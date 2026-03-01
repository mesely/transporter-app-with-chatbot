/**
 * @file page.tsx
 * FIX: Sidebar kaldırıldı, yerine Settings butonu eklendi.
 * Settings butonu → /settings sayfasına yönlendiriyor.
 * FIX: Eski gömülü ScanningLoader kaldırıldı, yeni nesil loader import edildi.
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

import TopControls from '../components/home/TopControls';
import ActionPanel from '../components/home/ActionPanel';
import ViewRatingsModal from '../components/ViewRatingsModal';
import ViewReportsModal from '../components/ViewReportsModal';
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
const LAST_RESULTS_BY_TYPE_KEY = 'Transport_last_results_by_type_v1';
const RATE_REMINDERS_KEY = 'Transport_rate_reminders_v1';
const FAVORITES_KEY = 'Transport_favorites_v1';
const MANUAL_LOCATION_KEY = 'Transport_manual_location_v1';
const SKIP_SPLASH_ONCE_KEY = 'Transport_skip_splash_once';
const HOME_VIEW_STATE_KEY = 'Transport_home_view_state_v1';
const TURKEY_BBOX = {
  minLat: 35.45,
  minLng: 25.4,
  maxLat: 42.65,
  maxLng: 45.2,
};

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

function readManualLocation(): { lat: number; lng: number; city?: string; district?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MANUAL_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const lat = Number(parsed?.lat);
    const lng = Number(parsed?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, city: parsed?.city, district: parsed?.district };
  } catch {
    return null;
  }
}

function isInsideBBox(
  lat: number,
  lng: number,
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number }
) {
  return lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng;
}

export default function Home() {
  const router = useRouter();
  const SPLASH_DURATION_MS = 6800;
  const DRIVERS_CACHE_TTL_MS = 120000;
  const DRIVERS_CACHE_REVALIDATE_MS = 15000;
  const DRIVERS_CACHE_MAX_ENTRIES = 80;
  const MAP_MOVE_FETCH_DEBOUNCE_MS = 700;
  const MIN_MOVE_DISTANCE_DEG = 0.03;
  const MIN_ZOOM_DELTA = 0.9;
  const VIEWPORT_REFETCH_EDGE_RATIO = 0.22;
  const BBOX_OVERSCAN_FACTOR = 0.45;
  const COUNTRY_MODE_ZOOM_THRESHOLD = 6.35;
  const COUNTRY_MODE_FETCH_LIMIT = 3200;
  const ACTION_PANEL_QUERY_ZOOM = 6.2;
  const ACTION_PANEL_QUERY_LIMIT = 3200;
  const TOP_UI_OFFSET = 'max(calc(env(safe-area-inset-top, 0px) + 22px), 34px)';

  const [showSplash, setShowSplash] = useState(true);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [mapDrivers, setMapDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [isApproximateLocation, setIsApproximateLocation] = useState(false);
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);
  const [mapFocusToken, setMapFocusToken] = useState(0);
  const [mapFocusZoom, setMapFocusZoom] = useState<number | undefined>(undefined);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [popupDriverId, setPopupDriverId] = useState<string | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);
  const [actionType, setActionType] = useState('kurtarici');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [panelCollapseToken, setPanelCollapseToken] = useState(0);
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalDriverId, setModalDriverId] = useState<string | null>(null);
  const [modalDriverName, setModalDriverName] = useState<string>('');
  const [selectedDriverGhost, setSelectedDriverGhost] = useState<any | null>(null);
  const [homeStateReady, setHomeStateReady] = useState(false);
  const actionTypeRef = useRef(actionType);
  const activeTagsRef = useRef(activeTags);
  const searchCoordsRef = useRef(searchCoords);
  const driversCacheRef = useRef<Record<string, { data: any[]; ts: number }>>({});
  const mapMoveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextMapMoveFetchRef = useRef(false);
  const listEndFetchLimitRef = useRef(0);
  const lastMapFetchRef = useRef<{
    lat: number;
    lng: number;
    zoom: number;
    bbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number };
  } | null>(null);

  const inflightFetchKeyRef = useRef<string | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const fetchSeqRef = useRef(0);
  const inflightMapFetchKeyRef = useRef<string | null>(null);
  const mapFetchAbortRef = useRef<AbortController | null>(null);
  const mapFetchSeqRef = useRef(0);
  const blockMapMoveFetchUntilRef = useRef(0);
  const driversRef = useRef<any[]>([]);
  const mapDriversRef = useRef<any[]>([]);
  const filterRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFilterTypeRef = useRef('kurtarici');

  useEffect(() => {
    driversRef.current = drivers;
  }, [drivers]);

  useEffect(() => {
    mapDriversRef.current = mapDrivers;
  }, [mapDrivers]);

  const readTypeCache = useCallback((type: string): any[] | null => {
    try {
      const raw = localStorage.getItem(LAST_RESULTS_BY_TYPE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, { ts: number; data: any[] }>;
      const row = parsed?.[type];
      if (!row || !Array.isArray(row.data)) return null;
      return row.data;
    } catch {
      return null;
    }
  }, []);

  const writeTypeCache = useCallback((type: string, data: any[]) => {
    try {
      const raw = localStorage.getItem(LAST_RESULTS_BY_TYPE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, { ts: number; data: any[] }>) : {};
      parsed[type] = { ts: Date.now(), data };
      localStorage.setItem(LAST_RESULTS_BY_TYPE_KEY, JSON.stringify(parsed));
    } catch {}
  }, []);

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
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(HOME_VIEW_STATE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const lat = Number(parsed?.searchCoords?.[0]);
      const lng = Number(parsed?.searchCoords?.[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setSearchCoords([lat, lng]);
      }
      if (typeof parsed?.actionType === 'string' && parsed.actionType) {
        setActionType(parsed.actionType);
      }
      if (Array.isArray(parsed?.activeTags)) {
        setActiveTags(parsed.activeTags.filter((t: any) => typeof t === 'string'));
      }
      if (typeof parsed?.mapSearchQuery === 'string') {
        setMapSearchQuery(parsed.mapSearchQuery);
      }
    } catch {}
    finally {
      setHomeStateReady(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(
        HOME_VIEW_STATE_KEY,
        JSON.stringify({
          searchCoords,
          actionType,
          activeTags,
          mapSearchQuery,
        }),
      );
    } catch {}
  }, [searchCoords, actionType, activeTags, mapSearchQuery]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      setFavorites(raw ? JSON.parse(raw) : []);
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const skipOnce = sessionStorage.getItem(SKIP_SPLASH_ONCE_KEY) === '1';
    if (skipOnce) {
      sessionStorage.removeItem(SKIP_SPLASH_ONCE_KEY);
      setShowSplash(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [SPLASH_DURATION_MS]);

  const fetchDrivers = useCallback(async (
    lat: number,
    lng: number,
    type: string,
    opts?: {
      zoom?: number;
      limit?: number;
      bbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number };
      append?: boolean;
      force?: boolean;
      countryFallback?: boolean;
      silent?: boolean;
      target?: 'panel' | 'map' | 'both';
    }
  ) => {
    const target = opts?.target || 'both';
    const includePanel = target === 'panel' || target === 'both';
    const includeMap = target === 'map' || target === 'both';
    const isMapOnlyRequest = target === 'map';
    const keyRef = isMapOnlyRequest ? inflightMapFetchKeyRef : inflightFetchKeyRef;
    const abortRef = isMapOnlyRequest ? mapFetchAbortRef : fetchAbortRef;
    const seqRef = isMapOnlyRequest ? mapFetchSeqRef : fetchSeqRef;

    const requestSeq = ++seqRef.current;
    const key = [
      type,
      lat.toFixed(4),
      lng.toFixed(4),
      String(opts?.zoom ? Math.round(opts.zoom * 10) / 10 : ''),
      String(opts?.limit ? Math.round(opts.limit) : ''),
      String(opts?.bbox ? `${opts.bbox.minLat.toFixed(3)}:${opts.bbox.minLng.toFixed(3)}:${opts.bbox.maxLat.toFixed(3)}:${opts.bbox.maxLng.toFixed(3)}` : ''),
    ].join(':');
    if (!opts?.force && keyRef.current === key) return;

    const now = Date.now();
    const cached = driversCacheRef.current[key];
    if (!opts?.force && cached) {
      if (includePanel) setDrivers(cached.data);
      if (includeMap) setMapDrivers(cached.data);
      setLoading(false);
      if (now - cached.ts < DRIVERS_CACHE_REVALIDATE_MS) return;
      if (now - cached.ts > DRIVERS_CACHE_TTL_MS) {
        delete driversCacheRef.current[key];
      }
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    keyRef.current = key;

    if (!opts?.silent && (!cached || opts?.force)) {
      const typeCached = readTypeCache(type);
      if (typeCached && typeCached.length > 0) {
        if (includePanel) setDrivers(typeCached);
        if (includeMap) setMapDrivers(typeCached);
      }
      if (includePanel) setLoading(true);
    }
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        type,
        zoom: String(Math.round((opts?.zoom ?? 9) * 10) / 10),
      });
      if (opts?.limit && Number.isFinite(opts.limit)) {
        params.set('limit', String(Math.max(50, Math.floor(opts.limit))));
      }
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
      if (requestSeq !== seqRef.current) return;
      const normalizedData = Array.isArray(data) ? data : [];

      if (
        normalizedData.length === 0 &&
        opts?.force &&
        opts?.countryFallback !== false &&
        type !== 'seyyar_sarj'
      ) {
        const fallbackBbox = isInsideBBox(lat, lng, TURKEY_BBOX) ? TURKEY_BBOX : undefined;
        await fetchDrivers(lat, lng, type, {
          zoom: 6.2,
          limit: 3200,
          bbox: fallbackBbox,
          force: true,
          append: false,
          countryFallback: false,
          silent: opts?.silent,
          target,
        });
        return;
      }

      driversCacheRef.current[key] = { data: normalizedData, ts: Date.now() };
      writeTypeCache(type, normalizedData);
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
      if (includePanel) {
        if (normalizedData.length === 0 && Array.isArray(driversRef.current) && driversRef.current.length > 0 && !!opts?.bbox) {
          // Keep current visible list if a move query returns empty to avoid sudden blank panel.
        } else if (opts?.append) {
          setDrivers((prev) => {
            const map = new globalThis.Map<string, any>();
            for (const item of prev || []) map.set(String(item?._id || `${item?.businessName}-${item?.phoneNumber}`), item);
            for (const item of normalizedData) map.set(String(item?._id || `${item?.businessName}-${item?.phoneNumber}`), item);
            return Array.from(map.values());
          });
        } else {
          setDrivers(normalizedData);
        }
      }

      if (includeMap) {
        if (opts?.append) {
          setMapDrivers((prev) => {
            const map = new globalThis.Map<string, any>();
            for (const item of prev || []) map.set(String(item?._id || `${item?.businessName}-${item?.phoneNumber}`), item);
            for (const item of normalizedData) map.set(String(item?._id || `${item?.businessName}-${item?.phoneNumber}`), item);
            return Array.from(map.values());
          });
        } else if (normalizedData.length > 0 || !opts?.bbox) {
          setMapDrivers(normalizedData);
        }
      }
    } catch (err) {
      if (requestSeq !== seqRef.current) return;
      if ((err as any)?.name !== 'AbortError') {
        console.error('Fetch Error:', err);
        const typed = readTypeCache(type);
        if (typed && typed.length > 0) {
          if (includePanel) setDrivers(typed);
          if (includeMap) setMapDrivers(typed);
          setOfflineNotice('Internet yok. Son sonuclar yukleniyor.');
          return;
        }
        try {
          const raw = localStorage.getItem(LAST_RESULTS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { data?: any[] };
            if (Array.isArray(parsed?.data) && parsed.data.length > 0) {
              if (includePanel) setDrivers(parsed.data);
              if (includeMap) setMapDrivers(parsed.data);
              setOfflineNotice('Internet yok. Son sonuclar yukleniyor.');
            }
          }
        } catch {}
      }
    } finally {
      if (keyRef.current === key) {
        keyRef.current = null;
      }
      if (!opts?.silent && includePanel) setLoading(false);
    }
  }, [DRIVERS_CACHE_MAX_ENTRIES, readTypeCache, writeTypeCache]);

  useEffect(() => {
    return () => {
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
      if (mapFetchAbortRef.current) mapFetchAbortRef.current.abort();
      if (mapMoveDebounceRef.current) clearTimeout(mapMoveDebounceRef.current);
      if (filterRetryRef.current) clearTimeout(filterRetryRef.current);
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
    const emitClientError = (kind: string, message: string) => {
      try {
        const payload = JSON.stringify({
          kind,
          message: String(message || '').slice(0, 800),
          href: typeof location !== 'undefined' ? location.href : '',
          ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          ts: Date.now(),
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(`${API_URL}/client-events`, payload);
        } else {
          fetch(`${API_URL}/client-events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {}
    };

    const onError = (e: ErrorEvent) => emitClientError('error', e.message || 'window_error');
    const onReject = (e: PromiseRejectionEvent) =>
      emitClientError('unhandled_rejection', typeof e.reason === 'string' ? e.reason : JSON.stringify(e.reason || 'unknown'));
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onReject);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onReject);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const goRequired = () => {
      if (readManualLocation()) return;
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
    if (!homeStateReady) return;
    if (!searchCoords) {
      fetchDrivers(DEFAULT_LAT, DEFAULT_LNG, 'kurtarici', {
        zoom: ACTION_PANEL_QUERY_ZOOM,
        limit: ACTION_PANEL_QUERY_LIMIT,
        bbox: TURKEY_BBOX,
      });
    }
  }, [ACTION_PANEL_QUERY_LIMIT, ACTION_PANEL_QUERY_ZOOM, fetchDrivers, homeStateReady, searchCoords]);

  useEffect(() => {
    if (!homeStateReady) return;
    if (searchCoords) return;
    if (typeof window === 'undefined') return;
    const manual = readManualLocation();
    if (!manual) return;

    const useManualIfNeeded = async () => {
      if (!navigator?.geolocation) {
        setSearchCoords([manual.lat, manual.lng]);
        setIsApproximateLocation(true);
        setMapFocusZoom(12.5);
        setMapFocusToken((v) => v + 1);
        return;
      }
      try {
        const permissions = (navigator as any).permissions;
        if (!permissions?.query) {
          setSearchCoords([manual.lat, manual.lng]);
          setIsApproximateLocation(true);
          setMapFocusZoom(12.5);
          setMapFocusToken((v) => v + 1);
          return;
        }
        const status = await permissions.query({ name: 'geolocation' as PermissionName });
        if (status?.state !== 'granted') {
          setSearchCoords([manual.lat, manual.lng]);
          setIsApproximateLocation(true);
          setMapFocusZoom(12.5);
          setMapFocusToken((v) => v + 1);
        }
      } catch {}
    };

    useManualIfNeeded();
  }, [homeStateReady, searchCoords]);

  const matchesActiveFilters = useCallback((d: any) => {
      const s = d.service;
      if (!s) return false;
      let match = false;
      if (actionType === 'seyyar_sarj')    match = s.subType === 'seyyar_sarj';
      else if (actionType === 'sarj')      match = s.mainType === 'SARJ';
      else if (actionType === 'kurtarici') match = s.mainType === 'KURTARICI';
      else if (actionType === 'nakliye')   match = s.mainType === 'NAKLIYE';
      else if (actionType === 'yolcu')     match = s.mainType === 'YOLCU';
      else if (CATEGORY_MAP[actionType])
        match = s.subType === actionType || CATEGORY_MAP[actionType].includes(s.subType);
      else match = s.subType === actionType;
      if (!match) return false;
      if (activeTags.length > 0) return activeTags.some((t) => (s.tags || []).includes(t));
      return true;
  }, [actionType, activeTags]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter(matchesActiveFilters);
  }, [drivers, matchesActiveFilters]);

  const filteredMapDrivers = useMemo(() => {
    return mapDrivers.filter(matchesActiveFilters);
  }, [mapDrivers, matchesActiveFilters]);

  const selectedDriverForFocus = useMemo(() => {
    if (selectedDriverGhost?._id && activeDriverId === selectedDriverGhost._id) {
      return selectedDriverGhost;
    }
    if (!activeDriverId) return null;
    const merged = [...filteredDrivers, ...filteredMapDrivers, ...drivers, ...mapDrivers];
    return merged.find((d: any) => d?._id === activeDriverId) || null;
  }, [activeDriverId, drivers, filteredDrivers, filteredMapDrivers, mapDrivers, selectedDriverGhost]);

  const mapRenderDrivers = useMemo(() => {
    if (!selectedDriverForFocus) return filteredMapDrivers;
    const exists = filteredMapDrivers.some((d: any) => d?._id === selectedDriverForFocus._id);
    if (exists) return filteredMapDrivers;
    return [...filteredMapDrivers, selectedDriverForFocus];
  }, [filteredMapDrivers, selectedDriverForFocus]);

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
    opts?: { forceFocus?: boolean; targetZoom?: number; clearActiveDriver?: boolean; preserveCurrentCoords?: boolean }
  ) => {
    const preserveCurrentCoords = !!opts?.preserveCurrentCoords;
    const prev = searchCoordsRef.current;
    const sameCoords =
      !!prev &&
      Math.abs(prev[0] - lat) < 0.00001 &&
      Math.abs(prev[1] - lng) < 0.00001;

    if (sameCoords && !preserveCurrentCoords) {
      if (opts?.clearActiveDriver) setActiveDriverId(null);
      if (opts?.forceFocus) {
        setFocusCoords([lat, lng]);
        setMapFocusZoom(opts?.targetZoom);
        setMapFocusToken((v) => v + 1);
      }
      return;
    }

    if (opts?.clearActiveDriver) setActiveDriverId(null);

    if (preserveCurrentCoords) {
      setFocusCoords([lat, lng]);
    } else {
      setFocusCoords(null);
      setSearchCoords([lat, lng]);
      setIsApproximateLocation(false);
    }

    if (opts?.forceFocus) {
      setMapFocusZoom(opts?.targetZoom);
      setMapFocusToken((v) => v + 1);
    }

    // Even when user location should stay fixed (preserveCurrentCoords),
    // queries must target the focused city/provider coordinates.
    const anchorLat = lat;
    const anchorLng = lng;
    fetchDrivers(anchorLat, anchorLng, actionTypeRef.current, {
      zoom: ACTION_PANEL_QUERY_ZOOM,
      limit: ACTION_PANEL_QUERY_LIMIT,
      bbox: TURKEY_BBOX,
    });
  }, [ACTION_PANEL_QUERY_LIMIT, ACTION_PANEL_QUERY_ZOOM, fetchDrivers]);

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
            if (readManualLocation()) return;
            router.replace('/location-required');
          }
        },
        { enableHighAccuracy: true, timeout: 22000, maximumAge: 120000 }
      );
    }, 1200);

    return () => clearTimeout(timer);
  }, [handleSearchLocation, router, searchCoords]);

  const handleFilterApply = useCallback((type: string) => {
    blockMapMoveFetchUntilRef.current = Date.now() + 1800;
    if (mapMoveDebounceRef.current) {
      clearTimeout(mapMoveDebounceRef.current);
      mapMoveDebounceRef.current = null;
    }
    if (filterRetryRef.current) {
      clearTimeout(filterRetryRef.current);
      filterRetryRef.current = null;
    }
    lastFilterTypeRef.current = type;
    setLoading(true);
    setActionType(type);
    setActiveTags([]);
    const typeCached = readTypeCache(type);
    if (typeCached && typeCached.length > 0) {
      setDrivers(typeCached);
    }
    const baseCoords = searchCoordsRef.current;
    const baseLat = baseCoords?.[0] ?? DEFAULT_LAT;
    const baseLng = baseCoords?.[1] ?? DEFAULT_LNG;
    const requestedLimit = Math.max(listEndFetchLimitRef.current || 0, ACTION_PANEL_QUERY_LIMIT);
    listEndFetchLimitRef.current = requestedLimit;
    fetchDrivers(baseLat, baseLng, type, {
      zoom: ACTION_PANEL_QUERY_ZOOM,
      limit: requestedLimit,
      bbox: TURKEY_BBOX,
      force: true,
      countryFallback: true,
    });

    // Safety refresh for very fast category toggles (e.g. vinc -> kurtarici).
    filterRetryRef.current = setTimeout(() => {
      if (lastFilterTypeRef.current !== type) return;
      const retryCoords = searchCoordsRef.current;
      fetchDrivers(retryCoords?.[0] ?? DEFAULT_LAT, retryCoords?.[1] ?? DEFAULT_LNG, type, {
        zoom: ACTION_PANEL_QUERY_ZOOM,
        limit: requestedLimit,
        bbox: TURKEY_BBOX,
        force: true,
        countryFallback: true,
      });
    }, 420);
  }, [ACTION_PANEL_QUERY_LIMIT, ACTION_PANEL_QUERY_ZOOM, fetchDrivers, readTypeCache]);

  const handleSelectDriver = useCallback((id: string | null, openPopup: boolean, driverHint?: any) => {
    setActiveDriverId(id);
    setPopupDriverId(openPopup ? id : null);
    if (!id) {
      setSelectedDriverGhost(null);
      setFocusCoords(null);
      return;
    }
    if (driverHint && driverHint._id === id) {
      setSelectedDriverGhost(driverHint);
    }
    const merged = [...filteredDrivers, ...filteredMapDrivers, ...drivers, ...mapDrivers];
    const selected = merged.find((d: any) => d?._id === id) || driverHint;
    const coords = selected?.location?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      // Keep user's blue location marker fixed; only move camera focus to selected provider.
      setFocusCoords([coords[1], coords[0]]);
    }
    if (id) {
      blockMapMoveFetchUntilRef.current = Date.now() + 3200;
      suppressNextMapMoveFetchRef.current = true;
      setMapFocusZoom(13.2);
      setMapFocusToken((v) => v + 1);
    }
  }, [drivers, filteredDrivers, filteredMapDrivers, mapDrivers]);

  const handleReachListEnd = useCallback(() => {
    const base = searchCoordsRef.current;
    if (!base) return;
    const prevLimit = listEndFetchLimitRef.current || ACTION_PANEL_QUERY_LIMIT;
    const nextLimit = Math.min(5200, prevLimit + 700);
    listEndFetchLimitRef.current = nextLimit;

    let expandedBbox = lastMapFetchRef.current?.bbox;
    if (expandedBbox) {
      const latSpan = Math.max(0.01, expandedBbox.maxLat - expandedBbox.minLat);
      const lngSpan = Math.max(0.01, expandedBbox.maxLng - expandedBbox.minLng);
      const latPad = Math.max(0.08, latSpan * 0.9);
      const lngPad = Math.max(0.08, lngSpan * 0.9);
      expandedBbox = {
        minLat: expandedBbox.minLat - latPad,
        minLng: expandedBbox.minLng - lngPad,
        maxLat: expandedBbox.maxLat + latPad,
        maxLng: expandedBbox.maxLng + lngPad,
      };
    }

    fetchDrivers(base[0], base[1], actionTypeRef.current, {
      zoom: ACTION_PANEL_QUERY_ZOOM,
      limit: nextLimit,
      bbox: TURKEY_BBOX,
      append: true,
    });
  }, [ACTION_PANEL_QUERY_LIMIT, ACTION_PANEL_QUERY_ZOOM, fetchDrivers]);

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

  useEffect(() => {
    listEndFetchLimitRef.current = 0;
  }, [actionType, searchCoords?.[0], searchCoords?.[1]]);

  const handleSearchPick = useCallback((driver: any) => {
    setMapSearchQuery(driver?.businessName || '');
    handleSelectDriver(driver?._id || null, true, driver);
  }, [handleSelectDriver]);

  const isFavorite = useCallback((driverId: string) => {
    return favorites.some((f) => f._id === driverId);
  }, [favorites]);

  const handleToggleFavorite = useCallback((driver: any) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f._id === driver._id);
      if (exists) return prev.filter((f) => f._id !== driver._id);
      return [...prev, {
        _id: driver._id,
        businessName: driver.businessName,
        phoneNumber: driver.phoneNumber,
        rating: driver.rating,
        service: driver.service,
        address: driver.address,
        location: driver.location,
      }];
    });
  }, []);

  const handleRemoveFavorite = useCallback((driverId: string) => {
    setFavorites((prev) => prev.filter((f) => f._id !== driverId));
  }, []);

  const handleOpenRatings = useCallback((driverId: string, driverName?: string) => {
    setModalDriverId(driverId);
    setModalDriverName(driverName || '');
    setShowRatingsModal(true);
  }, []);

  const handleOpenReports = useCallback((driverId: string, driverName?: string) => {
    setModalDriverId(driverId);
    setModalDriverName(driverName || '');
    setShowReportsModal(true);
  }, []);

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
    if (activeDriverId) {
      return;
    }
    if (Date.now() < blockMapMoveFetchUntilRef.current) {
      return;
    }
    if (suppressNextMapMoveFetchRef.current) {
      suppressNextMapMoveFetchRef.current = false;
      return;
    }
    const prev = lastMapFetchRef.current;
    if (prev) {
      const movedLat = Math.abs(prev.lat - lat);
      const movedLng = Math.abs(prev.lng - lng);
      const zoomDelta = Math.abs(prev.zoom - zoom);

      const hasMeaningfulPan = movedLat >= MIN_MOVE_DISTANCE_DEG || movedLng >= MIN_MOVE_DISTANCE_DEG;
      const hasMeaningfulZoom = zoomDelta >= MIN_ZOOM_DELTA;
      if (!hasMeaningfulPan && !hasMeaningfulZoom) {
        return;
      }
    }

    if (mapMoveDebounceRef.current) clearTimeout(mapMoveDebounceRef.current);
    mapMoveDebounceRef.current = setTimeout(() => {
      lastMapFetchRef.current = { lat, lng, zoom, bbox };
      let expandedBbox = bbox;
      if (bbox) {
        const latSpan = Math.max(0.01, bbox.maxLat - bbox.minLat);
        const lngSpan = Math.max(0.01, bbox.maxLng - bbox.minLng);
        const latPad = Math.max(0.06, latSpan * BBOX_OVERSCAN_FACTOR);
        const lngPad = Math.max(0.06, lngSpan * BBOX_OVERSCAN_FACTOR);
        expandedBbox = {
          minLat: bbox.minLat - latPad,
          minLng: bbox.minLng - lngPad,
          maxLat: bbox.maxLat + latPad,
          maxLng: bbox.maxLng + lngPad,
        };
      }
      const requestedLimit = Math.max(ACTION_PANEL_QUERY_LIMIT, 2200);
      fetchDrivers(lat, lng, actionTypeRef.current, {
        zoom,
        limit: requestedLimit,
        bbox: expandedBbox,
        append: true,
        silent: true,
        target: 'map',
      });
    }, MAP_MOVE_FETCH_DEBOUNCE_MS);
  }, [
    ACTION_PANEL_QUERY_LIMIT,
    ACTION_PANEL_QUERY_ZOOM,
    BBOX_OVERSCAN_FACTOR,
    COUNTRY_MODE_FETCH_LIMIT,
    COUNTRY_MODE_ZOOM_THRESHOLD,
    fetchDrivers,
    MAP_MOVE_FETCH_DEBOUNCE_MS,
    MIN_MOVE_DISTANCE_DEG,
    MIN_ZOOM_DELTA,
    activeDriverId,
  ]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white">
      <SplashScreen visible={showSplash} />

      <TopControls
        topOffset={TOP_UI_OFFSET}
        searchQuery={mapSearchQuery}
        onSearchQueryChange={setMapSearchQuery}
        suggestions={suggestions}
        onPickSuggestion={handleSearchPick}
        onProfileClick={() => setShowProfileModal(true)}
      />

      <div className="absolute inset-0 z-0">
        <Map
          searchCoords={searchCoords}
          searchApproximate={isApproximateLocation}
          searchApproxRadiusKm={8}
          focusCoords={focusCoords}
          focusRequestToken={mapFocusToken}
          focusRequestZoom={mapFocusZoom}
          drivers={mapRenderDrivers}
          activeDriverId={activeDriverId}
          popupDriverId={popupDriverId}
          onSelectDriver={(id) => handleSelectDriver(id, true)}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          onViewRatings={handleOpenRatings}
          onViewReports={handleOpenReports}
          onMapInteract={() => setPanelCollapseToken((v) => v + 1)}
          onMapMove={handleMapMove}
          onMapClick={() => {
            setActiveDriverId(null);
            setPopupDriverId(null);
            setPanelCollapseToken((v) => v + 1);
          }}
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
        onSelectDriver={(id, driver) => handleSelectDriver(id, false, driver)}
        onStartOrder={handleCreateOrder}
        isSidebarOpen={false}
        collapseRequestToken={panelCollapseToken}
        favoritesExternal={favorites}
        isFavoriteExternal={isFavorite}
        onToggleFavoriteExternal={handleToggleFavorite}
        onRemoveFavoriteExternal={handleRemoveFavorite}
        onReachListEnd={handleReachListEnd}
      />

      <ViewRatingsModal
        isOpen={showRatingsModal}
        onClose={() => setShowRatingsModal(false)}
        driverId={modalDriverId}
        driverName={modalDriverName}
      />
      <ViewReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        driverId={modalDriverId}
        driverName={modalDriverName}
      />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

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
