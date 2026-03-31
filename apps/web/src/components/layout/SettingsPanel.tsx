'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useTheme } from '@/hooks/useTheme';
import { disconnectSocket } from '@/lib/socket';
import Avatar from '@/components/ui/Avatar';

interface Props {
  onClose: () => void;
}

interface UserPrefs {
  id: string;
  name: string;
  email: string;
  role: string;
  emailNotifications: boolean;
  defaultView?: 'kanban' | 'list' | null;
}

export default function SettingsPanel({ onClose }: Props) {
  const { user, accessToken, logout, updateUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    api.get<UserPrefs>('/api/users/me', accessToken).then((p) => {
      const storedView = (localStorage.getItem('viewMode') as 'kanban' | 'list' | null) ?? 'kanban';
      setPrefs(p);
      setDisplayName(p.name);
      localStorage.setItem('viewMode', p.defaultView ?? storedView);
    }).catch(console.error);
  }, [accessToken]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  async function saveProfile() {
    if (!accessToken || !prefs) return;
    setSaving(true);
    try {
      await api.patch('/api/users/me', {
        name: displayName.trim(),
        emailNotifications: prefs.emailNotifications,
        defaultView: prefs.defaultView,
      }, accessToken);
      updateUser({ name: displayName.trim() || user?.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function toggleEmailNotifications() {
    if (!accessToken || !prefs) return;
    const next = !prefs.emailNotifications;
    setPrefs({ ...prefs, emailNotifications: next });
    try {
      await api.patch('/api/users/me', { emailNotifications: next }, accessToken);
    } catch { setPrefs({ ...prefs, emailNotifications: !next }); }
  }

  async function handleDefaultViewChange(defaultView: 'kanban' | 'list') {
    if (!accessToken || !prefs) return;
    localStorage.setItem('viewMode', defaultView);
    setPrefs({ ...prefs, defaultView });
    try {
      await api.patch('/api/users/me', { defaultView }, accessToken);
    } catch {
      setPrefs({ ...prefs, defaultView: prefs.defaultView });
    }
  }

  function handleSignOut() {
    logout();
    disconnectSocket();
    router.push('/auth/login');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        ref={ref}
        className="relative w-80 h-full bg-white dark:bg-[#16213E] border-l border-gray-200 dark:border-slate-700 shadow-2xl flex flex-col animate-slide-in-right overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <span className="font-semibold text-gray-800 dark:text-white">Settings</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-5 space-y-6">
          {/* Profile */}
          <section>
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Profile</p>
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={user?.name ?? 'U'} size="lg" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Display name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white text-sm focus:outline-none focus:border-[#1A73E8]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Email</label>
                <input
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full py-2 rounded-lg bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </section>

          <hr className="border-gray-100 dark:border-slate-700" />

          {/* Preferences */}
          <section>
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Preferences</p>
            <div className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">Theme</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
                </div>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-[#1A73E8]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Email notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">Email notifications</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Assignments, comments, invites</p>
                </div>
                <button
                  onClick={toggleEmailNotifications}
                  disabled={!prefs}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    prefs?.emailNotifications ? 'bg-[#1A73E8]' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prefs?.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div>
                <p className="text-sm text-gray-700 dark:text-gray-200 mb-1">Default view</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDefaultViewChange('kanban')}
                    className={`py-1.5 rounded-lg text-xs border transition-colors ${
                      prefs?.defaultView !== 'list'
                        ? 'bg-[#1A73E8] text-white border-[#1A73E8]'
                        : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Kanban
                  </button>
                  <button
                    onClick={() => handleDefaultViewChange('list')}
                    className={`py-1.5 rounded-lg text-xs border transition-colors ${
                      prefs?.defaultView === 'list'
                        ? 'bg-[#1A73E8] text-white border-[#1A73E8]'
                        : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-gray-100 dark:border-slate-700" />

          {/* Account */}
          <section>
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Account</p>
            <div className="space-y-2">
              <button className="w-full py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Change Password
              </button>
              <button
                onClick={handleSignOut}
                className="w-full py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
