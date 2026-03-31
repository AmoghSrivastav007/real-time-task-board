import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// PATCH /api/users/me
router.patch('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    emailNotifications: z.boolean().optional(),
    defaultView: z.enum(['kanban', 'list']).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const updateData: { name?: string; emailNotifications?: boolean } = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.emailNotifications !== undefined) updateData.emailNotifications = parsed.data.emailNotifications;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, emailNotifications: true },
  });

  res.json({ ...user, defaultView: parsed.data.defaultView ?? null });
});

// PATCH /api/users/me/notifications
router.patch('/me/notifications', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({ emailNotifications: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { emailNotifications: parsed.data.emailNotifications },
    select: { id: true, emailNotifications: true },
  });

  res.json(user);
});

// GET /api/users/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, role: true, emailNotifications: true },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ ...user, defaultView: null });
});

export default router;
