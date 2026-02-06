'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  Truck, Zap, BatteryCharging, Wrench, 
  Phone, MessageCircle, MapPin, Navigation, Map as MapIcon,
  Construction, Building2, Home, Star, CalendarCheck
} from 'lucide-react';

// --- 1. İKON FABRİKASI (ActionPanel Renkleriyle Senkron) ---
const createCustomIcon = (type?: string) => {
  let color = '#6b7280'; // Varsayılan Gri
  let IconComponent: any = Truck; 

  switch (type) {
    case 'kurtarici': 
      color = '#dc2626'; // Kırmızı
      IconComponent = Wrench; 
      break;
    case 'vinc': 
      color = '#991b1b'; 
      IconComponent = Construction; 
      break;
    case 'nakliye': 
      color = '#9333ea'; // Mor
      IconComponent = Home; 
      break;
    case 'kamyon':
    case 'tir':
    case 'kamyonet':
      color = '#ca8a04'; // Sarı/Ticari
      IconComponent = Truck; 
      break;
    case 'sarj_istasyonu': 
      color = '#2563eb'; // Mavi
      IconComponent = Zap; 
      break;
    case 'seyyar_sarj': 
      color =  '#0891b2'; // Cyan
      IconComponent = BatteryCharging; 
      break;
  }

  const iconHtml = renderToStaticMarkup(<IconComponent size={18} color="white" strokeWidth={3} />);

  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">${iconHtml}</div>
      </div>
    `,
    iconSize: [36, 36], 
    iconAnchor: [18, 36], 
    popupAnchor: [0, -40]
  });
};

const userIcon = L.divIcon({
  className: 'user-marker',
  html: `<div style="background-color: #3b82f6; width: 22px; height: 22px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);"></div>`,
  iconSize: [22, 22], iconAnchor: [11, 11],
});

// --- 2. HARİTA KONTROLCÜSÜ (Dinamik Odaklama) ---
function MapController({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 14, { duration: 2, animate: true });
    }
  }, [coords, map]);
  return null;
}

interface MapProps {
  searchCoords: [number, number] | null;
  drivers: any[];
  onStartOrder: (driver: any, method: 'call' | 'message') => void;
}

// --- 3. ANA HARİTA BİLEŞENİ ---
export default function Map({ searchCoords, drivers, onStartOrder }: MapProps) {
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [isRouting, setIsRouting] = useState(false);

  // Rota Çizme (OSRM)
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
    } catch (error) { console.error("Rota hatası:", error); } 
    finally { setIsRouting(false); }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    // Google Maps URL'i düzeltildi (Dinamik Parametreler)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
  };

  return (
    <div className="absolute inset-0 w-full h-full z-0">
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
        
        {searchCoords && <Marker position={searchCoords} icon={userIcon}><Popup>Buradasınız</Popup></Marker>}

        {routePath.length > 0 && <Polyline positions={routePath} color="#3b82f6" weight={6} opacity={0.6} dashArray="1, 12" lineCap="round" />}

        {drivers.map((driver) => {
          const isCharge = driver.serviceType?.includes('sarj');
          const [lng, lat] = driver.location.coordinates;

          return (
            <Marker 
              key={driver._id} 
              position={[lat, lng]}
              icon={createCustomIcon(driver.serviceType)}
            >
              <Popup className="custom-popup" minWidth={240}>
                <div className="p-1 font-sans">
                  
                  {/* Başlık ve Mesafe */}
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
                    {/* Yıldızlar */}
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={10} className={`${s <= (driver.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Navigasyon Paneli */}
                  <div className="flex gap-1.5 mb-3">
                    <button 
                      onClick={() => handleDrawRoute(lat, lng)}
                      className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      {isRouting ? '...' : <><Navigation size={12} /> ROTA</>}
                    </button>
                    <button 
                      onClick={() => openGoogleMaps(lat, lng)}
                      className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <MapIcon size={12} /> G-MAPS
                    </button>
                  </div>

                  {/* ANA AKSİYON BUTONLARI (ActionPanel İle Aynı Mantık) */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {isCharge ? (
                      // ŞARJ İÇİN REZERVASYON BUTONU
                      <button 
                        onClick={() => driver.reservationUrl && window.open(driver.reservationUrl, '_blank')}
                        className={`w-full py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${
                          driver.reservationUrl 
                            ? 'bg-blue-600 text-white shadow-lg active:scale-95' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <CalendarCheck size={14} /> REZERVASYON YAP
                      </button>
                    ) : (
                      // DİĞERLERİ İÇİN ARA VE MESAJ
                      <>
                        <button 
                          onClick={() => {
                             onStartOrder(driver, 'call');
                             window.location.href = `tel:${driver.phoneNumber}`;
                          }}
                          className="flex-1 bg-black text-white py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                        >
                          <Phone size={14} /> ARA
                        </button>
                        <button 
                          onClick={() => {
                             onStartOrder(driver, 'message');
                             window.open(`https://wa.me/${driver.phoneNumber?.replace(/\D/g, '')}`, '_blank');
                          }}
                          className="flex-1 bg-green-600 text-white py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                        >
                          <MessageCircle size={14} /> WP
                        </button>
                      </>
                    )}
                  </div>

                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapController coords={searchCoords} />
      </MapContainer>
    </div>
  );
}