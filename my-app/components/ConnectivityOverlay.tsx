/**
 * @file ConnectivityOverlay.tsx
 * @description İnternet bağlantı hatalarını yöneten Glassmorphism tabanlı global katman.
 */

'use client';

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCcw, ShieldAlert, Bot } from 'lucide-react';

export default function ConnectivityOverlay() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // 1. Başlangıç durumunu kontrol et
    setIsOffline(!window.navigator.onLine);

    // 2. Dinamik dinleyicileri kur
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[110000] bg-indigo-950/20 backdrop-blur-[25px] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 overflow-hidden">
      
      {/* ARKA PLAN DEKORATİF IŞIKLARI */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]"></div>

      {/* ANA HATA KARTI */}
      <div className="w-full max-w-sm bg-white/70 border-2 border-white/90 rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] p-10 flex flex-col items-center relative overflow-hidden">
        
        {/* HEADER BRANDING */}
        <div className="flex items-center gap-2 mb-8 opacity-40">
           <Bot size={16} className="text-indigo-950" />
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-950 italic">Transport AI</span>
        </div>

        {/* MERKEZİ İKON PANELİ */}
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-ping opacity-40"></div>
           <div className="w-24 h-24 bg-white/90 border-2 border-red-100 rounded-[2.5rem] flex items-center justify-center text-red-600 shadow-xl relative z-10">
              <WifiOff size={48} strokeWidth={1.5} />
           </div>
        </div>

        {/* METİN ALANI */}
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none italic">
            Bağlantı <br /> Kesildi
          </h2>
          <div className="bg-red-50/60 border border-red-100 px-4 py-2 rounded-full inline-block">
             <p className="text-[9px] font-black text-red-700 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert size={12} /> Çevrimdışı Mod Aktif
             </p>
          </div>
          <p className="text-gray-500 text-[11px] font-bold uppercase leading-relaxed max-w-[200px] mx-auto pt-2">
            Lojistik ağına tekrar bağlanabilmek için lütfen internet ayarlarınızı kontrol edin.
          </p>
        </div>

        {/* AKSİYON BUTONU (Yüksek Opaklık - Talep Ettiğiniz Gibi) */}
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 group"
        >
          <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          Ağı Yenile
        </button>

      </div>

      {/* ALT BİLGİ */}
      <div className="mt-8 flex items-center gap-2 bg-white/40 border border-white/60 px-6 py-2.5 rounded-full shadow-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">Status: Offline</span>
      </div>

    </div>
  );
}