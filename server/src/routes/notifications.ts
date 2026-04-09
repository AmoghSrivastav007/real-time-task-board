import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, read: false },
    data: { read: true },
  });
  res.json({ success: true });
});

// PATCH /api/notifications/:id
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.user!.id) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });
  res.json(updated);
});

export default router;
