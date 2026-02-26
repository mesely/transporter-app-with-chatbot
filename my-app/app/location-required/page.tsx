'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';

export default function LocationRequiredPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('Konum izni kapalı. Devam etmek için konumu açmanız gerekiyor.');

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
            setMessage('Konum izni bekleniyor. İzin verildiğinde otomatik devam edilecek.');
          } else {
            setMessage('Konum izni kapalı. Ayarlardan açıp Tekrar Kontrol Et butonuna basın.');
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_15%,rgba(239,68,68,0.16),transparent_35%),radial-gradient(circle_at_80%_85%,rgba(220,38,38,0.14),transparent_40%),#fff7f7] p-6 flex items-center justify-center">
      <div className="mx-auto w-full max-w-2xl rounded-[2.6rem] border border-white/70 bg-white/92 p-10 md:p-12 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto mb-6 inline-flex rounded-3xl bg-gradient-to-br from-red-50 to-red-100 p-4 text-red-600 shadow-sm">
          <MapPin size={34} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wide text-red-700">KONUM İZNİNİ AÇIN</h1>
        <p className="mt-4 text-lg md:text-xl font-extrabold text-slate-700">{message}</p>

        <div className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-slate-50/90 p-6 text-left">
          <div className="flex items-start gap-3 text-slate-700">
            <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-700">1</span>
            <p className="text-base font-black leading-snug">Ayarlar &gt; Uygulamalar &gt; Transport 245 &gt; İzinler &gt; Konum</p>
          </div>
          <div className="flex items-start gap-3 text-slate-700">
            <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-700">2</span>
            <p className="text-base font-black leading-snug">Konum iznini "İzin Ver" olarak ayarlayın.</p>
          </div>
          <div className="flex items-start gap-3 text-slate-700">
            <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-700">3</span>
            <p className="text-base font-black leading-snug">Aşağıdaki butona basın. Konum açıldığında ana ekrana otomatik dönecek.</p>
          </div>
        </div>

        <button
          onClick={checkAndGo}
          disabled={checking}
          className="mt-9 w-full rounded-[1.8rem] bg-gradient-to-r from-red-600 via-red-600 to-red-700 px-6 py-5 text-base font-black uppercase tracking-wide text-white shadow-xl disabled:opacity-70"
        >
          {checking ? 'Kontrol Ediliyor...' : 'Tekrar Kontrol Et'}
        </button>
      </div>
    </main>
  );
}
