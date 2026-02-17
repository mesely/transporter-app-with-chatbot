'use client';

import { Menu, User } from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
  onProfileClick: () => void;
  sidebarOpen: boolean;
}
export default function TopBar({ onMenuClick, onProfileClick, sidebarOpen }: TopBarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none">
      <div className="px-6 pt-11 flex items-center justify-between pointer-events-auto">
        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); onMenuClick(); }} 
          className="p-3 rounded-2xl bg-white shadow-lg border border-gray-100 text-gray-800"
        >
          <Menu className="w-6 h-6" />
        </button>

        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); onProfileClick(); }}
          className="p-3 rounded-2xl bg-white shadow-lg border border-gray-100 text-gray-800"
        >
          <User className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}