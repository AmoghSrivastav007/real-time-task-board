'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Props {
  boardId: string;
  onClose: () => void;
}

export default function InviteModal({ boardId, onClose }: Props) {
  const { accessToken } = useAuthStore();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post(`/api/boards/${boardId}/members`, { email, role }, accessToken);
      setSuccess(`${email} has been invited as ${role}`);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#16213E] border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-gray-800 dark:text-white font-semibold">Invite to Board</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleInvite} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:border-[#1A73E8]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:border-[#1A73E8]"
            >
              <option value="VIEWER">Viewer — read only</option>
              <option value="MEMBER">Member — create & edit tasks</option>
              <option value="ADMIN">Admin — full access</option>
            </select>
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? 'Inviting...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
