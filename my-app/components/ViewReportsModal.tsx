'use client';

import { useState, useEffect } from 'react';
import { X, ShieldAlert, Loader2 } from 'lucide-react';

interface ViewReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string | null;
  driverName?: string;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';

export default function ViewReportsModal({ isOpen, onClose, driverId, driverName }: ViewReportsModalProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !driverId) return;
    setLoading(true);
    fetch(`${API_URL}/reports?providerId=${driverId}`)
      .then(res => res.json())
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(() => setReports([]))
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
          <div className="w-16 h-16 bg-red-50 border-2 border-red-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Şikayetler</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 truncate">{driverName}</p>
          <span className="text-[9px] text-red-500 font-black uppercase bg-red-50 px-3 py-1 rounded-full mt-2 inline-block">
            {reports.length} Şikayet
          </span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-red-400" size={32} />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Henüz şikayet yok</p>
            </div>
          ) : (
            reports.map((r, i) => (
              <div key={i} className="bg-red-50/60 rounded-[1.5rem] p-4 border border-red-100">
                {r.reportCategory && (
                  <span className="text-[8px] font-black uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded-lg">
                    {r.reportCategory === 'driver' ? 'Sürücü/Firma' : 'Uygulama'}
                  </span>
                )}
                {r.reasons && r.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.reasons.map((reason: string, j: number) => (
                      <span key={j} className="px-2 py-0.5 bg-white text-red-700 text-[8px] font-black uppercase rounded-lg border border-red-100">
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
                {r.details && <p className="text-[10px] text-slate-600 font-bold leading-relaxed mt-2">{r.details}</p>}
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
