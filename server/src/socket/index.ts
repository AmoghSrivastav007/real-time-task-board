import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

interface SocketUser {
  id: string;
  email: string;
  name: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

export function setupSocketIO(io: Server): void {
  // JWT auth middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        id: string;
        email: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, name: true },
      });
      if (!user) return next(new Error('User not found'));
      (socket as AuthenticatedSocket).user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.user?.email})`);
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
    }

    // Join a board room after verifying membership
    socket.on('board:join', async (boardId: string) => {
      if (!socket.user) return;

      const membership = await prisma.boardMember.findUnique({
        where: { userId_boardId: { userId: socket.user.id, boardId } },
      });

      if (!membership) {
        socket.emit('error', { message: 'Not a board member' });
        return;
      }

      socket.join(boardId);
      socket.to(boardId).emit('user:joined', {
        userId: socket.user.id,
        name: socket.user.name,
        email: socket.user.email,
      });

      console.log(`User ${socket.user.email} joined board room ${boardId}`);
    });

    // Leave board room
    socket.on('board:leave', (boardId: string) => {
      socket.leave(boardId);
      if (socket.user) {
        socket.to(boardId).emit('user:left', { userId: socket.user.id });
      }
    });

    // Broadcast cursor/presence position
    socket.on('user:cursor', (data: { boardId: string; columnId: string | null }) => {
      if (!socket.user) return;
      socket.to(data.boardId).emit('user:cursor', {
        userId: socket.user.id,
        name: socket.user.name,
        columnId: data.columnId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
