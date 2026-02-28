/**
 * @file page.tsx
 * FIX: Sidebar kaldırıldı, yerine Settings butonu eklendi.
 * Settings butonu → /settings sayfasına yönlendiriyor.
 * FIX: Eski gömülü ScanningLoader kaldırıldı, yeni nesil loader import edildi.
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import TopBar from '../components/home/TopBar';
import ActionPanel from '../components/home/ActionPanel';
import ProfileModal from '../components/ProfileModal';
import ViewRatingsModal from '../components/ViewRatingsModal';
import ViewReportsModal from '../components/ViewReportsModal';

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
  const TOP_UI_OFFSET = 'max(calc(env(safe-area-inset-top, 0px) + 22px), 34px)';

  const [showSplash, setShowSplash] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
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
  const [modalDriverId, setModalDriverId] = useState<string | null>(null);
  const [modalDriverName, setModalDriverName] = useState<string>('');
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
  const blockMapMoveFetchUntilRef = useRef(0);
  const driversRef = useRef<any[]>([]);

  useEffect(() => {
    driversRef.current = drivers;
  }, [drivers]);

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
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [SPLASH_DURATION_MS]);

  const fetchDrivers = useCallback(async (
    lat: number,
    lng: number,
    type: string,
    opts?: { zoom?: number; limit?: number; bbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number }; append?: boolean; force?: boolean }
  ) => {
    const requestSeq = ++fetchSeqRef.current;
    const key = [
      type,
      lat.toFixed(4),
      lng.toFixed(4),
      String(opts?.zoom ? Math.round(opts.zoom * 10) / 10 : ''),
      String(opts?.limit ? Math.round(opts.limit) : ''),
      String(opts?.bbox ? `${opts.bbox.minLat.toFixed(3)}:${opts.bbox.minLng.toFixed(3)}:${opts.bbox.maxLat.toFixed(3)}:${opts.bbox.maxLng.toFixed(3)}` : ''),
    ].join(':');
    if (!opts?.force && inflightFetchKeyRef.current === key) return;

    const now = Date.now();
    const cached = driversCacheRef.current[key];
    if (!opts?.force && cached) {
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

    if (!cached || opts?.force) {
      const typeCached = readTypeCache(type);
      if (typeCached && typeCached.length > 0) {
        setDrivers(typeCached);
      }
      setLoading(true);
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
      if (requestSeq !== fetchSeqRef.current) return;
      const normalizedData = Array.isArray(data) ? data : [];
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
      if (normalizedData.length === 0 && Array.isArray(driversRef.current) && driversRef.current.length > 0 && !!opts?.bbox) {
        // Keep current visible list if a move query returns empty to avoid sudden blank panel.
      } else {
        if (opts?.append) {
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
    } catch (err) {
      if (requestSeq !== fetchSeqRef.current) return;
      if ((err as any)?.name !== 'AbortError') {
        console.error('Fetch Error:', err);
        const typed = readTypeCache(type);
        if (typed && typed.length > 0) {
          setDrivers(typed);
          setOfflineNotice('Internet yok. Son sonuclar yukleniyor.');
          return;
        }
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
  }, [DRIVERS_CACHE_MAX_ENTRIES, readTypeCache, writeTypeCache]);

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
    if (!searchCoords) {
      fetchDrivers(DEFAULT_LAT, DEFAULT_LNG, 'kurtarici', {
        zoom: COUNTRY_MODE_ZOOM_THRESHOLD,
        limit: 900,
        bbox: TURKEY_BBOX,
      });
    }
  }, [fetchDrivers, searchCoords]);

  useEffect(() => {
    if (searchCoords) return;
    if (typeof window === 'undefined') return;
    const manual = readManualLocation();
    if (!manual) return;

    const useManualIfNeeded = async () => {
      if (!navigator?.geolocation) {
        setSearchCoords([manual.lat, manual.lng]);
        setMapFocusZoom(12.5);
        setMapFocusToken((v) => v + 1);
        return;
      }
      try {
        const permissions = (navigator as any).permissions;
        if (!permissions?.query) return;
        const status = await permissions.query({ name: 'geolocation' as PermissionName });
        if (status?.state === 'denied') {
          setSearchCoords([manual.lat, manual.lng]);
          setMapFocusZoom(12.5);
          setMapFocusToken((v) => v + 1);
        }
      } catch {}
    };

    useManualIfNeeded();
  }, [searchCoords]);

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
    }

    if (opts?.forceFocus) {
      setMapFocusZoom(opts?.targetZoom);
      setMapFocusToken((v) => v + 1);
    }

    const anchorLat = preserveCurrentCoords ? (searchCoordsRef.current?.[0] ?? DEFAULT_LAT) : lat;
    const anchorLng = preserveCurrentCoords ? (searchCoordsRef.current?.[1] ?? DEFAULT_LNG) : lng;
    fetchDrivers(anchorLat, anchorLng, actionTypeRef.current);
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
    blockMapMoveFetchUntilRef.current = Date.now() + 1400;
    if (mapMoveDebounceRef.current) {
      clearTimeout(mapMoveDebounceRef.current);
      mapMoveDebounceRef.current = null;
    }
    setActionType(type);
    setActiveTags([]);
    const typeCached = readTypeCache(type);
    if (typeCached && typeCached.length > 0) {
      setDrivers(typeCached);
    }
    const zoom = lastMapFetchRef.current?.zoom ?? 9;
    const requestedLimit = Math.max(listEndFetchLimitRef.current || 0, zoom >= 10 ? 2200 : 1600);
    listEndFetchLimitRef.current = requestedLimit;
    fetchDrivers(searchCoords?.[0] ?? DEFAULT_LAT, searchCoords?.[1] ?? DEFAULT_LNG, type, {
      zoom,
      limit: requestedLimit,
      force: true,
    });
  }, [fetchDrivers, readTypeCache, searchCoords]);

  const handleSelectDriver = useCallback((id: string | null, openPopup: boolean) => {
    setActiveDriverId(id);
    setPopupDriverId(openPopup ? id : null);
    if (id) {
      suppressNextMapMoveFetchRef.current = true;
      setMapFocusZoom(12.8);
      setMapFocusToken((v) => v + 1);
    }
  }, []);

  const handleReachListEnd = useCallback(() => {
    const base = searchCoordsRef.current;
    if (!base) return;
    const zoom = lastMapFetchRef.current?.zoom ?? 10;
    const prevLimit = listEndFetchLimitRef.current || (zoom >= 10 ? 1400 : 1000);
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
      zoom,
      limit: nextLimit,
      bbox: expandedBbox,
      append: true,
    });
  }, [fetchDrivers]);

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
    handleSelectDriver(driver?._id || null, true);
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
      let leftSafeViewport = false;

      if (prev.bbox && bbox) {
        const latSpan = Math.max(0.0001, prev.bbox.maxLat - prev.bbox.minLat);
        const lngSpan = Math.max(0.0001, prev.bbox.maxLng - prev.bbox.minLng);
        const latInset = latSpan * VIEWPORT_REFETCH_EDGE_RATIO;
        const lngInset = lngSpan * VIEWPORT_REFETCH_EDGE_RATIO;

        const inner = {
          minLat: prev.bbox.minLat + latInset,
          minLng: prev.bbox.minLng + lngInset,
          maxLat: prev.bbox.maxLat - latInset,
          maxLng: prev.bbox.maxLng - lngInset,
        };

        leftSafeViewport =
          bbox.minLat < inner.minLat ||
          bbox.minLng < inner.minLng ||
          bbox.maxLat > inner.maxLat ||
          bbox.maxLng > inner.maxLng;
      }

      if (!hasMeaningfulPan && !hasMeaningfulZoom && !leftSafeViewport) {
        return;
      }
    }

    if (mapMoveDebounceRef.current) clearTimeout(mapMoveDebounceRef.current);
    mapMoveDebounceRef.current = setTimeout(() => {
      lastMapFetchRef.current = { lat, lng, zoom, bbox };
      const anchor = searchCoordsRef.current;
      const baseLat = anchor?.[0] ?? lat;
      const baseLng = anchor?.[1] ?? lng;
      let expandedBbox = bbox;
      let requestedLimit: number | undefined;
      if (bbox) {
        const minPad = zoom >= 12 ? 0.1 : zoom >= 10 ? 0.08 : 0.05;
        const latPad = Math.max(minPad, (bbox.maxLat - bbox.minLat) * BBOX_OVERSCAN_FACTOR);
        const lngPad = Math.max(minPad, (bbox.maxLng - bbox.minLng) * BBOX_OVERSCAN_FACTOR);
        expandedBbox = {
          minLat: bbox.minLat - latPad,
          minLng: bbox.minLng - lngPad,
          maxLat: bbox.maxLat + latPad,
          maxLng: bbox.maxLng + lngPad,
        };
        requestedLimit = zoom >= 10 ? 1400 : 1000;
      }
      if (zoom <= COUNTRY_MODE_ZOOM_THRESHOLD) {
        expandedBbox = TURKEY_BBOX;
        requestedLimit = COUNTRY_MODE_FETCH_LIMIT;
      }
      fetchDrivers(baseLat, baseLng, actionTypeRef.current, {
        zoom,
        limit: Math.max(requestedLimit || 0, zoom >= 10 ? 1800 : 1300),
        // Do not constrain ActionPanel by viewport; keep nearby districts visible even in high zoom.
        bbox: undefined,
        append: true,
      });
    }, MAP_MOVE_FETCH_DEBOUNCE_MS);
  }, [
    BBOX_OVERSCAN_FACTOR,
    COUNTRY_MODE_FETCH_LIMIT,
    COUNTRY_MODE_ZOOM_THRESHOLD,
    fetchDrivers,
    MAP_MOVE_FETCH_DEBOUNCE_MS,
    MIN_MOVE_DISTANCE_DEG,
    MIN_ZOOM_DELTA,
    VIEWPORT_REFETCH_EDGE_RATIO,
  ]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white">
      <SplashScreen visible={showSplash} />

      {/* TopBar artık Settings butonu gösteriyor (Sidebar yerine) */}
      <TopBar
        onProfileClick={() => setShowProfile(true)}
        topOffset={TOP_UI_OFFSET}
      />

      <div
        className="absolute left-1/2 z-[450] -translate-x-1/2 pointer-events-auto scale-[0.94] sm:scale-100 origin-top"
        style={{
          top: TOP_UI_OFFSET,
          width: 'min(540px, calc(100vw - 140px))'
        }}
      >
        <div className="relative rounded-2xl border border-gray-100 bg-white/95 shadow-lg backdrop-blur-md">
          <div className="flex min-h-[52px] items-center gap-2 px-4 py-2">
            <input
              value={mapSearchQuery}
              onChange={(e) => setMapSearchQuery(e.target.value)}
              placeholder="Firma veya hizmet ara"
              className="flex-1 bg-transparent text-[14px] font-semibold text-slate-800 outline-none"
            />
            {mapSearchQuery && (
              <button onClick={() => setMapSearchQuery('')} className="rounded-lg p-1.5 text-slate-500">
                <X size={17} />
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
          focusCoords={focusCoords}
          focusRequestToken={mapFocusToken}
          focusRequestZoom={mapFocusZoom}
          drivers={filteredDrivers}
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
        onSelectDriver={(id) => handleSelectDriver(id, false)}
        onStartOrder={handleCreateOrder}
        isSidebarOpen={false}
        collapseRequestToken={panelCollapseToken}
        favoritesExternal={favorites}
        isFavoriteExternal={isFavorite}
        onToggleFavoriteExternal={handleToggleFavorite}
        onRemoveFavoriteExternal={handleRemoveFavorite}
        onReachListEnd={handleReachListEnd}
      />

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
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
