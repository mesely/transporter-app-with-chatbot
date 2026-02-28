'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AppLang, getPreferredLang } from '../utils/language';

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
  searchApproximate?: boolean;
  searchApproxRadiusKm?: number;
  focusCoords?: [number, number] | null;
  focusRequestToken?: number;
  focusRequestZoom?: number;
  drivers: Driver[];
  onStartOrder: (driver: Driver, method: 'call' | 'message') => void;
  activeDriverId: string | null;
  popupDriverId?: string | null;
  onSelectDriver: (id: string | null) => void;
  isFavorite?: (driverId: string) => boolean;
  onToggleFavorite?: (driver: Driver) => void;
  onViewRatings?: (driverId: string, driverName?: string) => void;
  onViewReports?: (driverId: string, driverName?: string) => void;
  onMapInteract?: () => void;
  onMapMove?: (lat: number, lng: number, zoom: number, bbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number }) => void;
  onMapClick?: () => void;
}

const SERVICE_COLORS: Record<string, string> = {
  oto_kurtarma: '#dc2626',
  vinc: '#b91c1c',
  lastik: '#881337',
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
  vinc: '🚧',
  lastik: '○',
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
const FOCUS_PADDING_BASE = { top: 72, right: 36, left: 36 };
const MARKER_SCALE = 0.75;

const SERVICE_LABELS: Record<string, Record<AppLang, string>> = {
  oto_kurtarma: { tr: 'Oto Kurtarma', en: 'Roadside Recovery', de: 'Abschleppdienst', fr: 'Depannage', it: 'Soccorso stradale', es: 'Auxilio vial', pt: 'Reboque', ru: 'Ewakuator', zh: '道路救援', ja: 'ロードサービス', ko: '긴급 견인', ar: 'سحب مركبات' },
  vinc: { tr: 'Vinc', en: 'Crane', de: 'Kran', fr: 'Grue', it: 'Gru', es: 'Grua', pt: 'Guindaste', ru: 'Kran', zh: '吊车', ja: 'クレーン', ko: '크레인', ar: 'رافعة' },
  lastik: { tr: 'Lastik', en: 'Tire Service', de: 'Reifenservice', fr: 'Service pneus', it: 'Servizio gomme', es: 'Servicio de neumaticos', pt: 'Servico de pneus', ru: 'Shinomontazh', zh: '轮胎服务', ja: 'タイヤサービス', ko: '타이어 서비스', ar: 'خدمة إطارات' },
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

const MAP_UI_TEXT: Record<AppLang, { call: string; message: string; showGoogle: string; favoriteAdd: string; favoriteRemove: string; viewRatings: string; viewReports: string }> = {
  tr: { call: 'ARA', message: 'MESAJ AT', showGoogle: "MAPS'TE GORUNTULE", favoriteAdd: 'FAVORIYE EKLE', favoriteRemove: 'FAVORIDEN CIKAR', viewRatings: 'YORUMLARI GORUNTULE', viewReports: 'SIKAYETLERI GORUNTULE' },
  en: { call: 'CALL', message: 'MESSAGE', showGoogle: 'GOOGLE MAPS', favoriteAdd: 'FAVORITE', favoriteRemove: 'UNFAVORITE', viewRatings: 'REVIEWS', viewReports: 'REPORTS' },
  de: { call: 'ANRUF', message: 'NACHRICHT', showGoogle: 'GOOGLE MAPS', favoriteAdd: 'FAVORIT', favoriteRemove: 'ENTFERNEN', viewRatings: 'BEWERTUNG', viewReports: 'BESCHWERDE' },
  fr: { call: 'APPELER', message: 'MESSAGE', showGoogle: 'GOOGLE MAPS', favoriteAdd: 'FAVORI', favoriteRemove: 'SUPPRIMER', viewRatings: 'AVIS', viewReports: 'PLAINTES' },
  it: { call: 'CHIAMA', message: 'MESSAGGIO', showGoogle: 'GOOGLE MAPS', favoriteAdd: 'PREFERITI', favoriteRemove: 'RIMUOVI', viewRatings: 'RECENSIONI', viewReports: 'RECLAMI' },
  es: { call: 'LLAMAR', message: 'MENSAJE', showGoogle: 'GOOGLE MAPS', favoriteAdd: 'FAVORITO', favoriteRemove: 'QUITAR', viewRatings: 'RESENAS', viewReports: 'QUEJAS' },
  pt: { call: 'LIGAR', message: 'MENSAGEM', showGoogle: 'GOOGLE MAPS', favoriteAdd: 'FAVORITO', favoriteRemove: 'REMOVER', viewRatings: 'AVALIACOES', viewReports: 'RECLAMACOES' },
  ru: { call: 'POZVONIT', message: 'SOOBSHCHENIE', showGoogle: 'GOOGLE MAPS', favoriteAdd: 'IZBRANNOE', favoriteRemove: 'UBRAT', viewRatings: 'OTZYVY', viewReports: 'ZHALOBY' },
  zh: { call: '拨打', message: '消息', showGoogle: 'GOOGLE MAPS', favoriteAdd: '收藏', favoriteRemove: '取消', viewRatings: '评价', viewReports: '投诉' },
  ja: { call: '電話', message: 'メッセージ', showGoogle: 'GOOGLE MAPS', favoriteAdd: 'お気に入り', favoriteRemove: '解除', viewRatings: '評価', viewReports: '苦情' },
  ko: { call: '전화', message: '메시지', showGoogle: 'GOOGLE MAPS', favoriteAdd: '즐겨찾기', favoriteRemove: '해제', viewRatings: '리뷰', viewReports: '신고' },
  ar: { call: 'اتصال', message: 'رسالة', showGoogle: 'GOOGLE MAPS', favoriteAdd: 'مفضلة', favoriteRemove: 'إزالة', viewRatings: 'تقييمات', viewReports: 'شكاوى' },
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

function createEmptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] as any[] };
}

function createDriversGeoJsonByType(drivers: Driver[], zoomLevel = 12) {
  const grouped: Record<string, any> = {};
  for (const type of RENDER_SERVICE_TYPES) {
    grouped[type] = createEmptyFeatureCollection();
  }

  const lowZoomAggregation = zoomLevel < 10;
  const cellSize = zoomLevel < 6.2 ? 0.28 : zoomLevel < 8.2 ? 0.14 : 0.08;
  const buckets = new Map<string, { count: number; sumLng: number; sumLat: number; driver: Driver; subType: string }>();

  for (const d of drivers) {
    if (!Array.isArray(d.location?.coordinates)) continue;
    const subType = normalizeServiceType(d.service?.subType);
    if (HIDDEN_CATEGORIES.has(subType)) continue;

    if (lowZoomAggregation) {
      const lng = d.location.coordinates[0];
      const lat = d.location.coordinates[1];
      const gridLng = Math.round(lng / cellSize) * cellSize;
      const gridLat = Math.round(lat / cellSize) * cellSize;
      const bucketKey = `${subType}:${gridLng.toFixed(3)}:${gridLat.toFixed(3)}`;
      const existing = buckets.get(bucketKey);
      if (existing) {
        existing.count += 1;
        existing.sumLng += lng;
        existing.sumLat += lat;
      } else {
        buckets.set(bucketKey, { count: 1, sumLng: lng, sumLat: lat, driver: d, subType });
      }
      continue;
    }

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

  if (lowZoomAggregation) {
    for (const entry of buckets.values()) {
      const rep = entry.driver;
      const subType = entry.subType;
      grouped[subType].features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [entry.sumLng / entry.count, entry.sumLat / entry.count],
        },
        properties: {
          driverId: rep._id,
          businessName: rep.businessName || 'Isimsiz Isletme',
          distance: Number(rep.distance || 0),
          phoneNumber: rep.phoneNumber || '',
          rating: Number(rep.rating || 5),
          website: rep.website || rep.link || '',
          subType,
          color: getServiceColor(subType),
          icon: SERVICE_ICONS[subType] || SERVICE_ICONS.other,
        },
      });
    }
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

function createApproximateRangeGeoJson(coords: [number, number] | null, radiusKm = 8) {
  if (!coords) return { type: 'FeatureCollection', features: [] };
  const [lat, lng] = coords;
  const steps = 48;
  const latDelta = radiusKm / 110.574;
  const lngDelta = radiusKm / (111.32 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const ring: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const pointLat = lat + latDelta * Math.sin(angle);
    const pointLng = lng + lngDelta * Math.cos(angle);
    ring.push([pointLng, pointLat]);
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [ring],
        },
        properties: {},
      },
    ],
  };
}

function getFocusPadding() {
  if (typeof window === 'undefined') return { ...FOCUS_PADDING_BASE, bottom: 280 };
  return {
    ...FOCUS_PADDING_BASE,
    bottom: 280,
  };
}

function buildPopup(
  driver: Driver,
  lang: AppLang,
  onStartOrder: (driver: Driver, method: 'call' | 'message') => void,
  isFavorite: boolean,
  onToggleFavorite?: (driver: Driver) => void,
  onViewRatings?: (driverId: string, driverName?: string) => void,
  onViewReports?: (driverId: string, driverName?: string) => void
) {
  const subType = driver.service?.subType || 'other';
  const color = '#dc2626';
  const label = SERVICE_LABELS[subType]?.[lang] || SERVICE_LABELS.other[lang] || SERVICE_LABELS.other.en;
  const uiText = MAP_UI_TEXT[lang] || MAP_UI_TEXT.en;

  const wrap = document.createElement('div');
  wrap.className = 'p-0 text-gray-900';
  wrap.style.minWidth = '360px';
  wrap.style.width = 'min(360px, calc(100vw - 48px))';
  wrap.style.maxWidth = '100%';
  wrap.style.boxSizing = 'border-box';
  wrap.style.transform = 'scale(0.94)';
  wrap.style.transformOrigin = 'top left';

  const distance = driver.distance ? `${(driver.distance / 1000).toFixed(1)} KM` : '';
  const ratingValue = Number(driver.rating || 0);
  const filledStars = Math.max(0, Math.min(5, Math.round(ratingValue)));
  const emptyStars = 5 - filledStars;
  wrap.innerHTML = `
    <div style="font-family:ui-sans-serif,system-ui;background:rgba(255,255,255,0.92);backdrop-filter:blur(10px) saturate(130%);-webkit-backdrop-filter:blur(10px) saturate(130%);box-shadow:0 10px 22px rgba(15,23,42,0.12);border-radius:16px;padding:10px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:7px;">
        <span style="font-size:10px;font-weight:900;color:white;padding:5px 8px;border-radius:10px;background:${color};text-transform:uppercase;">${label}</span>
        <button data-action="favorite" style="border:1px solid #fecaca;border-radius:999px;width:28px;height:28px;color:${isFavorite ? '#ffffff' : '#dc2626'};background:${isFavorite ? color : '#ffffff'};font-size:14px;font-weight:900;cursor:pointer;line-height:1;transition:all .18s ease;">♡</button>
      </div>
      <h4 style="font-size:13px;font-weight:900;margin:0 0 5px 0;line-height:1.2;text-transform:uppercase;">${driver.businessName || ''}</h4>
      ${distance ? `<div style="font-size:10px;font-weight:800;color:#64748b;margin-bottom:7px;display:flex;align-items:center;gap:6px;"><span>${distance}</span><span style="color:#dc2626;letter-spacing:1px;">${'★'.repeat(filledStars)}${'☆'.repeat(emptyStars)}</span></div>` : '<div style="margin-bottom:7px;"></div>'}
      <div style="display:flex;gap:7px;">
        <button data-action="call" style="flex:1;border:0;border-radius:10px;padding:8px 6px;color:white;background:${color};font-size:9px;font-weight:900;cursor:pointer;transition:transform .18s ease,filter .18s ease;">${uiText.call}</button>
        <button data-action="message" style="flex:1;border:0;border-radius:10px;padding:8px 6px;color:white;background:${color};font-size:9px;font-weight:900;cursor:pointer;transition:transform .18s ease,filter .18s ease;">${uiText.message}</button>
      </div>
      <button data-action="show" style="margin-top:7px;width:100%;border:0;border-radius:10px;padding:8px 6px;color:white;background:${color};font-size:9px;font-weight:900;cursor:pointer;transition:transform .18s ease,filter .18s ease;">${uiText.showGoogle}</button>
      <div style="display:flex;gap:7px;margin-top:7px;">
        <button data-action="ratings" style="flex:1;border:0;border-radius:10px;padding:8px 6px;color:white;background:${color};font-size:9px;font-weight:900;cursor:pointer;transition:transform .18s ease,filter .18s ease;">${uiText.viewRatings}</button>
        <button data-action="reports" style="flex:1;border:0;border-radius:10px;padding:8px 6px;color:white;background:${color};font-size:9px;font-weight:900;cursor:pointer;transition:transform .18s ease,filter .18s ease;">${uiText.viewReports}</button>
      </div>
    </div>
  `;

  const callBtn = wrap.querySelector('[data-action="call"]') as HTMLButtonElement | null;
  const messageBtn = wrap.querySelector('[data-action="message"]') as HTMLButtonElement | null;
  const showBtn = wrap.querySelector('[data-action="show"]') as HTMLButtonElement | null;
  const favoriteBtn = wrap.querySelector('[data-action="favorite"]') as HTMLButtonElement | null;
  const ratingsBtn = wrap.querySelector('[data-action="ratings"]') as HTMLButtonElement | null;
  const reportsBtn = wrap.querySelector('[data-action="reports"]') as HTMLButtonElement | null;
  callBtn?.addEventListener('click', () => {
    onStartOrder(driver, 'call');
    if (driver.phoneNumber) window.location.href = `tel:${driver.phoneNumber}`;
  });
  messageBtn?.addEventListener('click', () => {
    onStartOrder(driver, 'message');
    if (driver.phoneNumber) window.location.href = `sms:${driver.phoneNumber}`;
  });
  favoriteBtn?.addEventListener('click', () => onToggleFavorite?.(driver));
  ratingsBtn?.addEventListener('click', () => onViewRatings?.(driver._id, driver.businessName));
  reportsBtn?.addEventListener('click', () => onViewReports?.(driver._id, driver.businessName));
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
  searchApproximate = false,
  searchApproxRadiusKm = 8,
  focusCoords,
  focusRequestToken,
  focusRequestZoom,
  drivers,
  onStartOrder,
  activeDriverId,
  popupDriverId,
  onSelectDriver,
  isFavorite,
  onToggleFavorite,
  onViewRatings,
  onViewReports,
  onMapInteract,
  onMapMove,
  onMapClick,
}: MapProps) {
  const [lang, setLang] = useState<AppLang>('tr');
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(12);
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const lastFocusTokenRef = useRef<number | undefined>(undefined);
  const lastActiveFocusIdRef = useRef<string | null>(null);
  const aggregateCacheRef = useRef<{
    driversRef: Driver[] | null;
    byBucket: Record<string, Record<string, any>>;
  }>({ driversRef: null, byBucket: {} });

  const center = useMemo<[number, number]>(() => {
    if (!searchCoords) return INITIAL_CENTER;
    return [searchCoords[1], searchCoords[0]];
  }, [searchCoords]);

  const driverById = useMemo(() => {
    const m = new globalThis.Map<string, Driver>();
    for (const d of drivers) m.set(d._id, d);
    return m;
  }, [drivers]);

  const getAggregatedDrivers = useCallback((list: Driver[], zoom: number) => {
    const bucket = zoom < 6.2 ? 'z0' : zoom < 8.2 ? 'z1' : zoom < 10 ? 'z2' : 'z3';
    if (aggregateCacheRef.current.driversRef !== list) {
      aggregateCacheRef.current = { driversRef: list, byBucket: {} };
    }
    const hit = aggregateCacheRef.current.byBucket[bucket];
    if (hit) return hit;
    const grouped = createDriversGeoJsonByType(list, zoom);
    aggregateCacheRef.current.byBucket[bucket] = grouped;
    return grouped;
  }, []);

  useEffect(() => {
    setLang(getPreferredLang());
  }, []);

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
    setMapZoomLevel(searchCoords ? 12 : 5.8);
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      const grouped = getAggregatedDrivers(drivers, map.getZoom());
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
            'circle-radius': ['step', ['get', 'point_count'], 20 * MARKER_SCALE, 20, 25 * MARKER_SCALE, 60, 31 * MARKER_SCALE],
            'circle-stroke-width': 2 * MARKER_SCALE,
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
            'text-size': 12,
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
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 15 * MARKER_SCALE, 12, 18.75 * MARKER_SCALE, 16, 21.75 * MARKER_SCALE],
            'circle-opacity': 0.95,
            'circle-stroke-width': 2 * MARKER_SCALE,
            'circle-stroke-color': '#ffffff',
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
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 15 * MARKER_SCALE, 12, 18.75 * MARKER_SCALE, 16, 21.75 * MARKER_SCALE],
          'circle-stroke-width': 2.4 * MARKER_SCALE,
          'circle-stroke-color': ['coalesce', ['get', 'color'], '#111827'],
          'circle-opacity': 0.96,
        },
      });

      map.addSource('search-point', {
        type: 'geojson',
        data: createUserPointGeoJson(searchApproximate ? null : searchCoords) as any,
      });

      map.addLayer({
        id: 'search-point-dot',
        type: 'circle',
        source: 'search-point',
        paint: {
          'circle-color': '#2563eb',
          'circle-radius': 8 * MARKER_SCALE,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 4,
        },
      });

      map.addLayer({
        id: 'search-point-ring',
        type: 'circle',
        source: 'search-point',
        paint: {
          'circle-color': '#2563eb',
          'circle-radius': 18 * MARKER_SCALE,
          'circle-opacity': 0.22,
        },
      });

      map.addSource('search-range', {
        type: 'geojson',
        data: createApproximateRangeGeoJson(searchApproximate ? searchCoords : null, searchApproxRadiusKm) as any,
      });

      map.addLayer({
        id: 'search-range-fill',
        type: 'fill',
        source: 'search-range',
        paint: {
          'fill-color': '#2563eb',
          'fill-opacity': 0.16,
        },
      });

      map.addLayer({
        id: 'search-range-line',
        type: 'line',
        source: 'search-range',
        paint: {
          'line-color': '#2563eb',
          'line-width': 2,
          'line-opacity': 0.7,
        },
      });

      const clusterLayers = RENDER_SERVICE_TYPES.map((type) => `clusters-${type}`);
      const pointLayers = RENDER_SERVICE_TYPES.map((type) => `driver-points-${type}`);

      for (const type of RENDER_SERVICE_TYPES) {
        const clusterLayerId = `clusters-${type}`;
        const sourceId = `drivers-${type}`;
        map.on('click', clusterLayerId, async (e) => {
          onMapInteract?.();
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
          onMapInteract?.();
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
        onMapInteract?.();
        const features = map.queryRenderedFeatures(e.point, { layers: [...clusterLayers, ...pointLayers, 'active-driver-point'] });
        if (features.length === 0) onMapClick?.();
      });

      map.on('moveend', () => {
        const c = map.getCenter();
        const b = map.getBounds();
        setMapZoomLevel(map.getZoom());
        onMapMove?.(c.lat, c.lng, map.getZoom(), {
          minLat: b.getSouth(),
          minLng: b.getWest(),
          maxLat: b.getNorth(),
          maxLng: b.getEast(),
        });
      });
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const grouped = getAggregatedDrivers(drivers, mapZoomLevel);
    for (const type of RENDER_SERVICE_TYPES) {
      const source = map.getSource(`drivers-${type}`) as maplibregl.GeoJSONSource | undefined;
      if (source) source.setData(grouped[type] as any);
    }
    const activeSource = map.getSource('active-driver') as maplibregl.GeoJSONSource | undefined;
    if (activeSource) {
      activeSource.setData(createActiveDriverGeoJson(activeDriverId ? driverById.get(activeDriverId) : undefined) as any);
    }
  }, [activeDriverId, driverById, drivers, getAggregatedDrivers, mapZoomLevel]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('search-point')) return;
    const pointSource = map.getSource('search-point') as maplibregl.GeoJSONSource;
    pointSource.setData(createUserPointGeoJson(searchApproximate ? null : searchCoords) as any);
    const rangeSource = map.getSource('search-range') as maplibregl.GeoJSONSource | undefined;
    if (rangeSource) {
      rangeSource.setData(createApproximateRangeGeoJson(searchApproximate ? searchCoords : null, searchApproxRadiusKm) as any);
    }
  }, [searchApproxRadiusKm, searchApproximate, searchCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const hasNewFocusRequest = typeof focusRequestToken === 'number' && focusRequestToken !== lastFocusTokenRef.current;
    if (hasNewFocusRequest) {
      lastFocusTokenRef.current = focusRequestToken;
      const selected = activeDriverId ? driverById.get(activeDriverId) : undefined;
      const selectedCoords = selected?.location?.coordinates;
      if (selectedCoords) {
        lastActiveFocusIdRef.current = activeDriverId;
        map.stop();
        map.easeTo({
          center: [selectedCoords[0], selectedCoords[1]],
          zoom: focusRequestZoom ?? 12.8,
          duration: 900,
          padding: getFocusPadding(),
        });
        return;
      }
      const targetCoords = focusCoords || searchCoords;
      if (targetCoords) {
        lastActiveFocusIdRef.current = null;
        map.stop();
        map.easeTo({
          center: [targetCoords[1], targetCoords[0]],
          zoom: focusRequestZoom ?? 13.2,
          duration: 900,
          padding: getFocusPadding(),
        });
      }
      return;
    }

    if (activeDriverId && activeDriverId !== lastActiveFocusIdRef.current) {
      const d = driverById.get(activeDriverId);
      const coords = d?.location?.coordinates;
      if (coords) {
        lastActiveFocusIdRef.current = activeDriverId;
        map.stop();
        map.easeTo({
          center: [coords[0], coords[1]],
          zoom: 12.8,
          duration: 900,
          padding: getFocusPadding(),
        });
      }
    } else if (!activeDriverId) {
      lastActiveFocusIdRef.current = null;
    }
  }, [activeDriverId, driverById, focusCoords, focusRequestToken, focusRequestZoom, searchCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    popupRef.current?.remove();
    if (!popupDriverId) return;

    const driver = driverById.get(popupDriverId);
    if (!driver?.location?.coordinates) return;

    const popupNode = buildPopup(
      driver,
      lang,
      onStartOrder,
      !!isFavorite?.(driver._id),
      onToggleFavorite,
      onViewRatings,
      onViewReports
    );
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnMove: false,
      anchor: 'bottom',
      offset: 18,
      className: 'transport-popup-clean',
      maxWidth: 'min(420px, calc(100vw - 24px))'
    })
      .setLngLat([driver.location.coordinates[0], driver.location.coordinates[1]])
      .setDOMContent(popupNode)
      .addTo(map);

    popupRef.current = popup;
  }, [driverById, isFavorite, lang, onStartOrder, onToggleFavorite, onViewRatings, onViewReports, popupDriverId]);

  return <div ref={mapNodeRef} className="absolute inset-0 h-full w-full bg-[#f0f4f8]" />;
}

export default memo(MapView);
