'use client';

import { X, UserCircle2, Save, Heart, CreditCard, BadgeCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '../lib/firebase';
import { useMembershipIap } from '../lib/useMembershipIap';
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

function getMembershipText(lang: AppLang) {
  if (lang === 'fr') {
    return {
      title: 'Adhésion',
      firstYear: '12 premiers mois gratuits',
      freeUntil: 'Fin de la période gratuite',
      yearlyAfter: 'Puis annuel',
      paymentOnlyApple: 'Paiement uniquement via Apple In-App Purchase.',
      status: 'Statut',
      active: 'Actif',
      passive: 'Inactif',
      expiry: 'Expiration',
      iosOnlyInfo: "L'achat d'abonnement est disponible sur iOS via App Store.",
      start: "Démarrer l'abonnement (IAP)",
      restore: 'Restaurer les achats',
      manage: "Gérer l'abonnement",
      processing: 'Traitement...',
    };
  }
  if (lang === 'en') {
    return {
      title: 'Membership',
      firstYear: 'First 12 months free',
      freeUntil: 'Free period ends',
      yearlyAfter: 'Then yearly',
      paymentOnlyApple: 'Payment is available only via Apple In-App Purchase.',
      status: 'Status',
      active: 'Active',
      passive: 'Inactive',
      expiry: 'Expiry',
      iosOnlyInfo: 'Subscription purchase is available on iOS via App Store.',
      start: 'Start Subscription (IAP)',
      restore: 'Restore Purchases',
      manage: 'Manage Subscription',
      processing: 'Processing...',
    };
  }
  return {
    title: 'Üyelik',
    firstYear: 'İlk 12 ay ücretsiz',
    freeUntil: 'Ücretsiz dönem bitiş',
    yearlyAfter: 'Sonrasında yıllık',
    paymentOnlyApple: 'Ödeme yalnızca Apple In-App Purchase ile yapılır.',
    status: 'Durum',
    active: 'Aktif',
    passive: 'Pasif',
    expiry: 'Bitiş',
    iosOnlyInfo: 'Abonelik satın alma iOS uygulamasında App Store üzerinden yapılır.',
    start: 'Aboneliği Başlat (IAP)',
    restore: 'Satın Alımları Geri Yükle',
    manage: 'Aboneliği Yönet',
    processing: 'İşleniyor...',
  };
}

function toLocaleTag(lang: AppLang): string {
  if (lang === 'fr') return 'fr-FR';
  if (lang === 'en') return 'en-US';
  return 'tr-TR';
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [name, setName] = useState('');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [saved, setSaved] = useState(false);
  const [membershipStartedAt, setMembershipStartedAt] = useState<number | null>(null);
  const [appLang, setAppLang] = useState<AppLang>('tr');
  const membershipIap = useMembershipIap();

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

    const storedMembershipStart = Number(localStorage.getItem('Transport_membership_started_at') || '');
    if (Number.isFinite(storedMembershipStart) && storedMembershipStart > 0) {
      setMembershipStartedAt(storedMembershipStart);
    }
    setAppLang(getPreferredLang());
  }, [isOpen]);

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

  const freeUntilText = useMemo(() => {
    if (!membershipStartedAt) return '-';
    const next = new Date(membershipStartedAt);
    next.setFullYear(next.getFullYear() + 1);
    return next.toLocaleDateString(toLocaleTag(appLang));
  }, [appLang, membershipStartedAt]);

  const iapExpiresText = useMemo(() => {
    if (!membershipIap.expiresDate) return '-';
    const dt = new Date(membershipIap.expiresDate);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString(toLocaleTag(appLang));
  }, [appLang, membershipIap.expiresDate]);
  const membershipText = useMemo(() => getMembershipText(appLang), [appLang]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-700/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-[2.2rem] border border-white/70 bg-white/85 p-6 shadow-2xl backdrop-blur-2xl relative">
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
              className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
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

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-3">
          <div className="flex items-center gap-2">
            <BadgeCheck className="text-emerald-600" size={16} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{membershipText.title}</p>
          </div>
          <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black uppercase text-emerald-700 border border-emerald-100">
            <CreditCard size={12} /> Premium
          </div>
          <p className="mt-1 text-[12px] font-black text-slate-900">{membershipText.firstYear}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-600">{membershipText.freeUntil}: {freeUntilText}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-600">{membershipText.yearlyAfter} {membershipIap.priceText || '1 EUR'} (store local price).</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-600">{membershipText.paymentOnlyApple}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-600">{membershipText.status}: {membershipIap.isActive ? membershipText.active : membershipText.passive}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-600">{membershipText.expiry}: {iapExpiresText}</p>
          {!membershipIap.isNativeIOS && (
            <p className="mt-2 text-[11px] font-semibold text-slate-500">
              {membershipText.iosOnlyInfo}
            </p>
          )}
          {membershipIap.isNativeIOS && !membershipIap.hasPurchasesPlugin && (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-700">
              IAP eklentisi bu iOS buildinde aktif değil. Xcode paketlerini yenileyip tekrar build alın.
            </p>
          )}
          {membershipIap.errorText && membershipIap.isNativeIOS && membershipIap.hasPurchasesPlugin && (
            <p className="mt-2 text-[11px] font-semibold text-red-600">{membershipIap.errorText}</p>
          )}
          {membershipIap.isNativeIOS && membershipIap.hasPurchasesPlugin ? (
            <div className="mt-3 grid gap-2">
              <button
                onClick={membershipIap.purchase}
                disabled={membershipIap.isLoading}
                className="rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-white disabled:opacity-60"
              >
                {membershipIap.isLoading ? membershipText.processing : membershipText.start}
              </button>
              <button
                onClick={membershipIap.restore}
                disabled={membershipIap.isLoading}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-700 disabled:opacity-60"
              >
                {membershipText.restore}
              </button>
              <button
                onClick={membershipIap.openManageSubscriptions}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-700"
              >
                {membershipText.manage}
              </button>
            </div>
          ) : null}
        </div>

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
