/**
 * @file TopBar.tsx
 * FIX: Menu butonu kaldırıldı, yerine Settings butonu eklendi.
 */

'use client';
import { Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  onProfileClick: () => void;
}

export default function TopBar({ onProfileClick }: TopBarProps) {
  const router = useRouter();

  return (
    <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none">
      <div
        className="px-6 flex items-center justify-between pointer-events-auto"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        
        {/* Settings butonu (eski Menu yerine) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push('/settings');
          }}
          className="p-3 rounded-2xl bg-white shadow-lg border border-gray-100 text-gray-800"
        >
          <Settings className="w-6 h-6" />
        </button>

        {/* Profile butonu */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onProfileClick();
          }}
          className="p-3 rounded-2xl bg-white shadow-lg border border-gray-100 text-gray-800"
        >
          <User className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
