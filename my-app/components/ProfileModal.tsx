'use client';

import { X, UserCircle2, Save, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '../lib/firebase';
import { AppLang, LANG_CHANGED_EVENT, LANG_STORAGE_KEY, getPreferredLang } from '../utils/language';

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

function getCopy(lang: AppLang) {
  if (lang === 'fr') {
    return {
      title: 'Profil',
      fullName: 'Nom complet',
      save: 'Enregistrer',
      saved: 'Profil mis a jour.',
      logout: 'Deconnexion',
      favorites: 'Prestataires favoris',
      noFavorites: 'Aucun favori.',
      defaultUser: 'Utilisateur',
      defaultCompany: 'Entreprise',
    };
  }
  if (lang === 'en') {
    return {
      title: 'Profile',
      fullName: 'Full Name',
      save: 'Save',
      saved: 'Profile updated.',
      logout: 'Log Out',
      favorites: 'Favorite Providers',
      noFavorites: 'No favorites yet.',
      defaultUser: 'User',
      defaultCompany: 'Company',
    };
  }
  return {
    title: 'Profil',
    fullName: 'Ad Soyad',
    save: 'Kaydet',
    saved: 'Profil guncellendi.',
    logout: 'Cikis Yap',
    favorites: 'Favori Firmalar',
    noFavorites: 'Henuz favori firma yok.',
    defaultUser: 'Kullanici',
    defaultCompany: 'Firma',
  };
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [name, setName] = useState('');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [saved, setSaved] = useState(false);
  const [appLang, setAppLang] = useState<AppLang>('tr');
  const copy = getCopy(appLang);

  useEffect(() => {
    if (!isOpen) return;
    setSaved(false);
    setName(localStorage.getItem(USER_NAME_KEY) || copy.defaultUser);
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setFavorites(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFavorites([]);
    }
    setAppLang(getPreferredLang());
  }, [copy.defaultUser, isOpen]);

  useEffect(() => {
    const syncLang = () => setAppLang(getPreferredLang());
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === LANG_STORAGE_KEY) syncLang();
    };
    const onLangChanged = () => syncLang();
    window.addEventListener('storage', onStorage);
    window.addEventListener(LANG_CHANGED_EVENT, onLangChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LANG_CHANGED_EVENT, onLangChanged);
    };
  }, []);

  const handleSave = () => {
    const clean = name.trim() || copy.defaultUser;
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
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/35 p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <button onClick={onClose} className="absolute right-5 top-5 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:bg-slate-50">
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <UserCircle2 size={34} className="text-slate-700" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-wide text-slate-900">{copy.title}</h3>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
          <UserCircle2 size={16} className="text-slate-700" />
          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{copy.fullName}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
              placeholder={copy.fullName}
            />
          </div>
        </div>

        <button onClick={handleSave} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95">
          <Save size={16} /> {copy.save}
        </button>
        {saved && <p className="mt-2 text-center text-xs font-bold text-emerald-700">{copy.saved}</p>}
        <button
          onClick={handleLogout}
          className="mt-2 w-full rounded-2xl bg-slate-900 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg"
        >
          {copy.logout}
        </button>

        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2">
            <Heart size={16} className="text-slate-700" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{copy.favorites}</p>
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {favorites.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-500">
                {copy.noFavorites}
              </p>
            ) : (
              favorites.map((fav) => (
                <div key={fav._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-black uppercase text-slate-800">{fav.businessName || copy.defaultCompany}</p>
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
