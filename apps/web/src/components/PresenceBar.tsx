'use client';

import { useBoardStore } from '@/store/board';
import { useAuthStore } from '@/store/auth';

function avatarColor(name: string) {
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500'];
  return colors[name.charCodeAt(0) % colors.length];
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function PresenceBar() {
  const presence = useBoardStore((s) => s.presence);
  const { user } = useAuthStore();

  const all = user
    ? [{ userId: user.id, name: user.name, columnId: null }, ...presence.filter((p) => p.userId !== user.id)]
    : presence;

  if (all.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {all.slice(0, 6).map((p) => (
        <div key={p.userId} className="relative" title={p.name}>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-950 ${avatarColor(p.name)}`}
          >
            {getInitials(p.name)}
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-400 ring-1 ring-slate-950" />
        </div>
      ))}
      {all.length > 6 && (
        <span className="text-xs text-slate-500 ml-1">+{all.length - 6}</span>
      )}
    </div>
  );
}
