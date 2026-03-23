import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, Role } from './auth';

/**
 * Resolves the board membership role for the current user on a given board.
 * Attaches boardRole to req for downstream use.
 */
export interface BoardAuthRequest extends AuthRequest {
  boardRole?: Role;
  boardId?: string;
}

export function requireBoardAccess(minRole: Role = 'VIEWER') {
  const hierarchy: Role[] = ['VIEWER', 'MEMBER', 'ADMIN'];

  return async (req: BoardAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const boardId = req.params.boardId || req.params.id;
    const userId = req.user?.id;

    if (!userId || !boardId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const membership = await prisma.boardMember.findUnique({
      where: { userId_boardId: { userId, boardId } },
    });

    if (!membership) {
      res.status(403).json({ error: 'Not a board member' });
      return;
    }

    const userLevel = hierarchy.indexOf(membership.role);
    const requiredLevel = hierarchy.indexOf(minRole);

    if (userLevel < requiredLevel) {
      res.status(403).json({ error: 'Insufficient board permissions' });
      return;
    }

    req.boardRole = membership.role;
    req.boardId = boardId;
    next();
  };
}
