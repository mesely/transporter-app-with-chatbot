'use client';

import { FormEvent, useMemo, useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { Mail, Lock, User, Chrome, Facebook } from 'lucide-react';
import { auth, facebookProvider, googleProvider } from '../../lib/firebase';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => (mode === 'register' ? 'Kayit Ol' : 'Giris Yap'), [mode]);

  const onEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) localStorage.setItem('Transport_auth_name', name.trim());
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: any) {
      setError(err?.message || 'Kimlik dogrulama basarisiz.');
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
          <p className="mt-2 text-sm font-semibold text-slate-600">Uygulamayi kullanmak icin hesap gerekli.</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setMode('register')}
            className={`rounded-xl py-2 text-xs font-black uppercase ${mode === 'register' ? 'bg-white text-cyan-700 shadow' : 'text-slate-500'}`}
          >
            Kayit
          </button>
          <button
            onClick={() => setMode('login')}
            className={`rounded-xl py-2 text-xs font-black uppercase ${mode === 'login' ? 'bg-white text-cyan-700 shadow' : 'text-slate-500'}`}
          >
            Giris
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
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta" type="email" required className="w-full bg-transparent text-sm font-semibold outline-none" />
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3">
            <Lock size={16} className="text-cyan-700" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sifre" type="password" required className="w-full bg-transparent text-sm font-semibold outline-none" />
          </label>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg disabled:opacity-60"
          >
            {loading ? 'Isleniyor...' : mode === 'register' ? 'Kaydi Tamamla' : 'Giris Yap'}
          </button>
        </form>

        <div className="my-4 h-px bg-slate-200" />

        <div className="space-y-2">
          <button
            onClick={() => socialLogin('google')}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-black uppercase tracking-wide text-slate-700 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Chrome size={16} className="text-red-500" /> Google ile Giris
          </button>
          <button
            onClick={() => socialLogin('facebook')}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-black uppercase tracking-wide text-slate-700 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Facebook size={16} className="text-blue-600" /> Facebook ile Giris
          </button>
        </div>
      </section>
    </main>
  );
}

