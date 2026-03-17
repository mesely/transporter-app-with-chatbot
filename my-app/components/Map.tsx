'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AppLang, getPreferredLang, LANG_CHANGED_EVENT, LANG_STORAGE_KEY } from '../utils/language';
import { openSystemMap } from '../lib/openSystemMap';
import { extractProviderServiceTypes, getProviderPrimaryServiceType, normalizeProviderServiceType } from '../utils/providerServices';

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
  vehicleItems?: Array<{ name: string; photoUrls: string[] }>;
  vehicleInfo?: string;
  vehiclePhotos?: string[];
  photoUrl?: string;
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
  onViewVehicles?: (driver: Driver) => void;
  onViewPhotos?: (driver: Driver) => void;
  onMapInteract?: () => void;
  onMapMove?: (lat: number, lng: number, zoom: number, bbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number }) => void;
  onMapClick?: () => void;
}

const SERVICE_COLORS: Record<string, string> = {
  oto_kurtarma: '#dc2626',
  vinc: '#b91c1c',
  lastik: '#881337',
  lastikci: '#881337',
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
  lastikci: '○',
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
  oto_kurtarma: { tr: 'Çekici', en: 'Tow', de: 'Abschlepp', fr: 'Remorque', it: 'Traino', es: 'Grua', pt: 'Reboque', ru: 'Ewakuator', zh: '拖车', ja: 'レッカー', ko: '견인', ar: 'سحب' },
  vinc: { tr: 'Vinc', en: 'Crane', de: 'Kran', fr: 'Grue', it: 'Gru', es: 'Grua', pt: 'Guindaste', ru: 'Kran', zh: '吊车', ja: 'クレーン', ko: '크레인', ar: 'رافعة' },
  lastik: { tr: 'Lastikçi', en: 'Tire', de: 'Reifen', fr: 'Pneu', it: 'Gomme', es: 'Llantas', pt: 'Pneu', ru: 'Shiny', zh: '轮胎', ja: 'タイヤ', ko: '타이어', ar: 'إطارات' },
  lastikci: { tr: 'Lastikçi', en: 'Tire', de: 'Reifen', fr: 'Pneu', it: 'Gomme', es: 'Llantas', pt: 'Pneu', ru: 'Shiny', zh: '轮胎', ja: 'タイヤ', ko: '타이어', ar: 'إطارات' },
  kurtarici: { tr: 'Kurtarici', en: 'Tow', de: 'Bergung', fr: 'Remorquage', it: 'Recupero', es: 'Rescate', pt: 'Resgate', ru: 'Evakuaciya', zh: '救援', ja: '救援', ko: '구난', ar: 'إنقاذ' },
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

const MAP_UI_TEXT: Record<AppLang, { call: string; message: string; showMap: string; favoriteAdd: string; favoriteRemove: string; viewRatings: string; viewReports: string; viewVehicles: string; viewPhotos: string; scoreLabel: string }> = {
  tr: { call: 'ARA', message: 'MESAJ', showMap: "MAPS", favoriteAdd: 'FAVORI', favoriteRemove: 'CIKAR', viewRatings: 'YORUMLAR', viewReports: 'SIKAYETLER', viewVehicles: 'ARACLAR', viewPhotos: 'FOTOGRAFLAR', scoreLabel: 'Firma' },
  en: { call: 'CALL', message: 'TEXT', showMap: 'MAPS', favoriteAdd: 'SAVE', favoriteRemove: 'REMOVE', viewRatings: 'REVIEWS', viewReports: 'REPORTS', viewVehicles: 'VEHICLES', viewPhotos: 'PHOTOS', scoreLabel: 'Score' },
  de: { call: 'ANRUF', message: 'NACHRICHT', showMap: 'MAPS', favoriteAdd: 'FAVORIT', favoriteRemove: 'ENTFERNEN', viewRatings: 'BEWERTUNG', viewReports: 'BESCHWERDE', viewVehicles: 'FAHRZEUGE', viewPhotos: 'FOTOS', scoreLabel: 'Bewertung' },
  fr: { call: 'APPELER', message: 'MESSAGE', showMap: 'MAPS', favoriteAdd: 'FAVORI', favoriteRemove: 'SUPPRIMER', viewRatings: 'AVIS', viewReports: 'PLAINTES', viewVehicles: 'VEHICULES', viewPhotos: 'PHOTOS', scoreLabel: 'Note' },
  it: { call: 'CHIAMA', message: 'MESSAGGIO', showMap: 'MAPS', favoriteAdd: 'PREFERITI', favoriteRemove: 'RIMUOVI', viewRatings: 'RECENSIONI', viewReports: 'RECLAMI', viewVehicles: 'VEICOLI', viewPhotos: 'FOTO', scoreLabel: 'Punteggio' },
  es: { call: 'LLAMAR', message: 'MENSAJE', showMap: 'MAPS', favoriteAdd: 'FAVORITO', favoriteRemove: 'QUITAR', viewRatings: 'RESENAS', viewReports: 'QUEJAS', viewVehicles: 'VEHICULOS', viewPhotos: 'FOTOS', scoreLabel: 'Puntaje' },
  pt: { call: 'LIGAR', message: 'MENSAGEM', showMap: 'MAPS', favoriteAdd: 'FAVORITO', favoriteRemove: 'REMOVER', viewRatings: 'AVALIACOES', viewReports: 'RECLAMACOES', viewVehicles: 'VEICULOS', viewPhotos: 'FOTOS', scoreLabel: 'Pontuacao' },
  ru: { call: 'POZVONIT', message: 'SOOBSHCHENIE', showMap: 'MAPS', favoriteAdd: 'IZBRANNOE', favoriteRemove: 'UBRAT', viewRatings: 'OTZYVY', viewReports: 'ZHALOBY', viewVehicles: 'TRANSPORT', viewPhotos: 'FOTO', scoreLabel: 'Ocenka' },
  zh: { call: '拨打', message: '消息', showMap: 'MAPS', favoriteAdd: '收藏', favoriteRemove: '取消', viewRatings: '评价', viewReports: '投诉', viewVehicles: '车辆', viewPhotos: '照片', scoreLabel: '评分' },
  ja: { call: '電話', message: 'メッセージ', showMap: 'MAPS', favoriteAdd: 'お気に入り', favoriteRemove: '解除', viewRatings: '評価', viewReports: '苦情', viewVehicles: '車両', viewPhotos: '写真', scoreLabel: '評価' },
  ko: { call: '전화', message: '메시지', showMap: 'MAPS', favoriteAdd: '즐겨찾기', favoriteRemove: '해제', viewRatings: '리뷰', viewReports: '신고', viewVehicles: '차량', viewPhotos: '사진', scoreLabel: '평점' },
  ar: { call: 'اتصال', message: 'رسالة', showMap: 'MAPS', favoriteAdd: 'مفضلة', favoriteRemove: 'إزالة', viewRatings: 'تقييمات', viewReports: 'شكاوى', viewVehicles: 'المركبات', viewPhotos: 'الصور', scoreLabel: 'التقييم' },
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

const HIDDEN_CATEGORIES = new Set<string>();
const INITIAL_CENTER: [number, number] = [35.2433, 38.9637];

function getServiceColor(subType: string) {
  const normalized = normalizeProviderServiceType(subType);
  const key = normalized === 'lastikci' ? 'lastikci' : normalized;
  return SERVICE_COLORS[key] || SERVICE_COLORS.other;
}

function normalizeServiceType(subType: string | undefined) {
  if (!subType) return 'other';
  const normalized = normalizeProviderServiceType(subType);
  if (normalized === 'lastikci') return 'lastikci';
  return SERVICE_COLORS[normalized] ? normalized : 'other';
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
    const renderTypes = extractProviderServiceTypes(d.service, (d as any)?.serviceType)
      .map((type) => normalizeServiceType(type))
      .filter((type, index, all) => Boolean(type) && type !== 'other' && all.indexOf(type) === index);
    const serviceTypes = renderTypes.length > 0 ? renderTypes : [normalizeServiceType(getProviderPrimaryServiceType(d.service, (d as any)?.serviceType))];

    for (const subType of serviceTypes) {
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

function getPopupScaleForZoom(zoom: number) {
  if (zoom <= 3.2) return 0.68 * 0.7;
  if (zoom <= 4.2) return 0.74 * 0.7;
  if (zoom <= 5.2) return 0.8 * 0.7;
  if (zoom <= 6.2) return 0.86 * 0.7;
  if (zoom <= 7.2) return 0.92 * 0.7;
  return 0.7;
}

function applyPopupScale(node: HTMLElement | null, zoom: number) {
  if (!node) return;
  const scale = getPopupScaleForZoom(zoom);
  node.style.transform = `scale(${scale})`;
  node.style.transformOrigin = 'bottom center';
}

function buildPopup(
  driver: Driver,
  lang: AppLang,
  onStartOrder: (driver: Driver, method: 'call' | 'message') => void,
  isFavorite: boolean,
  onToggleFavorite?: (driver: Driver) => void,
  onViewRatings?: (driverId: string, driverName?: string) => void,
  onViewReports?: (driverId: string, driverName?: string) => void,
  onViewVehicles?: (driver: Driver) => void,
  onViewPhotos?: (driver: Driver) => void
) {
  const subType = driver.service?.subType || 'other';
  const color = getServiceColor(normalizeServiceType(subType));
  const label = SERVICE_LABELS[subType]?.[lang] || SERVICE_LABELS.other[lang] || SERVICE_LABELS.other.en;
  const uiText = MAP_UI_TEXT[lang] || MAP_UI_TEXT.en;

  const wrap = document.createElement('div');
  wrap.className = 'p-0 text-gray-900';
  wrap.style.minWidth = '380px';
  wrap.style.width = 'min(380px, calc(100vw - 40px))';
  wrap.style.maxWidth = '100%';
  wrap.style.boxSizing = 'border-box';

  const distance = driver.distance ? `${(driver.distance / 1000).toFixed(1)} KM` : '';
  const ratingValue = Number(driver.rating || 0);
  const filledStars = Math.max(0, Math.min(5, Math.round(ratingValue)));
  const emptyStars = 5 - filledStars;
  const vehicleItems: Array<{ name: string; photoUrls: string[] }> =
    Array.isArray(driver.vehicleItems) && driver.vehicleItems.length > 0
      ? driver.vehicleItems
      : (driver.vehicleInfo
          ? [{ name: driver.vehicleInfo, photoUrls: driver.vehiclePhotos || (driver.photoUrl ? [driver.photoUrl] : []) }]
          : []);
  const vehicleCount = vehicleItems.length;
  const photoCount = Array.from(new Set([
    ...(Array.isArray(driver.vehiclePhotos) ? driver.vehiclePhotos : []),
    ...(driver.photoUrl ? [driver.photoUrl] : []),
    ...vehicleItems.flatMap((v) => (Array.isArray(v.photoUrls) ? v.photoUrls : [])),
  ].filter(Boolean))).length;
  wrap.innerHTML = `
    <div style="font-family:ui-sans-serif,system-ui;background:rgba(255,255,255,0.92);backdrop-filter:blur(10px) saturate(130%);-webkit-backdrop-filter:blur(10px) saturate(130%);box-shadow:0 10px 22px rgba(15,23,42,0.12);border-radius:16px;padding:10px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:7px;">
        <span style="font-size:10px;font-weight:900;color:white;padding:5px 8px;border-radius:10px;background:${color};text-transform:uppercase;">${label}</span>
        <button data-action="favorite" style="border:1px solid #fecaca;border-radius:999px;width:28px;height:28px;color:${isFavorite ? '#ffffff' : '#dc2626'};background:${isFavorite ? color : '#ffffff'};font-size:14px;font-weight:900;cursor:pointer;line-height:1;transition:all .18s ease;">♡</button>
      </div>
      <h4 style="font-size:15px;font-weight:900;margin:0 0 6px 0;line-height:1.25;text-transform:uppercase;">${driver.businessName || ''}</h4>
      <div style="font-size:11px;font-weight:800;color:#475569;margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        ${distance ? `<span>${distance}</span>` : ''}
        <span style="padding:3px 8px;border-radius:999px;background:#f8fafc;border:1px solid #e2e8f0;">${uiText.scoreLabel}: ${ratingValue.toFixed(1)}/5</span>
        <span style="color:#dc2626;letter-spacing:1px;">${'★'.repeat(filledStars)}${'☆'.repeat(emptyStars)}</span>
      </div>
      <div style="display:flex;gap:7px;">
        <button data-action="call" style="flex:1;border:0;border-radius:10px;padding:10px 8px;color:white;background:${color};font-size:11px;font-weight:900;cursor:pointer;transition:transform .18s ease,filter .18s ease;">${uiText.call}</button>
        <button data-action="message" style="flex:1;border:0;border-radius:10px;padding:10px 8px;color:white;background:${color};font-size:11px;font-weight:900;cursor:pointer;transition:transform .18s ease,filter .18s ease;">${uiText.message}</button>
      </div>
      <button data-action="show" style="margin-top:7px;width:100%;border:0;border-radius:10px;padding:10px 8px;color:white;background:${color};font-size:11px;font-weight:900;cursor:pointer;transition:transform .18s ease,filter .18s ease;">${uiText.showMap}</button>
      <div style="display:flex;gap:7px;margin-top:7px;">
        <button data-action="ratings" style="flex:1;border:0;border-radius:10px;padding:10px 8px;color:white;background:${color};font-size:11px;font-weight:900;cursor:pointer;transition:transform .18s ease,filter .18s ease;">${uiText.viewRatings}</button>
        <button data-action="reports" style="flex:1;border:0;border-radius:10px;padding:10px 8px;color:white;background:${color};font-size:11px;font-weight:900;cursor:pointer;transition:transform .18s ease,filter .18s ease;">${uiText.viewReports}</button>
      </div>
      ${(vehicleCount > 0 || photoCount > 0) ? `
      <div style="display:flex;gap:7px;margin-top:7px;">
        ${vehicleCount > 0 ? `<button data-action="vehicles" style="flex:1;border:0;border-radius:10px;padding:10px 8px;color:white;background:${color};font-size:11px;font-weight:900;cursor:pointer;transition:transform .18s ease,filter .18s ease;">${uiText.viewVehicles} (${vehicleCount})</button>` : ''}
        ${photoCount > 0 ? `<button data-action="photos" style="flex:1;border:0;border-radius:10px;padding:10px 8px;color:white;background:${color};font-size:11px;font-weight:900;cursor:pointer;transition:transform .18s ease,filter .18s ease;">${uiText.viewPhotos} (${photoCount})</button>` : ''}
      </div>` : ''}
    </div>
  `;

  const callBtn = wrap.querySelector('[data-action="call"]') as HTMLButtonElement | null;
  const messageBtn = wrap.querySelector('[data-action="message"]') as HTMLButtonElement | null;
  const showBtn = wrap.querySelector('[data-action="show"]') as HTMLButtonElement | null;
  const favoriteBtn = wrap.querySelector('[data-action="favorite"]') as HTMLButtonElement | null;
  const ratingsBtn = wrap.querySelector('[data-action="ratings"]') as HTMLButtonElement | null;
  const reportsBtn = wrap.querySelector('[data-action="reports"]') as HTMLButtonElement | null;
  const vehiclesBtn = wrap.querySelector('[data-action="vehicles"]') as HTMLButtonElement | null;
  const photosBtn = wrap.querySelector('[data-action="photos"]') as HTMLButtonElement | null;
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
  vehiclesBtn?.addEventListener('click', () => onViewVehicles?.(driver));
  photosBtn?.addEventListener('click', () => onViewPhotos?.(driver));
  showBtn?.addEventListener('click', () => {
    const lat = driver.location?.coordinates?.[1];
    const lng = driver.location?.coordinates?.[0];
    if (typeof lat === 'number' && typeof lng === 'number') {
      openSystemMap(lat, lng, driver.businessName || 'Destination');
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
  onViewVehicles,
  onViewPhotos,
  onMapInteract,
  onMapMove,
  onMapClick,
}: MapProps) {
  const [lang, setLang] = useState<AppLang>('tr');
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(12);
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const popupContentRef = useRef<HTMLElement | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
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
    const syncLang = () => setLang(getPreferredLang());
    syncLang();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === LANG_STORAGE_KEY) syncLang();
    };
    const onLangChanged = () => syncLang();
    window.addEventListener('storage', onStorage);
    window.addEventListener(LANG_CHANGED_EVENT, onLangChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LANG_CHANGED_EVENT, onLangChanged);
    };
  }, []);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapNodeRef.current,
      style: BASE_STYLE as any,
      center,
      zoom: searchCoords ? 12 : 5.8,
      minZoom: 2,
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

      map.addSource('search-point', {
        type: 'geojson',
        data: createUserPointGeoJson(searchCoords || null) as any,
      });

      map.addLayer({
        id: 'search-point-dot',
        type: 'circle',
        source: 'search-point',
        paint: {
          'circle-color': '#2563eb',
          'circle-radius': 10,
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
          'circle-radius': 24,
          'circle-opacity': 0.2,
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

      const markerEl = document.createElement('div');
      markerEl.style.width = '18px';
      markerEl.style.height = '18px';
      markerEl.style.borderRadius = '999px';
      markerEl.style.background = '#2563eb';
      markerEl.style.border = '3px solid #ffffff';
      markerEl.style.boxShadow = '0 0 0 6px rgba(37, 99, 235, 0.25), 0 6px 12px rgba(15, 23, 42, 0.35)';
      markerEl.style.pointerEvents = 'none';

      const marker = new maplibregl.Marker({
        element: markerEl,
        anchor: 'center',
      });
      if (searchCoords) {
        marker.setLngLat([searchCoords[1], searchCoords[0]]).addTo(map);
      }
      marker.getElement().style.zIndex = '120';
      userMarkerRef.current = marker;

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

      map.on('zoom', () => {
        applyPopupScale(popupContentRef.current, map.getZoom());
      });
    });

    return () => {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      popupRef.current?.remove();
      popupContentRef.current = null;
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
    pointSource.setData(createUserPointGeoJson(searchCoords || null) as any);
    const rangeSource = map.getSource('search-range') as maplibregl.GeoJSONSource | undefined;
    if (rangeSource) {
      rangeSource.setData(createApproximateRangeGeoJson(searchApproximate ? searchCoords : null, searchApproxRadiusKm) as any);
    }
  }, [searchApproxRadiusKm, searchApproximate, searchCoords]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = userMarkerRef.current;
    if (!map || !marker) return;
    if (!searchCoords) {
      marker.remove();
      return;
    }
    marker.setLngLat([searchCoords[1], searchCoords[0]]);
    if (!marker.getElement().isConnected) {
      marker.addTo(map);
    }
  }, [searchCoords]);

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
    popupContentRef.current = null;
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
      onViewReports,
      onViewVehicles,
      onViewPhotos
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

    popupContentRef.current = popupNode;
    applyPopupScale(popupContentRef.current, map.getZoom());
    popupRef.current = popup;
  }, [driverById, isFavorite, lang, onStartOrder, onToggleFavorite, onViewRatings, onViewReports, onViewVehicles, onViewPhotos, popupDriverId]);

  return <div ref={mapNodeRef} className="absolute inset-0 h-full w-full bg-[#f0f4f8]" />;
}

export default memo(MapView);
