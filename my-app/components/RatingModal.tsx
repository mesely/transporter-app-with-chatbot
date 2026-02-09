'use client';

import { Star, X, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';

interface RatingModalProps {
  isOpen: boolean;
  onRate: (data: { rating: number; comment: string; tags: string[] }) => void;
  onClose: () => void;
}

export default function RatingModal({ isOpen, onRate, onClose }: RatingModalProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- AKILLI ETİKETLER ---
  const dynamicTags = useMemo(() => {
    if (selectedRating >= 4) {
      return ["Hızlı Geldi ⚡", "Harika Hizmet 🏆", "Güler Yüzlü 😊", "Güvenli Sürüş 🛡️", "Uygun Fiyat 💰"];
    } else if (selectedRating > 0) {
      return ["Geç Geldi ⏳", "Kaba Davranış 😠", "Araç Sorunluydu 🛠️", "Pahalı Buldum 💸", "İletişim Zayıf 📵"];
    }
    return [];
  }, [selectedRating]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleRateSubmit = async () => {
    if (selectedRating > 0) {
      setIsSubmitting(true);
      onRate({ rating: selectedRating, comment, tags: selectedTags });
      
      setTimeout(() => {
          setIsSubmitting(false);
          onClose();
      }, 500);
    }
  };

  return (
    // Overlay: Hafif gri ve az bulanık (SettingsModal ile uyumlu)
    <div className="fixed inset-0 z-[10001] bg-gray-900/10 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Modal Container: GLASSMORPHISM */}
      <div className="w-full max-w-md rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/40 bg-white/80 backdrop-blur-2xl p-8 text-center relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Kapat Butonu (Glass Style) */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 w-10 h-10 bg-white/40 border border-white/50 hover:bg-white/80 hover:text-red-500 rounded-full flex items-center justify-center text-gray-500 transition-all active:scale-95 shadow-sm"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="mb-8 mt-2">
          <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Hizmet Nasıldı?</h3>
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">Sürücüyü değerlendir, kaliteyi artır.</p>
        </div>

        {/* YILDIZLAR */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => { setSelectedRating(star); setSelectedTags([]); }}
              className="transition-transform hover:scale-125 active:scale-90"
            >
              <Star 
                className={`w-11 h-11 transition-all duration-300 ${
                  star <= (hoverRating || selectedRating) 
                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' 
                    : 'fill-transparent text-gray-300 stroke-[1.5]' 
                }`} 
              />
            </button>
          ))}
        </div>

        {/* ETİKETLER */}
        {selectedRating > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8 animate-in slide-in-from-top-4 duration-500">
            {dynamicTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
                  selectedTags.includes(tag)
                    ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-105'
                    : 'bg-white/40 text-gray-600 border-white/60 hover:bg-white/80 hover:border-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* YORUM ALANI (Glass Input) */}
        <div className="relative mb-8 group">
          <div className="absolute top-3 left-4 text-gray-400 group-focus-within:text-gray-800 transition-colors">
            <MessageSquare size={16} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="EKLEMEK İSTEDİĞİNİZ BİR ŞEY VAR MI?"
            className="w-full bg-white/50 border border-white/60 rounded-2xl py-3 pl-12 pr-4 text-[10px] font-bold uppercase focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white/80 transition-all min-h-[100px] resize-none shadow-inner placeholder:text-gray-400 text-gray-800"
          />
        </div>

        {/* PUANLAMA BUTONU */}
        <button 
          onClick={handleRateSubmit}
          disabled={selectedRating === 0 || isSubmitting}
          className={`w-full py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase mb-4 transition-all flex items-center justify-center gap-2 shadow-xl ${
            selectedRating > 0 
              ? 'bg-gray-900 text-white hover:bg-black active:scale-95 shadow-gray-900/20' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'GÖNDERİLİYOR...' : <><CheckCircle2 size={16} /> PUANLAMAYI BİTİR</>}
        </button>

        {/* SONRA PUANLA BUTONU */}
        <button 
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-3 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition-colors"
        >
          <Clock size={14} /> ŞİMDİ DEĞİL, SONRA HATIRLAT
        </button>

      </div>
    </div>
  );
}