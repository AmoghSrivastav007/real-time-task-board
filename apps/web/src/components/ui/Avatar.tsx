'use client';

const COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-pink-500',
  'bg-teal-500', 'bg-orange-500', 'bg-green-500',
];

export function avatarColor(name: string) {
  return COLORS[name.charCodeAt(0) % COLORS.length];
}

export function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };

export default function Avatar({ name, size = 'md', className = '' }: Props) {
  return (
    <div
      className={`${sizes[size]} ${avatarColor(name)} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
