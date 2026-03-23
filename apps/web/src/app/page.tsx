'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Task<span className="text-indigo-400">Board</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Real-time collaborative kanban boards. Work together, ship faster.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-8 py-3 rounded-lg border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-medium transition-colors"
          >
            Create Account
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-8">
          {[
            { icon: '⚡', label: 'Real-time sync', desc: 'See changes instantly across all collaborators' },
            { icon: '🔒', label: 'Role-based access', desc: 'Admin, Member, and Viewer permissions' },
            { icon: '🎯', label: 'Drag & drop', desc: 'Intuitive task management with smooth DnD' },
          ].map((f) => (
            <div key={f.label} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-left">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-medium text-slate-200">{f.label}</div>
              <div className="text-xs text-slate-500 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
