'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Board {
  id: string;
  title: string;
  memberRole: string;
  owner: { id: string; name: string; email: string };
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken, logout } = useAuthStore();
  const [boards, setBoards] = useState<Board[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) { router.push('/auth/login'); return; }
    api.get<Board[]>('/api/boards', accessToken)
      .then(setBoards)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken, router]);

  async function createBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !accessToken) return;
    setCreating(true);
    try {
      const board = await api.post<Board>('/api/boards', { title: newTitle }, accessToken);
      setBoards((prev) => [board, ...prev]);
      setNewTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">
          Task<span className="text-indigo-400">Board</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{user?.name}</span>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Your Boards</h1>
        </div>

        {/* Create board form */}
        <form onSubmit={createBoard} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New board name..."
            className="flex-1 max-w-sm px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {creating ? 'Creating...' : '+ New Board'}
          </button>
        </form>

        {loading ? (
          <div className="text-slate-500 text-sm">Loading boards...</div>
        ) : boards.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">📋</p>
            <p>No boards yet. Create one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/board/${board.id}`}
                className="group p-5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 transition-all"
              >
                <div className="flex items-start justify-between">
                  <h2 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {board.title}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                    {board.memberRole}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  by {board.owner.name} · {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
