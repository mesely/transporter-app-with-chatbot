'use client';

// --- LEAFLET & REACT ---
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// --- ICONS ---
import { 
  Truck, Zap, Wrench, Anchor, Star, 
  CalendarCheck, CarFront, Globe, Home, Navigation, Phone, MessageCircle 
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
  activeDriverId: string | null;
  onSelectDriver: (id: string | null) => void;
  onMapMove?: (lat: number, lng: number) => void;
  onMapClick?: () => void;
}

// --- 2. ÖZGÜN SERVİS YAPILANDIRMASI (ACTION PANEL İLE %100 UYUMLU) ---
const SERVICE_CONFIG: any = {
  // KURTARICI GRUBU
  kurtarici: { color: '#dc2626', Icon: CarFront },        
  oto_kurtarma: { color: '#dc2626', Icon: CarFront },   
  vinc: { color: '#7f1d1d', Icon: Anchor },             

  // NAKLİYE GRUBU
  nakliye: { color: '#9333ea', Icon: Truck },             
  evden_eve: { color: '#9333ea', Icon: Home },           
  kamyon: { color: '#9333ea', Icon: Truck },             
  tir: { color: '#9333ea', Icon: Truck },                

  // YURT DIŞI
  yurt_disi_nakliye: { color: '#4338ca', Icon: Globe },  

  // ŞARJ GRUBU
  sarj_istasyonu: { color: '#2563eb', Icon: Navigation },      
  seyyar_sarj: { color: '#06b6d4', Icon: Zap },         
  sarj: { color: '#2563eb', Icon: Navigation },               

  other: { color: '#6b7280', Icon: Truck }
};

// --- 3. DİNAMİK İKON TASARIMI ---
const createCustomIcon = (type: string | undefined, zoom: number, isActive: boolean) => {
  const config = SERVICE_CONFIG[type || ''] || SERVICE_CONFIG.other;
  const baseSize = Math.max(28, Math.min(55, isActive ? zoom * 2.8 : zoom * 2.2)); 
  const innerSize = baseSize * 0.55;

  const iconHtml = renderToStaticMarkup(
    <config.Icon size={innerSize} color="white" strokeWidth={2.5} />
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
        border: 3px solid white; 
        box-shadow: ${isActive ? '0 0 25px rgba(34, 197, 94, 0.7)' : '0 6px 14px rgba(0,0,0,0.3)'}; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        transition: all 0.4s ease;">
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

// --- 4. HARİTA KONTROLLERİ ---
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
    click: (e) => {
      if (e.originalEvent.target === map.getContainer() || (e.originalEvent.target as any).classList.contains('leaflet-container')) {
        if (onMapClick) onMapClick();
      }
    }
  });
  return null;
}

function MapController({ coords, activeDriverCoords }: { coords: [number, number] | null, activeDriverCoords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (activeDriverCoords) {
      map.flyTo(activeDriverCoords, 16, { duration: 1.5 });
    } else if (coords) {
      map.flyTo(coords, 13, { duration: 2 });
    }
  }, [coords, activeDriverCoords, map]);
  return null;
}

// --- 5. ANA BİLEŞEN ---
export default function Map({ searchCoords, drivers, onStartOrder, activeDriverId, onSelectDriver, onMapMove, onMapClick }: MapProps) {
  const [currentZoom, setCurrentZoom] = useState(13);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});

  const activeDriverCoords = useMemo(() => {
    if (!activeDriverId) return null;
    const driver = drivers.find(d => d._id === activeDriverId);
    if (driver) return [driver.location.coordinates[1], driver.location.coordinates[0]] as [number, number];
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
          attribution='© OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapEvents 
          onZoomChange={setCurrentZoom} 
          onMapMove={onMapMove} 
          onMapClick={onMapClick} 
        />
        <MapController coords={searchCoords} activeDriverCoords={activeDriverCoords} />

        {/* Kullanıcı Pin */}
        {searchCoords && (
          <Marker position={searchCoords} icon={
            L.divIcon({
              className: 'user-marker',
              html: `<div style="background-color: #3b82f6; width: 22px; height: 22px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 20px rgba(59, 130, 246, 0.6); animation: pulse 2s infinite;"></div>`,
              iconSize: [22, 22], iconAnchor: [11, 11],
            })
          }>
            <Popup>Konumunuz</Popup>
          </Marker>
        )}

        {/* Sürücü Pinleri */}
        {drivers.map((driver: Driver) => {
          const lng = driver.location.coordinates[0];
          const lat = driver.location.coordinates[1];
          const isActive = activeDriverId === driver._id;
          const isCharge = driver.serviceType?.includes('sarj');

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
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm border border-blue-100">
                        {driver.serviceType === 'yurt_disi_nakliye' 
                            ? 'YURT DIŞI LOJİSTİK' 
                            : driver.serviceType?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="font-black text-sm text-gray-900 uppercase leading-tight">
                      {driver.firstName} {driver.lastName}
                    </div>
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={10} className={`${s <= (driver.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>

                  {/* 🔥 AKSİYON BUTONLARI: TIKLANDIĞI AN HER ŞEYİ KAPATIR 🔥 */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {isCharge ? (
                      <button 
                        onClick={() => {
                            onSelectDriver(null); // Popup'ı Kapat
                            if (driver.reservationUrl) window.open(driver.reservationUrl, '_blank');
                        }} 
                        className={`w-full py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${driver.reservationUrl ? 'bg-blue-600 text-white shadow-lg active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        <CalendarCheck size={14} /> REZERVASYON
                      </button>
                    ) : (
                      <>
                        <button 
                            onClick={() => { 
                                onStartOrder(driver, 'call'); 
                                onSelectDriver(null); // Popup'ı Kapat
                                window.location.href = `tel:${driver.phoneNumber}`; 
                            }} 
                            className="flex-1 bg-black text-white py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                        >
                            <Phone size={14} /> ARA
                        </button>
                        <button 
                            onClick={() => { 
                                onStartOrder(driver, 'message'); 
                                onSelectDriver(null); // Popup'ı Kapat
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
      </MapContainer>
    </div>
  );
}