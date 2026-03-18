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
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[101] w-72 border-r border-slate-200 bg-white
        transform transition-all duration-300
        lg:translate-x-0 lg:static 
        ${isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between border-b border-slate-200 p-8">
           <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-900">
                 <Box size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase leading-none tracking-tight text-slate-900">Transport</h2>
                <span className="text-[8px] font-black tracking-[0.3em] uppercase text-slate-500">Control Panel</span>
              </div>
           </div>
           <button onClick={onClose} className="lg:hidden rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"><X size={20} strokeWidth={1.5}/></button>
        </div>

        <nav className="p-6 space-y-3 mt-4">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (window.innerWidth < 1024) onClose();
              }}
              className={`
                w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest transition-all duration-300
                ${activeTab === item.id 
                  ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <item.icon size={18} strokeWidth={1.5} /> 
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-10 w-full px-6">
           <div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
              <ShieldCheck size={24} strokeWidth={1.5} className="mx-auto mb-2 text-slate-700" />
              <p className="text-[8px] font-black uppercase tracking-widest leading-relaxed text-slate-600">Sistem Güvenlik <br/> Modu Aktif</p>
           </div>
           <button 
             onClick={() => window.location.reload()} 
             className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 px-6 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-red-500 transition-all hover:bg-slate-50"
           >
              <LogOut size={16} strokeWidth={1.5} /> Panelden Çıkış
           </button>
        </div>
      </aside>
    </>
  );
}
