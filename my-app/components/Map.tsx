'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AppLang, getPreferredLang } from '../utils/language';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Anchor,
  Bus,
  CarFront,
  Container,
  Crown,
  Globe,
  Home,
  MapPin,
  Navigation,
  Package,
  Truck,
  Users
} from 'lucide-react';

interface Driver {
  _id: string;
  businessName: string;
  distance?: number;
  phoneNumber?: string;
  rating?: number;
  website?: string;
  link?: string;
  location: {
    coordinates: [number, number];
  };
  address?: { city?: string; district?: string };
  service?: { mainType: string; subType: string; tags: string[] };
  pricing?: { openingFee: number; pricePerUnit: number };
}

interface MapProps {
  searchCoords: [number, number] | null;
  focusRequestToken?: number;
  focusRequestZoom?: number;
  drivers: Driver[];
  onStartOrder: (driver: Driver, method: 'call' | 'message') => void;
  activeDriverId: string | null;
  onSelectDriver: (id: string | null) => void;
  onMapMove?: (lat: number, lng: number, zoom: number, bbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number }) => void;
  onMapClick?: () => void;
}

const SERVICE_COLORS: Record<string, string> = {
  oto_kurtarma: '#dc2626',
  vinc: '#7f1d1d',
  kurtarici: '#dc2626',
  nakliye: '#7e22ce',
  evden_eve: '#7e22ce',
  tir: '#7e22ce',
  kamyon: '#7e22ce',
  kamyonet: '#7e22ce',
  yurt_disi_nakliye: '#3730a3',
  istasyon: '#2563eb',
  seyyar_sarj: '#0891b2',
  minibus: '#059669',
  otobus: '#059669',
  midibus: '#059669',
  vip_tasima: '#059669',
  yolcu: '#059669',
  other: '#6b7280',
};

const SERVICE_ICONS: Record<string, string> = {
  oto_kurtarma: '🚗',
  vinc: '🏗',
  kurtarici: '🚨',
  nakliye: '🚚',
  evden_eve: '🏠',
  tir: '🚛',
  kamyon: '🚚',
  kamyonet: '📦',
  yurt_disi_nakliye: '🌍',
  istasyon: '⚡',
  seyyar_sarj: '🔋',
  minibus: '🚐',
  otobus: '🚌',
  midibus: '🚌',
  vip_tasima: '👑',
  yolcu: '👥',
  other: '📍',
};

const RENDER_SERVICE_TYPES = Object.keys(SERVICE_COLORS) as string[];
const FOCUS_UP_OFFSET_PX = 240;

const GeziciSarjIcon = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 36h12v10H4z" /><path d="M16 36l3-6h7l3 6" /><circle cx="7" cy="48" r="2.5" /><circle cx="26" cy="48" r="2.5" />
    <path d="M29 36c4 0 4-10 10-10s6 10 10 10" strokeDasharray="3 2" />
    <path d="M38 24l2 2-2 2" strokeWidth="1" />
    <path d="M44 38h16v8H44z" /><path d="M44 38l2-5h10l2 5" /><circle cx="48" cy="48" r="2.5" /><circle cx="56" cy="48" r="2.5" />
  </svg>
);

const SERVICE_ICON_COMPONENTS: Record<string, any> = {
  oto_kurtarma: CarFront,
  vinc: Anchor,
  kurtarici: CarFront,
  nakliye: Truck,
  evden_eve: Home,
  tir: Container,
  kamyon: Truck,
  kamyonet: Package,
  yurt_disi_nakliye: Globe,
  istasyon: Navigation,
  seyyar_sarj: GeziciSarjIcon,
  minibus: CarFront,
  otobus: Bus,
  midibus: Bus,
  vip_tasima: Crown,
  yolcu: Users,
  other: MapPin,
};

const SERVICE_LABELS: Record<string, Record<AppLang, string>> = {
  oto_kurtarma: { tr: 'Oto Kurtarma', en: 'Roadside Recovery', de: 'Abschleppdienst', fr: 'Depannage', it: 'Soccorso stradale', es: 'Auxilio vial', pt: 'Reboque', ru: 'Ewakuator', zh: '道路救援', ja: 'ロードサービス', ko: '긴급 견인', ar: 'سحب مركبات' },
  vinc: { tr: 'Vinc', en: 'Crane', de: 'Kran', fr: 'Grue', it: 'Gru', es: 'Grua', pt: 'Guindaste', ru: 'Kran', zh: '吊车', ja: 'クレーン', ko: '크레인', ar: 'رافعة' },
  kurtarici: { tr: 'Kurtarici', en: 'Recovery', de: 'Bergung', fr: 'Remorquage', it: 'Recupero', es: 'Rescate', pt: 'Resgate', ru: 'Evakuaciya', zh: '救援', ja: '救援', ko: '구난', ar: 'إنقاذ' },
  nakliye: { tr: 'Nakliye', en: 'Transport', de: 'Transport', fr: 'Transport', it: 'Trasporto', es: 'Transporte', pt: 'Transporte', ru: 'Perevozka', zh: '运输', ja: '輸送', ko: '운송', ar: 'نقل' },
  evden_eve: { tr: 'Evden Eve', en: 'Home Moving', de: 'Umzug', fr: 'Demenagement', it: 'Trasloco', es: 'Mudanza', pt: 'Mudanca', ru: 'Pereezd', zh: '搬家', ja: '引っ越し', ko: '이사', ar: 'نقل منزلي' },
  tir: { tr: 'TIR', en: 'Trailer Truck', de: 'Sattelzug', fr: 'Semi-remorque', it: 'Autoarticolato', es: 'Trailer', pt: 'Carreta', ru: 'Fura', zh: '半挂车', ja: 'トレーラー', ko: '트레일러', ar: 'شاحنة مقطورة' },
  kamyon: { tr: 'Kamyon', en: 'Truck', de: 'LKW', fr: 'Camion', it: 'Camion', es: 'Camion', pt: 'Caminhao', ru: 'Gruzovik', zh: '卡车', ja: 'トラック', ko: '트럭', ar: 'شاحنة' },
  kamyonet: { tr: 'Kamyonet', en: 'Van', de: 'Transporter', fr: 'Fourgon', it: 'Furgone', es: 'Furgoneta', pt: 'Van', ru: 'Furgon', zh: '厢式车', ja: 'バン', ko: '밴', ar: 'فان' },
  yurt_disi_nakliye: { tr: 'Uluslararasi', en: 'International', de: 'International', fr: 'International', it: 'Internazionale', es: 'Internacional', pt: 'Internacional', ru: 'Mezhdunarodnyj', zh: '国际运输', ja: '国際輸送', ko: '국제 운송', ar: 'دولي' },
  istasyon: { tr: 'Istasyon', en: 'Station', de: 'Station', fr: 'Station', it: 'Stazione', es: 'Estacion', pt: 'Estacao', ru: 'Stanciya', zh: '充电站', ja: 'ステーション', ko: '스테이션', ar: 'محطة' },
  seyyar_sarj: { tr: 'Mobil Sarj', en: 'Mobile Charge', de: 'Mobiles Laden', fr: 'Charge mobile', it: 'Ricarica mobile', es: 'Carga movil', pt: 'Carga movel', ru: 'Mobilnaya zaryadka', zh: '移动充电', ja: '移動充電', ko: '이동 충전', ar: 'شحن متنقل' },
  minibus: { tr: 'Minibus', en: 'Minibus', de: 'Minibus', fr: 'Minibus', it: 'Minibus', es: 'Minibus', pt: 'Micro-onibus', ru: 'Mikroavtobus', zh: '小巴', ja: 'ミニバス', ko: '미니버스', ar: 'ميني باص' },
  otobus: { tr: 'Otobus', en: 'Bus', de: 'Bus', fr: 'Bus', it: 'Autobus', es: 'Autobus', pt: 'Onibus', ru: 'Avtobus', zh: '公交车', ja: 'バス', ko: '버스', ar: 'حافلة' },
  midibus: { tr: 'Midibus', en: 'Midibus', de: 'Midibus', fr: 'Midibus', it: 'Midibus', es: 'Midibus', pt: 'Midi-onibus', ru: 'Midibus', zh: '中巴', ja: 'ミディバス', ko: '미디버스', ar: 'ميدي باص' },
  vip_tasima: { tr: 'VIP Transfer', en: 'VIP Transfer', de: 'VIP Transfer', fr: 'Transfert VIP', it: 'Transfer VIP', es: 'Traslado VIP', pt: 'Transfer VIP', ru: 'VIP transfer', zh: 'VIP接送', ja: 'VIP送迎', ko: 'VIP 이동', ar: 'نقل VIP' },
  yolcu: { tr: 'Yolcu Tasima', en: 'Passenger', de: 'Personentransport', fr: 'Transport passager', it: 'Trasporto passeggeri', es: 'Transporte de pasajeros', pt: 'Transporte de passageiros', ru: 'Passazhirskij', zh: '客运', ja: '旅客輸送', ko: '승객 운송', ar: 'نقل ركاب' },
  other: { tr: 'Hizmet', en: 'Service', de: 'Dienst', fr: 'Service', it: 'Servizio', es: 'Servicio', pt: 'Servico', ru: 'Servis', zh: '服务', ja: 'サービス', ko: '서비스', ar: 'خدمة' },
};

const MAP_UI_TEXT: Record<AppLang, { call: string; message: string; show: string }> = {
  tr: { call: 'ARA', message: 'MESAJ AT', show: 'HARITADA GOSTER' },
  en: { call: 'CALL', message: 'MESSAGE', show: 'SHOW ON MAP' },
  de: { call: 'ANRUFEN', message: 'NACHRICHT', show: 'AUF KARTE ZEIGEN' },
  fr: { call: 'APPELER', message: 'MESSAGE', show: 'VOIR SUR LA CARTE' },
  it: { call: 'CHIAMA', message: 'MESSAGGIO', show: 'MOSTRA SULLA MAPPA' },
  es: { call: 'LLAMAR', message: 'MENSAJE', show: 'VER EN MAPA' },
  pt: { call: 'LIGAR', message: 'MENSAGEM', show: 'VER NO MAPA' },
  ru: { call: 'POZVONIT', message: 'SOOBSHCHENIE', show: 'POKAZAT NA KARTE' },
  zh: { call: '拨打电话', message: '发送消息', show: '在地图中显示' },
  ja: { call: '電話する', message: 'メッセージ', show: '地図で表示' },
  ko: { call: '전화하기', message: '메시지', show: '지도에서 보기' },
  ar: { call: 'اتصال', message: 'رسالة', show: 'عرض على الخريطة' },
};

const BASE_STYLE = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', 'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'],
      tileSize: 256,
      attribution: 'OpenStreetMap contributors, CARTO',
    },
  },
  layers: [{ id: 'carto-layer', type: 'raster', source: 'carto', minzoom: 0, maxzoom: 22 }],
} as const;

const HIDDEN_CATEGORIES = new Set(['seyyar_sarj', 'minibus', 'otobus', 'midibus', 'vip_tasima', 'yolcu_tasima']);
const INITIAL_CENTER: [number, number] = [35.2433, 38.9637];

function getServiceColor(subType: string) {
  return SERVICE_COLORS[subType] || SERVICE_COLORS.other;
}

function normalizeServiceType(subType: string | undefined) {
  if (!subType) return 'other';
  return SERVICE_COLORS[subType] ? subType : 'other';
}

function darkenHex(hex: string, amount: number) {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return hex;
  const r = Math.max(0, Math.min(255, parseInt(raw.slice(0, 2), 16) - amount));
  const g = Math.max(0, Math.min(255, parseInt(raw.slice(2, 4), 16) - amount));
  const b = Math.max(0, Math.min(255, parseInt(raw.slice(4, 6), 16) - amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function createDomMarker(subType: string, active: boolean) {
  const baseColor = getServiceColor(subType);
  const color = active ? darkenHex(baseColor, 50) : baseColor;

  const el = document.createElement('div');
  el.style.width = active ? '62px' : '54px';
  el.style.height = active ? '62px' : '54px';
  el.style.borderRadius = '9999px';
  el.style.transform = 'scale(0.85)';
  el.style.transformOrigin = 'bottom center';
  el.style.background = color;
  el.style.border = active ? '4px solid #fff' : '3px solid #fff';
  el.style.boxShadow = active ? '0 0 20px rgba(0,0,0,0.28)' : '0 6px 14px rgba(0,0,0,0.2)';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.cursor = 'pointer';
  el.style.pointerEvents = 'auto';
  el.style.transition = 'all .18s ease';
  el.innerHTML = `<div style="width:34%;height:34%;border-radius:9999px;background:rgba(255,255,255,0.95);"></div>`;
  return el;
}

function createEmptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] as any[] };
}

function createDriversGeoJsonByType(drivers: Driver[]) {
  const grouped: Record<string, any> = {};
  for (const type of RENDER_SERVICE_TYPES) {
    grouped[type] = createEmptyFeatureCollection();
  }

  for (const d of drivers) {
    if (!Array.isArray(d.location?.coordinates)) continue;
    const subType = normalizeServiceType(d.service?.subType);
    if (HIDDEN_CATEGORIES.has(subType)) continue;

    grouped[subType].features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: d.location.coordinates,
      },
      properties: {
        driverId: d._id,
        businessName: d.businessName || 'Isimsiz Isletme',
        distance: Number(d.distance || 0),
        phoneNumber: d.phoneNumber || '',
        rating: Number(d.rating || 5),
        website: d.website || d.link || '',
        subType,
        color: getServiceColor(subType),
        icon: SERVICE_ICONS[subType] || SERVICE_ICONS.other,
      },
    });
  }

  return grouped;
}

function createActiveDriverGeoJson(driver: Driver | undefined) {
  if (!driver?.location?.coordinates) return createEmptyFeatureCollection();
  const subType = normalizeServiceType(driver.service?.subType);
  if (HIDDEN_CATEGORIES.has(subType)) return createEmptyFeatureCollection();
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: driver.location.coordinates,
      },
      properties: {
        driverId: driver._id,
        color: getServiceColor(subType),
        icon: SERVICE_ICONS[subType] || SERVICE_ICONS.other,
      },
    }],
  };
}

function createUserPointGeoJson(coords: [number, number] | null) {
  if (!coords) {
    return { type: 'FeatureCollection', features: [] };
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [coords[1], coords[0]] },
        properties: {},
      },
    ],
  };
}

function buildPopup(driver: Driver, lang: AppLang, onStartOrder: (driver: Driver, method: 'call' | 'message') => void) {
  const subType = driver.service?.subType || 'other';
  const color = getServiceColor(subType);
  const label = SERVICE_LABELS[subType]?.[lang] || SERVICE_LABELS.other[lang] || SERVICE_LABELS.other.en;
  const uiText = MAP_UI_TEXT[lang] || MAP_UI_TEXT.en;

  const wrap = document.createElement('div');
  wrap.className = 'p-2 text-gray-900';
  wrap.style.minWidth = '250px';

  const distance = driver.distance ? `${(driver.distance / 1000).toFixed(1)} KM` : '';
  const rating = (driver.rating || 5).toFixed(1);
  const phone = driver.phoneNumber || '';

  wrap.innerHTML = `
    <div style="font-family: ui-sans-serif, system-ui;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:8px;">
        <span style="font-size:10px;font-weight:900;color:white;padding:5px 8px;border-radius:10px;background:${color};text-transform:uppercase;">${label}</span>
        ${distance ? `<span style="font-size:10px;font-weight:800;color:#9ca3af;">${distance}</span>` : ''}
      </div>
      <h4 style="font-size:13px;font-weight:900;margin:0 0 6px 0;line-height:1.2;text-transform:uppercase;">${driver.businessName || ''}</h4>
      <div style="font-size:11px;font-weight:800;color:#6b7280;margin-bottom:12px;">⭐ ${rating}</div>
      <div style="display:flex;gap:8px;">
        <button data-action="call" style="flex:1;border:0;border-radius:14px;padding:10px 8px;color:white;background:${color};font-size:10px;font-weight:900;cursor:pointer;">${uiText.call}</button>
        <button data-action="message" style="flex:1;border:0;border-radius:14px;padding:10px 8px;color:white;background:#374151;font-size:10px;font-weight:900;cursor:pointer;">${uiText.message}</button>
      </div>
      <button data-action="show" style="margin-top:8px;width:100%;border:0;border-radius:10px;padding:9px 8px;color:white;background:#111827;font-size:10px;font-weight:900;cursor:pointer;">${uiText.show}</button>
    </div>
  `;

  const callBtn = wrap.querySelector('[data-action="call"]') as HTMLButtonElement | null;
  const messageBtn = wrap.querySelector('[data-action="message"]') as HTMLButtonElement | null;
  const showBtn = wrap.querySelector('[data-action="show"]') as HTMLButtonElement | null;

  callBtn?.addEventListener('click', () => {
    onStartOrder(driver, 'call');
    if (phone) window.location.href = `tel:${phone}`;
  });
  messageBtn?.addEventListener('click', () => {
    onStartOrder(driver, 'message');
    if (phone) window.location.href = `sms:${phone}`;
  });
  showBtn?.addEventListener('click', () => {
    const lat = driver.location?.coordinates?.[1];
    const lng = driver.location?.coordinates?.[0];
    if (typeof lat === 'number' && typeof lng === 'number') {
      window.open(`https://maps.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  });

  return wrap;
}

function MapView({
  searchCoords,
  focusRequestToken,
  focusRequestZoom,
  drivers,
  onStartOrder,
  activeDriverId,
  onSelectDriver,
  onMapMove,
  onMapClick,
}: MapProps) {
  const [lang, setLang] = useState<AppLang>('tr');
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const lastFocusTokenRef = useRef<number | undefined>(undefined);
  const domMarkersRef = useRef<Record<string, { marker: maplibregl.Marker; subType: string; active: boolean }>>({});
  const syncDomMarkersRef = useRef<(() => void) | null>(null);
  const activeDriverIdRef = useRef<string | null>(activeDriverId);
  const onSelectDriverRef = useRef(onSelectDriver);

  const center = useMemo<[number, number]>(() => {
    if (!searchCoords) return INITIAL_CENTER;
    return [searchCoords[1], searchCoords[0]];
  }, [searchCoords]);

  const driverById = useMemo(() => {
    const m = new globalThis.Map<string, Driver>();
    for (const d of drivers) m.set(d._id, d);
    return m;
  }, [drivers]);

  useEffect(() => {
    setLang(getPreferredLang());
  }, []);

  useEffect(() => {
    activeDriverIdRef.current = activeDriverId;
  }, [activeDriverId]);

  useEffect(() => {
    onSelectDriverRef.current = onSelectDriver;
  }, [onSelectDriver]);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapNodeRef.current,
      style: BASE_STYLE as any,
      center,
      zoom: searchCoords ? 12 : 5.8,
      minZoom: 5,
      maxZoom: 18,
      renderWorldCopies: false,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      const grouped = createDriversGeoJsonByType(drivers);
      for (const type of RENDER_SERVICE_TYPES) {
        const sourceId = `drivers-${type}`;
        map.addSource(sourceId, {
          type: 'geojson',
          data: grouped[type] as any,
          cluster: true,
          clusterMaxZoom: 11,
          clusterRadius: 55,
        });

        map.addLayer({
          id: `clusters-${type}`,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': getServiceColor(type),
            'circle-radius': ['step', ['get', 'point_count'], 20, 20, 25, 60, 31],
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
          },
        });

        map.addLayer({
          id: `cluster-count-${type}`,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 13,
            'text-font': ['Open Sans Bold'],
          },
          paint: { 'text-color': '#ffffff' },
        });

        map.addLayer({
          id: `driver-points-${type}`,
          type: 'circle',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': getServiceColor(type),
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 12, 12, 14, 16, 16],
            'circle-opacity': 0,
            'circle-stroke-width': 0,
            'circle-stroke-opacity': 0,
          },
        });
      }

      map.addSource('active-driver', {
        type: 'geojson',
        data: createActiveDriverGeoJson(driverById.get(activeDriverId || '')) as any,
      });

      map.addLayer({
        id: 'active-driver-point',
        type: 'circle',
        source: 'active-driver',
        paint: {
          'circle-color': ['coalesce', ['get', 'color'], '#111827'],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 16, 12, 20, 16, 24],
          'circle-stroke-width': 4,
          'circle-stroke-color': ['coalesce', ['get', 'color'], '#111827'],
          'circle-opacity': 0.96,
        },
      });

      map.addSource('search-point', {
        type: 'geojson',
        data: createUserPointGeoJson(searchCoords) as any,
      });

      map.addLayer({
        id: 'search-point-dot',
        type: 'circle',
        source: 'search-point',
        paint: {
          'circle-color': '#2563eb',
          'circle-radius': 8,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
        },
      });

      map.addLayer({
        id: 'search-point-ring',
        type: 'circle',
        source: 'search-point',
        paint: {
          'circle-color': '#2563eb',
          'circle-radius': 16,
          'circle-opacity': 0.15,
        },
      });

      const clusterLayers = RENDER_SERVICE_TYPES.map((type) => `clusters-${type}`);
      const pointLayers = RENDER_SERVICE_TYPES.map((type) => `driver-points-${type}`);

      const syncDomMarkers = () => {
        const features = map.queryRenderedFeatures(undefined, { layers: pointLayers });
        const seen = new Set<string>();
        const activeId = activeDriverIdRef.current;
        const canvas = map.getCanvas();

        for (const feature of features) {
          const props: any = feature.properties || {};
          const id = String(props.driverId || '');
          if (!id || seen.has(id)) continue;

          const coords = (feature.geometry as any)?.coordinates as [number, number] | undefined;
          if (!coords || coords.length !== 2) continue;

          const subType = normalizeServiceType(String(props.subType || 'other'));
          const isActive = id === activeId;
          const screen = map.project({ lng: coords[0], lat: coords[1] });
          const edgeMargin = isActive ? 42 : 36;
          if (
            screen.x < edgeMargin ||
            screen.y < edgeMargin ||
            screen.x > canvas.width - edgeMargin ||
            screen.y > canvas.height - edgeMargin
          ) {
            continue;
          }
          seen.add(id);

          const existing = domMarkersRef.current[id];
          if (existing) {
            const shouldRecreate = existing.subType !== subType || existing.active !== isActive;
            if (shouldRecreate) {
              existing.marker.remove();
              const newEl = createDomMarker(subType, isActive);
              newEl.onclick = (ev) => {
                ev.stopPropagation();
                onSelectDriverRef.current(id);
              };
              domMarkersRef.current[id] = {
                marker: new maplibregl.Marker({ element: newEl, anchor: 'bottom' }).setLngLat(coords).addTo(map),
                subType,
                active: isActive,
              };
            } else {
              existing.marker.setLngLat(coords);
            }
            continue;
          }

          const el = createDomMarker(subType, isActive);
          el.onclick = (ev) => {
            ev.stopPropagation();
            onSelectDriverRef.current(id);
          };

          domMarkersRef.current[id] = {
            marker: new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(coords).addTo(map),
            subType,
            active: isActive,
          };
        }

        for (const [id, entry] of Object.entries(domMarkersRef.current)) {
          if (!seen.has(id)) {
            entry.marker.remove();
            delete domMarkersRef.current[id];
          }
        }
      };

      syncDomMarkersRef.current = syncDomMarkers;
      map.on('move', syncDomMarkers);
      map.on('zoom', syncDomMarkers);
      map.on('moveend', syncDomMarkers);
      map.on('idle', syncDomMarkers);

      for (const type of RENDER_SERVICE_TYPES) {
        const clusterLayerId = `clusters-${type}`;
        const sourceId = `drivers-${type}`;
        map.on('click', clusterLayerId, async (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const clusterId = feature.properties?.cluster_id;
          const source = map.getSource(sourceId) as any;
          if (!source || clusterId === undefined) return;
          const expansionZoom = await source.getClusterExpansionZoom(clusterId);
          const coords = (feature.geometry as any).coordinates as [number, number];
          map.stop();
          map.easeTo({ center: coords, zoom: expansionZoom, duration: 500 });
        });

        const pointLayerId = `driver-points-${type}`;
        map.on('click', pointLayerId, (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const id = String(feature.properties?.driverId || '');
          if (!id) return;
          onSelectDriver(id);
        });

        map.on('mouseenter', clusterLayerId, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', clusterLayerId, () => (map.getCanvas().style.cursor = ''));
        map.on('mouseenter', pointLayerId, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', pointLayerId, () => (map.getCanvas().style.cursor = ''));
      }

      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [...clusterLayers, ...pointLayers, 'active-driver-point'] });
        if (features.length === 0) onMapClick?.();
      });

      map.on('moveend', () => {
        const c = map.getCenter();
        const b = map.getBounds();
        onMapMove?.(c.lat, c.lng, map.getZoom(), {
          minLat: b.getSouth(),
          minLng: b.getWest(),
          maxLat: b.getNorth(),
          maxLng: b.getEast(),
        });
      });

      syncDomMarkers();
    });

    return () => {
      popupRef.current?.remove();
      for (const entry of Object.values(domMarkersRef.current)) entry.marker.remove();
      domMarkersRef.current = {};
      syncDomMarkersRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const grouped = createDriversGeoJsonByType(drivers);
    for (const type of RENDER_SERVICE_TYPES) {
      const source = map.getSource(`drivers-${type}`) as maplibregl.GeoJSONSource | undefined;
      if (source) source.setData(grouped[type] as any);
    }
    const activeSource = map.getSource('active-driver') as maplibregl.GeoJSONSource | undefined;
    if (activeSource) {
      activeSource.setData(createActiveDriverGeoJson(activeDriverId ? driverById.get(activeDriverId) : undefined) as any);
    }
    syncDomMarkersRef.current?.();
  }, [drivers, activeDriverId, driverById]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('search-point')) return;
    const source = map.getSource('search-point') as maplibregl.GeoJSONSource;
    source.setData(createUserPointGeoJson(searchCoords) as any);
  }, [searchCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const hasNewFocusRequest = typeof focusRequestToken === 'number' && focusRequestToken !== lastFocusTokenRef.current;
    if (hasNewFocusRequest && searchCoords) {
      lastFocusTokenRef.current = focusRequestToken;
      map.stop();
      map.easeTo({
        center: [searchCoords[1], searchCoords[0]],
        zoom: focusRequestZoom ?? 15,
        duration: 900,
        offset: [0, FOCUS_UP_OFFSET_PX],
      });
      return;
    }

    if (activeDriverId) {
      const d = driverById.get(activeDriverId);
      const coords = d?.location?.coordinates;
      if (coords) {
        map.stop();
        map.easeTo({
          center: [coords[0], coords[1]],
          zoom: 16,
          duration: 900,
          offset: [0, FOCUS_UP_OFFSET_PX],
        });
      }
    } else if (searchCoords) {
      map.stop();
      map.easeTo({
        center: [searchCoords[1], searchCoords[0]],
        zoom: 12,
        duration: 900,
        offset: [0, FOCUS_UP_OFFSET_PX],
      });
    }
  }, [activeDriverId, driverById, focusRequestToken, focusRequestZoom, searchCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    popupRef.current?.remove();
    if (!activeDriverId) return;

    const driver = driverById.get(activeDriverId);
    if (!driver?.location?.coordinates) return;

    const popupNode = buildPopup(driver, lang, onStartOrder);
    const popup = new maplibregl.Popup({ closeButton: false, closeOnMove: true, offset: 20 })
      .setLngLat([driver.location.coordinates[0], driver.location.coordinates[1]])
      .setDOMContent(popupNode)
      .addTo(map);

    popupRef.current = popup;
  }, [activeDriverId, driverById, lang, onStartOrder]);

  return <div ref={mapNodeRef} className="absolute inset-0 h-full w-full bg-[#f0f4f8]" />;
}

export default memo(MapView);
