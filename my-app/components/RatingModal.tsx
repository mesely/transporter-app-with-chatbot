'use client';

import { Star, X, MessageSquare, CheckCircle2 } from 'lucide-react';
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

  // --- AKILLI ETİKETLER (Yıldıza Göre Değişir) ---
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

  const handleRateSubmit = () => {
    if (selectedRating > 0) {
      onRate({
        rating: selectedRating,
        comment: comment,
        tags: selectedTags
      });
      // State'leri sıfırla
      setSelectedRating(0);
      setComment('');
      setSelectedTags([]);
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] backdrop-blur-md bg-black/10 flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      <div className="bg-white/90 backdrop-blur-2xl w-full max-w-md rounded-[2.5rem] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.2)] border border-white/50 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-black/5 hover:bg-black/10 rounded-full text-gray-500 transition-all">
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="mb-6">
          <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Hizmet Nasıldı?</h3>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">Deneyimini paylaş, kaliteyi artır.</p>
        </div>

        {/* YILDIZLAR */}
        <div className="flex justify-center gap-2 mb-6">
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
                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]' 
                    : 'fill-transparent text-gray-200' 
                }`} 
              />
            </button>
          ))}
        </div>

        {/* AKILLI ETİKETLER (LinkedIn Tarzı) */}
        {selectedRating > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6 animate-in slide-in-from-top-4 duration-500">
            {dynamicTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
                  selectedTags.includes(tag)
                    ? 'bg-black text-white border-black shadow-lg scale-105'
                    : 'bg-white/50 text-gray-500 border-gray-100 hover:border-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* OPSİYONEL YORUM ALANI */}
        <div className="relative mb-8 group">
          <div className="absolute top-3 left-4 text-gray-400 group-focus-within:text-black transition-colors">
            <MessageSquare size={16} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="EKLEMEK İSTEDİĞİNİZ BİR ŞEY VAR MI? (OPSİYONEL)"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-[10px] font-bold uppercase focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white transition-all min-h-[100px] resize-none"
          />
        </div>

        {/* ANA AKSİYON BUTONU */}
        <button 
          onClick={handleRateSubmit}
          disabled={selectedRating === 0}
          className={`w-full py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase mb-4 transition-all flex items-center justify-center gap-2 shadow-xl ${
            selectedRating > 0 
              ? 'bg-black text-white hover:bg-gray-800 active:scale-95 shadow-black/20' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {selectedRating > 0 && <CheckCircle2 size={16} />}
          PUANLAMAYI TAMAMLA
        </button>

        <button 
          onClick={onClose}
          className="text-gray-400 text-[9px] font-black uppercase tracking-widest hover:text-red-500 transition-colors"
        >
          Şimdi Değil, Atla
        </button>

      </div>
    </div>
  );
}