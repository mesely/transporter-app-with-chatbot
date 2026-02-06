'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { 
  Truck, Zap, BatteryCharging, Wrench, 
  Phone, MessageCircle, Navigation, Map as MapIcon,
  Construction, Home, Star, CalendarCheck
} from 'lucide-react';

// --- 1. TİPLER (TypeScript Hatalarını Çözen Kısım) ---
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
  seyyar_sarj: { color: '#0891b2', Icon: BatteryCharging }
};

// --- 3. DİNAMİK İKON VE KÜME TASARIMLARI ---
const createCustomIcon = (type: string | undefined, zoom: number) => {
  const config = SERVICE_CONFIG[type || ''] || { color: '#6b7280', Icon: Truck };
  const baseSize = Math.max(14, Math.min(36, zoom * 1.8)); 
  const innerSize = baseSize * 0.55;

  const iconHtml = renderToStaticMarkup(
    <config.Icon size={innerSize} color="white" strokeWidth={3} />
  );

  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div style="
        background-color: ${config.color}; 
        width: ${baseSize}px; 
        height: ${baseSize}px; 
        border-radius: 50% 50% 50% 0; 
        transform: rotate(-45deg); 
        border: ${zoom > 12 ? '2px' : '1px'} solid white; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
        display: flex; 
        align-items: center; 
        justify-content: center;">
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

const createClusterIcon = (cluster: any, type: string) => {
  const count = cluster.getChildCount();
  const config = SERVICE_CONFIG[type] || { color: '#333' };
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${config.color}; 
        width: 40px; height: 40px; 
        border-radius: 50%; 
        border: 3px solid white; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: white; 
        font-weight: 900; 
        font-size: 12px; 
        box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        opacity: 0.98;">
        ${count}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(40, 40),
  });
};

// --- 4. HARİTA KONTROL BİLEŞENLERİ ---
function MapEvents({ onZoomChange }: { onZoomChange: (z: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
  });
  return null;
}

function MapController({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 14, { duration: 2, animate: true });
  }, [coords, map]);
  return null;
}

// --- 5. ANA BİLEŞEN ---
export default function Map({ searchCoords, drivers, onStartOrder }: MapProps) {
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [isRouting, setIsRouting] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);

  // Sürücüleri türlerine göre ayır (Sadece aynı türdekiler kümelensin diye)
  const groupedDrivers = useMemo(() => {
    return drivers.reduce((acc: any, driver: any) => {
      const type = driver.serviceType || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(driver);
      return acc;
    }, {});
  }, [drivers]);

  const handleDrawRoute = async (destLat: number, destLng: number) => {
    if (!searchCoords) return;
    setIsRouting(true);
    const [startLat, startLng] = searchCoords;
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
        setRoutePath(coords);
      }
    } catch (e) { console.error("Rota hatası:", e); } 
    finally { setIsRouting(false); }
  };

  const userIcon = L.divIcon({
    className: 'user-marker',
    html: `<div style="background-color: #3b82f6; width: 22px; height: 22px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);"></div>`,
    iconSize: [22, 22], iconAnchor: [11, 11],
  });

  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-gray-100">
      <MapContainer 
        center={searchCoords || [38.4237, 27.1428]} 
        zoom={13} 
        zoomControl={false} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='© OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapEvents onZoomChange={setCurrentZoom} />
        <MapController coords={searchCoords} />

        {searchCoords && (
          <Marker position={searchCoords} icon={userIcon}>
            <Popup>Şu anki konumunuz</Popup>
          </Marker>
        )}

        {routePath.length > 0 && (
          <Polyline positions={routePath} color="#3b82f6" weight={6} opacity={0.6} dashArray="1, 12" lineCap="round" />
        )}

        {/* 🚀 GRUPLANDIRILMIŞ KÜMELER: Her türün kendi Cluster'ı var */}
        {Object.keys(groupedDrivers).map((type) => (
          <MarkerClusterGroup 
            key={type}
            iconCreateFunction={(cluster) => createClusterIcon(cluster, type)}
            maxClusterRadius={50}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={true}
          >
            {groupedDrivers[type].map((driver: Driver) => {
              const [lng, lat] = driver.location.coordinates;
              const isCharge = driver.serviceType?.includes('sarj');

              return (
                <Marker 
                  key={driver._id} 
                  position={[lat, lng]}
                  icon={createCustomIcon(driver.serviceType, currentZoom)}
                >
                  <Popup className="custom-popup" minWidth={240}>
                    <div className="p-1 font-sans">
                      
                      {/* Üst Bilgi */}
                      <div className="mb-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            {driver.serviceType?.replace('_', ' ')}
                          </span>
                          {driver.distance && (
                            <span className="text-[9px] font-bold text-gray-400">
                              {(driver.distance / 1000).toFixed(1)} km
                            </span>
                          )}
                        </div>
                        <div className="font-black text-sm text-gray-900 uppercase leading-tight">
                          {driver.firstName} {driver.lastName}
                        </div>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={10} className={`${s <= (driver.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>

                      {/* Navigasyon */}
                      <div className="flex gap-1.5 mb-3">
                        <button onClick={() => handleDrawRoute(lat, lng)} className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                          {isRouting ? '...' : <><Navigation size={12} /> ROTA</>}
                        </button>
                        <button onClick={() => window.open(`http://maps.google.com/?daddr=${lat},${lng}`, '_blank')} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                          <MapIcon size={12} /> G-MAPS
                        </button>
                      </div>

                      {/* Aksiyon Butonları */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        {isCharge ? (
                          <button onClick={() => driver.reservationUrl && window.open(driver.reservationUrl, '_blank')} className={`w-full py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${driver.reservationUrl ? 'bg-blue-600 text-white shadow-lg active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                            <CalendarCheck size={14} /> REZERVASYON YAP
                          </button>
                        ) : (
                          <>
                            <button onClick={() => { onStartOrder(driver, 'call'); window.location.href = `tel:${driver.phoneNumber}`; }} className="flex-1 bg-black text-white py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 active:scale-95 shadow-lg">ARA</button>
                            <button onClick={() => { onStartOrder(driver, 'message'); window.open(`https://wa.me/${driver.phoneNumber?.replace(/\D/g, '')}`, '_blank'); }} className="flex-1 bg-green-600 text-white py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 active:scale-95 shadow-lg">WP</button>
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