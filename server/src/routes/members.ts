import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireBoardAccess, BoardAuthRequest } from '../middleware/boardAuth';

const router = Router();

// POST /api/boards/:boardId/members — invite user by email
router.post(
  '/:boardId/members',
  authenticateToken,
  requireBoardAccess('ADMIN'),
  async (req: BoardAuthRequest, res: Response): Promise<void> => {
    const schema = z.object({
      email: z.string().email(),
      role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const member = await prisma.boardMember.upsert({
      where: { userId_boardId: { userId: user.id, boardId: req.params.boardId } },
      update: { role: parsed.data.role },
      create: { userId: user.id, boardId: req.params.boardId, role: parsed.data.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(member);
  }
);

// PATCH /api/boards/:boardId/members/:userId — change role
router.patch(
  '/:boardId/members/:userId',
  authenticateToken,
  requireBoardAccess('ADMIN'),
  async (req: BoardAuthRequest, res: Response): Promise<void> => {
    const schema = z.object({ role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const member = await prisma.boardMember.update({
      where: { userId_boardId: { userId: req.params.userId, boardId: req.params.boardId } },
      data: { role: parsed.data.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json(member);
  }
);

// DELETE /api/boards/:boardId/members/:userId — remove member
router.delete(
  '/:boardId/members/:userId',
  authenticateToken,
  requireBoardAccess('ADMIN'),
  async (req: BoardAuthRequest, res: Response): Promise<void> => {
    await prisma.boardMember.delete({
      where: { userId_boardId: { userId: req.params.userId, boardId: req.params.boardId } },
    });
    res.json({ success: true });
  }
);

export default router;
