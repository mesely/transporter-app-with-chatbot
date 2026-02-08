'use client';

import { useState, useEffect } from 'react';
import { Zap, MapPin, Truck, ShieldCheck, LifeBuoy } from 'lucide-react';

const LOADING_MESSAGES = [
  {
    text: "Transporter nakliye ihtiyacınızı anında karşılar.",
    sub: "Tır, Kamyon ve Kamyonetler taranıyor...",
    icon: Truck
  },
  {
    text: "Yolda mı kaldınız? Transporter ile kurtarıcı yanınızda.",
    sub: "En yakın çekici ve vinç operatörleri bulunuyor...",
    icon: LifeBuoy
  },
  {
    text: "Aracınızın şarjı mı bitti?",
    sub: "Mobil şarj ve istasyon verileri çekiliyor...",
    icon: Zap
  },
  {
    text: "Güvenli hizmet için 'Anlaştım' onayı verin.",
    sub: "Bu sayede işlem sonunda şikayet/puanlama yapabilirsiniz.",
    icon: ShieldCheck
  },
  {
    text: "Sürücüler ve İstasyonlar Taranıyor...",
    sub: "Harita verileri güncelleniyor.",
    icon: MapPin
  }
];

export default function ScanningLoader() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0); // Yüzdelik durum

  // Mesaj Döngüsü
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Yüzdelik Bar Mantığı (7000ms'ye senkronize)
  useEffect(() => {
    const totalTime = 7000; // page.tsx'teki süre ile aynı (7 saniye)
    const intervalTime = 50; // Her 50ms'de bir güncelle
    const step = 100 / (totalTime / intervalTime); // Her adımda ne kadar artacak

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(oldProgress + step, 100);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const CurrentIcon = LOADING_MESSAGES[currentStep].icon;

  return (
    // 🔥 BEYAZ GLASSMORPHISM TASARIM 🔥
    <div className="fixed inset-0 z-[9999] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center text-gray-800 cursor-wait transition-all duration-700">
      
      {/* Radar Efekti - Beyaz/Gri Uyumlu */}
      <div className="relative flex items-center justify-center mb-10">
        {/* Dış Halkalar */}
        <div className="absolute w-48 h-48 border-4 border-blue-500/10 rounded-full animate-[ping_2s_linear_infinite]"></div>
        <div className="absolute w-72 h-72 border border-blue-500/5 rounded-full animate-[pulse_3s_linear_infinite]"></div>
        
        {/* Merkez İkon Kutusu (Glass) */}
        <div className="relative z-10 bg-white/80 p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 backdrop-blur-2xl animate-bounce-slow">
           <CurrentIcon className="w-14 h-14 text-blue-600 transition-all duration-500" strokeWidth={1.5} />
        </div>
      </div>

      {/* Değişen Mesajlar */}
      <div className="text-center space-y-3 px-8 max-w-md h-24 transition-all duration-500">
        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 animate-in fade-in slide-in-from-bottom-2 duration-500 key={currentStep}">
          {LOADING_MESSAGES[currentStep].text}
        </h3>
        <p className="text-sm text-gray-500 font-medium tracking-wide animate-pulse">
          {LOADING_MESSAGES[currentStep].sub}
        </p>
      </div>

      {/* Progress Bar (Görsel Doluluk - YÜZDELİK ÇALIŞIYOR) */}
      <div className="absolute bottom-20 w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }} // Dinamik genişlik
        ></div>
      </div>

      {/* Marka */}
      <div className="absolute bottom-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
        TRANSPORTER APP
      </div>
    </div>
  );
}