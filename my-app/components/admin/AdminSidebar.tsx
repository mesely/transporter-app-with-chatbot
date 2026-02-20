/**
 * @file AdminSidebar.tsx
 * @description Transport 245 Yönetici Paneli - Yan Menü (Sidebar).
 * UPDATE: Tasarıma Glassmorphism eklendi, ikonlar inceltildi (strokeWidth={1.5}) ve turkuaz (#49b5c2) tema rengine uyarlandı.
 */

'use client';

import { X, LayoutDashboard, Users, AlertCircle, LogOut, ShieldCheck, Box } from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminSidebar({ isOpen, onClose, activeTab, onTabChange }: AdminSidebarProps) {
  const menu = [
    { id: 'tariffs', label: 'GLOBAL TARİFELER', icon: LayoutDashboard },
    { id: 'providers', label: 'KURUM YÖNETİMİ', icon: Users },
    { id: 'complaints', label: 'VAKA MERKEZİ', icon: AlertCircle },
  ];

  return (
    <>
      {/* MOBIL OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[101] w-72 bg-white/60 backdrop-blur-2xl border-r border-white/50 
        transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        lg:translate-x-0 lg:static 
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* LOGO ALANI */}
        <div className="p-8 border-b border-white/40 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                 <Box size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-black tracking-tighter text-xl uppercase leading-none text-slate-900">Transport</h2>
                <span className="text-[8px] font-black text-[#49b5c2] tracking-[0.3em] uppercase">Control Panel</span>
              </div>
           </div>
           <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:bg-white/50 hover:text-slate-800 rounded-full transition-colors"><X size={20} strokeWidth={1.5}/></button>
        </div>

        {/* MENÜ LİSTESİ */}
        <nav className="p-6 space-y-3 mt-4">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (window.innerWidth < 1024) onClose();
              }}
              className={`
                w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all duration-300
                ${activeTab === item.id 
                  ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' 
                  : 'text-[#49b5c2] hover:bg-white/60 hover:text-slate-800'}
              `}
            >
              <item.icon size={18} strokeWidth={1.5} /> 
              {item.label}
            </button>
          ))}
        </nav>

        {/* ALT ÇIKIŞ BUTONU */}
        <div className="absolute bottom-10 w-full px-6">
           <div className="p-5 bg-white/40 backdrop-blur-sm border border-white/50 rounded-3xl mb-4 text-center shadow-sm">
              <ShieldCheck size={24} strokeWidth={1.5} className="text-[#49b5c2] mx-auto mb-2" />
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-relaxed">Sistem Güvenlik <br/> Modu Aktif</p>
           </div>
           <button 
             onClick={() => window.location.reload()} 
             className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] text-red-500 uppercase tracking-[0.2em] hover:bg-white/60 transition-all border border-transparent hover:border-white/50 hover:shadow-sm"
           >
              <LogOut size={16} strokeWidth={1.5} /> Panelden Çıkış
           </button>
        </div>
      </aside>
    </>
  );
}