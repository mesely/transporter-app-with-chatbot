'use client';

import { useState, useEffect } from 'react';
import { Truck, ShieldCheck } from 'lucide-react';

export default function ScanningLoader() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    'Yeni nesil lojistik ağı hazırlanıyor',
    'Konuma en yakın araçlar listeleniyor',
    'Uygun hizmet sağlayıcılar filtreleniyor',
    'Güvenilir ve hızlı eşleşmeler oluşturuluyor'
  ];

  useEffect(() => {
    const totalTime = 7000;
    const intervalTime = 50;
    const steps = totalTime / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(oldProgress + increment, 100);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden">

      {/* ARKA PLAN GÖRSELİ */}
      <div className="absolute inset-0 z-[-2] bg-[url('/splash.jpeg')] bg-cover bg-center bg-no-repeat"></div>

      {/* BEYAZ ÖRTÜ */}
      <div className="absolute inset-0 z-[-1] bg-white/20"></div>

      {/* MERKEZ İKON */}
      <div className="relative z-10 flex items-center justify-center mb-16">
        <div className="bg-white/50 border border-white/70 backdrop-blur-xl p-10 rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
          <Truck className="w-16 h-16 text-gray-900" strokeWidth={1.2} />
        </div>
      </div>

      {/* YÜKLEME BARI */}
      <div className="absolute bottom-24 flex flex-col items-center gap-3 w-72 z-10">
        <div className="w-full h-2 bg-white/40 rounded-full overflow-hidden border border-white/70 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-gray-800 via-blue-600 to-gray-900 rounded-full transition-all duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-[10px] font-black uppercase tracking-wide text-gray-800 text-center bg-white/60 px-3 py-2 rounded-xl border border-white/60 min-h-[38px] flex items-center justify-center">
          {messages[messageIndex]}
        </div>
      </div>

      {/* MARKA KATMANI */}
      <div className="absolute bottom-8 flex items-center gap-2 bg-white/60 border border-white/70 backdrop-blur-lg px-6 py-2 rounded-full z-10 shadow-sm">
        <ShieldCheck size={14} className="text-blue-600" />
        <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em]">
          Transport <span className="text-gray-900">245</span>
        </span>
      </div>
    </div>
  );
}
