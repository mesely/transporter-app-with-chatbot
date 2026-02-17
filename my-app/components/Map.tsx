/**
 * @file Map.tsx
 * FIX v4: renderToStaticMarkup her render'da çağrılmıyordu → icon cache sistemi eklendi.
 * FIX: flyTo animasyonları kaldırıldı → setView kullanıldı (iOS crash engellendi).
 * FIX: preferCanvas={true} korundu.
 */

'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Driver {
  _id: string;
  businessName: string;
  distance?: number;
  phoneNumber?: string;
  rating?: number;
  website?: string;
  location: { coordinates: [number, number] };
  service?: { mainType: string; subType: string; tags: string[] };
  isCluster?: boolean;
  count?: number;
  expansionZoom?: number;
  clusterServiceType?: string;
}

interface MapProps {
  searchCoords: [number, number] | null;
  drivers: Driver[];
  onStartOrder: (driver: Driver, method: 'call' | 'message') => void;
  activeDriverId: string | null;
  onSelectDriver: (id: string | null) => void;
  onMapMove?: (lat: number, lng: number, zoom: number) => void;
  onMapClick?: () => void;
}

// --- Renk haritası (SVG yerine saf HTML/CSS ikonlar) ---
const SERVICE_COLORS: Record<string, string> = {
  oto_kurtarma: '#dc2626',
  vinc:         '#b91c1c',
  nakliye:      '#9333ea',
  evden_eve:    '#a855f7',
  tir:          '#7e22ce',
  kamyon:       '#6b21a8',
  kamyonet:     '#581c87',
  yurt_disi_nakliye: '#4338ca',
  istasyon:     '#2563eb',
  seyyar_sarj:  '#0ea5e9',
  other:        '#6b7280',
};

const SERVICE_LABELS: Record<string, string> = {
  oto_kurtarma: 'Oto Kurtarma',
  vinc:         'Vinç',
  nakliye:      'Nakliye',
  evden_eve:    'Evden Eve',
  tir:          'TIR',
  kamyon:       'Kamyon',
  kamyonet:     'Kamyonet',
  yurt_disi_nakliye: 'Uluslararası',
  istasyon:     'İstasyon',
  seyyar_sarj:  'Mobil Şarj',
  other:        'Hizmet',
};

// --- 🔥 KRİTİK: İkon cache — her tip+durum için sadece BİR KEZ üretilir ---
const iconCache = new Map<string, L.DivIcon>();

function getMarkerIcon(subType: string, isActive: boolean): L.DivIcon {
  const cacheKey = `${subType}-${isActive}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)!;

  const color = isActive ? '#16a34a' : (SERVICE_COLORS[subType] || SERVICE_COLORS.other);
  const size = isActive ? 44 : 36;

  // SVG/renderToStaticMarkup YOK — saf HTML string
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });

  iconCache.set(cacheKey, icon);
  return icon;
}

function getClusterIcon(count: number, type: string): L.DivIcon {
  const cacheKey = `cluster-${type}-${count}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)!;

  const color = SERVICE_COLORS[type] || SERVICE_COLORS.other;
  const size = 40;

  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.2);
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:900;font-size:13px;font-family:sans-serif;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  iconCache.set(cacheKey, icon);
  return icon;
}

const userLocIcon = L.divIcon({
  className: '',
  html: `<div style="
    background:#2563eb;width:16px;height:16px;
    border-radius:50%;border:3px solid white;
    box-shadow:0 0 10px rgba(37,99,235,0.5);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// --- Harita olayları ---
function MapEvents({ onZoomChange, onMapMove, onMapClick }: {
  onZoomChange: (z: number) => void;
  onMapMove?: (lat: number, lng: number, zoom: number) => void;
  onMapClick?: () => void;
}) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
    moveend: () => onMapMove?.(map.getCenter().lat, map.getCenter().lng, map.getZoom()),
    click: (e) => {
      if ((e.originalEvent.target as HTMLElement).classList.contains('leaflet-container')) {
        onMapClick?.();
      }
    },
  });
  return null;
}

// --- 🔥 KRİTİK: flyTo → setView (animasyon YOK, bellek spike YOK) ---
function MapController({
  coords,
  activeDriverCoords,
}: {
  coords: [number, number] | null;
  activeDriverCoords: [number, number] | null;
}) {
  const map = useMap();
  const prevActive = useRef<string | null>(null);
  const prevCoords = useRef<string | null>(null);

  useEffect(() => {
    if (!activeDriverCoords) return;
    const key = activeDriverCoords.join(',');
    if (prevActive.current === key) return;
    prevActive.current = key;
    // animate:false → GPU spike yok
    map.setView(activeDriverCoords, 15, { animate: false });
  }, [activeDriverCoords, map]);

  useEffect(() => {
    if (!coords || activeDriverCoords) return;
    const key = coords.join(',');
    if (prevCoords.current === key) return;
    prevCoords.current = key;
    map.setView(coords, 12, { animate: false });
  }, [coords, activeDriverCoords, map]);

  return null;
}

// --- Ana bileşen ---
const MapComponent = ({
  searchCoords,
  drivers,
  onStartOrder,
  activeDriverId,
  onSelectDriver,
  onMapMove,
  onMapClick,
}: MapProps) => {
  const [currentZoom, setCurrentZoom] = useState(searchCoords ? 12 : 7);
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const initialCenter = useMemo<[number, number]>(
    () => searchCoords ?? [39.9334, 32.8597],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const activeDriverCoords = useMemo<[number, number] | null>(() => {
    const d = drivers.find((d) => d._id === activeDriverId);
    return d ? [d.location.coordinates[1], d.location.coordinates[0]] : null;
  }, [activeDriverId, drivers]);

  const hiddenCategories = useMemo(
    () => new Set(['seyyar_sarj', 'minibus', 'otobus', 'midibus', 'vip_tasima', 'yolcu_tasima']),
    []
  );

  // --- Kümeleme ---
  const visibleMarkers = useMemo(() => {
    const mapDrivers = drivers.filter((d) => !hiddenCategories.has(d.service?.subType ?? ''));
    if (!mapDrivers.length) return [];
    if (currentZoom >= 12) return mapDrivers.map((d) => ({ ...d, isCluster: false }));

    const result: Driver[] = [];
    const processed = new Set<string>();
    const threshold = 100 / Math.pow(2, currentZoom);

    for (const d of mapDrivers) {
      if (processed.has(d._id) || d._id === activeDriverId) continue;

      const currentSubType = d.service?.subType;
      const group = mapDrivers.filter((o) => {
        if (processed.has(o._id) || o._id === activeDriverId) return false;
        if (o.service?.subType !== currentSubType) return false;
        return (
          Math.abs(d.location.coordinates[1] - o.location.coordinates[1]) < threshold &&
          Math.abs(d.location.coordinates[0] - o.location.coordinates[0]) < threshold
        );
      });

      if (group.length > 1) {
        group.forEach((c) => processed.add(c._id));
        result.push({
          _id: `cluster-${d._id}`,
          businessName: 'Küme',
          location: d.location,
          isCluster: true,
          count: group.length,
          clusterServiceType: currentSubType ?? 'other',
          expansionZoom: currentZoom + 3,
        } as Driver);
      } else {
        result.push({ ...d, isCluster: false });
        processed.add(d._id);
      }
    }

    if (activeDriverId) {
      const active = mapDrivers.find((d) => d._id === activeDriverId);
      if (active) result.push({ ...active, isCluster: false });
    }

    return result;
  }, [drivers, currentZoom, activeDriverId, hiddenCategories]);

  // Aktif marker popup'ını aç
  useEffect(() => {
    if (!activeDriverId) return;
    const marker = markerRefs.current[activeDriverId];
    if (marker) {
      const t = setTimeout(() => marker.openPopup(), 150);
      return () => clearTimeout(t);
    }
  }, [activeDriverId]);

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <MapContainer
        center={initialCenter}
        zoom={currentZoom}
        zoomControl={false}
        className="w-full h-full"
        preferCanvas={true}
      >
        <TileLayer
          attribution="© CartoDB"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapEvents
          onZoomChange={setCurrentZoom}
          onMapMove={onMapMove}
          onMapClick={onMapClick}
        />
        <MapController coords={searchCoords} activeDriverCoords={activeDriverCoords} />

        {searchCoords && (
          <Marker position={searchCoords} icon={userLocIcon} />
        )}

        {visibleMarkers.map((item) => {
          const pos: [number, number] = [
            item.location.coordinates[1],
            item.location.coordinates[0],
          ];

          if (item.isCluster) {
            return (
              <Marker
                key={item._id}
                position={pos}
                icon={getClusterIcon(item.count ?? 0, item.clusterServiceType ?? 'other')}
                eventHandlers={{
                  click: (e) => e.target._map.setView(pos, item.expansionZoom ?? 14, { animate: false }),
                }}
              />
            );
          }

          const subType = item.service?.subType ?? '';
          const isActive = activeDriverId === item._id;
          const color = SERVICE_COLORS[subType] ?? SERVICE_COLORS.other;
          const label = SERVICE_LABELS[subType] ?? 'Hizmet';

          return (
            <Marker
              key={item._id}
              position={pos}
              icon={getMarkerIcon(subType, isActive)}
              ref={(el) => { markerRefs.current[item._id] = el; }}
              eventHandlers={{ click: () => onSelectDriver(item._id) }}
            >
              <Popup className="custom-leaflet-popup" minWidth={240} closeButton={false}>
                <div className="p-1 font-sans">
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className="text-[9px] font-black text-white px-2 py-0.5 rounded uppercase"
                      style={{ backgroundColor: color }}
                    >
                      {label}
                    </span>
                    {item.distance != null && (
                      <span className="text-[9px] font-bold text-gray-400">
                        {(item.distance / 1000).toFixed(1)} KM
                      </span>
                    )}
                  </div>

                  <h4 className="font-black text-gray-900 text-sm uppercase mb-1">
                    {item.businessName}
                  </h4>

                  <div className="flex items-center gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 12,
                          color: s <= (item.rating ?? 5) ? '#facc15' : '#e5e7eb',
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 border-t pt-3">
                    <button
                      onClick={() => {
                        onStartOrder(item, 'call');
                        window.location.href = `tel:${item.phoneNumber}`;
                      }}
                      style={{
                        flex: 1,
                        background: '#111827',
                        color: 'white',
                        padding: '10px 0',
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      📞 ARA
                    </button>
                    <button
                      onClick={() => (window.location.href = `sms:${item.phoneNumber}`)}
                      style={{
                        flex: 1,
                        background: '#16a34a',
                        color: 'white',
                        padding: '10px 0',
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      💬 SMS
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${item.location.coordinates[1]},${item.location.coordinates[0]}`,
                        '_blank'
                      )
                    }
                    style={{
                      width: '100%',
                      marginTop: 8,
                      background: '#f3f4f6',
                      color: '#6b7280',
                      padding: '8px 0',
                      borderRadius: 8,
                      fontSize: 9,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    📍 YOL TARİFİ
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default React.memo(MapComponent, (prev, next) => {
  return (
    prev.activeDriverId === next.activeDriverId &&
    prev.drivers === next.drivers &&
    prev.searchCoords === next.searchCoords
  );
});