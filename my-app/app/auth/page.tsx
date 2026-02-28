'use client';

import { FormEvent, useMemo, useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { Mail, Lock, User, Phone, Facebook } from 'lucide-react';
import { auth, facebookProvider, googleProvider } from '../../lib/firebase';

type CountryCodeOption = { code: string; flag: string; label: string };

const COUNTRY_CODES: CountryCodeOption[] = [
  { code: '+90', flag: '🇹🇷', label: 'Türkiye' },
  { code: '+49', flag: '🇩🇪', label: 'Almanya' },
  { code: '+33', flag: '🇫🇷', label: 'Fransa' },
  { code: '+39', flag: '🇮🇹', label: 'İtalya' },
  { code: '+44', flag: '🇬🇧', label: 'Birleşik Krallık' },
  { code: '+1', flag: '🇺🇸', label: 'Amerika' },
];

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 533.5 544.3" aria-hidden="true">
      <path fill="#4285f4" d="M533.5 278.4c0-18.5-1.5-37-4.7-55.1H272v104.4h147.2c-6.1 33.2-25 61.3-53.1 80.1v66h85.9c50.3-46.3 81.5-114.6 81.5-195.4z" />
      <path fill="#34a853" d="M272 544.3c73.5 0 135.3-24.4 180.4-66.5l-85.9-66c-23.9 16.3-54.5 25.6-94.5 25.6-72.7 0-134.4-49.1-156.4-115.2h-88.6v72.4C72.3 484 166.6 544.3 272 544.3z" />
      <path fill="#fbbc04" d="M115.6 322.2c-10.9-32.4-10.9-67.6 0-100l-.1-72.4H27c-39.1 77.8-39.1 166.9 0 244.7l88.6-72.3z" />
      <path fill="#ea4335" d="M272 107c41.4-.6 81.1 14.9 111.6 43.6l83.2-83.2C402.6 24.2 339.4-.4 272 0 166.6 0 72.3 60.3 27 149.8l88.6 72.4C137.6 156.1 199.3 107 272 107z" />
    </svg>
  );
}

function normalizePhone(value: string) {
  return String(value || '').replace(/\D/g, '');
}

function buildEmailFromIdentifier(identifier: string, countryCode: string) {
  const raw = String(identifier || '').trim();
  if (!raw) return '';
  if (raw.includes('@')) return raw.toLocaleLowerCase('tr');

  const cc = normalizePhone(countryCode).replace(/^0+/, '');
  let phone = normalizePhone(raw);
  if (!phone) return '';
  if (phone.startsWith('00')) phone = phone.slice(2);
  if (phone.startsWith('0')) phone = phone.slice(1);
  if (!phone.startsWith(cc)) phone = `${cc}${phone}`;
  return `phone_${phone}@transport245.app`;
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+90');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => (mode === 'register' ? 'Kayıt Ol' : 'Giriş Yap'), [mode]);

  const onEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const email = buildEmailFromIdentifier(identifier, countryCode);
      if (!email) throw new Error('Lütfen geçerli bir e-posta veya telefon girin.');
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) localStorage.setItem('Transport_auth_name', name.trim());
        const normalizedPhone = normalizePhone(phone);
        if (normalizedPhone) {
          const cc = normalizePhone(countryCode);
          localStorage.setItem('Transport_auth_phone', `+${cc}${normalizedPhone.startsWith('0') ? normalizedPhone.slice(1) : normalizedPhone}`);
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: any) {
      setError(err?.message || 'Kimlik doğrulama başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (provider: 'google' | 'facebook') => {
    setError('');
    setLoading(true);
    try {
      const p = provider === 'google' ? googleProvider : facebookProvider;
      try {
        await signInWithPopup(auth, p);
      } catch {
        await signInWithRedirect(auth, p);
      }
    } catch (err: any) {
      setError(err?.message || `${provider} ile giris basarisiz.`);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(6,182,212,0.18),transparent_32%),radial-gradient(circle_at_86%_88%,rgba(37,99,235,0.2),transparent_38%),#f8fafc] flex items-center justify-center p-5">
      <section className="w-full max-w-md rounded-[2.2rem] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <img src="/playstore.png" alt="Transport 245" className="mx-auto h-16 w-16 rounded-2xl shadow-lg ring-1 ring-slate-200" />
          <h1 className="mt-4 text-2xl font-black uppercase tracking-wide text-slate-900">{title}</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">Uygulamayı kullanmak için hesap gerekli.</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setMode('register')}
            className={`rounded-xl py-2 text-xs font-black uppercase ${mode === 'register' ? 'bg-white text-cyan-700 shadow' : 'text-slate-500'}`}
          >
            Kayıt
          </button>
          <button
            onClick={() => setMode('login')}
            className={`rounded-xl py-2 text-xs font-black uppercase ${mode === 'login' ? 'bg-white text-cyan-700 shadow' : 'text-slate-500'}`}
          >
            Giriş
          </button>
        </div>

        <form onSubmit={onEmailSubmit} className="mt-4 space-y-3">
          {mode === 'register' && (
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3">
              <User size={16} className="text-cyan-700" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad Soyad" className="w-full bg-transparent text-sm font-semibold outline-none" />
            </label>
          )}
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3">
            <Mail size={16} className="text-cyan-700" />
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="E-posta veya Telefon"
              required
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3">
            <span className="text-sm font-black text-slate-600">🌐</span>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-black text-slate-700 outline-none"
            >
              {COUNTRY_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.flag} {item.code}
                </option>
              ))}
            </select>
            <div className="h-5 w-px bg-slate-200" />
            <Phone size={16} className="text-cyan-700" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefon (Kayıt için)"
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </div>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3">
            <Lock size={16} className="text-cyan-700" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifre" type="password" required className="w-full bg-transparent text-sm font-semibold outline-none" />
          </label>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg disabled:opacity-60"
          >
            {loading ? 'İşleniyor...' : mode === 'register' ? 'Kaydı Tamamla' : 'Giriş Yap'}
          </button>
        </form>

        <div className="my-4 h-px bg-slate-200" />

        <div className="space-y-2">
          <button
            onClick={() => socialLogin('google')}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-black uppercase tracking-wide text-slate-700 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <GoogleLogo /> Google ile Giriş
          </button>
          <button
            onClick={() => socialLogin('facebook')}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-black uppercase tracking-wide text-slate-700 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Facebook size={16} className="text-blue-600" /> Facebook ile Giriş
          </button>
        </div>
      </section>
    </main>
  );
}
