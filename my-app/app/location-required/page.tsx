'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';

const MANUAL_LOCATION_KEY = 'Transport_manual_location_v1';

export default function LocationRequiredPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('Konum izni kapalı. Devam etmek için konumu açmanız gerekiyor.');
  const [cityData, setCityData] = useState<Record<string, string[]>>({});
  const [selectedCity, setSelectedCity] = useState('İstanbul');
  const [selectedDistrict, setSelectedDistrict] = useState('Tuzla');

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
    const controller = new AbortController();
    const loadCities = async () => {
      try {
        const res = await fetch('/il_ilce.csv', { signal: controller.signal, cache: 'no-store' });
        const text = await res.text();
        const lines = text.split('\n').slice(1);
        const map: Record<string, string[]> = {};
        for (const line of lines) {
          const [il, ilce] = line.split(',');
          if (!il || !ilce) continue;
          const city = il.trim();
          const district = ilce.trim();
          if (!city || !district) continue;
          if (!map[city]) map[city] = [];
          map[city].push(district);
        }
        Object.keys(map).forEach((city) => {
          map[city] = Array.from(new Set(map[city]));
        });
        setCityData(map);
      } catch {}
    };
    loadCities();
    return () => controller.abort();
  }, []);

  const availableDistricts = useMemo(() => cityData[selectedCity] || [], [cityData, selectedCity]);

  useEffect(() => {
    if (!availableDistricts.length) return;
    if (!availableDistricts.includes(selectedDistrict)) {
      setSelectedDistrict(availableDistricts[0]);
    }
  }, [availableDistricts, selectedDistrict]);

  const handleContinueWithSelection = useCallback(async () => {
    if (!selectedCity || !selectedDistrict) return;
    setChecking(true);
    try {
      const q = encodeURIComponent(`${selectedDistrict}, ${selectedCity}, Türkiye`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${q}`);
      const data = await res.json();
      const lat = Number(data?.[0]?.lat);
      const lng = Number(data?.[0]?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        alert('Seçilen il/ilçe için merkez bulunamadı.');
        return;
      }
      localStorage.setItem(MANUAL_LOCATION_KEY, JSON.stringify({
        lat,
        lng,
        city: selectedCity,
        district: selectedDistrict,
        ts: Date.now(),
      }));
      router.replace('/');
    } catch {
      alert('Konum seçimi işlenemedi. Lütfen tekrar deneyin.');
    } finally {
      setChecking(false);
    }
  }, [router, selectedCity, selectedDistrict]);

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

        <div className="mt-6 grid grid-cols-1 gap-3 text-left md:grid-cols-2">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="rounded-2xl border border-white/50 bg-white/80 p-4 text-sm font-black text-slate-800 outline-none backdrop-blur-sm"
          >
            {Object.keys(cityData).map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="rounded-2xl border border-white/50 bg-white/80 p-4 text-sm font-black text-slate-800 outline-none backdrop-blur-sm"
          >
            {availableDistricts.map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleContinueWithSelection}
          disabled={checking || !selectedCity || !selectedDistrict}
          className="mt-4 w-full rounded-[1.6rem] bg-white px-6 py-4 text-sm font-black uppercase tracking-wide text-red-700 shadow-lg ring-1 ring-red-200 disabled:opacity-70"
        >
          {checking ? 'Hazırlanıyor...' : 'Seçilen İl/İlçe Merkeziyle Devam Et'}
        </button>
      </div>
    </main>
  );
}
