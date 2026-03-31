import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendEmail } from '../lib/email';

const router = Router();

async function getBoardIdFromTask(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { column: { select: { boardId: true } } },
  });
  return task?.column.boardId ?? null;
}

// PATCH /api/tasks/:id — update task fields
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    assigneeId: z.string().nullable().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    dueDate: z.string().datetime().nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : parsed.data.dueDate,
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  const boardId = await getBoardIdFromTask(req.params.id);
  const io = req.app.get('io');
  if (boardId) io.to(boardId).emit('task:updated', task);

  if (parsed.data.assigneeId && parsed.data.assigneeId !== req.user!.id) {
    const notification = await prisma.notification.create({
      data: {
        userId: parsed.data.assigneeId,
        message: `You were assigned: ${task.title}`,
        type: 'ASSIGNED',
        link: boardId ? `/board/${boardId}` : null,
      },
    });
    io.to(`user:${parsed.data.assigneeId}`).emit('notification:new', notification);
  }

  // Fire-and-forget assignment email
  if (parsed.data.assigneeId && parsed.data.assigneeId !== req.user!.id) {
    (async () => {
      try {
        const assignee = await prisma.user.findUnique({ where: { id: parsed.data.assigneeId! } });
        if (assignee?.emailNotifications) {
          const fullTask = await prisma.task.findUnique({
            where: { id: req.params.id },
            include: { column: { include: { board: true } } },
          });
          if (fullTask) {
            const boardUrl = `${process.env.CLIENT_URL}/board/${fullTask.column.boardId}`;
            await sendEmail(
              assignee.email,
              `You have been assigned a task: ${task.title}`,
              `<p>You have been assigned to task <strong>${task.title}</strong>.</p>
               ${task.description ? `<p>${task.description}</p>` : ''}
               <p>Board: <strong>${fullTask.column.board.title}</strong></p>
               <p><a href="${boardUrl}">View board</a></p>`
            );
          }
        }
      } catch (err) {
        console.error('[email] assignment notification error:', err);
      }
    })();
  }

  res.json(task);
});

// PATCH /api/tasks/:id/move — move task to new column + reorder
router.patch('/:id/move', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    toColumnId: z.string(),
    newOrder: z.number().int().min(0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { toColumnId, newOrder } = parsed.data;
  const taskId = req.params.id;

  const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existingTask) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const fromColumnId = existingTask.columnId;

  // Shift tasks in destination column to make room
  await prisma.task.updateMany({
    where: { columnId: toColumnId, order: { gte: newOrder }, id: { not: taskId } },
    data: { order: { increment: 1 } },
  });

  // If moving within same column, shift tasks that were after old position
  if (fromColumnId === toColumnId && existingTask.order < newOrder) {
    await prisma.task.updateMany({
      where: {
        columnId: fromColumnId,
        order: { gt: existingTask.order, lte: newOrder },
        id: { not: taskId },
      },
      data: { order: { decrement: 1 } },
    });
  } else if (fromColumnId !== toColumnId) {
    // Compact source column
    await prisma.task.updateMany({
      where: { columnId: fromColumnId, order: { gt: existingTask.order } },
      data: { order: { decrement: 1 } },
    });
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { columnId: toColumnId, order: newOrder },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  const boardId = await getBoardIdFromTask(taskId);
  const io = req.app.get('io');
  if (boardId) {
    io.to(boardId).emit('task:moved', {
      task,
      fromColumnId,
      toColumnId,
      newOrder,
    });
  }

  res.json(task);
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const boardId = await getBoardIdFromTask(req.params.id);
  await prisma.task.delete({ where: { id: req.params.id } });

  const io = req.app.get('io');
  if (boardId) io.to(boardId).emit('task:deleted', { taskId: req.params.id });

  res.json({ success: true });
});

export default router;
