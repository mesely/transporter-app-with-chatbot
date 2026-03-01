'use client';

import { ArrowLeft, Heart, Save, UserCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const FAVORITES_KEY = 'Transport_favorites_v1';
const USER_NAME_KEY = 'Transport_user_name';

type FavoriteItem = {
  _id: string;
  businessName?: string;
  phoneNumber?: string;
  address?: { city?: string; district?: string };
};

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('Kullanıcı');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem(USER_NAME_KEY) || 'Kullanıcı';
    setName(storedName);

    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setFavorites(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFavorites([]);
    }
  }, []);

  const saveName = () => {
    const clean = name.trim() || 'Kullanıcı';
    localStorage.setItem(USER_NAME_KEY, clean);
    setName(clean);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-[#f1f5f9] to-[#e2e8f0] px-5 pb-10 pt-10 md:px-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Profil</h1>
          </div>
        </header>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <UserCircle2 className="text-cyan-700" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Ad Soyad</p>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ad Soyad"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none"
            />
            <button
              onClick={saveName}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wide text-white"
            >
              <Save size={14} /> Kaydet
            </button>
          </div>
          {saved && <p className="mt-2 text-xs font-bold text-emerald-700">Ad soyad güncellendi.</p>}
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
                  {fav.phoneNumber && (
                    <p className="mt-1 text-[11px] font-semibold text-slate-600">{fav.phoneNumber}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
