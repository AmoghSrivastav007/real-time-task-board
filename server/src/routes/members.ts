import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireBoardAccess, BoardAuthRequest } from '../middleware/boardAuth';
import { sendEmail } from '../lib/email';

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

    const board = await prisma.board.findUnique({ where: { id: req.params.boardId }, select: { id: true, title: true } });
    if (board && user.id !== req.user!.id) {
      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          message: `You were invited to: ${board.title}`,
          type: 'INVITED',
          link: `/board/${board.id}`,
        },
      });
      req.app.get('io').to(`user:${user.id}`).emit('notification:new', notification);
    }

    // Fire-and-forget invite email
    (async () => {
      try {
        if (user.id !== req.user!.id && user.emailNotifications) {
          const board = await prisma.board.findUnique({
            where: { id: req.params.boardId },
            include: { owner: { select: { name: true } } },
          });
          const inviter = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
          if (board && inviter) {
            const boardUrl = `${process.env.CLIENT_URL}/board/${board.id}`;
            await sendEmail(
              user.email,
              `You have been invited to: ${board.title}`,
              `<p><strong>${inviter.name}</strong> invited you to the board <strong>${board.title}</strong> as <strong>${parsed.data.role}</strong>.</p>
               <p><a href="${boardUrl}">Open board</a></p>`
            );
          }
        }
      } catch (err) {
        console.error('[email] invite notification error:', err);
      }
    })();

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
