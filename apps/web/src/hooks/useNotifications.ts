import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { getSocket } from '@/lib/socket';

export interface Notification {
  id: string;
  message: string;
  type: 'COMMENT' | 'ASSIGNED' | 'INVITED';
  read: boolean;
  link: string | null;
  createdAt: string;
}

export function useNotifications() {
  const { accessToken } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await api.get<Notification[]>('/api/notifications', accessToken);
      setNotifications(data);
    } catch { /* silent */ }
  }, [accessToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Live updates via socket
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    const handler = (n: Notification) => setNotifications((prev) => [n, ...prev]);
    socket.on('notification:new', handler);
    return () => { socket.off('notification:new', handler); };
  }, [accessToken]);

  async function markRead(id: string) {
    if (!accessToken) return;
    try {
      await api.patch(`/api/notifications/${id}`, {}, accessToken);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch { /* silent */ }
  }

  async function markAllRead() {
    if (!accessToken) return;
    try {
      await api.patch('/api/notifications/read-all', {}, accessToken);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* silent */ }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead, refetch: fetchNotifications };
}
