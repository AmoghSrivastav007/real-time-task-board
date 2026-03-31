import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendEmail } from '../lib/email';

const router = Router({ mergeParams: true });

const commentSelect = {
  id: true,
  content: true,
  taskId: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, email: true } },
};

async function getBoardIdFromTask(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { column: { select: { boardId: true } } },
  });
  return task?.column.boardId ?? null;
}

// GET /api/tasks/:taskId/comments
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const comments = await prisma.comment.findMany({
    where: { taskId: req.params.taskId },
    orderBy: { createdAt: 'asc' },
    select: commentSelect,
  });
  res.json(comments);
});

// POST /api/tasks/:taskId/comments
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({ content: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const comment = await prisma.comment.create({
    data: { content: parsed.data.content, taskId: req.params.taskId, authorId: req.user!.id },
    select: commentSelect,
  });

  const boardId = await getBoardIdFromTask(req.params.taskId);
  const io = req.app.get('io');
  if (boardId) io.to(boardId).emit('comment:created', comment);

  const taskForNotification = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: { assignee: { select: { id: true } } },
  });
  if (taskForNotification?.assignee && taskForNotification.assignee.id !== req.user!.id) {
    const notification = await prisma.notification.create({
      data: {
        userId: taskForNotification.assignee.id,
        message: `${comment.author.name} commented on: ${taskForNotification.title}`,
        type: 'COMMENT',
        link: `/board/${boardId}`,
      },
    });
    io.to(`user:${taskForNotification.assignee.id}`).emit('notification:new', notification);
  }

  // Fire-and-forget email to task assignee
  (async () => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: req.params.taskId },
        include: {
          assignee: true,
          column: { include: { board: true } },
        },
      });
      if (
        task?.assignee &&
        task.assignee.id !== req.user!.id &&
        task.assignee.emailNotifications
      ) {
        const boardUrl = `${process.env.CLIENT_URL}/board/${task.column.boardId}`;
        await sendEmail(
          task.assignee.email,
          `${comment.author.name} commented on: ${task.title}`,
          `<p><strong>${comment.author.name}</strong> commented on task <strong>${task.title}</strong>:</p>
           <blockquote>${parsed.data.content}</blockquote>
           <p><a href="${boardUrl}">View board</a></p>`
        );
      }
    } catch (err) {
      console.error('[email] comment notification error:', err);
    }
  })();

  res.status(201).json(comment);
});

// PATCH /api/comments/:id
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({ content: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.comment.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Comment not found' }); return; }
  if (existing.authorId !== req.user!.id) { res.status(403).json({ error: 'Not your comment' }); return; }

  const comment = await prisma.comment.update({
    where: { id: req.params.id },
    data: { content: parsed.data.content },
    select: commentSelect,
  });

  const boardId = await getBoardIdFromTask(existing.taskId);
  const io = req.app.get('io');
  if (boardId) io.to(boardId).emit('comment:updated', comment);

  res.json(comment);
});

// DELETE /api/comments/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.comment.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Comment not found' }); return; }

  const isAdmin = req.user!.role === 'ADMIN';
  if (existing.authorId !== req.user!.id && !isAdmin) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  await prisma.comment.delete({ where: { id: req.params.id } });

  const boardId = await getBoardIdFromTask(existing.taskId);
  const io = req.app.get('io');
  if (boardId) io.to(boardId).emit('comment:deleted', { commentId: req.params.id, taskId: existing.taskId });

  res.json({ success: true });
});

export default router;
