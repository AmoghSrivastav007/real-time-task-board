import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireBoardAccess, BoardAuthRequest } from '../middleware/boardAuth';

// Local type for membership query result (mirrors Prisma shape without requiring generated client)
type MembershipWithBoard = {
  role: string;
  board: {
    id: string;
    title: string;
    ownerId: string;
    createdAt: Date;
    owner: { id: string; name: string; email: string };
  };
};

const router = Router();

// GET /api/boards — list boards the user is a member of
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const memberships = await prisma.boardMember.findMany({
    where: { userId },
    include: { board: { include: { owner: { select: { id: true, name: true, email: true } } } } },
  });
  res.json((memberships as MembershipWithBoard[]).map((m) => ({ ...m.board, memberRole: m.role })));
});

// POST /api/boards — create board
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({ title: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const userId = req.user!.id;
  const board = await prisma.board.create({
    data: {
      title: parsed.data.title,
      ownerId: userId,
      members: { create: { userId, role: 'ADMIN' } },
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  res.status(201).json(board);
});

// DELETE /api/boards/:id — delete board (ADMIN only)
router.delete(
  '/:id',
  authenticateToken,
  requireBoardAccess('ADMIN'),
  async (req: BoardAuthRequest, res: Response): Promise<void> => {
    await prisma.board.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  }
);

// GET /api/boards/:boardId/columns — get columns with tasks
router.get(
  '/:boardId/columns',
  authenticateToken,
  requireBoardAccess('VIEWER'),
  async (req: BoardAuthRequest, res: Response): Promise<void> => {
    const columns = await prisma.column.findMany({
      where: { boardId: req.params.boardId },
      orderBy: { order: 'asc' },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: { assignee: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    res.json(columns);
  }
);

// POST /api/boards/:boardId/columns — add column
router.post(
  '/:boardId/columns',
  authenticateToken,
  requireBoardAccess('MEMBER'),
  async (req: BoardAuthRequest, res: Response): Promise<void> => {
    const schema = z.object({ title: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const boardId = req.params.boardId;
    const maxOrder = await prisma.column.aggregate({ where: { boardId }, _max: { order: true } });
    const order = (maxOrder._max.order ?? -1) + 1;

    const column = await prisma.column.create({
      data: { title: parsed.data.title, boardId, order },
    });

    const io = req.app.get('io');
    io.to(boardId).emit('column:created', column);

    res.status(201).json(column);
  }
);

export default router;
