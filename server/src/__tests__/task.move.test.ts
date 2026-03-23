/**
 * Tests for task move order recalculation logic.
 * Uses a mock Prisma client to avoid DB dependency.
 */

// Mock prisma before importing the route
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    task: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import taskRoutes from '../routes/tasks';

process.env.JWT_SECRET = 'test_secret';

const app = express();
app.use(express.json());
// Mock io
app.set('io', { to: () => ({ emit: jest.fn() }) });
app.use('/api/tasks', taskRoutes);

function makeToken() {
  return jwt.sign({ id: 'user1', email: 'a@b.com', role: 'MEMBER' }, 'test_secret', { expiresIn: '1h' });
}

const mockTask = {
  id: 'task1',
  columnId: 'col1',
  order: 2,
  title: 'Test',
  column: { boardId: 'board1' },
};

describe('PATCH /api/tasks/:id/move', () => {
  beforeEach(() => jest.clearAllMocks());

  it('moves task to a new column', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);
    (prisma.task.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.task.update as jest.Mock).mockResolvedValue({
      ...mockTask,
      columnId: 'col2',
      order: 0,
      column: { boardId: 'board1' },
    });

    const res = await request(app)
      .patch('/api/tasks/task1/move')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ toColumnId: 'col2', newOrder: 0 });

    expect(res.status).toBe(200);
    expect(prisma.task.updateMany).toHaveBeenCalled();
    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ columnId: 'col2', order: 0 }),
      })
    );
  });

  it('returns 404 when task not found', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/tasks/nonexistent/move')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ toColumnId: 'col2', newOrder: 0 });

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid body', async () => {
    const res = await request(app)
      .patch('/api/tasks/task1/move')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ toColumnId: 'col2' }); // missing newOrder

    expect(res.status).toBe(400);
  });
});
