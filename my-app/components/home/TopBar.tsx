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
      {/* Container: px-6 ve pt-11 (Konumlandırmalar aynı kaldı) */}
      <div className="px-6 pt-11 pb-4 flex items-center justify-between pointer-events-auto">
        
        {/* SOL - Menü Butonu */}
        <button 
          type="button" // 🔥 FIX: iOS'un butonu submit sanıp yenilemesini engeller
          onClick={(e) => {
            e.preventDefault(); // 🔥 FIX: Tıklama sonrası varsayılan yenileme davranışını durdurur
            onMenuClick();
          }} 
          className={`p-3 rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 border border-white/40 active:scale-95 ${
            sidebarOpen 
              ? 'bg-white text-green-700 scale-105 ring-2 ring-green-100' 
              : 'bg-white/60 text-gray-700 hover:bg-white/80'
          }`}
        >
          <Menu className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {/* ORTA - Logo Alanı Tamamen Silindi */}

        {/* SAĞ - Profil Butonu */}
        <button 
          type="button" // 🔥 FIX: iOS'un butonu submit sanıp yenilemesini engeller
          onClick={(e) => {
            e.preventDefault(); // 🔥 FIX: Tıklama sonrası varsayılan yenileme davranışını durdurur
            onProfileClick();
          }}
          className="p-3 rounded-2xl backdrop-blur-xl bg-white/60 text-gray-700 border border-white/40 shadow-lg hover:bg-white/80 hover:scale-105 active:scale-95 transition-all"
        >
          <User className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}