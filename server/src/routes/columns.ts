import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper: get boardId from columnId
async function getBoardId(columnId: string): Promise<string | null> {
  const col = await prisma.column.findUnique({ where: { id: columnId }, select: { boardId: true } });
  return col?.boardId ?? null;
}

// PATCH /api/columns/:id — rename or reorder
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    title: z.string().min(1).optional(),
    order: z.number().int().min(0).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const column = await prisma.column.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  const io = req.app.get('io');
  const boardId = await getBoardId(req.params.id);
  if (boardId) io.to(boardId).emit('column:updated', column);

  res.json(column);
});

// DELETE /api/columns/:id — delete column (ADMIN)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const boardId = await getBoardId(req.params.id);
  await prisma.column.delete({ where: { id: req.params.id } });

  const io = req.app.get('io');
  if (boardId) io.to(boardId).emit('column:deleted', { columnId: req.params.id });

  res.json({ success: true });
});

// POST /api/columns/:id/tasks — create task
router.post('/:id/tasks', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    assigneeId: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    dueDate: z.string().datetime().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const columnId = req.params.id;
  const maxOrder = await prisma.task.aggregate({ where: { columnId }, _max: { order: true } });
  const order = (maxOrder._max.order ?? -1) + 1;

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      columnId,
      order,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  const boardId = await getBoardId(columnId);
  const io = req.app.get('io');
  if (boardId) io.to(boardId).emit('task:created', task);

  res.status(201).json(task);
});

export default router;
