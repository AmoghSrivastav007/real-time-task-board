'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Props {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : form;

      const data = await api.post<{ user: any; accessToken: string; refreshToken: string }>(
        `/api/auth/${mode}`,
        body
      );

      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[#F0F2F5] dark:bg-[#1A1A2E]">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#1A73E8] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800 dark:text-white">TasksBoard</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
            <Link
              href={mode === 'login' ? '/auth/register' : '/auth/login'}
              className="text-[#1A73E8] hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-[#16213E] p-6 rounded-xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1A73E8] transition-colors"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1A73E8] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1A73E8] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </main>
  );
}
