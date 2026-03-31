'use client';

import { useEffect, useState } from 'react';

interface Props {
  message: string;
  onDone: () => void;
  type?: 'success' | 'error';
}

export default function Toast({ message, onDone, type = 'success' }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 200); }, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
    >
      {message}
    </div>
  );
}
