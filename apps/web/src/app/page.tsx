'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#F0F2F5] dark:bg-[#1A1A2E]">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#1A73E8] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Tasks<span className="text-[#1A73E8]">Board</span>
          </h1>
        </div>
        <p className="text-gray-500 dark:text-slate-400">
          Real-time collaborative kanban boards. Work together, ship faster.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-8 py-3 rounded-xl bg-[#1A73E8] hover:bg-blue-600 text-white font-medium transition-colors shadow-sm"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-8 py-3 rounded-xl border border-gray-200 dark:border-slate-600 hover:border-[#1A73E8] text-gray-600 dark:text-slate-300 hover:text-[#1A73E8] font-medium transition-colors bg-white dark:bg-[#16213E] shadow-sm"
          >
            Create Account
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { icon: '⚡', label: 'Real-time sync', desc: 'See changes instantly across all collaborators' },
            { icon: '🔒', label: 'Role-based access', desc: 'Admin, Member, and Viewer permissions' },
            { icon: '🎯', label: 'Drag & drop', desc: 'Intuitive task management with smooth DnD' },
          ].map((f) => (
            <div key={f.label} className="p-4 rounded-xl bg-white dark:bg-[#16213E] border border-gray-100 dark:border-slate-700/50 text-left shadow-sm">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{f.label}</div>
              <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
