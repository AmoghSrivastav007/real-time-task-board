'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useBoardStore } from '@/store/board';
import { getSocket, disconnectSocket } from '@/lib/socket';
import BoardCanvas from '@/components/BoardCanvas';
import PresenceBar from '@/components/PresenceBar';
import InviteModal from '@/components/InviteModal';

export default function BoardPage() {
  const { id: boardId } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, user, logout } = useAuthStore();
  const { setColumns, addColumn, updateColumn, removeColumn, addTask, updateTask, moveTask, removeTask, setPresence, removePresence } = useBoardStore();
  const [boardTitle, setBoardTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (!accessToken) { router.push('/auth/login'); return; }

    // Load columns + tasks
    api.get<any[]>(`/api/boards/${boardId}/columns`, accessToken)
      .then((cols) => {
        setColumns(cols);
        setLoading(false);
      })
      .catch(() => router.push('/dashboard'));

    // Load board title
    api.get<any[]>('/api/boards', accessToken).then((boards) => {
      const board = boards.find((b: any) => b.id === boardId);
      if (board) setBoardTitle(board.title);
    });

    // Socket setup
    const socket = getSocket(accessToken);

    socket.emit('board:join', boardId);

    socket.on('task:created', addTask);
    socket.on('task:updated', updateTask);
    socket.on('task:moved', ({ task, fromColumnId, toColumnId, newOrder }: any) => {
      moveTask(task.id, fromColumnId, toColumnId, newOrder);
    });
    socket.on('task:deleted', ({ taskId }: { taskId: string }) => removeTask(taskId));
    socket.on('column:created', (col: any) => addColumn({ ...col, tasks: [] }));
    socket.on('column:updated', updateColumn);
    socket.on('column:deleted', ({ columnId }: { columnId: string }) => removeColumn(columnId));
    socket.on('user:cursor', setPresence);
    socket.on('user:joined', (u: any) => setPresence({ userId: u.userId, name: u.name, columnId: null }));
    socket.on('user:left', ({ userId }: { userId: string }) => removePresence(userId));

    return () => {
      socket.emit('board:leave', boardId);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('task:deleted');
      socket.off('column:created');
      socket.off('column:updated');
      socket.off('column:deleted');
      socket.off('user:cursor');
      socket.off('user:joined');
      socket.off('user:left');
    };
  }, [boardId, accessToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Boards
          </Link>
          <h1 className="text-white font-semibold">{boardTitle}</h1>
        </div>
        <div className="flex items-center gap-4">
          <PresenceBar />
          <button
            onClick={() => setShowInvite(true)}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-colors"
          >
            + Invite
          </button>
          <button
            onClick={() => { logout(); disconnectSocket(); router.push('/'); }}
            className="text-sm text-slate-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Board canvas */}
      <div className="flex-1 overflow-hidden">
        <BoardCanvas boardId={boardId} />
      </div>

      {showInvite && (
        <InviteModal boardId={boardId} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}
