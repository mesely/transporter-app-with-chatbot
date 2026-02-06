'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, MapPin, Phone, ShieldCheck } from 'lucide-react';

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_intro');
    if (!hasSeen) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('has_seen_intro', 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else handleClose();
  };

  if (!isOpen) return null;

  const steps = [
    {
      icon: <MapPin className="w-14 h-14 text-green-600" />,
      title: "Yolda mı Kaldın?",
      desc: "Hiç panik yapma. Haritadan sana en yakın çekiciyi veya tamirciyi gör."
    },
    {
      icon: <Phone className="w-14 h-14 text-blue-600" />,
      title: "Tek Tuşla Ara",
      desc: "İstediğin aracı seç, 'Ara' tuşuna bas. Sürücüyle hemen konuş."
    },
    {
      icon: <ShieldCheck className="w-14 h-14 text-yellow-500" />,
      title: "Güvendesin",
      desc: "Sürücü gelene kadar buradan takip et. İşlem bitince puan ver."
    }
  ];

  return (
    <div className="fixed inset-0 z-[20000] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* KART: Light Glass */}
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-sm rounded-[2.5rem] p-8 relative shadow-2xl scale-100 animate-in zoom-in-95 duration-300 border border-white/60">
        
        <button onClick={handleClose} className="absolute top-5 right-5 p-2 bg-white/50 hover:bg-white rounded-full text-gray-500 transition-all shadow-sm">
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* İÇERİK */}
        <div className="flex flex-col items-center text-center mt-4 min-h-[240px]">
          <div className="mb-6 p-4 bg-white rounded-full shadow-lg border border-white/50">
            {steps[step].icon}
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">{steps[step].title}</h2>
          <p className="text-gray-600 leading-relaxed font-medium">{steps[step].desc}</p>
        </div>

        {/* NOKTALAR */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-black' : 'w-2 bg-gray-300'}`} />
          ))}
        </div>

        {/* BUTON: Katı Siyah (Premium) */}
        <button 
          onClick={handleNext}
          className="w-full bg-black text-white text-sm font-black tracking-widest py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {step === 2 ? "HEMEN BAŞLA" : "DEVAM ET"} 
          {step < 2 && <ChevronRight size={18} />}
        </button>

      </div>
    </div>
  );
}