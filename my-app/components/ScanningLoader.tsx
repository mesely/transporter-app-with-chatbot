'use client';

import { useState, useEffect } from 'react';
import { Zap, MapPin, Truck, ShieldCheck, LifeBuoy, MessageSquare, Scale } from 'lucide-react';

const LOADING_MESSAGES = [
  {
    text: "Transporter nakliye ihtiyacınızı anında karşılar.",
    sub: "Tır, Kamyon ve Kamyonetler taranıyor...",
    icon: Truck
  },
  {
    text: "Yolda mı kaldınız? Transporter her an yanınızda.",
    sub: "En yakın çekici ve vinç operatörleri bulunuyor...",
    icon: LifeBuoy
  },
  {
    text: "Transporter 6563 Sayılı Kanun Uyarınca Aracı Hizmet Sağlayıcıdır.",
    sub: "Güvenliğiniz için tüm süreçler kayıt altına alınmaktadır.",
    icon: Scale
  },
  {
    text: "Görüşlerinizle Birlikte Gelişiyoruz.",
    sub: "İşlem sonunda şikayet ve öneri formunu doldurmayı unutmayın.",
    icon: MessageSquare
  },
  {
    text: "Sürücüler ve İstasyonlar Taranıyor...",
    sub: "Harita verileri ve fiyat tarifeleri güncelleniyor.",
    icon: MapPin
  }
];

export default function ScanningLoader() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // 1. Mesaj Döngüsü (Yumuşak Geçişler İçin 3 Saniyede Bir)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2. Yüzdelik Bar Mantığı (7 Saniye Akıcı Dolum)
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

  const CurrentIcon = LOADING_MESSAGES[currentStep].icon;

  return (
    // ANA KATMAN: DERİN GLASSMORPHISM
    <div className="fixed inset-0 z-[99999] bg-white/40 backdrop-blur-[10px] flex flex-col items-center justify-center text-gray-800 cursor-wait transition-all duration-1000 overflow-hidden">
      
      {/* DINAMIK CAM BLOBLARI (Arka planda süzülen renkli cam ışıkları) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-400/15 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
         <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-white/20 rounded-full blur-[80px]"></div>
      </div>

      {/* MERKEZ KRISTAL RADAR */}
      <div className="relative flex items-center justify-center mb-16 scale-110">
        {/* Radar Halkaları (Süper ince glass strokes) */}
        <div className="absolute w-64 h-64 border border-blue-500/10 rounded-full animate-[ping_4s_linear_infinite]"></div>
        <div className="absolute w-80 h-80 border border-white/30 rounded-full animate-[pulse_3s_linear_infinite] shadow-inner"></div>
        
        {/* Merkez Cam Kutu (The Crystal Core) */}
        <div className="relative z-10 bg-white/30 border border-white/60 backdrop-blur-2xl p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] ring-1 ring-white/40">
           <CurrentIcon className="w-16 h-16 text-gray-900 transition-all duration-700 drop-shadow-md" strokeWidth={1.2} />
        </div>
      </div>

      {/* MESAJ ALANI (Glass Typography) */}
      <div className="relative z-10 text-center space-y-4 px-10 max-w-xl h-32 flex flex-col justify-center">
        <h3 
          key={`text-${currentStep}`} 
          className="text-xl font-black uppercase tracking-tight text-gray-900 animate-in fade-in slide-in-from-bottom-4 duration-700 leading-tight"
        >
          {LOADING_MESSAGES[currentStep].text}
        </h3>
        <div 
           key={`sub-${currentStep}`}
           className="bg-white/40 border border-white/50 backdrop-blur-md px-4 py-1.5 rounded-full inline-block mx-auto animate-in fade-in zoom-in-95 duration-1000"
        >
           <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase">
             {LOADING_MESSAGES[currentStep].sub}
           </p>
        </div>
      </div>

      {/* MODERNIZE PROGRESS BAR (Glass Rail) */}
      <div className="absolute bottom-24 flex flex-col items-center gap-4 w-72 z-10">
        <div className="flex justify-between w-full px-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sistem Taraması</span>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-lg border border-blue-100/40 shadow-sm">%{Math.round(progress)}</span>
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-xl border border-white/60 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-gray-800 via-blue-600 to-gray-900 rounded-full transition-all duration-150 ease-linear shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            style={{ width: `${progress}%` }} 
          ></div>
        </div>
      </div>

      {/* MARKA KATMANI (Footer Glass) */}
      <div className="absolute bottom-8 flex items-center gap-2 bg-white/20 border border-white/40 backdrop-blur-lg px-6 py-2 rounded-full z-10 shadow-sm">
        <ShieldCheck size={14} className="text-blue-600" />
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
          Transporter <span className="text-gray-900">2026</span>
        </span>
      </div>
    </div>
  );
}