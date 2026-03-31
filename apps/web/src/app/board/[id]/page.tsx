'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useBoardStore } from '@/store/board';
import { getSocket } from '@/lib/socket';
import BoardCanvas from '@/components/board/BoardCanvas';
import InviteModal from '@/components/InviteModal';
import TopNavbar from '@/components/layout/TopNavbar';
import Sidebar from '@/components/layout/Sidebar';
import PresenceBar from '@/components/PresenceBar';
import Toast from '@/components/ui/Toast';

type ViewMode = 'kanban' | 'list';

export default function BoardPage() {
  const { id: boardId } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { setColumns, addColumn, updateColumn, removeColumn, addTask, updateTask, moveTask, removeTask, setPresence, removePresence } = useBoardStore();

  const [boardTitle, setBoardTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('viewMode') as ViewMode) ?? 'kanban';
    }
    return 'kanban';
  });
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');

  const loadBoard = useCallback(async () => {
    if (!accessToken) return;
    try {
      const cols = await api.get<any[]>(`/api/boards/${boardId}/columns`, accessToken);
      setColumns(cols);
    } catch { router.push('/dashboard'); }
  }, [boardId, accessToken, setColumns, router]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadBoard();
    setRefreshing(false);
    setToast('Board refreshed');
  }

  function handleToggleView() {
    setViewMode((v) => {
      const next = v === 'kanban' ? 'list' : 'kanban';
      localStorage.setItem('viewMode', next);
      return next;
    });
  }

  useEffect(() => {
    if (!accessToken) { router.push('/auth/login'); return; }

    loadBoard().then(() => setLoading(false));

    api.get<any[]>('/api/boards', accessToken).then((boards) => {
      const board = boards.find((b: any) => b.id === boardId);
      if (board) setBoardTitle(board.title);
    });

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
      }
      if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
        setSidebarCollapsed(true);
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#1A1A2E] flex items-center justify-center">
        <div className="text-gray-400 dark:text-slate-500">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F0F2F5] dark:bg-[#1A1A2E] overflow-hidden">
      <TopNavbar
        onToggleSidebar={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setMobileSidebarOpen((v) => !v);
            return;
          }
          setSidebarCollapsed((v) => !v);
        }}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        viewMode={viewMode}
        onToggleView={handleToggleView}
        showBoardControls
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <Sidebar
              collapsed={false}
              onSelect={() => setMobileSidebarOpen(false)}
              className="relative h-full w-64 shadow-2xl bg-[#F8F9FA] dark:bg-[#16213E]"
            />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Board header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 dark:border-slate-700/50 bg-white dark:bg-[#16213E] shrink-0">
            <h1 className="font-semibold text-gray-800 dark:text-white">{boardTitle || 'Main Board'}</h1>
            <div className="flex items-center gap-3">
              <PresenceBar />
              <button
                onClick={() => setShowInvite(true)}
                className="text-sm px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-blue-600 text-white transition-colors"
              >
                + Invite
              </button>
            </div>
          </div>

          {/* Board canvas */}
          <div className="flex-1 overflow-hidden">
            <BoardCanvas boardId={boardId} viewMode={viewMode} />
          </div>
        </main>
      </div>

      {showInvite && <InviteModal boardId={boardId} onClose={() => setShowInvite(false)} />}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  );
}
