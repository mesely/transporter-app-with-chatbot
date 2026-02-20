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
    <div className="fixed inset-0 z-[100000] bg-slate-950/40 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-8 relative max-h-[85vh] flex flex-col">
        <button onClick={onClose} className="absolute top-8 right-8 w-10 h-10 bg-slate-50 border border-slate-100 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center text-slate-400 transition-all active:scale-90">
          <X size={18} strokeWidth={3} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-50 border-2 border-yellow-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Değerlendirmeler</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 truncate">{driverName}</p>
          {avgRating > 0 && (
            <div className="flex items-center justify-center gap-1 mt-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={16} className={s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
              ))}
              <span className="text-sm font-black text-slate-700 ml-1">{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-yellow-500" size={32} />
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Henüz değerlendirme yok</p>
            </div>
          ) : (
            [...ratings].reverse().map((r, i) => (
              <div key={i} className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-100">
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={12} className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                  ))}
                  <span className="text-[10px] font-black text-slate-600 ml-1">{r.rating}/5</span>
                </div>
                {r.tags && r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {r.tags.map((tag: string, j: number) => (
                      <span key={j} className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[8px] font-black uppercase rounded-lg">{tag}</span>
                    ))}
                  </div>
                )}
                {r.comment && <p className="text-[10px] text-slate-600 font-bold leading-relaxed">{r.comment}</p>}
                {r.createdAt && (
                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">
                    {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="w-full mt-4 py-4 rounded-[2rem] bg-slate-900 text-white font-black uppercase text-xs tracking-widest active:scale-95 transition-all">
          Kapat
        </button>
      </div>
    </div>
  );
}
