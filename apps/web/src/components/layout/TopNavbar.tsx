'use client';

import { useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import NotificationPanel from './NotificationPanel';
import SettingsPanel from './SettingsPanel';
import { useAuthStore } from '@/store/auth';
import { useNotifications } from '@/hooks/useNotifications';

interface Props {
  onToggleSidebar: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  viewMode?: 'kanban' | 'list';
  onToggleView?: () => void;
  showBoardControls?: boolean;
}

export default function TopNavbar({
  onToggleSidebar,
  onRefresh,
  refreshing,
  viewMode,
  onToggleView,
  showBoardControls = false,
}: Props) {
  const { user } = useAuthStore();
  const notificationState = useNotifications();
  const { unreadCount } = notificationState;
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="h-14 shrink-0 bg-white dark:bg-[#16213E] border-b border-gray-200 dark:border-slate-700/50 flex items-center px-3 md:px-4 gap-2 md:gap-3 z-40 transition-colors duration-300">
        {/* Left */}
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-500 dark:text-gray-400 shrink-0"
          title="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#1A73E8] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800 dark:text-white text-sm">TasksBoard</span>
        </Link>

        {/* Center - desktop/tablet search */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          <div className={`relative transition-all duration-200 ${searchOpen ? 'w-full max-w-md' : 'w-48 md:w-64'}`}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
              placeholder="Search"
              className="w-full pl-9 pr-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-700/50 border border-transparent focus:border-[#1A73E8] focus:bg-white dark:focus:bg-slate-700 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none transition-all"
            />
          </div>
          <button
            title="Filter and sort"
            className="ml-2 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-500 dark:text-gray-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10m-7 6h4" />
            </svg>
          </button>
        </div>

        {/* Right icons */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          {/* Refresh */}
          {showBoardControls && onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh board"
              className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-500 dark:text-gray-400"
            >
              <svg
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {/* View toggle */}
          {showBoardControls && onToggleView && (
            <button
              onClick={onToggleView}
              title={viewMode === 'kanban' ? 'Switch to list view' : 'Switch to kanban view'}
              className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-500 dark:text-gray-400"
            >
              {viewMode === 'kanban' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="18" rx="1" />
                </svg>
              )}
            </button>
          )}

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <div className="relative hidden md:block">
            <button
              onClick={() => { setShowNotifications((v) => !v); setShowSettings(false); }}
              title="Notifications"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-500 dark:text-gray-400 relative"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationPanel
                notifications={notificationState.notifications}
                markRead={notificationState.markRead}
                markAllRead={notificationState.markAllRead}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => { setShowSettings(true); setShowNotifications(false); }}
            title="Settings"
            className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-500 dark:text-gray-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

          {/* Avatar */}
          {user && <Avatar name={user.name} size="sm" className="ml-1" />}
        </div>
      </header>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
}
