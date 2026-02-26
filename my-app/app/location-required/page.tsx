'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocateFixed, Settings2, ShieldAlert } from 'lucide-react';

export default function LocationRequiredPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('Konum izni kapali. Devam etmek icin konumu acmaniz gerekiyor.');

  const checkAndGo = useCallback(() => {
    if (!navigator?.geolocation) return;
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setChecking(false);
        router.replace('/');
      },
      () => {
        setChecking(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [router]);

  useEffect(() => {
    let mounted = true;
    const watch = async () => {
      try {
        const permissions = (navigator as any).permissions;
        if (permissions?.query) {
          const status = await permissions.query({ name: 'geolocation' as PermissionName });
          if (!mounted) return;
          if (status?.state === 'granted') {
            checkAndGo();
            return;
          }
          if (status?.state === 'prompt') {
            setMessage('Konum izni bekleniyor. Izin verildiginde otomatik devam edilecek.');
          } else {
            setMessage('Konum izni kapali. Ayarlardan acip Tekrar Kontrol Et butonuna basin.');
          }
        }
      } catch {}
    };

    watch();
    const intervalId = setInterval(watch, 2200);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [checkAndGo]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_15%,rgba(239,68,68,0.15),transparent_35%),radial-gradient(circle_at_80%_85%,rgba(124,58,237,0.16),transparent_40%),#f8fafc] p-6">
      <div className="mx-auto mt-14 max-w-xl rounded-[2.4rem] border border-white/60 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-5 inline-flex rounded-2xl bg-red-50 p-3 text-red-600">
          <ShieldAlert size={26} />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900">Konum Gerekli</h1>
        <p className="mt-3 text-sm font-bold text-slate-600">{message}</p>

        <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <Settings2 size={14} className="text-slate-500" />
            Ayarlar &gt; Uygulamalar &gt; Transport 245 &gt; Izinler &gt; Konum
          </div>
          <div className="flex items-center gap-2">
            <LocateFixed size={14} className="text-slate-500" />
            Konum acildiginda sayfa otomatik olarak ana ekrana donecek.
          </div>
        </div>

        <button
          onClick={checkAndGo}
          disabled={checking}
          className="mt-7 w-full rounded-[1.6rem] bg-gradient-to-r from-red-600 via-rose-600 to-purple-700 px-5 py-4 text-sm font-black uppercase tracking-wide text-white shadow-xl disabled:opacity-70"
        >
          {checking ? 'Kontrol Ediliyor...' : 'Tekrar Kontrol Et'}
        </button>
      </div>
    </main>
  );
}

