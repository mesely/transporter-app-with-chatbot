/**
 * @file page.tsx
 * FIX: Sidebar kaldırıldı, yerine Settings butonu eklendi.
 * Settings butonu → /settings sayfasına yönlendiriyor.
 * FIX: Eski gömülü ScanningLoader kaldırıldı, yeni nesil loader import edildi.
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import TopBar from '../components/home/TopBar';
import ActionPanel from '../components/home/ActionPanel';
import ProfileModal from '../components/ProfileModal';

const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-50" />,
});
const SplashScreen = dynamic(() => import('../components/SplashScreen'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';
const DEFAULT_LAT = 41.0082;
const DEFAULT_LNG = 28.9784;
const LAST_RESULTS_KEY = 'Transport_last_results_v1';
const RATE_REMINDERS_KEY = 'Transport_rate_reminders_v1';

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

function normalizeText(v: string) {
  return (v || '')
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function Home() {
  const router = useRouter();
  const SPLASH_DURATION_MS = 6800;
  const DRIVERS_CACHE_TTL_MS = 120000;
  const DRIVERS_CACHE_REVALIDATE_MS = 15000;
  const DRIVERS_CACHE_MAX_ENTRIES = 80;
  const MAP_MOVE_FETCH_DEBOUNCE_MS = 350;
  const MIN_MOVE_DISTANCE_DEG = 0.015;
  const MIN_ZOOM_DELTA = 0.6;

  const [showSplash, setShowSplash] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [mapFocusToken, setMapFocusToken] = useState(0);
  const [mapFocusZoom, setMapFocusZoom] = useState<number | undefined>(undefined);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);
  const [actionType, setActionType] = useState('kurtarici');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const actionTypeRef = useRef(actionType);
  const activeTagsRef = useRef(activeTags);
  const searchCoordsRef = useRef(searchCoords);
  const driversCacheRef = useRef<Record<string, { data: any[]; ts: number }>>({});
  const mapMoveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMapFetchRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);

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

  const fetchDrivers = useCallback(async (
    lat: number,
    lng: number,
    type: string,
    opts?: { zoom?: number; bbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number } }
  ) => {
    const key = [
      type,
      lat.toFixed(4),
      lng.toFixed(4),
      String(opts?.zoom ? Math.round(opts.zoom * 10) / 10 : ''),
      String(opts?.bbox ? `${opts.bbox.minLat.toFixed(3)}:${opts.bbox.minLng.toFixed(3)}:${opts.bbox.maxLat.toFixed(3)}:${opts.bbox.maxLng.toFixed(3)}` : ''),
    ].join(':');
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
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        type,
        zoom: String(Math.round((opts?.zoom ?? 9) * 10) / 10),
      });
      if (opts?.bbox) {
        params.set('minLat', String(opts.bbox.minLat));
        params.set('minLng', String(opts.bbox.minLng));
        params.set('maxLat', String(opts.bbox.maxLat));
        params.set('maxLng', String(opts.bbox.maxLng));
      }
      const url =
        type === 'seyyar_sarj'
          ? `${API_URL}/users/all?type=seyyar_sarj`
          : `${API_URL}/users/nearby?${params.toString()}`;
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      const normalizedData = Array.isArray(data) ? data : [];
      driversCacheRef.current[key] = { data: normalizedData, ts: Date.now() };
      try {
        localStorage.setItem(LAST_RESULTS_KEY, JSON.stringify({ ts: Date.now(), data: normalizedData }));
      } catch {}
      const keys = Object.keys(driversCacheRef.current);
      if (keys.length > DRIVERS_CACHE_MAX_ENTRIES) {
        const sorted = keys
          .map((k) => ({ k, ts: driversCacheRef.current[k].ts }))
          .sort((a, b) => a.ts - b.ts);
        const purge = sorted.slice(0, keys.length - DRIVERS_CACHE_MAX_ENTRIES);
        for (const item of purge) delete driversCacheRef.current[item.k];
      }
      setDrivers(normalizedData);
    } catch (err) {
      if ((err as any)?.name !== 'AbortError') {
        console.error('Fetch Error:', err);
        try {
          const raw = localStorage.getItem(LAST_RESULTS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { data?: any[] };
            if (Array.isArray(parsed?.data) && parsed.data.length > 0) {
              setDrivers(parsed.data);
              setOfflineNotice('Internet yok. Son sonuclar yukleniyor.');
            }
          }
        } catch {}
      }
    } finally {
      if (inflightFetchKeyRef.current === key) {
        inflightFetchKeyRef.current = null;
      }
      setLoading(false);
    }
  }, [DRIVERS_CACHE_MAX_ENTRIES]);

  useEffect(() => {
    return () => {
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
      if (mapMoveDebounceRef.current) clearTimeout(mapMoveDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    const onOnline = () => setOfflineNotice(null);
    const onOffline = () => setOfflineNotice('Internet yok. Son sonuclar yukleniyor.');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    if (typeof navigator !== 'undefined' && !navigator.onLine) onOffline();
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const goRequired = () => {
      if (!cancelled) router.replace('/location-required');
    };

    const checkPermission = async () => {
      if (typeof window === 'undefined') return;
      if (!navigator?.geolocation) {
        goRequired();
        return;
      }
      try {
        const permissions = (navigator as any).permissions;
        if (permissions?.query) {
          const status = await permissions.query({ name: 'geolocation' as PermissionName });
          if (status?.state === 'denied') {
            goRequired();
            return;
          }
        }
      } catch {}
    };

    checkPermission();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!searchCoords) fetchDrivers(DEFAULT_LAT, DEFAULT_LNG, 'kurtarici');
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
      try {
        const remindersRaw = localStorage.getItem(RATE_REMINDERS_KEY);
        const reminders = remindersRaw ? JSON.parse(remindersRaw) : [];
        reminders.push({
          id: `${driver?._id || 'x'}-${Date.now()}`,
          driverId: driver?._id,
          driverName: driver?.businessName || 'Hizmet Saglayici',
          dueAt: Date.now() + 24 * 60 * 60 * 1000,
          notified: false,
        });
        localStorage.setItem(RATE_REMINDERS_KEY, JSON.stringify(reminders));
      } catch {}
    } catch (_) {}
  }, [searchCoords]);

  const handleSearchLocation = useCallback((
    lat: number,
    lng: number,
    opts?: { forceFocus?: boolean; targetZoom?: number; clearActiveDriver?: boolean }
  ) => {
    const prev = searchCoordsRef.current;
    const sameCoords =
      !!prev &&
      Math.abs(prev[0] - lat) < 0.00001 &&
      Math.abs(prev[1] - lng) < 0.00001;

    if (sameCoords) {
      if (opts?.clearActiveDriver) setActiveDriverId(null);
      if (opts?.forceFocus) {
        setMapFocusZoom(opts?.targetZoom);
        setMapFocusToken((v) => v + 1);
      }
      return;
    }

    if (opts?.clearActiveDriver) setActiveDriverId(null);
    setSearchCoords([lat, lng]);
    if (opts?.forceFocus) {
      setMapFocusZoom(opts?.targetZoom);
      setMapFocusToken((v) => v + 1);
    }
    fetchDrivers(lat, lng, actionTypeRef.current);
  }, [fetchDrivers]);

  useEffect(() => {
    if (searchCoords) return;
    if (typeof window === 'undefined' || !navigator?.geolocation) return;

    const timer = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleSearchLocation(pos.coords.latitude, pos.coords.longitude, {
            forceFocus: true,
            targetZoom: 15,
            clearActiveDriver: true,
          });
        },
        (err) => {
          if ((err as GeolocationPositionError)?.code === 1) {
            router.replace('/location-required');
          }
        },
        { enableHighAccuracy: true, timeout: 22000, maximumAge: 120000 }
      );
    }, 1200);

    return () => clearTimeout(timer);
  }, [handleSearchLocation, router, searchCoords]);

  const handleFilterApply = useCallback((type: string) => {
    if (type === actionTypeRef.current && activeTagsRef.current.length === 0) return;
    setActionType(type);
    setActiveTags([]);
    fetchDrivers(searchCoords?.[0] ?? DEFAULT_LAT, searchCoords?.[1] ?? DEFAULT_LNG, type, {
      zoom: lastMapFetchRef.current?.zoom ?? 9,
    });
  }, [fetchDrivers, searchCoords]);

  const handleSelectDriver = useCallback((id: string | null) => {
    setActiveDriverId(id);
    if (id) {
      setMapFocusZoom(12.8);
      setMapFocusToken((v) => v + 1);
    }
  }, []);

  const suggestions = useMemo(() => {
    const q = normalizeText(mapSearchQuery);
    if (!q) return [];
    const tokens = q.split(' ').filter(Boolean);
    const serviceLabel = (subType: string) => {
      const s = (subType || '').toLocaleLowerCase('tr');
      if (s.includes('kurtar')) return 'oto cekici kurtarici';
      if (s.includes('vinc')) return 'vinc';
      if (s.includes('sarj') || s.includes('istasyon')) return 'sarj istasyon';
      if (s.includes('nakliye') || s.includes('kamyon') || s.includes('tir')) return 'nakliye tasima';
      return s;
    };
    return filteredDrivers
      .filter((d) => {
        const hay = normalizeText([
          d.businessName,
          d.address?.city,
          d.address?.district,
          d.address?.fullText,
          serviceLabel(d.service?.subType || ''),
        ].filter(Boolean).join(' '));
        return tokens.every((t) => hay.includes(t));
      })
      .slice(0, 6);
  }, [filteredDrivers, mapSearchQuery]);

  const handleSearchPick = useCallback((driver: any) => {
    setMapSearchQuery(driver?.businessName || '');
    handleSelectDriver(driver?._id || null);
  }, [handleSelectDriver]);

  useEffect(() => {
    const tick = () => {
      try {
        const raw = localStorage.getItem(RATE_REMINDERS_KEY);
        if (!raw) return;
        const list = JSON.parse(raw) as Array<any>;
        let changed = false;
        const now = Date.now();
        const next = list.map((item) => {
          if (!item.notified && Number(item.dueAt) <= now) {
            changed = true;
            const title = 'Hizmeti degerlendir';
            const body = `${item.driverName} icin puanlama yapabilirsiniz.`;
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification(title, { body });
            } else {
              setReminderNotice(body);
            }
            return { ...item, notified: true };
          }
          return item;
        });
        if (changed) localStorage.setItem(RATE_REMINDERS_KEY, JSON.stringify(next));
      } catch {}
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const handleMapMove = useCallback((
    lat: number,
    lng: number,
    zoom: number,
    bbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number }
  ) => {
    const prev = lastMapFetchRef.current;
    if (prev) {
      const movedLat = Math.abs(prev.lat - lat);
      const movedLng = Math.abs(prev.lng - lng);
      const zoomDelta = Math.abs(prev.zoom - zoom);
      if (movedLat < MIN_MOVE_DISTANCE_DEG && movedLng < MIN_MOVE_DISTANCE_DEG && zoomDelta < MIN_ZOOM_DELTA) {
        return;
      }
    }

    if (mapMoveDebounceRef.current) clearTimeout(mapMoveDebounceRef.current);
    mapMoveDebounceRef.current = setTimeout(() => {
      lastMapFetchRef.current = { lat, lng, zoom };
      const anchor = searchCoordsRef.current;
      const baseLat = anchor?.[0] ?? lat;
      const baseLng = anchor?.[1] ?? lng;
      fetchDrivers(baseLat, baseLng, actionTypeRef.current, { zoom, bbox });
    }, MAP_MOVE_FETCH_DEBOUNCE_MS);
  }, [fetchDrivers, MAP_MOVE_FETCH_DEBOUNCE_MS, MIN_MOVE_DISTANCE_DEG, MIN_ZOOM_DELTA]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white">
      <SplashScreen visible={showSplash} />

      {/* TopBar artık Settings butonu gösteriyor (Sidebar yerine) */}
      <TopBar
        onProfileClick={() => setShowProfile(true)}
      />

      <div
        className="absolute left-1/2 z-[450] -translate-x-1/2 pointer-events-auto scale-[0.94] sm:scale-100 origin-top"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 30px)',
          width: 'min(540px, calc(100vw - 140px))'
        }}
      >
        <div className="relative rounded-2xl border border-white/70 bg-white/95 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 px-3 py-2">
            <Search size={16} className="text-slate-500" />
            <input
              value={mapSearchQuery}
              onChange={(e) => setMapSearchQuery(e.target.value)}
              placeholder="Firma veya hizmet ara"
              className="flex-1 bg-transparent text-[13px] font-semibold text-slate-800 outline-none"
            />
            {mapSearchQuery && (
              <button onClick={() => setMapSearchQuery('')} className="p-1 text-slate-500">
                <X size={16} />
              </button>
            )}
          </div>
          {suggestions.length > 0 && (
            <div className="max-h-56 overflow-y-auto border-t border-slate-100">
              {suggestions.map((d) => (
                <button
                  key={d._id}
                  onClick={() => handleSearchPick(d)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50"
                >
                  <div className="text-[12px] font-black uppercase text-slate-800">{d.businessName}</div>
                  <div className="text-[10px] font-semibold text-slate-500">
                    {(d.address?.city || '')} {(d.address?.district || '')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-0 z-0">
        <Map
          searchCoords={searchCoords}
          focusRequestToken={mapFocusToken}
          focusRequestZoom={mapFocusZoom}
          drivers={filteredDrivers}
          activeDriverId={activeDriverId}
          onSelectDriver={handleSelectDriver}
          onMapMove={handleMapMove}
          onMapClick={() => setActiveDriverId(null)}
          onStartOrder={handleCreateOrder}
        />
      </div>

      <ActionPanel
        onSearchLocation={handleSearchLocation}
        currentCoords={searchCoords}
        onFilterApply={handleFilterApply}
        actionType={actionType}
        onActionChange={setActionType}
        activeTags={activeTags}
        onTagsChange={setActiveTags}
        drivers={filteredDrivers}
        loading={loading}
        activeDriverId={activeDriverId}
        onSelectDriver={handleSelectDriver}
        onStartOrder={handleCreateOrder}
        isSidebarOpen={false}
      />

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />

      {(offlineNotice || reminderNotice) && (
        <div className="fixed inset-x-0 bottom-3 z-[2600] flex justify-center pointer-events-none">
          <div className="max-w-[92vw] rounded-2xl bg-black/80 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white shadow-xl">
            {offlineNotice || reminderNotice}
          </div>
        </div>
      )}
    </main>
  );
}
