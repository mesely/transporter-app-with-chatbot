'use client';

// --- LEAFLET & REACT ---
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// --- CLUSTER & ICONS ---
import MarkerClusterGroup from 'react-leaflet-cluster';
import { 
  Truck, Zap, BatteryCharging, Wrench, 
  Construction, Home, Star, CalendarCheck
} from 'lucide-react';

// --- 1. TİPLER ---
interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  distance?: number;
  phoneNumber?: string;
  serviceType?: string;
  rating?: number;
  location: {
    coordinates: [number, number]; // [lng, lat]
  };
  reservationUrl?: string;
}

interface MapProps {
  searchCoords: [number, number] | null;
  drivers: Driver[];
  onStartOrder: (driver: Driver, method: 'call' | 'message') => void;
  // --- SENKRONİZASYON PROPLARI ---
  activeDriverId: string | null;
  onSelectDriver: (id: string | null) => void;
  // Harita kaydırıldığında veri çekmek için
  onMapMove?: (lat: number, lng: number) => void;
  // Boşluğa tıklama olayı
  onMapClick?: () => void;
}

// --- 2. RENK VE İKON YAPILANDIRMASI ---
const SERVICE_CONFIG: any = {
  kurtarici: { color: '#dc2626', Icon: Wrench },
  vinc: { color: '#991b1b', Icon: Construction },
  nakliye: { color: '#9333ea', Icon: Home },
  kamyon: { color: '#ca8a04', Icon: Truck },
  tir: { color: '#ca8a04', Icon: Truck },
  kamyonet: { color: '#ca8a04', Icon: Truck },
  sarj_istasyonu: { color: '#2563eb', Icon: Zap },
  seyyar_sarj: { color: '#0891b2', Icon: BatteryCharging },
  // Varsayılan
  other: { color: '#6b7280', Icon: Truck }
};

// --- 3. DİNAMİK İKON TASARIMI (BÜYÜTÜLDÜ 🔍 1.2x) ---
const createCustomIcon = (type: string | undefined, zoom: number, isActive: boolean) => {
  const config = SERVICE_CONFIG[type || ''] || SERVICE_CONFIG.other;
  
  // 🔥 İKON BOYUTLARI ARTTIRILDI
  // Eski: 18/50 -> Yeni: 22/55
  const baseSize = Math.max(22, Math.min(55, isActive ? zoom * 2.8 : zoom * 2.2)); 
  const innerSize = baseSize * 0.55;

  const iconHtml = renderToStaticMarkup(
    <config.Icon size={innerSize} color="white" strokeWidth={3} />
  );

  return L.divIcon({
    className: `custom-pin-marker ${isActive ? 'active-pin' : ''}`,
    html: `
      <div style="
        background-color: ${isActive ? '#22c55e' : config.color}; 
        width: ${baseSize}px; 
        height: ${baseSize}px; 
        border-radius: 50% 50% 50% 0; 
        transform: rotate(-45deg); 
        border: ${zoom > 12 ? '3px' : '2px'} solid white; 
        box-shadow: ${isActive ? '0 0 25px rgba(34, 197, 94, 0.7)' : '0 6px 14px rgba(0,0,0,0.35)'}; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        transition: all 0.3s ease;">
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

// 🔥 CLUSTER (KÜME) İKONU DA BÜYÜTÜLDÜ (1.2x)
const createClusterIcon = (cluster: any, type: string) => {
  const count = cluster.getChildCount();
  const config = SERVICE_CONFIG[type] || SERVICE_CONFIG.other;
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${config.color}; 
        width: 52px; height: 52px; 
        border-radius: 50%; 
        border: 4px solid white; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: white; 
        font-weight: 900; 
        font-size: 15px; 
        box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        opacity: 0.98;">
        ${count}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [52, 52],
  });
};

// --- 4. HARİTA KONTROL BİLEŞENLERİ ---
function MapEvents({ onZoomChange, onMapMove, onMapClick }: { 
  onZoomChange: (z: number) => void, 
  onMapMove?: (lat: number, lng: number) => void,
  onMapClick?: () => void 
}) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
    moveend: () => {
      if (onMapMove) {
        const center = map.getCenter();
        onMapMove(center.lat, center.lng);
      }
    },
    click: () => {
      if (onMapClick) onMapClick();
    }
  });
  return null;
}

// 🔥 ZOOM OUT HATASINI ÇÖZEN AKILLI KONTROLCÜ
function MapController({ coords, activeDriverCoords }: { coords: [number, number] | null, activeDriverCoords: [number, number] | null }) {
  const map = useMap();
  const prevCoordsRef = useRef<string>(""); // Önceki koordinatı hatırla

  useEffect(() => {
    if (activeDriverCoords) {
      // Sürücü seçildiyse oraya kesin git
      map.flyTo(activeDriverCoords, 16, { duration: 1.5 });
    } else if (coords) {
      // Eğer arama koordinatı değiştiyse ve eskisiyle aynı değilse git.
      // Bu sayede zoom out yapınca veya haritayı kaydırınca tekrar merkeze atmaz.
      const coordsStr = coords.toString();
      if (prevCoordsRef.current !== coordsStr) {
        map.flyTo(coords, 13, { duration: 2, animate: true });
        prevCoordsRef.current = coordsStr;
      }
    }
  }, [coords, activeDriverCoords, map]);
  
  return null;
}

// --- 5. ANA BİLEŞEN ---
export default function Map({ searchCoords, drivers, onStartOrder, activeDriverId, onSelectDriver, onMapMove, onMapClick }: MapProps) {
  const [currentZoom, setCurrentZoom] = useState(13);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});

  const groupedDrivers = useMemo(() => {
    return drivers.reduce((acc: any, driver: any) => {
      const type = driver.serviceType || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(driver);
      return acc;
    }, {});
  }, [drivers]);

  const activeDriverCoords = useMemo(() => {
    const active = drivers.find(d => d._id === activeDriverId);
    if (active && active.location?.coordinates) {
      return [active.location.coordinates[1], active.location.coordinates[0]] as [number, number];
    }
    return null;
  }, [activeDriverId, drivers]);

  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-gray-100">
      <MapContainer 
        center={searchCoords || [38.4237, 27.1428]} 
        zoom={13} 
        zoomControl={false} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='© OpenStreetMap contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapEvents 
          onZoomChange={setCurrentZoom} 
          onMapMove={onMapMove} 
          onMapClick={onMapClick} 
        />
        <MapController coords={searchCoords} activeDriverCoords={activeDriverCoords} />

        {/* Kullanıcı Konumu */}
        {searchCoords && (
          <Marker position={searchCoords} icon={
            L.divIcon({
              className: 'user-marker',
              html: `<div style="background-color: #3b82f6; width: 22px; height: 22px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 20px rgba(59, 130, 246, 0.6); animation: pulse 2s infinite;"></div>`,
              iconSize: [22, 22], iconAnchor: [11, 11],
            })
          }>
            <Popup>Şu anki konumunuz</Popup>
          </Marker>
        )}

        {/* Sürücü Markerları (Cluster İçinde) */}
        {Object.keys(groupedDrivers).map((type) => (
          <MarkerClusterGroup 
            key={type}
            iconCreateFunction={(cluster) => createClusterIcon(cluster, type)}
            maxClusterRadius={50}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={true}
            chunkedLoading={true} // 🔥 KASMA SORUNU İÇİN (Performans)
          >
            {groupedDrivers[type].map((driver: Driver) => {
              const lng = driver.location.coordinates[0];
              const lat = driver.location.coordinates[1];
              
              const isCharge = driver.serviceType?.includes('sarj');
              const isActive = activeDriverId === driver._id;

              return (
                <Marker 
                  key={driver._id} 
                  position={[lat, lng]}
                  ref={(el) => { 
                    markerRefs.current[driver._id] = el; 
                    if (el && isActive) el.openPopup(); 
                  }}
                  icon={createCustomIcon(driver.serviceType, currentZoom, isActive)}
                  eventHandlers={{
                    click: () => onSelectDriver(driver._id) 
                  }}
                >
                  <Popup className="custom-popup" minWidth={240}>
                    <div className="p-1 font-sans">
                      <div className="mb-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            {driver.serviceType?.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="font-black text-sm text-gray-900 uppercase leading-tight">
                          {driver.firstName} {driver.lastName}
                        </div>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={10} className={`${s <= (driver.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}/>`} />
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        {isCharge ? (
                          <button onClick={() => driver.reservationUrl && window.open(driver.reservationUrl, '_blank')} className={`w-full py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${driver.reservationUrl ? 'bg-blue-600 text-white shadow-lg active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                            <CalendarCheck size={14} /> REZERVASYON YAP
                          </button>
                        ) : (
                          <>
                            <button onClick={() => { onStartOrder(driver, 'call'); window.location.href = `tel:${driver.phoneNumber}`; }} className="flex-1 bg-black text-white py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 active:scale-95 shadow-lg">ARA</button>
                            <button onClick={() => { onStartOrder(driver, 'message'); window.open(`https://wa.me/${driver.phoneNumber?.replace(/\D/g, '')}`, '_blank'); }} className="flex-1 bg-green-600 text-white py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 active:scale-95 shadow-lg">WHATSAPP</button>
                          </>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        ))}
      </MapContainer>
    </div>
  );
}