'use client';

import { Star, X, MessageSquare, CheckCircle2, Clock, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
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

  // --- AKILLI ETİKETLER (Daha Canlı İkonlarla) ---
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
      }, 600);
    }
  };

  return (
    // Overlay: Admin paneliyle uyumlu koyuluk ve blur
    <div className="fixed inset-0 z-[10001] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Modal Container: iOS Glassmorphism Stil */}
      <div className="w-full max-w-md rounded-[3rem] shadow-2xl border border-white/60 bg-white/90 backdrop-blur-2xl p-8 text-center relative max-h-[92vh] overflow-y-auto custom-scrollbar animate-in zoom-in duration-300">
        
        {/* Kapat Butonu: Sürücü panelindeki yuvarlak buton stili */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 w-12 h-12 bg-white shadow-lg border border-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center text-slate-400 transition-all active:scale-90"
        >
          <X size={20} strokeWidth={3} />
        </button>

        <div className="mb-10 mt-4">
          <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] w-fit mx-auto mb-4">
            Geri Bildirim
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Hizmet Nasıldı?</h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-3">Deneyiminizi puanlayarak ağımızı güçlendirin.</p>
        </div>

        {/* YILDIZLAR: Daha büyük ve interaktif */}
        <div className="flex justify-center gap-3 mb-10">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => { setSelectedRating(star); setSelectedTags([]); }}
              className="transition-all hover:scale-125 active:scale-95"
            >
              <Star 
                size={44}
                className={`transition-all duration-300 ${
                  star <= (hoverRating || selectedRating) 
                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]' 
                    : 'fill-transparent text-slate-200 stroke-[1.5]' 
                }`} 
              />
            </button>
          ))}
        </div>

        {/* ETİKETLER: Renkli Chip Tasarımı */}
        {selectedRating > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10 animate-in slide-in-from-bottom-4 duration-500">
            {dynamicTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* YORUM ALANI: Admin paneli input stili */}
        <div className="relative mb-8 group">
          <MessageSquare className="absolute top-4 left-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="SÜRÜCÜ HAKKINDA NOTLARINIZ..."
            className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] py-4 pl-14 pr-4 text-xs font-bold uppercase focus:outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[120px] resize-none shadow-inner placeholder:text-slate-300 text-slate-700"
          />
        </div>

        {/* PUANLAMA BUTONU: Siyah/Mavi geçişli ana aksiyon butonu */}
        <button 
          onClick={handleRateSubmit}
          disabled={selectedRating === 0 || isSubmitting}
          className={`w-full py-6 rounded-[2rem] font-black text-xs tracking-[0.3em] uppercase mb-4 transition-all flex items-center justify-center gap-3 shadow-2xl ${
            selectedRating > 0 
              ? 'bg-slate-900 text-white hover:bg-blue-600 active:scale-95 shadow-slate-900/30' 
              : 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200'
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <><CheckCircle2 size={18} /> DEĞERLENDİRMEYİ TAMAMLA</>
          )}
        </button>

        {/* SONRA PUANLA BUTONU */}
        <button 
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-2 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
        >
          <Clock size={14} /> ŞİMDİ DEĞİL, SONRA HATIRLAT
        </button>

      </div>
    </div>
  );
}