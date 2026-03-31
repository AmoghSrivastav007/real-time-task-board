'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface Props {
  collapsed: boolean;
  className?: string;
  onSelect?: () => void;
}

const navItems: Array<{ href: string; label: string; icon: ReactNode; highlighted?: boolean }> = [
  {
    href: '/dashboard',
    label: 'Calendar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Tasks',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Boards',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Add Board',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Remove',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Favorites',
    highlighted: true,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ),
  },
];

export default function Sidebar({ collapsed, className = '', onSelect }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className={`shrink-0 flex flex-col bg-white dark:bg-[#16213E] border-r border-gray-200 dark:border-slate-700/50 transition-all duration-300 ${
        collapsed ? 'w-14' : 'w-56'
      } ${className}`}
    >
      <div className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith('/board');
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onSelect}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors group ${
                active
                  ? 'bg-[#1A73E8] text-white'
                  : item.highlighted
                  ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
