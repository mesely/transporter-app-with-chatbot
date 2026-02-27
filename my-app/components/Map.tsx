'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
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
  focusCoords?: [number, number] | null;
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
const FOCUS_PADDING_BASE = { top: 72, right: 36, left: 36 };

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

function createEmptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] as any[] };
}

function createDriversGeoJsonByType(drivers: Driver[], zoomLevel = 12) {
  const grouped: Record<string, any> = {};
  for (const type of RENDER_SERVICE_TYPES) {
    grouped[type] = createEmptyFeatureCollection();
  }

  const lowZoomAggregation = zoomLevel < 8.5;
  const cellSize = zoomLevel < 6.5 ? 0.18 : 0.08;
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

function getFocusPadding() {
  if (typeof window === 'undefined') return { ...FOCUS_PADDING_BASE, bottom: 520 };
  const vh = window.innerHeight || 900;
  return {
    ...FOCUS_PADDING_BASE,
    bottom: Math.max(460, Math.round(vh * 0.5)),
  };
}

function buildPopup(driver: Driver, lang: AppLang, onStartOrder: (driver: Driver, method: 'call' | 'message') => void) {
  const subType = driver.service?.subType || 'other';
  const color = getServiceColor(subType);
  const label = SERVICE_LABELS[subType]?.[lang] || SERVICE_LABELS.other[lang] || SERVICE_LABELS.other.en;
  const uiText = MAP_UI_TEXT[lang] || MAP_UI_TEXT.en;

  const wrap = document.createElement('div');
  wrap.className = 'p-2 text-gray-900';
  wrap.style.minWidth = '380px';
  wrap.style.width = 'min(380px, calc(100vw - 48px))';
  wrap.style.maxWidth = '100%';
  wrap.style.boxSizing = 'border-box';
  wrap.style.transform = 'scale(0.975)';
  wrap.style.transformOrigin = 'top left';

  const distance = driver.distance ? `${(driver.distance / 1000).toFixed(1)} KM` : '';
  const ratingValue = Number(driver.rating || 5);
  const rating = ratingValue.toFixed(1);
  const filledStars = Math.max(0, Math.min(5, Math.round(ratingValue)));
  const emptyStars = 5 - filledStars;
  const phone = driver.phoneNumber || '';

  wrap.innerHTML = `
    <div style="font-family: ui-sans-serif, system-ui;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:8px;">
        <span style="font-size:10px;font-weight:900;color:white;padding:5px 8px;border-radius:10px;background:${color};text-transform:uppercase;">${label}</span>
        ${distance ? `<span style="font-size:10px;font-weight:800;color:#9ca3af;">${distance}</span>` : ''}
      </div>
      <h4 style="font-size:13px;font-weight:900;margin:0 0 6px 0;line-height:1.2;text-transform:uppercase;">${driver.businessName || ''}</h4>
      <div style="font-size:11px;font-weight:800;color:#6b7280;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
        <span style="color:#dc2626;letter-spacing:1px;">${'★'.repeat(filledStars)}${'☆'.repeat(emptyStars)}</span>
        <span>${rating}</span>
      </div>
      <div style="display:flex;gap:8px;">
        <button data-action="call" style="flex:1;border:0;border-radius:13px;padding:10px 8px;color:white;background:${color};font-size:10px;font-weight:900;cursor:pointer;">${uiText.call}</button>
        <button data-action="message" style="flex:1;border:0;border-radius:13px;padding:10px 8px;color:white;background:${color};font-size:10px;font-weight:900;cursor:pointer;">${uiText.message}</button>
      </div>
      <button data-action="show" style="margin-top:8px;width:100%;border:0;border-radius:11px;padding:10px 8px;color:white;background:${color};font-size:10px;font-weight:900;cursor:pointer;">${uiText.show}</button>
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
  focusCoords,
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
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(12);
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const lastFocusTokenRef = useRef<number | undefined>(undefined);
  const lastActiveFocusIdRef = useRef<string | null>(null);

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
      const grouped = createDriversGeoJsonByType(drivers, map.getZoom());
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
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 15, 12, 18.75, 16, 21.75],
            'circle-opacity': 0.95,
            'circle-stroke-width': 2.5,
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
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 15, 12, 18.75, 16, 21.75],
          'circle-stroke-width': 3,
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
          'circle-radius': 9,
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
          'circle-radius': 20,
          'circle-opacity': 0.22,
        },
      });

      const clusterLayers = RENDER_SERVICE_TYPES.map((type) => `clusters-${type}`);
      const pointLayers = RENDER_SERVICE_TYPES.map((type) => `driver-points-${type}`);

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
    const grouped = createDriversGeoJsonByType(drivers, mapZoomLevel);
    for (const type of RENDER_SERVICE_TYPES) {
      const source = map.getSource(`drivers-${type}`) as maplibregl.GeoJSONSource | undefined;
      if (source) source.setData(grouped[type] as any);
    }
    const activeSource = map.getSource('active-driver') as maplibregl.GeoJSONSource | undefined;
    if (activeSource) {
      activeSource.setData(createActiveDriverGeoJson(activeDriverId ? driverById.get(activeDriverId) : undefined) as any);
    }
  }, [drivers, activeDriverId, driverById, mapZoomLevel]);

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
    if (!activeDriverId) return;

    const driver = driverById.get(activeDriverId);
    if (!driver?.location?.coordinates) return;

    const popupNode = buildPopup(driver, lang, onStartOrder);
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnMove: false,
      anchor: 'bottom',
      offset: 18,
      maxWidth: 'min(420px, calc(100vw - 24px))'
    })
      .setLngLat([driver.location.coordinates[0], driver.location.coordinates[1]])
      .setDOMContent(popupNode)
      .addTo(map);

    popupRef.current = popup;
  }, [activeDriverId, driverById, lang, onStartOrder]);

  return <div ref={mapNodeRef} className="absolute inset-0 h-full w-full bg-[#f0f4f8]" />;
}

export default memo(MapView);
