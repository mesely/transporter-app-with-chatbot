/**
 * @file Map.tsx
 * @description Transporter 2026 Akıllı Harita Motoru.
 * Özellikler: MongoDB GeoJSON Senkronizasyonu, Dinamik İkonografi, 
 * Akıllı Kümeleme (Clustering) ve Smooth-Fly Animasyonları.
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
  CalendarCheck, CarFront, Globe, Home, Navigation, Phone, MessageCircle, Package, MapPin
} from 'lucide-react';

// --- 1. TİPLER ---
interface Driver {
  _id: string;
  businessName: string; 
  distance?: number;
  phoneNumber?: string;
  rating?: number;
  location: {
    coordinates: [number, number]; // [lng, lat] (MongoDB Standardı)
  };
  reservationUrl?: string;
  address?: { city?: string; district?: string; };
  service?: { mainType: string; subType: string; tags: string[]; };
  pricing?: { openingFee: number; pricePerUnit: number; };
  
  // Cluster State
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

// --- 2. SERVİS YAPILANDIRMASI ---
const SERVICE_CONFIG: any = {
  kurtarici:    { color: '#ef4444', Icon: CarFront, label: 'Kurtarıcı' },        
  oto_kurtarma: { color: '#dc2626', Icon: CarFront, label: 'Oto Kurtarma' },
  vinc:         { color: '#b91c1c', Icon: Anchor, label: 'Vinç' },
  nakliye:      { color: '#a855f7', Icon: Truck, label: 'Nakliye' },             
  evden_eve:    { color: '#9333ea', Icon: Home, label: 'Evden Eve' },           
  kamyon:       { color: '#7e22ce', Icon: Truck, label: 'Kamyon' },             
  tir:          { color: '#6b21a8', Icon: Truck, label: 'TIR' },
  kamyonet:     { color: '#581c87', Icon: Package, label: 'Kamyonet' },
  yurt_disi_nakliye: { color: '#4338ca', Icon: Globe, label: 'Uluslararası' },
  istasyon:     { color: '#1d4ed8', Icon: Navigation, label: 'İstasyon' },
  seyyar_sarj:  { color: '#0ea5e9', Icon: Zap, label: 'Mobil Şarj' },
  other:        { color: '#6b7280', Icon: MapPin, label: 'Hizmet' }
};

// --- 3. İKON GENERATORLARI ---

const createCustomIcon = (type: string | undefined, zoom: number, isActive: boolean) => {
  const config = SERVICE_CONFIG[type || ''] || SERVICE_CONFIG.other;
  const baseSize = isActive ? 52 : Math.max(34, Math.min(46, zoom * 2.8)); 
  const iconHtml = renderToStaticMarkup(<config.Icon size={baseSize * 0.55} color="white" strokeWidth={2.5} />);

  return L.divIcon({
    className: `custom-pin-marker ${isActive ? 'z-[1000]' : ''}`,
    html: `
      <div style="
        background-color: ${isActive ? '#16a34a' : config.color}; 
        width: ${baseSize}px; height: ${baseSize}px; 
        border-radius: 50% 50% 50% 0; transform: rotate(-45deg); 
        border: ${isActive ? '3px' : '2px'} solid white; 
        box-shadow: ${isActive ? '0 0 25px rgba(22,163,74,0.5)' : '0 4px 10px rgba(0,0,0,0.2)'}; 
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
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
  const size = 42 + (Math.min(count, 50) / 50) * 12;
  const iconHtml = renderToStaticMarkup(<config.Icon size={size * 0.35} color="white" strokeWidth={3} />);

  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div style="
        background-color: ${config.color}; 
        width: ${size}px; height: ${size}px; 
        border-radius: 50%; border: 3px solid rgba(255,255,255,0.9);
        box-shadow: 0 6px 15px rgba(0,0,0,0.2);
        display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="margin-bottom: -1px;">${iconHtml}</div>
        <div style="font-weight: 900; font-size: ${size * 0.25}px; color: white; line-height: 1;">${count}</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// --- 4. MAP INTERNAL CONTROLLERS ---

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
      map.flyTo(coords, 14, { duration: 1.5 });
    }
  }, [coords, activeDriverCoords, map]);
  return null;
}

// --- 5. ANA COMPONENT ---

export default function Map({ searchCoords, drivers, onStartOrder, activeDriverId, onSelectDriver, onMapMove, onMapClick }: MapProps) {
  const [currentZoom, setCurrentZoom] = useState(searchCoords ? 13 : 6);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  const initialCenter: [number, number] = searchCoords || [39.1667, 35.6667];

  const activeDriverCoords = useMemo(() => {
    const d = drivers.find(d => d._id === activeDriverId);
    return d ? [d.location.coordinates[1], d.location.coordinates[0]] as [number, number] : null;
  }, [activeDriverId, drivers]);

  // --- KÜMELEME (CLUSTERING) MANTIĞI ---
  const visibleMarkers = useMemo(() => {
    if (!drivers.length) return [];
    if (currentZoom >= 12) return drivers.map(d => ({ ...d, isCluster: false }));

    const result: Driver[] = [];
    const processed = new Set<string>();
    const threshold = 80 / Math.pow(2, currentZoom); 

    drivers.forEach((d) => {
      if (processed.has(d._id) || d._id === activeDriverId) return;
      
      const clusterGroup = drivers.filter(other => {
        if (processed.has(other._id) || other._id === activeDriverId) return false;
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
          clusterServiceType: d.service?.subType || 'other',
          expansionZoom: currentZoom + 3
        } as Driver);
      } else {
        result.push({ ...d, isCluster: false });
        processed.add(d._id);
      }
    });

    // Aktif sürücüyü her zaman ekle
    if (activeDriverId) {
        const active = drivers.find(d => d._id === activeDriverId);
        if (active) result.push({ ...active, isCluster: false });
    }

    return result;
  }, [drivers, currentZoom, activeDriverId]);

  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-[#f8fdfe]">
      <MapContainer 
        center={initialCenter} 
        zoom={currentZoom} 
        zoomControl={false} 
        className="w-full h-full"
        minZoom={5}
        maxZoom={18}
      >
        {/* Voyager TileLayer - Daha modern ve profesyonel görünüm */}
        <TileLayer
          attribution='&copy; CartoDB Voyager'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapEvents onZoomChange={setCurrentZoom} onMapMove={onMapMove} onMapClick={onMapClick} />
        <MapController coords={searchCoords} activeDriverCoords={activeDriverCoords} />

        {/* Kullanıcı Konumu */}
        {searchCoords && (
          <Marker position={searchCoords} icon={L.divIcon({
            className: 'user-loc',
            html: `<div style="background-color:#3b82f6; width:18px; height:18px; border-radius:50%; border:3px solid white; box-shadow:0 0 15px rgba(59,130,246,0.6); animation:pulse 2s infinite;"></div>`,
            iconSize: [18, 18], iconAnchor: [9, 9]
          })} />
        )}

        {/* Markerlar */}
        {visibleMarkers.map((item: Driver) => {
          const pos: [number, number] = [item.location.coordinates[1], item.location.coordinates[0]];

          if (item.isCluster) {
            return (
              <Marker key={item._id} position={pos} 
                icon={createClusterIcon(item.count || 0, item.clusterServiceType || 'other')}
                eventHandlers={{ click: (e) => e.target._map.flyTo(pos, item.expansionZoom) }} />
            );
          }

          const isActive = activeDriverId === item._id;
          const config = SERVICE_CONFIG[item.service?.subType || ''] || SERVICE_CONFIG.other;

          return (
            <Marker 
              key={item._id} 
              position={pos}
              icon={createCustomIcon(item.service?.subType, currentZoom, isActive)}
              ref={(el) => { 
                markerRefs.current[item._id] = el;
                if (el && isActive) setTimeout(() => el.openPopup(), 150);
              }}
              eventHandlers={{ click: () => onSelectDriver(item._id) }}
            >
              <Popup className="custom-leaflet-popup" minWidth={260} closeButton={false}>
                <div className="p-1 font-sans">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-white px-2 py-0.5 rounded uppercase tracking-widest shadow-sm" style={{ backgroundColor: config.color }}>
                      {config.label}
                    </span>
                    {item.distance && <span className="text-[9px] font-bold text-gray-400">{(item.distance / 1000).toFixed(1)} KM</span>}
                  </div>
                  <h4 className="font-black text-gray-900 text-sm uppercase leading-tight mb-1">{item.businessName}</h4>
                  <div className="flex items-center gap-0.5 mb-4">
                    {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= (item.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />)}
                  </div>
                  
                  <div className="flex gap-2 border-t border-gray-100 pt-3">
                    <button 
                      onClick={() => { onStartOrder(item, 'call'); window.location.href=`tel:${item.phoneNumber}`; }}
                      className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                    >
                      <Phone size={12} /> ARA
                    </button>
                    <button 
                      onClick={() => window.open(`https://wa.me/${item.phoneNumber?.replace(/\D/g,'')}`)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                    >
                      <MessageCircle size={12} /> WHATSAPP
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}