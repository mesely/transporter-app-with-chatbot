'use client';

import { useState, useEffect } from 'react';
import { X, Star, Loader2 } from 'lucide-react';

interface ViewRatingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string | null;
  driverName?: string;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';

export default function ViewRatingsModal({ isOpen, onClose, driverId, driverName }: ViewRatingsModalProps) {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (!isOpen || !driverId) return;
    setLoading(true);
    fetch(`${API_URL}/users/${driverId}/ratings`)
      .then(res => res.json())
      .then(data => {
        setRatings(data.ratings || []);
        setAvgRating(data.rating || 0);
      })
      .catch(() => setRatings([]))
      .finally(() => setLoading(false));
  }, [isOpen, driverId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">

        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-8 pt-10 pb-7 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 bg-black/15 rounded-full flex items-center justify-center text-white active:scale-90"
          >
            <X size={18} strokeWidth={3} />
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Star className="w-7 h-7 text-white fill-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">Değerlendirmeler</h3>
              <p className="text-white/70 text-[11px] font-bold uppercase mt-1 truncate">{driverName}</p>
            </div>
          </div>
          {avgRating > 0 ? (
            <div className="flex items-center gap-2 bg-white/20 rounded-2xl px-4 py-2.5 w-fit">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14} className={s <= Math.round(avgRating) ? 'fill-white text-white' : 'text-white/30'} />
                ))}
              </div>
              <span className="text-white font-black text-sm ml-0.5">{avgRating.toFixed(1)}</span>
              <span className="text-white/60 font-bold text-[10px] uppercase">Ortalama</span>
            </div>
          ) : (
            <div className="bg-white/20 rounded-2xl px-4 py-2.5 w-fit">
              <span className="text-white/70 font-black text-[11px] uppercase">Henüz değerlendirme yok</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 min-h-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star size={28} className="text-amber-200" />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Henüz değerlendirme yok</p>
            </div>
          ) : (
            [...ratings].reverse().map((r, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={13} className={s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                    ))}
                    <span className="text-[9px] font-black text-slate-500 ml-1">{r.rating}/5</span>
                  </div>
                  {r.createdAt && (
                    <span className="text-[8px] text-slate-400 font-bold uppercase">
                      {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  )}
                </div>
                {r.tags && r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {r.tags.map((tag: string, j: number) => (
                      <span key={j} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded-lg">{tag}</span>
                    ))}
                  </div>
                )}
                {r.comment && (
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{r.comment}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest active:scale-95 transition-transform"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
