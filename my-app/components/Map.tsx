/**
 * @file Map.tsx
 * @description Transport 245 Performans Optimize Harita Motoru.
 * FIX: React.memo ile sarmallanarak gereksiz re-render (ve iOS crash) engellendi.
 * FIX: Google Maps link yapısı düzeltildi.
 * PERFORMANS: Ağır animasyonlar ve gölge hesaplamaları iOS WebView için hafifletildi.
 */

'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';

// --- ICONS ---
import { 
  Truck, Zap, Anchor, Star, 
  CarFront, Globe, Home, Navigation, Phone, MessageCircle, Package, MapPin,
  Users, Bus, Crown
} from 'lucide-react';

// --- ÖZEL İKON: GEZİCİ ŞARJ ---
const GeziciSarjIcon = ({ size = 24, color = "currentColor" }: { size?: number, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 36h12v10H4z" /><path d="M16 36l3-6h7l3 6" /><circle cx="7" cy="48" r="2.5" /><circle cx="26" cy="48" r="2.5" />
    <path d="M29 36c4 0 4-10 10-10s6 10 10 10" strokeDasharray="3 2" />
    <path d="M38 24l2 2-2 2" strokeWidth="1" />
    <path d="M44 38h16v8H44z" /><path d="M44 38l2-5h10l2 5" /><circle cx="48" cy="48" r="2.5" /><circle cx="56" cy="48" r="2.5" />
  </svg>
);

// --- TİPLER ---
interface Driver {
  _id: string;
  businessName: string; 
  distance?: number;
  phoneNumber?: string;
  rating?: number;
  website?: string;
  location: {
    coordinates: [number, number];
  };
  service?: { mainType: string; subType: string; tags: string[]; };
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

const SERVICE_CONFIG: any = {
  oto_kurtarma: { color: '#dc2626', Icon: CarFront, label: 'Oto Kurtarma' },
  vinc:         { color: '#b91c1c', Icon: Anchor, label: 'Vinç' },
  nakliye:      { color: '#9333ea', Icon: Truck, label: 'Nakliye' },
  evden_eve:    { color: '#a855f7', Icon: Home, label: 'Evden Eve' },
  tir:          { color: '#7e22ce', Icon: Truck, label: 'TIR' },
  kamyon:       { color: '#6b21a8', Icon: Truck, label: 'Kamyon' },
  kamyonet:     { color: '#581c87', Icon: Package, label: 'Kamyonet' },
  yurt_disi_nakliye: { color: '#4338ca', Icon: Globe, label: 'Uluslararası' },
  istasyon:     { color: '#2563eb', Icon: Zap, label: 'İstasyon' },
  seyyar_sarj:  { color: '#0ea5e9', Icon: GeziciSarjIcon, label: 'Mobil Şarj' },
  other:        { color: '#6b7280', Icon: MapPin, label: 'Hizmet' }
};

// --- İKON ÜRETİCİLERİ ---
const createCustomIcon = (type: string | undefined, zoom: number, isActive: boolean) => {
  const config = SERVICE_CONFIG[type || ''] || SERVICE_CONFIG.other;
  const baseSize = isActive ? 52 : Math.max(34, Math.min(44, zoom * 2.8)); 
  const iconMarkup = renderToStaticMarkup(<config.Icon size={baseSize * 0.55} color="white" strokeWidth={2.5} />);

  return L.divIcon({
    className: `custom-pin-marker ${isActive ? 'active-z' : ''}`,
    html: `
      <div style="
        background-color: ${isActive ? '#16a34a' : config.color}; 
        width: ${baseSize}px; height: ${baseSize}px; 
        border-radius: 50% 50% 50% 0; transform: rotate(-45deg); 
        border: 2px solid white; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        display: flex; align-items: center; justify-content: center;">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
          ${iconMarkup}
        </div>
      </div>
    `,
    iconSize: [baseSize, baseSize], 
    iconAnchor: [baseSize / 2, baseSize]
  });
};

const createClusterIcon = (count: number, type: string) => {
  const config = SERVICE_CONFIG[type || ''] || SERVICE_CONFIG.other;
  const size = 42;
  const iconMarkup = renderToStaticMarkup(<config.Icon size={size * 0.35} color="white" strokeWidth={3} />);

  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div style="
        background-color: ${config.color}; 
        width: ${size}px; height: ${size}px; 
        border-radius: 50%; border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="margin-bottom: -2px;">${iconMarkup}</div>
        <div style="font-weight: 900; font-size: 11px; color: white;">${count}</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// --- HARİTA KONTROL BİLEŞENLERİ ---
function MapEvents({ onZoomChange, onMapMove, onMapClick }: any) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
    moveend: () => onMapMove && onMapMove(map.getCenter().lat, map.getCenter().lng, map.getZoom()),
    click: (e) => {
      if ((e.originalEvent.target as HTMLElement).classList.contains('leaflet-container')) {
        onMapClick && onMapClick();
      }
    }
  });
  return null;
}

function MapController({ coords, activeDriverCoords }: { coords: [number, number] | null, activeDriverCoords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (activeDriverCoords) {
      map.flyTo(activeDriverCoords, 16, { animate: true, duration: 1 });
    } else if (coords) {
      map.flyTo(coords, 12, { animate: true, duration: 1.2 });
    }
  }, [coords, activeDriverCoords, map]);
  return null;
}

// --- ANA BİLEŞEN (MEMOİZE EDİLMİŞ) ---
const Map = ({ searchCoords, drivers, onStartOrder, activeDriverId, onSelectDriver, onMapMove, onMapClick }: MapProps) => {
  const [currentZoom, setCurrentZoom] = useState(searchCoords ? 12 : 6.5);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  
  const initialCenter = useMemo(() => searchCoords || [39.9334, 32.8597] as [number, number], []);

  const activeDriverCoords = useMemo(() => {
    const d = drivers.find(d => d._id === activeDriverId);
    return d ? [d.location.coordinates[1], d.location.coordinates[0]] as [number, number] : null;
  }, [activeDriverId, drivers]);

  const hiddenCategories = ['seyyar_sarj', 'minibus', 'otobus', 'midibus', 'vip_tasima', 'yolcu_tasima'];

  // --- KÜMELEME MANTIĞI ---
  const visibleMarkers = useMemo(() => {
    const mapDrivers = drivers.filter(d => !hiddenCategories.includes(d.service?.subType || ''));
    if (!mapDrivers.length) return [];
    if (currentZoom >= 12) return mapDrivers.map(d => ({ ...d, isCluster: false }));

    const result: Driver[] = [];
    const processed = new Set<string>();
    const threshold = 120 / Math.pow(2, currentZoom); 

    mapDrivers.forEach((d) => {
      if (processed.has(d._id) || d._id === activeDriverId) return;
      
      const currentSubType = d.service?.subType;
      const clusterGroup = mapDrivers.filter(other => {
        if (processed.has(other._id) || other._id === activeDriverId) return false;
        if (other.service?.subType !== currentSubType) return false;

        const distLat = Math.abs(d.location.coordinates[1] - other.location.coordinates[1]);
        const distLng = Math.abs(d.location.coordinates[0] - other.location.coordinates[0]);
        return distLat < threshold && distLng < threshold;
      });

      if (clusterGroup.length > 1) {
        clusterGroup.forEach(c => processed.add(c._id));
        result.push({
          _id: `cluster-${d._id}`,
          businessName: 'Küme',
          location: d.location,
          isCluster: true,
          count: clusterGroup.length,
          clusterServiceType: currentSubType || 'other',
          expansionZoom: currentZoom + 3
        } as Driver);
      } else {
        result.push({ ...d, isCluster: false });
        processed.add(d._id);
      }
    });

    if (activeDriverId) {
        const active = mapDrivers.find(d => d._id === activeDriverId);
        if (active) result.push({ ...active, isCluster: false });
    }

    return result;
  }, [drivers, currentZoom, activeDriverId]);

  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-[#f8fafc]">
      <MapContainer 
        center={initialCenter} 
        zoom={currentZoom} 
        zoomControl={false} 
        className="w-full h-full"
        preferCanvas={true} // 🔥 GPU PERFORMANSI İÇİN KRİTİK
      >
        <TileLayer attribution='© CartoDB' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        
        <MapEvents onZoomChange={setCurrentZoom} onMapMove={onMapMove} onMapClick={onMapClick} />
        <MapController coords={searchCoords} activeDriverCoords={activeDriverCoords} />

        {searchCoords && (
          <Marker position={searchCoords} icon={L.divIcon({
            className: 'user-loc-marker',
            html: `<div style="background-color:#2563eb; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 15px rgba(37,99,235,0.5);"></div>`,
            iconSize: [16, 16], iconAnchor: [8, 8]
          })} />
        )}

        {visibleMarkers.map((item: Driver) => {
          const pos: [number, number] = [item.location.coordinates[1], item.location.coordinates[0]];
          const subType = item.service?.subType || '';
          
          if (item.isCluster) {
            return (
              <Marker 
                key={item._id} 
                position={pos} 
                icon={createClusterIcon(item.count || 0, item.clusterServiceType || 'other')}
                eventHandlers={{ click: (e) => e.target._map.flyTo(pos, item.expansionZoom) }} 
              />
            );
          }

          const isActive = activeDriverId === item._id;
          const config = SERVICE_CONFIG[subType] || SERVICE_CONFIG.other;

          return (
            <Marker 
              key={item._id} 
              position={pos}
              icon={createCustomIcon(subType, currentZoom, isActive)}
              ref={(el) => { 
                markerRefs.current[item._id] = el;
                if (el && isActive) setTimeout(() => el.openPopup(), 100);
              }}
              eventHandlers={{ click: () => onSelectDriver(item._id) }}
            >
              <Popup className="custom-leaflet-popup" minWidth={260} closeButton={false}>
                <div className="p-1 font-sans">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-white px-2 py-0.5 rounded uppercase" style={{ backgroundColor: config.color }}>
                      {config.label}
                    </span>
                    {item.distance && <span className="text-[9px] font-bold text-gray-400">{(item.distance / 1000).toFixed(1)} KM</span>}
                  </div>
                  
                  <h4 className="font-black text-gray-900 text-sm uppercase mb-1">{item.businessName}</h4>
                  
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={10} className={s <= (item.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                  
                  <div className="flex gap-2 border-t pt-3">
                    <button 
                      onClick={() => { onStartOrder(item, 'call'); window.location.href=`tel:${item.phoneNumber}`; }}
                      className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"
                    >
                      <Phone size={12} /> ARA
                    </button>
                    <button 
                      onClick={() => window.location.href=`sms:${item.phoneNumber}`}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={12} /> SMS
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${item.location.coordinates[1]},${item.location.coordinates[0]}`, '_blank')}
                    className="w-full mt-2 bg-gray-100 text-gray-500 py-2 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-2"
                  >
                    <MapPin size={10} /> YOL TARİFİ
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

// --- 🔥 MEMOİZASYON KARŞILAŞTIRMASI ---
export default React.memo(Map, (prev, next) => {
  return (
    prev.activeDriverId === next.activeDriverId &&
    prev.drivers === next.drivers &&
    prev.searchCoords === next.searchCoords
  );
});