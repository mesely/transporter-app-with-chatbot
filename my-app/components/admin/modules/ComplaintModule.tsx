'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, ShieldAlert, Star, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';

export default function ComplaintModule() {
  const [reports, setReports] = useState<any[]>([]);
  const [pendingRatings, setPendingRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsRes, ratingsRes] = await Promise.all([
        fetch(`${API_URL}/reports`),
        fetch(`${API_URL}/users/ratings/pending`),
      ]);
      const reportsData = await reportsRes.json();
      const ratingsData = await ratingsRes.json();
      setReports(Array.isArray(reportsData) ? reportsData : []);
      setPendingRatings(Array.isArray(ratingsData) ? ratingsData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const moderateReport = async (reportId: string, action: 'approve' | 'reject') => {
    const busy = `report:${reportId}:${action}`;
    setBusyKey(busy);
    try {
      await fetch(`${API_URL}/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'approve' ? 'RESOLVED' : 'CLOSED',
          adminNote: action === 'approve' ? 'Admin onayıyla yayınlandı.' : 'Admin tarafından reddedildi.',
        }),
      });
      await loadData();
    } finally {
      setBusyKey(null);
    }
  };

  const moderateRating = async (providerId: string, entryId: string, action: 'approve' | 'reject') => {
    const busy = `rating:${providerId}:${entryId}:${action}`;
    setBusyKey(busy);
    try {
      await fetch(`${API_URL}/users/ratings/${providerId}/${entryId}/moderate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await loadData();
    } finally {
      setBusyKey(null);
    }
  };

  const reportQueue = reports.filter((r) => ['OPEN', 'IN_PROGRESS'].includes(String(r?.status || '').toUpperCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4 rounded-[2rem] border border-white/60 bg-white/65 p-6 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-2 text-xs font-black uppercase text-rose-700">
          <ShieldAlert size={16} /> Bekleyen Şikayet: {reportQueue.length}
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-2 text-xs font-black uppercase text-amber-700">
          <Star size={16} /> Bekleyen Değerlendirme: {pendingRatings.length}
        </div>
      </div>

      <section className="rounded-[2rem] border border-white/60 bg-white/65 p-6 shadow-lg backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-700">Şikayet Moderasyonu</h3>
        {loading ? (
          <p className="text-xs font-bold text-slate-500">Yükleniyor...</p>
        ) : reportQueue.length === 0 ? (
          <p className="text-xs font-bold text-slate-500">Bekleyen şikayet yok.</p>
        ) : (
          <div className="space-y-3">
            {reportQueue.map((r) => (
              <div key={r._id} className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase text-slate-800">{r.reason || 'Şikayet'}</p>
                  <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black uppercase text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <p className="mb-3 text-xs font-semibold text-slate-600">{r.details || 'Detay girilmemiş.'}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => moderateReport(r._id, 'approve')}
                    disabled={!!busyKey}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} /> Onayla & Yayınla
                  </button>
                  <button
                    onClick={() => moderateReport(r._id, 'reject')}
                    disabled={!!busyKey}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-60"
                  >
                    <XCircle size={14} /> Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/60 bg-white/65 p-6 shadow-lg backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-700">Değerlendirme Moderasyonu</h3>
        {loading ? (
          <p className="text-xs font-bold text-slate-500">Yükleniyor...</p>
        ) : pendingRatings.length === 0 ? (
          <p className="text-xs font-bold text-slate-500">Bekleyen değerlendirme yok.</p>
        ) : (
          <div className="space-y-3">
            {pendingRatings.map((item) => (
              <div key={`${item.providerId}-${item.entryId}`} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase text-slate-800">{item.providerName}</p>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-black uppercase text-amber-700">
                    <Clock3 size={12} /> {item.rating}/5
                  </span>
                </div>
                {item.comment && <p className="mb-2 text-xs font-semibold text-slate-600">{item.comment}</p>}
                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {item.tags.map((tag: string, i: number) => (
                      <span key={`${item.entryId}-tag-${i}`} className="rounded-lg bg-white px-2 py-1 text-[10px] font-black uppercase text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => moderateRating(item.providerId, item.entryId, 'approve')}
                    disabled={!!busyKey}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} /> Onayla & Yayınla
                  </button>
                  <button
                    onClick={() => moderateRating(item.providerId, item.entryId, 'reject')}
                    disabled={!!busyKey}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-60"
                  >
                    <XCircle size={14} /> Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
