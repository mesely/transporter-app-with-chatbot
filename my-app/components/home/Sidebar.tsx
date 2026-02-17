'use client';

import { X, UserCircle2, MapPin, Settings, Heart, FileText, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

// Modallar (Eğer patlıyorsa bunları da geçici olarak yorum satırı yapabilirsin)
import SettingsModal from '../SettingsModal';
import ProfileModal from '../ProfileModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: string) => void;
}

export default function Sidebar({ isOpen, onClose, onSelectAction }: SidebarProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // 🔥 EĞER AÇIK DEĞİLSE HİÇ RENDER ETME (GPU Belleği için en güvenlisi bu)
  if (!isOpen) return null;

  return (
    <>
      {/* OVERLAY: Blur yok, sadece düz renk */}
      <div 
        className="fixed inset-0 bg-black/60 z-[2000]" 
        onClick={onClose}
      />

      {/* SIDEBAR GÖVDESİ: 
          - Transition/Animasyon TAMAMEN SİLİNDİ.
          - Transform-GPU SİLİNDİ (Çökmeye neden olan buydu).
          - Backdrop-Blur SİLİNDİ.
      */}
      <aside className="fixed top-0 left-0 h-full w-[85%] max-w-[320px] z-[2001] bg-white flex flex-col shadow-none border-r border-gray-200">
        
        <div className="p-6 shrink-0 bg-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900 uppercase italic">Menü</h2>
            <button 
                type="button" 
                onClick={onClose}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
            >
                <X size={20} />
            </button>
          </div>

          <div onClick={() => setShowProfile(true)} className="rounded-2xl p-4 border border-gray-100 bg-gray-50 mb-6">
             <div className="flex items-center gap-4">
                <UserCircle2 size={32} className="text-gray-400" />
                <div className="flex-1">
                  <h3 className="font-black text-xs uppercase text-gray-900">Kullanıcı</h3>
                  <p className="text-[8px] text-gray-500 font-black uppercase">Aktif</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-4">
           {/* Örnek Buton - Crash testi için sade tutuldu */}
           <button 
             onClick={() => { onSelectAction('kurtarici'); onClose(); }}
             className="w-full p-4 bg-red-50 text-red-700 rounded-xl font-black text-[10px] uppercase text-left"
           >
             OTO KURTARMA
           </button>
           <button 
             onClick={() => { onSelectAction('nakliye'); onClose(); }}
             className="w-full p-4 bg-purple-50 text-purple-700 rounded-xl font-black text-[10px] uppercase text-left"
           >
             NAKLİYE
           </button>
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
          <button 
            type="button" 
            onClick={() => setShowSettings(true)}
            className="w-full py-4 bg-gray-100 rounded-xl font-black text-[9px] uppercase"
          >
             AYARLAR
          </button>
        </div>
      </aside>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
}