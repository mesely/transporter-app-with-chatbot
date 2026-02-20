/**
 * @file Map.tsx
 * @description Transport 245 Akıllı Harita Motoru.
 * FIX: Kümeleme mantığı sadece aynı subType içindekileri gruplayacak şekilde özelleştirildi.
 * FIX: Yolcu Taşıma ve Gezici Şarj kategorisindeki sürücüler haritada (marker olarak) gizlendi.
 * FIX: İl seçimi yapıldığında harita otomatik olarak o koordinata odaklanır.
 */

'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo, useRef } from 'react';
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
  link?: string;
  location: {
    coordinates: [number, number]; // [lng, lat]
  };
  address?: { city?: string; district?: string; };
  service?: { mainType: string; subType: string; tags: string[]; };
  pricing?: { openingFee: number; pricePerUnit: number; };
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

// --- SERVİS YAPILANDIRMASI ---
const SERVICE_CONFIG: any = {
  oto_kurtarma: { color: '#dc2626', Icon: CarFront, label: 'Oto Kurtarma' },
  vinc:         { color: '#881337', Icon: Anchor, label: 'Vinç' },
  kurtarici:    { color: '#ef4444', Icon: CarFront, label: 'Kurtarıcı' },
  nakliye:      { color: '#9333ea', Icon: Truck, label: 'Nakliye' },
  evden_eve:    { color: '#a855f7', Icon: Home, label: 'Evden Eve' },
  tir:          { color: '#7e22ce', Icon: Truck, label: 'TIR' },
  kamyon:       { color: '#6b21a8', Icon: Truck, label: 'Kamyon' },
  kamyonet:     { color: '#581c87', Icon: Package, label: 'Kamyonet' },
  yurt_disi_nakliye: { color: '#1e3a8a', Icon: Globe, label: 'Uluslararası' },
  istasyon:     { color: '#2563eb', Icon: Zap, label: 'İstasyon' },
  seyyar_sarj:  { color: '#0ea5e9', Icon: GeziciSarjIcon, label: 'Mobil Şarj' },
  minibus:      { color: '#10b981', Icon: Users, label: 'Minibüs' },
  otobus:       { color: '#059669', Icon: Bus, label: 'Otobüs' },
  midibus:      { color: '#047857', Icon: Bus, label: 'Midibüs' },
  vip_tasima:   { color: '#064e3b', Icon: Crown, label: 'VIP Transfer' },
  yolcu:        { color: '#10b981', Icon: Users, label: 'Yolcu Taşıma' },
  other:        { color: '#6b7280', Icon: MapPin, label: 'Hizmet' }
};

const darkenHex = (hex: string, amount: number) => {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return hex;
  const r = Math.max(0, Math.min(255, parseInt(raw.slice(0, 2), 16) - amount));
  const g = Math.max(0, Math.min(255, parseInt(raw.slice(2, 4), 16) - amount));
  const b = Math.max(0, Math.min(255, parseInt(raw.slice(4, 6), 16) - amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// --- İKON GENERATORLARI ---
const createCustomIcon = (type: string | undefined, zoom: number, isActive: boolean) => {
  const config = SERVICE_CONFIG[type || ''] || SERVICE_CONFIG.other;
  const baseSize = isActive ? 56 : Math.max(36, Math.min(48, zoom * 2.8)); 
  const iconHtml = renderToStaticMarkup(<config.Icon size={baseSize * 0.55} color="white" strokeWidth={2.5} />);

  return L.divIcon({
    className: `custom-pin-marker ${isActive ? 'z-[2000]' : ''}`,
    html: `
      <div style="
        background-color: ${isActive ? '#16a34a' : config.color}; 
        width: ${baseSize}px; height: ${baseSize}px; 
        border-radius: 50% 50% 50% 0; transform: rotate(-45deg); 
        border: ${isActive ? '4px' : '2px'} solid white; 
        box-shadow: ${isActive ? '0 0 30px rgba(22,163,74,0.6)' : '0 4px 12px rgba(0,0,0,0.25)'}; 
        display: flex; align-items: center; justify-content: center;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
          ${iconHtml}
        </div>
      </div>
    `,
    iconSize: [baseSize, baseSize], 
    iconAnchor: [baseSize / 2, baseSize],
    popupAnchor: [0, -baseSize] 
  });
};

const createClusterIcon = (count: number, type: string) => {
  const config = SERVICE_CONFIG[type || ''] || SERVICE_CONFIG.other;
  const size = 44 + (Math.min(count, 50) / 50) * 14;
  const iconHtml = renderToStaticMarkup(<config.Icon size={size * 0.35} color="white" strokeWidth={3} />);

  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div style="
        background-color: ${config.color}; 
        width: ${size}px; height: ${size}px; 
        border-radius: 50%; border: 3px solid rgba(255,255,255,0.9);
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="margin-bottom: -2px;">${iconHtml}</div>
        <div style="font-weight: 900; font-size: ${size * 0.28}px; color: white; line-height: 1; letter-spacing: -0.5px;">${count}</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// --- HARİTA KONTROLLERİ ---
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
      map.flyTo(activeDriverCoords, 16, { duration: 1.2 });
    } else if (coords) {
      map.flyTo(coords, 12, { duration: 1.5 });
    }
  }, [coords, activeDriverCoords, map]);
  return null;
}

// --- ANA BİLEŞEN ---
export default function Map({ searchCoords, drivers, onStartOrder, activeDriverId, onSelectDriver, onMapMove, onMapClick }: MapProps) {
  const [currentZoom, setCurrentZoom] = useState(searchCoords ? 12 : 6.5);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  const initialCenter: [number, number] = searchCoords || [39.9334, 32.8597];

  const activeDriverCoords = useMemo(() => {
    const d = drivers.find(d => d._id === activeDriverId);
    return d ? [d.location.coordinates[1], d.location.coordinates[0]] as [number, number] : null;
  }, [activeDriverId, drivers]);

  const hiddenCategories = ['seyyar_sarj', 'minibus', 'otobus', 'midibus', 'vip_tasima', 'yolcu_tasima'];

  const visibleMarkers = useMemo(() => {
    const mapDrivers = drivers.filter(d => !hiddenCategories.includes(d.service?.subType || ''));

    if (!mapDrivers.length) return [];
    if (currentZoom >= 12) return mapDrivers.map(d => ({ ...d, isCluster: false }));

    const result: Driver[] = [];
    const processed = new Set<string>();
    const threshold = 100 / Math.pow(2, currentZoom); 

    mapDrivers.forEach((d) => {
      if (processed.has(d._id) || d._id === activeDriverId) return;
      
      const currentSubType = d.service?.subType;

      // 🔥 FIX: clusterGroup filtresine 'subType' kontrolü eklendi
      const clusterGroup = mapDrivers.filter(other => {
        if (processed.has(other._id) || other._id === activeDriverId) return false;
        
        // Sadece aynı subType olanları kümele
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
    <div className="absolute inset-0 w-full h-full z-0 bg-[#f0f4f8]">
      <MapContainer center={initialCenter} zoom={currentZoom} zoomControl={false} className="w-full h-full" minZoom={5} maxZoom={18}>
        <TileLayer attribution='© CartoDB Voyager' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        
        <MapEvents onZoomChange={setCurrentZoom} onMapMove={onMapMove} onMapClick={onMapClick} />
        <MapController coords={searchCoords} activeDriverCoords={activeDriverCoords} />

        {searchCoords && (
          <Marker position={searchCoords} icon={L.divIcon({
            className: 'user-loc',
            html: `<div style="background-color:#2563eb; width:20px; height:20px; border-radius:50%; border:4px solid white; box-shadow:0 0 20px rgba(37,99,235,0.7); animation:pulse 2s infinite;"></div>`,
            iconSize: [20, 20], iconAnchor: [10, 10]
          })} />
        )}

        {visibleMarkers.map((item: Driver) => {
          const pos: [number, number] = [item.location.coordinates[1], item.location.coordinates[0]];
          const subType = item.service?.subType || '';
          
          if (hiddenCategories.includes(subType)) return null;

          if (item.isCluster) {
            return (
              <Marker key={item._id} position={pos} 
                icon={createClusterIcon(item.count || 0, item.clusterServiceType || 'other')}
                eventHandlers={{ click: (e) => e.target._map.flyTo(pos, item.expansionZoom) }} />
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
                if (el && isActive) setTimeout(() => el.openPopup(), 200);
              }}
              eventHandlers={{ click: () => onSelectDriver(item._id) }}
            >
              <Popup className="custom-leaflet-popup" minWidth={280} closeButton={false}>
                <div className="p-1 font-sans text-gray-900">
                  <div className="flex justify-between items-start mb-2.5">
                    <span className="text-[10px] font-black text-white px-2.5 py-1 rounded-lg uppercase tracking-tighter shadow-sm" style={{ backgroundColor: config.color }}>
                      {config.label}
                    </span>
                    {item.distance && <span className="text-[10px] font-black text-gray-400">{(item.distance / 1000).toFixed(1)} KM</span>}
                  </div>
                  
                  <h4 className="font-black text-slate-900 text-sm uppercase leading-tight mb-1">{item.businessName}</h4>
                  
                  <div className="flex items-center gap-0.5 mb-4">
                    {[1,2,3,4,5].map(s => (
                      <Star
                        key={s}
                        size={11}
                        style={s <= (item.rating || 5) ? { color: config.color, fill: config.color } : { color: '#e5e7eb' }}
                      />
                    ))}
                    <span className="text-[10px] font-bold text-gray-400 ml-1">({item.rating || 5}.0)</span>
                  </div>
                  
                  <div className="flex gap-2 border-t border-gray-100 pt-3.5">
                    <button
                      onClick={() => { onStartOrder(item, 'call'); window.location.href=`tel:${item.phoneNumber}`; }}
                      className="flex-1 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg border border-white/30 backdrop-blur-md"
                      style={{ background: `linear-gradient(135deg, ${config.color}, ${darkenHex(config.color, 45)})` }}
                    >
                      <Phone size={13} /> ARA
                    </button>
                    
                    <button
                      onClick={() => { onStartOrder(item, 'message'); window.location.href=`sms:${item.phoneNumber}`; }}
                      className="flex-1 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg border border-white/30 backdrop-blur-md"
                      style={{ background: `linear-gradient(135deg, ${darkenHex(config.color, 18)}, ${darkenHex(config.color, 65)})` }}
                    >
                      <MessageCircle size={13} /> MESAJ AT
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => window.open(`https://maps.google.com/maps?q=${item.location.coordinates[1]},${item.location.coordinates[0]}`, '_blank')}
                    className="w-full mt-2 text-white py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 border border-white/30 backdrop-blur-md transition-all"
                    style={{ background: `linear-gradient(135deg, ${config.color}, ${darkenHex(config.color, 55)})` }}
                  >
                    <MapPin size={12} /> HARİTADA GÖSTER
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
