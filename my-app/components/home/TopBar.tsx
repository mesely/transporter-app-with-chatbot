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
      {/* DEĞİŞİKLİK BURADA: px-6 (Sağ/Sol) ve pt-10 (Üst) */}
      <div className="px-6 pt-11 pb-4 flex items-center justify-between pointer-events-auto">
        
        {/* SOL - Menü Butonu */}
        <button 
          onClick={onMenuClick} 
          className={`p-3 rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 border border-white/40 active:scale-95 ${
            sidebarOpen 
              ? 'bg-white text-green-700 scale-105 ring-2 ring-green-100' 
              : 'bg-white/60 text-gray-700 hover:bg-white/80'
          }`}
        >
          <Menu className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {/* ORTA - Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
          {/* Logo konumu üstten padding artınca kayabilir, gerekirse buraya 'mt-6' gibi bir margin ekleyebilirsin */}
          <div className="bg-white/40 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg border border-white/30 mt-6"> 
            <h1 className="text-sm font-black text-gray-800 tracking-[0.2em] drop-shadow-sm">
              2TRANSPORTER2
            </h1>
          </div>
        </div>

        {/* SAĞ - Profil Butonu */}
        <button 
          onClick={onProfileClick}
          className="p-3 rounded-2xl backdrop-blur-xl bg-white/60 text-gray-700 border border-white/40 shadow-lg hover:bg-white/80 hover:scale-105 active:scale-95 transition-all"
        >
          <User className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}