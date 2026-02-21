'use client';

import { useState, useEffect } from 'react';
import { X, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-[100000] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">

        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-red-500 to-rose-600 px-8 pt-10 pb-7 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 bg-black/15 rounded-full flex items-center justify-center text-white active:scale-90"
          >
            <X size={18} strokeWidth={3} />
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">Şikayetler</h3>
              <p className="text-white/70 text-[11px] font-bold uppercase mt-1 truncate">{driverName}</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-2.5 w-fit">
            <span className="text-white font-black text-sm">{reports.length}</span>
            <span className="text-white/70 font-bold text-[11px] uppercase ml-1.5">Şikayet</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 min-h-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-red-400" size={32} />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={28} className="text-red-200" />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Henüz şikayet yok</p>
            </div>
          ) : (
            reports.map((r, i) => (
              <div key={i} className="bg-red-50/60 rounded-2xl p-4 border border-red-100">
                <div className="flex items-center justify-between mb-2">
                  {r.reportCategory && (
                    <span className="text-[8px] font-black uppercase text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                      {r.reportCategory === 'driver' ? 'Sürücü / Firma' : 'Uygulama'}
                    </span>
                  )}
                  {r.createdAt && (
                    <span className="text-[8px] text-slate-400 font-bold uppercase ml-auto">
                      {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  )}
                </div>
                {r.reasons && r.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 mb-2">
                    {r.reasons.map((reason: string, j: number) => (
                      <span key={j} className="px-2 py-0.5 bg-white text-red-700 text-[8px] font-black uppercase rounded-lg border border-red-200">
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
                {r.details && (
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">{r.details}</p>
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
