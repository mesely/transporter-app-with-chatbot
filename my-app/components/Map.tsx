'use client';

// --- LEAFLET & REACT ---
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// --- ICONS ---
import { 
  Truck, Zap, Anchor, Star, 
  CalendarCheck, CarFront, Globe, Home, Navigation, Phone, MessageCircle, Package 
} from 'lucide-react';

// --- 1. TİPLER (YENİ DB UYUMLU) ---
interface Driver {
  _id: string;
  businessName: string; // Yeni DB
  distance?: number;
  phoneNumber?: string;
  rating?: number;
  location: {
    coordinates: [number, number]; // [lng, lat]
  };
  reservationUrl?: string;
  
  // Hizmet Tipi (Nested)
  service?: {
    mainType: string;
    subType: string; // 'istasyon', 'MOBIL_UNIT', 'vinc' vs.
    tags: string[];
  };

  // Frontend Kümeleme için geçici alanlar
  isCluster?: boolean;
  count?: number;
  expansionZoom?: number;
  clusterServiceType?: string; // Kümenin rengi için
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

// --- 2. SERVİS RENK VE İKON YAPILANDIRMASI (DB VALUE EŞLEŞTİRMESİ) ---
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
  kamyonet: { color: '#a855f7', Icon: Package }, // Ekstra
  yurt_disi_nakliye: { color: '#4338ca', Icon: Globe },  
  
  // ŞARJ GRUBU (DB'deki 'istasyon' ve 'MOBIL_UNIT' değerlerine dikkat)
  sarj_istasyonu: { color: '#2563eb', Icon: Navigation },
  istasyon: { color: '#2563eb', Icon: Navigation },      // 🔥 DB Value
  
  seyyar_sarj: { color: '#06b6d4', Icon: Zap }, 
  MOBIL_UNIT: { color: '#06b6d4', Icon: Zap },           // 🔥 DB Value
  
  sarj: { color: '#2563eb', Icon: Navigation },               
  
  // DİĞER
  other: { color: '#6b7280', Icon: Truck }
};

// --- 3. İKON OLUŞTURUCULAR ---

// A) TEKİL ARAÇ İKONU
const createCustomIcon = (type: string | undefined, zoom: number, isActive: boolean) => {
  // DB'den gelen type (örn: 'istasyon') config'de yoksa 'other' kullan
  const config = SERVICE_CONFIG[type || ''] || SERVICE_CONFIG.other;
  
  // Zoom'a göre boyut (Uzaklaştıkça küçülür ama kaybolmaz)
  const baseSize = Math.max(30, Math.min(55, isActive ? zoom * 3 : zoom * 2.5)); 
  const innerSize = baseSize * 0.55;

  const iconHtml = renderToStaticMarkup(
    <config.Icon size={innerSize} color="white" strokeWidth={3} />
  );

  return L.divIcon({
    className: `custom-pin-marker ${isActive ? 'z-[999]' : ''}`,
    html: `
      <div style="
        background-color: ${isActive ? '#22c55e' : config.color}; 
        width: ${baseSize}px; 
        height: ${baseSize}px; 
        border-radius: 50% 50% 50% 0; 
        transform: rotate(-45deg); 
        border: 3px solid white; 
        box-shadow: ${isActive ? '0 0 25px rgba(34, 197, 94, 0.8)' : '0 4px 10px rgba(0,0,0,0.4)'}; 
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

// B) KÜME (CLUSTER) İKONU - RENKLİ VE İKONLU
const createClusterIcon = (count: number, type: string) => {
  const config = SERVICE_CONFIG[type || ''] || SERVICE_CONFIG.other;
  const size = 36 + (Math.min(count, 100) / 100) * 24; // Sayı arttıkça büyüyen balon

  const iconHtml = renderToStaticMarkup(
    <config.Icon size={size * 0.4} color="white" strokeWidth={3} />
  );

  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div style="
        background-color: ${config.color}; 
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50%; 
        border: 4px solid rgba(255,255,255,0.85);
        box-shadow: 0 6px 20px rgba(0,0,0,0.35);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.3s ease;">
        
        <div style="margin-bottom: -3px;">${iconHtml}</div>
        
        <div style="
          font-family: 'Inter', sans-serif;
          font-weight: 900;
          font-size: ${size * 0.3}px;
          color: white;
          line-height: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
          ${count}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// --- 4. HARİTA KONTROLLERİ ---
function MapEvents({ onZoomChange, onMapMove, onMapClick }: { 
  onZoomChange: (z: number) => void, 
  onMapMove?: (lat: number, lng: number, zoom: number) => void,
  onMapClick?: () => void 
}) {
  const map = useMapEvents({
    zoomend: () => {
      const z = map.getZoom();
      onZoomChange(z);
      if (onMapMove) {
        const center = map.getCenter();
        onMapMove(center.lat, center.lng, z);
      }
    },
    moveend: () => {
      if (onMapMove) {
        const center = map.getCenter();
        const z = map.getZoom();
        onMapMove(center.lat, center.lng, z);
      }
    },
    click: (e) => {
      if ((e.originalEvent.target as HTMLElement).classList.contains('leaflet-container')) {
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
      map.flyTo(activeDriverCoords, 16, { duration: 1.5, easeLinearity: 0.25 });
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
  const mapRef = useRef<L.Map | null>(null);

  const activeDriverCoords = useMemo(() => {
    if (!activeDriverId) return null;
    const driver = drivers.find(d => d._id === activeDriverId);
    if (driver && driver.location) return [driver.location.coordinates[1], driver.location.coordinates[0]] as [number, number];
    return null;
  }, [activeDriverId, drivers]);

  // 🔥 CLUSTERING (KÜMELEME) ALGORİTMASI - AGRESİF & RENKLİ
  const visibleMarkers = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];

    // Zoom 12 ve üzeri ise (çok yakınsa) kümeleme yapma, hepsini göster
    if (currentZoom >= 12) {
      return drivers.map(d => ({ ...d, isCluster: false }));
    }

    const clusters: Driver[] = [];
    const processedIndices = new Set<number>();
    
    // Zoom uzaklaştıkça (değer azaldıkça) threshold çok daha hızlı artmalı.
    // Örn Zoom 5: 120 / 32 = 3.75 derece (Tüm Marmara'yı toplayabilir)
    // Örn Zoom 10: 120 / 1024 = 0.1 derece (İlçe bazlı)
    const threshold = 120 / Math.pow(2, currentZoom); 

    drivers.forEach((driver, index) => {
      // Aktif seçili sürücüyü asla kümeye sokma
      if (driver._id === activeDriverId) {
        clusters.push({ ...driver, isCluster: false });
        processedIndices.add(index);
        return;
      }

      if (processedIndices.has(index)) return;

      const clusterGroup = [driver];
      processedIndices.add(index);

      // Grup liderinin tipi (Renk için)
      const groupSubType = driver.service?.subType || 'other';

      for (let i = index + 1; i < drivers.length; i++) {
        if (processedIndices.has(i)) continue;
        const other = drivers[i];
        
        if (other._id === activeDriverId) continue; // Aktif olanı atla
        if (!other.location) continue;

        const dLat = Math.abs(driver.location.coordinates[1] - other.location.coordinates[1]);
        const dLng = Math.abs(driver.location.coordinates[0] - other.location.coordinates[0]);

        if (dLat < threshold && dLng < threshold) {
           clusterGroup.push(other);
           processedIndices.add(i);
        }
      }

      if (clusterGroup.length > 1) {
        clusters.push({
          _id: `cluster-${index}`,
          businessName: 'Küme',
          location: driver.location, 
          clusterServiceType: groupSubType, // 🔥 RENK İÇİN
          isCluster: true,
          count: clusterGroup.length,
          expansionZoom: currentZoom + 3 
        } as Driver);
      } else {
        clusters.push({ ...driver, isCluster: false });
      }
    });

    return clusters;
  }, [drivers, currentZoom, activeDriverId]);

  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-gray-100">
      <MapContainer 
        center={searchCoords || [38.4237, 27.1428]} 
        zoom={13} 
        zoomControl={false} 
        className="w-full h-full"
        ref={mapRef}
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

        {visibleMarkers.map((item: Driver) => {
          const lat = item.location?.coordinates[1];
          const lng = item.location?.coordinates[0];
          
          if (!lat || !lng) return null;

          // A) KÜME GÖRÜNÜMÜ
          if (item.isCluster) {
             return (
               <Marker
                 key={item._id}
                 position={[lat, lng]}
                 // 🔥 type bilgisini doğru gönderiyoruz
                 icon={createClusterIcon(item.count || 0, item.clusterServiceType || 'other')}
                 eventHandlers={{
                   click: (e) => {
                     e.target._map.flyTo([lat, lng], (item.expansionZoom || currentZoom + 3));
                   }
                 }}
               />
             );
          }

          // B) TEKİL GÖRÜNÜM
          const isActive = activeDriverId === item._id;
          const subType = item.service?.subType || 'other';
          const isStation = subType === 'istasyon' || subType === 'sarj_istasyonu';
          const displayName = item.businessName || 'İsimsiz İşletme';

          return (
            <Marker 
              key={item._id} 
              position={[lat, lng]}
              ref={(el) => { 
                markerRefs.current[item._id] = el; 
                if (el && isActive) el.openPopup(); 
              }}
              icon={createCustomIcon(subType, currentZoom, isActive)}
              eventHandlers={{
                click: () => onSelectDriver(item._id) 
              }}
            >
              <Popup className="custom-popup" minWidth={240} closeButton={false}>
                <div className="p-1 font-sans">
                  <div className="mb-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm border border-blue-100">
                        {subType === 'yurt_disi_nakliye' ? 'YURT DIŞI' : subType.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    {/* 🔥 İŞLETME ADI */}
                    <div className="font-black text-sm text-gray-900 uppercase leading-tight">
                      {displayName}
                    </div>
                    
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={10} className={`${s <= (item.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {/* İSTASYON İSE SADECE ROTA */}
                    {isStation ? (
                      <button 
                        onClick={() => {
                            onSelectDriver(null); 
                            if (item.reservationUrl) window.open(item.reservationUrl, '_blank');
                        }} 
                        className={`w-full py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${item.reservationUrl ? 'bg-blue-600 text-white shadow-lg active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        <CalendarCheck size={14} /> REZERVASYON / ROTA
                      </button>
                    ) : (
                      <>
                        <button 
                            onClick={() => { 
                                onStartOrder(item, 'call'); 
                                onSelectDriver(null); 
                                window.location.href = `tel:${item.phoneNumber}`; 
                            }} 
                            className="flex-1 bg-black text-white py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                        >
                            <Phone size={14} /> ARA
                        </button>
                        <button 
                            onClick={() => { 
                                onStartOrder(item, 'message'); 
                                onSelectDriver(null); 
                                window.open(`https://wa.me/${item.phoneNumber?.replace(/\D/g, '')}`, '_blank'); 
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