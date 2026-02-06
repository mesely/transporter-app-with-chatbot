'use client';

import { Star, X } from 'lucide-react';
import { useState } from 'react';

interface RatingModalProps {
  isOpen: boolean;
  onRate: (rating: number) => void;
  onClose: () => void;
}

export default function RatingModal({ isOpen, onRate, onClose }: RatingModalProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  if (!isOpen) return null;

  const handleRate = () => { if (selectedRating > 0) onRate(selectedRating); };

  return (
    <div className="fixed inset-0 z-[10001] backdrop-blur-sm bg-transparent flex items-center justify-center p-4 animate-in fade-in">
      
      {/* KART: Light Glass */}
      <div className="bg-white/70 backdrop-blur-xl w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-white/40 relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/40 hover:bg-white/60 rounded-full text-gray-800 transition-all">
          <X size={20} strokeWidth={2.5} />
        </button>

        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Hizmet Nasıldı?</h3>
        <p className="text-gray-600 text-sm mb-8 font-bold">Sürücüyü puanlayarak kalitemizi artırmamıza yardımcı olun.</p>

        {/* Yıldızlar */}
        <div className="flex justify-center gap-3 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setSelectedRating(star)}
              className="transition-transform hover:scale-110 active:scale-90 focus:outline-none"
            >
              <Star 
                className={`w-10 h-10 transition-colors duration-200 ${
                  star <= (hoverRating || selectedRating) 
                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' 
                    : 'fill-white text-gray-300' 
                }`} 
              />
            </button>
          ))}
        </div>

        {/* Puan Durumu */}
        <div className="h-6 mb-8">
          {selectedRating > 0 && (
            <span className="text-black font-black text-lg animate-in fade-in uppercase tracking-wide">
              {selectedRating === 5 ? "Mükemmel! 🤩" : 
               selectedRating === 4 ? "Çok İyi 🙂" : 
               selectedRating === 3 ? "İdare Eder 😐" : 
               selectedRating === 2 ? "Kötüydü 😕" : "Berbat 😡"}
            </span>
          )}
        </div>

        {/* BUTON DÜZELTİLDİ: OPAK BEYAZ (Solid White) */}
        <button 
          onClick={handleRate}
          disabled={selectedRating === 0}
          className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase mb-4 transition-all shadow-xl border border-gray-100 ${
            selectedRating > 0 
              ? 'bg-white text-black hover:bg-gray-50 active:scale-95 cursor-pointer' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed border-transparent'
          }`}
        >
          PUANLA VE BİTİR
        </button>

        <button 
          onClick={onClose}
          className="text-gray-500 text-[10px] font-bold uppercase tracking-widest hover:text-black p-2 transition-colors"
        >
          Puanlamak İstemiyorum
        </button>

      </div>
    </div>
  );
}