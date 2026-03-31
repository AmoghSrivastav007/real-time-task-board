'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import TopNavbar from '@/components/layout/TopNavbar';
import Sidebar from '@/components/layout/Sidebar';

interface UserPrefs {
  id: string;
  name: string;
  email: string;
  role: string;
  emailNotifications: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!accessToken) { router.push('/auth/login'); return; }
    api.get<UserPrefs>('/api/users/me', accessToken).then(setPrefs).catch(console.error);
  }, [accessToken, router]);

  async function toggleNotifications() {
    if (!accessToken || !prefs) return;
    setSaving(true);
    try {
      const updated = await api.patch<UserPrefs>('/api/users/me/notifications', {
        emailNotifications: !prefs.emailNotifications,
      }, accessToken);
      setPrefs((p) => p ? { ...p, emailNotifications: updated.emailNotifications } : p);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="h-screen flex flex-col bg-[#F0F2F5] dark:bg-[#1A1A2E] overflow-hidden">
      <TopNavbar
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-lg mx-auto">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>
            {prefs ? (
              <div className="bg-white dark:bg-[#16213E] border border-gray-100 dark:border-slate-700/50 rounded-xl p-6 space-y-5 shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 dark:text-slate-500">Name</p>
                  <p className="text-sm text-gray-800 dark:text-white">{prefs.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 dark:text-slate-500">Email</p>
                  <p className="text-sm text-gray-800 dark:text-white">{prefs.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 dark:text-slate-500">Role</p>
                  <p className="text-sm text-gray-800 dark:text-white">{prefs.role}</p>
                </div>
                <hr className="border-gray-100 dark:border-slate-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Email Notifications</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      Receive emails for task assignments, comments, and board invites
                    </p>
                  </div>
                  <button
                    onClick={toggleNotifications}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                      prefs.emailNotifications ? 'bg-[#1A73E8]' : 'bg-gray-300 dark:bg-slate-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prefs.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 dark:text-slate-500 text-sm">Loading...</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
