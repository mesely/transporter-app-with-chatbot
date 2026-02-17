'use client';
import { Menu, User } from 'lucide-react';

export default function TopBar({ onMenuClick, onProfileClick, sidebarOpen }: any) {
  return (
    <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none">
      <div className="px-6 pt-11 flex items-center justify-between pointer-events-auto">
        <button 
          type="button"
          // 🔥 e.stopPropagation() ekleyerek tıklamanın haritaya sızmasını önlüyoruz
          onClick={(e) => { 
            console.log("[TopBar] Menu Button Clicked!");
            e.preventDefault(); 
            e.stopPropagation(); 
            onMenuClick(); 
          }} 
          className="p-3 rounded-2xl bg-white shadow-lg border border-gray-100 text-gray-800 active:scale-95 transition-transform"
        >
          <Menu className="w-6 h-6" />
        </button>

        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onProfileClick(); }}
          className="p-3 rounded-2xl bg-white shadow-lg border border-gray-100 text-gray-800"
        >
          <User className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}