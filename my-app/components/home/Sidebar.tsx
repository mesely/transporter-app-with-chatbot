/**
 * @file Sidebar.tsx
 * Tüm animate-in / backdrop-blur / transition / shadow-2xl kaldırıldı.
 */

'use client';
import { X, UserCircle2, FileText, Shield, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: string) => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenAgreement: () => void;
  onOpenKVKK: () => void;
}

export default function Sidebar({
  isOpen, onClose, onSelectAction,
  onOpenProfile, onOpenSettings, onOpenAgreement, onOpenKVKK,
}: SidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[2000]" onClick={onClose} />
      <aside className="fixed top-0 left-0 h-full w-[85%] max-w-[320px] z-[2001] bg-white flex flex-col border-r border-gray-100">
        <div className="p-6 shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Menü</h2>
            <button onClick={onClose} className="p-2 bg-gray-50 rounded-full"><X size={20} /></button>
          </div>
          <div onClick={onOpenProfile} className="flex items-center gap-4 p-4 bg-gray-50 rounded-[1.8rem] cursor-pointer">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200">
              <UserCircle2 size={24} className="text-gray-400" />
            </div>
            <span className="font-black text-[11px] uppercase text-gray-900">Profilim</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-3">
          <button onClick={() => onSelectAction('kurtarici')} className="w-full p-5 bg-red-50 text-red-700 rounded-2xl font-black text-[10px] text-left uppercase">
            Oto Kurtarma
          </button>
          <button onClick={() => onSelectAction('nakliye')} className="w-full p-5 bg-purple-50 text-purple-700 rounded-2xl font-black text-[10px] text-left uppercase">
            Nakliye
          </button>
          <div className="grid grid-cols-2 gap-2 pt-4">
            <button onClick={onOpenAgreement} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl text-[8px] font-black uppercase text-gray-500">
              <FileText size={18} />Sözleşme
            </button>
            <button onClick={onOpenKVKK} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl text-[8px] font-black uppercase text-gray-500">
              <Shield size={18} />KVKK
            </button>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          <button onClick={onOpenSettings} className="w-full py-4 bg-white border border-gray-200 rounded-xl font-black text-[10px] uppercase text-blue-600">
            AYARLAR
          </button>
          <div className="flex items-center gap-2 justify-center mt-4 opacity-30">
            <ShieldCheck size={12} />
            <span className="text-[8px] font-black uppercase tracking-widest">Transport 245</span>
          </div>
        </div>
      </aside>
    </>
  );
}