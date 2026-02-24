/**
 * @file page.tsx
 * FIX: Sidebar kaldırıldı, yerine Settings butonu eklendi.
 * Settings butonu → /settings sayfasına yönlendiriyor.
 * FIX: Eski gömülü ScanningLoader kaldırıldı, yeni nesil loader import edildi.
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import TopBar from '../components/home/TopBar';
import ActionPanel from '../components/home/ActionPanel';
import ProfileModal from '../components/ProfileModal';

// 🔥 YENİ LOADER'I BURAYA IMPORT EDİYORUZ
// Not: Dosya yolunu (path) kendi proje yapına göre düzenlemeyi unutma!
import ScanningLoader from '../components/ScanningLoader'; 

const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-50" />,
});

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';

const CATEGORY_MAP: Record<string, string[]> = {
  tir: ['tenteli', 'frigorifik', 'lowbed', 'konteyner', 'acik_kasa'],
  kamyon: ['6_teker', '8_teker', '10_teker', '12_teker', 'kirkayak'],
  kamyonet: ['panelvan', 'acik_kasa', 'kapali_kasa'],
  yolcu: ['minibus', 'otobus', 'midibus', 'vip_tasima'],
};

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('Transport_device_id');
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('Transport_device_id', id);
  }
  return id;
}

export default function Home() {
  const SPLASH_DURATION_MS = 3750;
  const LOADER_DURATION_MS = 7500;
  const DRIVERS_CACHE_TTL_MS = 120000;
  const DRIVERS_CACHE_REVALIDATE_MS = 15000;

  const [showSplash, setShowSplash] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [actionType, setActionType] = useState('kurtarici');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const actionTypeRef = useRef(actionType);
  const activeTagsRef = useRef(activeTags);
  const searchCoordsRef = useRef(searchCoords);
  const driversCacheRef = useRef<Record<string, { data: any[]; ts: number }>>({});

  const inflightFetchKeyRef = useRef<string | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // 🔥 YENİ LOADER İÇİN ZAMANLAYICI
  useEffect(() => {
    actionTypeRef.current = actionType;
  }, [actionType]);

  useEffect(() => {
    activeTagsRef.current = activeTags;
  }, [activeTags]);

  useEffect(() => {
    searchCoordsRef.current = searchCoords;
  }, [searchCoords]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [SPLASH_DURATION_MS]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, LOADER_DURATION_MS);
    return () => clearTimeout(timer);
  }, [LOADER_DURATION_MS]);

  const fetchDrivers = useCallback(async (lat: number, lng: number, type: string) => {
    const key = `${type}:${lat.toFixed(5)}:${lng.toFixed(5)}`;
    if (inflightFetchKeyRef.current === key) return;

    const now = Date.now();
    const cached = driversCacheRef.current[key];
    if (cached) {
      setDrivers(cached.data);
      setLoading(false);
      if (now - cached.ts < DRIVERS_CACHE_REVALIDATE_MS) return;
      if (now - cached.ts > DRIVERS_CACHE_TTL_MS) {
        delete driversCacheRef.current[key];
      }
    }

    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    inflightFetchKeyRef.current = key;

    if (!cached) setLoading(true);
    try {
      const url =
        type === 'seyyar_sarj'
          ? `${API_URL}/users/all?type=seyyar_sarj`
          : `${API_URL}/users/nearby?lat=${lat}&lng=${lng}&type=${type}&zoom=9`;
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      const normalizedData = Array.isArray(data) ? data : [];
      driversCacheRef.current[key] = { data: normalizedData, ts: Date.now() };
      setDrivers(normalizedData);
    } catch (err) {
      if ((err as any)?.name !== 'AbortError') {
        console.error('Fetch Error:', err);
      }
    } finally {
      if (inflightFetchKeyRef.current === key) {
        inflightFetchKeyRef.current = null;
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!searchCoords) fetchDrivers(39.9334, 32.8597, 'kurtarici');
  }, [fetchDrivers, searchCoords]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const s = d.service;
      if (!s) return false;
      let match = false;
      if (actionType === 'seyyar_sarj')    match = s.subType === 'seyyar_sarj';
      else if (actionType === 'kurtarici') match = s.mainType === 'KURTARICI';
      else if (actionType === 'nakliye')   match = s.mainType === 'NAKLIYE';
      else if (actionType === 'yolcu')     match = s.mainType === 'YOLCU';
      else if (CATEGORY_MAP[actionType])
        match = s.subType === actionType || CATEGORY_MAP[actionType].includes(s.subType);
      else match = s.subType === actionType;
      if (!match) return false;
      if (activeTags.length > 0) return activeTags.some((t) => (s.tags || []).includes(t));
      return true;
    });
  }, [drivers, actionType, activeTags]);

  const handleCreateOrder = useCallback(async (driver: any, method: 'call' | 'message') => {
    try {
      const deviceId = getOrCreateDeviceId();
      const coords = searchCoords;
      await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: deviceId,
          driverId: driver?._id,
          serviceType: driver?.service?.subType || driver?.serviceType || 'genel',
          pickupLocation: { lat: coords?.[0] ?? 0, lng: coords?.[1] ?? 0 },
          contactMethod: method,
          customerOutcome: 'PENDING',
        })
      });
    } catch (_) {}
  }, [searchCoords]);

  const handleSearchLocation = useCallback((lat: number, lng: number) => {
    const prev = searchCoordsRef.current;
    if (prev && Math.abs(prev[0] - lat) < 0.00001 && Math.abs(prev[1] - lng) < 0.00001) return;
    setSearchCoords([lat, lng]);
    fetchDrivers(lat, lng, actionTypeRef.current);
  }, [fetchDrivers]);

  const handleFilterApply = useCallback((type: string) => {
    if (type === actionTypeRef.current && activeTagsRef.current.length === 0) return;
    setActionType(type);
    setActiveTags([]);
    fetchDrivers(searchCoords?.[0] ?? 39.9, searchCoords?.[1] ?? 32.8, type);
  }, [fetchDrivers, searchCoords]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white">
      {showSplash && (
        <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(59,130,246,0.14),transparent_55%)]" />
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-indigo-100/60 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="rounded-[2.5rem] border border-gray-200/70 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
              <img
                src="/favicon.ico"
                alt="Transport 245 logo"
                className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl object-contain"
              />
            </div>

            <p className="mt-6 text-center text-[11px] sm:text-xs font-black uppercase tracking-[0.18em] text-gray-900">
              Gelecegin lojistik agi
            </p>
          </div>
        </div>
      )}

      {/* YENİ LOADER ÇAĞRILIYOR */}
      {showLoader && <ScanningLoader />}

      {/* TopBar artık Settings butonu gösteriyor (Sidebar yerine) */}
      <TopBar
        onProfileClick={() => setShowProfile(true)}
      />

      <div className="absolute inset-0 z-0">
        <Map
          searchCoords={searchCoords}
          drivers={filteredDrivers}
          activeDriverId={activeDriverId}
          onSelectDriver={setActiveDriverId}
          onMapClick={() => setActiveDriverId(null)}
          onStartOrder={handleCreateOrder}
        />
      </div>

      <ActionPanel
        onSearchLocation={handleSearchLocation}
        onFilterApply={handleFilterApply}
        actionType={actionType}
        onActionChange={setActionType}
        activeTags={activeTags}
        onTagsChange={setActiveTags}
        drivers={filteredDrivers}
        loading={loading}
        activeDriverId={activeDriverId}
        onSelectDriver={setActiveDriverId}
        onStartOrder={handleCreateOrder}
        isSidebarOpen={false}
      />

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </main>
  );
}
