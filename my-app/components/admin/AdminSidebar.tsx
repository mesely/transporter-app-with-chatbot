'use client';

import { X, LayoutDashboard, Users, AlertCircle, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminSidebar({ isOpen, onClose, activeTab, onTabChange }: SidebarProps) {
  
  const menuItems = [
    { id: 'tariffs', label: 'Tarifeler & Fiyatlar', icon: LayoutDashboard },
    { id: 'providers', label: 'Araçlar & Sürücüler', icon: Users },
    { id: 'complaints', label: 'Şikayetler & Raporlar', icon: AlertCircle },
  ];

  return (
    <>
      {/* Mobil için Karartma Arka Planı */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Paneli */}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none border-r border-gray-200
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-800 tracking-tighter">MENÜ</h2>
          <button onClick={onClose} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  // Mobildeysek menüyü kapat
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all
                  ${isActive 
                    ? 'bg-black text-white shadow-lg scale-105' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            Çıkış Yap
          </button>
        </div>
      </div>
    </>
  );
}