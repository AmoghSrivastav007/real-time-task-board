/**
 * Tests that socket events are emitted after task:moved.
 */
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

const emitMock = jest.fn();
const toMock = jest.fn(() => ({ emit: emitMock }));

const app = express();
app.use(express.json());
app.set('io', { to: toMock });
app.use('/api/tasks', taskRoutes);

function makeToken() {
  return jwt.sign({ id: 'user1', email: 'a@b.com', role: 'MEMBER' }, 'test_secret', { expiresIn: '1h' });
}

describe('Socket event emission on task:moved', () => {
  beforeEach(() => jest.clearAllMocks());

  it('emits task:moved event to board room', async () => {
    (prisma.task.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'task1', columnId: 'col1', order: 0, title: 'T' })
      .mockResolvedValueOnce({ id: 'task1', columnId: 'col2', order: 1, column: { boardId: 'board1' } });

    (prisma.task.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.task.update as jest.Mock).mockResolvedValue({
      id: 'task1',
      columnId: 'col2',
      order: 1,
      column: { boardId: 'board1' },
    });

    await request(app)
      .patch('/api/tasks/task1/move')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ toColumnId: 'col2', newOrder: 1 });

    expect(toMock).toHaveBeenCalledWith('board1');
    expect(emitMock).toHaveBeenCalledWith('task:moved', expect.objectContaining({ toColumnId: 'col2' }));
  });
});
