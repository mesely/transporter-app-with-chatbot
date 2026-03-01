'use client';

import { AlertTriangle, ArrowLeft, Heart, Mail, Star, UserCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';
const FAVORITES_KEY = 'Transport_favorites_v1';

type FavoriteItem = {
  _id: string;
  businessName?: string;
  phoneNumber?: string;
  address?: { city?: string; district?: string };
  rating?: number;
};

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState('Kullanıcı');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [myRatings, setMyRatings] = useState<any[]>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizedPhone = useMemo(() => String(phone || '').replace(/\D/g, ''), [phone]);

  useEffect(() => {
    const storedName = localStorage.getItem('Transport_user_name') || 'Kullanıcı';
    const storedEmail = localStorage.getItem('Transport_user_email') || '';
    const storedPhone = localStorage.getItem('Transport_user_phone') || '';

    setName(storedName);
    setEmail(storedEmail);
    setPhone(storedPhone);

    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setFavorites(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    const loadActivity = async () => {
      if (!normalizedPhone) {
        setMyRatings([]);
        setMyReports([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [ratingsRes, reportsRes] = await Promise.all([
          fetch(`${API_URL}/users/ratings/by-reporter?phone=${encodeURIComponent(normalizedPhone)}`),
          fetch(`${API_URL}/reports?reporterPhone=${encodeURIComponent(normalizedPhone)}`),
        ]);
        const ratingsData = await ratingsRes.json();
        const reportsData = await reportsRes.json();
        setMyRatings(Array.isArray(ratingsData) ? ratingsData : []);
        setMyReports(Array.isArray(reportsData) ? reportsData : []);
      } catch {
        setMyRatings([]);
        setMyReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [normalizedPhone]);

  const getStatusChip = (statusRaw: string) => {
    const status = String(statusRaw || '').toUpperCase();
    if (status === 'APPROVED' || status === 'RESOLVED') {
      return { label: 'Yayınlandı', className: 'bg-emerald-100 text-emerald-700' };
    }
    if (status === 'REJECTED' || status === 'CLOSED') {
      return { label: 'Reddedildi', className: 'bg-slate-200 text-slate-600' };
    }
    return { label: 'Admin Onayı Bekliyor', className: 'bg-amber-100 text-amber-700' };
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-[#f1f5f9] to-[#e2e8f0] px-5 pb-10 pt-10 md:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Profil ve Aktiviteler</h1>
          </div>
        </header>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <UserCircle2 className="text-cyan-700" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Hesap Bilgileri</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase text-slate-400">Ad Soyad</p>
              <p className="mt-1 text-sm font-black text-slate-900">{name || '-'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase text-slate-400">E-posta</p>
              <p className="mt-1 text-sm font-black text-slate-900 break-all">{email || '-'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Heart className="text-rose-600" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Favori Firmalar</p>
          </div>
          <div className="mt-4 space-y-2">
            {favorites.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">Henüz favori firma yok.</p>
            ) : (
              favorites.map((fav) => (
                <div key={fav._id} className="rounded-xl border border-rose-100 bg-rose-50/70 p-3">
                  <p className="text-xs font-black uppercase text-slate-800">{fav.businessName || 'Firma'}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-600">
                    {(fav.address?.district || '-') + ' / ' + (fav.address?.city || '-')}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Star className="text-amber-500" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Yaptığım Değerlendirmeler</p>
          </div>
          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="text-xs font-bold text-slate-500">Yükleniyor...</p>
            ) : myRatings.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">Henüz değerlendirme yok.</p>
            ) : (
              myRatings.map((item) => {
                const chip = getStatusChip(item.status);
                return (
                  <div key={`${item.providerId}-${item.entryId}`} className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase text-slate-800">{item.providerName || 'Firma'}</p>
                      <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${chip.className}`}>{chip.label}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-bold text-slate-600">Puan: {item.rating}/5</p>
                    {item.comment && <p className="mt-1 text-[11px] font-medium text-slate-600">{item.comment}</p>}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Yaptığım Şikayetler</p>
          </div>
          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="text-xs font-bold text-slate-500">Yükleniyor...</p>
            ) : myReports.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">Henüz şikayet yok.</p>
            ) : (
              myReports.map((item: any) => {
                const chip = getStatusChip(item.status);
                return (
                  <div key={item._id} className="rounded-xl border border-red-100 bg-red-50/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase text-slate-800">{item.reason || 'Şikayet'}</p>
                      <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${chip.className}`}>{chip.label}</span>
                    </div>
                    {item.details && <p className="mt-1 text-[11px] font-medium text-slate-600">{item.details}</p>}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <footer className="rounded-[2rem] border border-white/70 bg-white/70 p-4 text-center shadow-lg backdrop-blur-xl">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <Mail size={14} /> Onay süreçleri admin panelinden yönetilir.
          </p>
        </footer>
      </div>
    </main>
  );
}
