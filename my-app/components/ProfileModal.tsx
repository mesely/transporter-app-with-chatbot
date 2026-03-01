'use client';

import { X, UserCircle2, Save, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '../lib/firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FavoriteItem = {
  _id: string;
  businessName?: string;
  phoneNumber?: string;
  address?: { city?: string; district?: string };
};

const FAVORITES_KEY = 'Transport_favorites_v1';
const USER_NAME_KEY = 'Transport_user_name';

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [name, setName] = useState('');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSaved(false);
    setName(localStorage.getItem(USER_NAME_KEY) || 'Kullanıcı');
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setFavorites(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFavorites([]);
    }
  }, [isOpen]);

  const handleSave = () => {
    const clean = name.trim() || 'Kullanıcı';
    localStorage.setItem(USER_NAME_KEY, clean);
    setName(clean);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const handleLogout = async () => {
    try {
      await FirebaseAuthentication.signOut();
    } catch {}
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem('Transport_auth_logged_in');
    localStorage.removeItem('Transport_guest_mode');
    localStorage.removeItem('Transport_user_email');
    localStorage.removeItem('Transport_user_phone');
    localStorage.removeItem('Transport_user_name');
    localStorage.removeItem('Transport_user_city');
    localStorage.removeItem('Transport_user_country_code');
    onClose();
    window.location.assign('/auth');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-black/35 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-[2.2rem] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur-xl relative">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-all">
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="text-center mb-5">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white shadow-lg">
            <UserCircle2 size={34} className="text-cyan-700" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-wide">Profil</h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 flex items-center gap-3">
          <UserCircle2 size={16} className="text-cyan-700" />
          <div className="flex-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Ad Soyad</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
              placeholder="Ad Soyad"
            />
          </div>
        </div>

        <button onClick={handleSave} className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 mt-4 flex items-center justify-center gap-2 text-white shadow-lg active:scale-95 transition-all text-xs font-black uppercase tracking-widest">
          <Save size={16} /> Kaydet
        </button>
        {saved && <p className="mt-2 text-center text-xs font-bold text-emerald-700">Profil güncellendi.</p>}
        <button
          onClick={handleLogout}
          className="w-full rounded-2xl bg-slate-900 py-3 mt-2 text-xs font-black uppercase tracking-widest text-white shadow-lg"
        >
          Çıkış Yap
        </button>

        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={16} className="text-rose-600" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Favori Firmalar</p>
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {favorites.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-500">
                Henüz favori firma yok.
              </p>
            ) : (
              favorites.map((fav) => (
                <div key={fav._id} className="rounded-xl border border-rose-100 bg-rose-50/70 p-3">
                  <p className="text-xs font-black uppercase text-slate-800">{fav.businessName || 'Firma'}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-600">
                    {(fav.address?.district || '-') + ' / ' + (fav.address?.city || '-')}
                  </p>
                  {fav.phoneNumber && <p className="mt-1 text-[11px] font-semibold text-slate-600">{fav.phoneNumber}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
