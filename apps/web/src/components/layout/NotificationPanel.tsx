'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/hooks/useNotifications';

interface Props {
  notifications: Notification[];
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  onClose: () => void;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const typeIcon: Record<Notification['type'], string> = {
  COMMENT: '💬',
  ASSIGNED: '✅',
  INVITED: '📩',
};

export default function NotificationPanel({ notifications, markRead, markAllRead, onClose }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  async function handleClick(n: Notification) {
    await markRead(n.id);
    if (n.link) router.push(n.link);
    onClose();
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#16213E] border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
        <span className="font-semibold text-sm text-gray-800 dark:text-white">Notifications</span>
        <button
          onClick={markAllRead}
          className="text-xs text-[#1A73E8] hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-slate-500">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors text-left ${
                !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
            >
              <span className="text-lg shrink-0 mt-0.5">{typeIcon[n.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{n.message}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-[#1A73E8] shrink-0 mt-1.5" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
