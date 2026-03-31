'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import TopNavbar from '@/components/layout/TopNavbar';
import Sidebar from '@/components/layout/Sidebar';

interface Board {
  id: string;
  title: string;
  memberRole: string;
  owner: { id: string; name: string; email: string };
  createdAt: string;
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MEMBER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  VIEWER: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
};

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [boards, setBoards] = useState<Board[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) { router.push('/auth/login'); return; }
    api.get<Board[]>('/api/boards', accessToken)
      .then(setBoards)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken, router]);

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

  async function createBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !accessToken) return;
    setCreating(true);
    try {
      const board = await api.post<Board>('/api/boards', { title: newTitle }, accessToken);
      setBoards((prev) => [board, ...prev]);
      setNewTitle('');
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
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
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <button onClick={() => setMobileSidebarOpen(false)} className="absolute inset-0 bg-black/40" />
            <Sidebar
              collapsed={false}
              onSelect={() => setMobileSidebarOpen(false)}
              className="relative h-full w-64 shadow-2xl bg-[#F8F9FA] dark:bg-[#16213E]"
            />
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Your Boards</h1>
            </div>

            {/* Create board */}
            <form onSubmit={createBoard} className="flex gap-3 mb-8">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New board name..."
                className="flex-1 max-w-sm px-3 py-2 rounded-lg bg-white dark:bg-[#16213E] border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1A73E8] transition-colors shadow-sm text-sm"
              />
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                className="px-4 py-2 rounded-lg bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm"
              >
                {creating ? 'Creating...' : '+ New Board'}
              </button>
            </form>

            {loading ? (
              <div className="text-gray-400 dark:text-slate-500 text-sm">Loading boards...</div>
            ) : boards.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-slate-500">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm">No boards yet. Create one above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/board/${board.id}`}
                    className="group p-5 rounded-xl bg-white dark:bg-[#16213E] border border-gray-100 dark:border-slate-700/50 hover:border-[#1A73E8]/40 hover:shadow-md transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-[#1A73E8]/10 dark:bg-[#1A73E8]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#1A73E8]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[board.memberRole] ?? roleColors.VIEWER}`}>
                        {board.memberRole}
                      </span>
                    </div>
                    <h2 className="font-semibold text-gray-800 dark:text-white group-hover:text-[#1A73E8] transition-colors text-sm">
                      {board.title}
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      by {board.owner.name} · {new Date(board.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
