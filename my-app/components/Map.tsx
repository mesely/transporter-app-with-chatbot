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
  CalendarCheck, CarFront, Globe, Home, Navigation, Phone, MessageCircle 
} from 'lucide-react';

// --- 1. TİPLER (Yeni DB Yapısına Uygun) ---
interface Driver {
  _id: string;
  businessName?: string; // Yeni DB
  firstName?: string;    // Eski DB (Yedek)
  lastName?: string;     // Eski DB (Yedek)
  distance?: number;
  phoneNumber?: string;
  serviceType?: string;
  rating?: number;
  location: {
    coordinates: [number, number]; // [lng, lat]
  };
  reservationUrl?: string;
  
  // Frontend işlemleri için geçici alanlar
  isCluster?: boolean;
  count?: number;
  expansionZoom?: number;
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

// --- 2. SERVİS İKON YAPILANDIRMASI ---
const SERVICE_CONFIG: any = {
  kurtarici: { color: '#dc2626', Icon: CarFront },        
  oto_kurtarma: { color: '#dc2626', Icon: CarFront },   
  vinc: { color: '#7f1d1d', Icon: Anchor },             
  nakliye: { color: '#9333ea', Icon: Truck },             
  evden_eve: { color: '#9333ea', Icon: Home },           
  kamyon: { color: '#9333ea', Icon: Truck },             
  tir: { color: '#9333ea', Icon: Truck },                
  yurt_disi_nakliye: { color: '#4338ca', Icon: Globe },  
  sarj_istasyonu: { color: '#2563eb', Icon: Navigation },      
  seyyar_sarj: { color: '#06b6d4', Icon: Zap },         
  sarj: { color: '#2563eb', Icon: Navigation },               
  other: { color: '#6b7280', Icon: Truck }
};

// --- 3. İKON OLUŞTURUCULAR ---

// A) TEKİL ARAÇ İKONU
const createCustomIcon = (type: string | undefined, zoom: number, isActive: boolean) => {
  const config = SERVICE_CONFIG[type || ''] || SERVICE_CONFIG.other;
  // Zoom seviyesine göre boyut ayarla (çok küçük olmasın)
  const baseSize = Math.max(32, Math.min(55, isActive ? zoom * 3 : zoom * 2.5)); 
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
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
          ${iconHtml}
        </div>
      </div>
    `,
    iconSize: [baseSize, baseSize], 
    iconAnchor: [baseSize / 2, baseSize], 
    popupAnchor: [0, -baseSize] // Popup tam tepede çıksın
  });
};

// B) KÜME (CLUSTER) İKONU (5-6 Gibi Yazma Mantığı)
const createClusterIcon = (count: number) => {
  const size = 30 + (Math.min(count, 100) / 100) * 20; // Sayıya göre büyüyen balon

  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div style="
        background-color: #111827;
        color: white;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid rgba(255,255,255,0.8);
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: sans-serif;
        font-weight: 900;
        font-size: ${size * 0.4}px;">
        ${count}
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
      // Haritanın boş yerine tıklayınca seçimi kaldır
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

  // Aktif sürücü koordinatları
  const activeDriverCoords = useMemo(() => {
    if (!activeDriverId) return null;
    const driver = drivers.find(d => d._id === activeDriverId);
    if (driver && driver.location) return [driver.location.coordinates[1], driver.location.coordinates[0]] as [number, number];
    return null;
  }, [activeDriverId, drivers]);

  // 🔥 CLUSTERING ALGORİTMASI (Manuel Gruplama)
  const visibleMarkers = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];

    // Zoom seviyesi 11'den büyükse (yakınsa) gruplama yapma, hepsini göster
    if (currentZoom >= 11) {
      return drivers.map(d => ({ ...d, isCluster: false }));
    }

    const clusters: Driver[] = [];
    const processedIndices = new Set<number>();
    
    // Zoom seviyesine göre gruplama mesafesi (Uzaklaştıkça mesafe artar)
    // Bu değer derece cinsindendir (kabaca).
    const threshold = 15 / Math.pow(2, currentZoom); 

    drivers.forEach((driver, index) => {
      if (processedIndices.has(index)) return;

      const clusterGroup = [driver];
      processedIndices.add(index);

      // Diğer sürücülere bak, yakın olanları bu gruba al
      for (let i = index + 1; i < drivers.length; i++) {
        if (processedIndices.has(i)) continue;
        
        const other = drivers[i];
        if (!other.location) continue;

        const dLat = Math.abs(driver.location.coordinates[1] - other.location.coordinates[1]);
        const dLng = Math.abs(driver.location.coordinates[0] - other.location.coordinates[0]);

        // Basit öklid mesafesi (Kareköksüz performans için yeterli)
        if (dLat < threshold && dLng < threshold) {
           clusterGroup.push(other);
           processedIndices.add(i);
        }
      }

      if (clusterGroup.length > 1) {
        // Küme Oluştur
        clusters.push({
          _id: `cluster-${index}`,
          businessName: 'Grup',
          location: driver.location, // Grubun merkezi ilk eleman olsun
          isCluster: true,
          count: clusterGroup.length,
          expansionZoom: currentZoom + 2 // Tıklayınca ne kadar zoom yapacak
        } as Driver);
      } else {
        // Tekil Eleman
        clusters.push({ ...driver, isCluster: false });
      }
    });

    return clusters;
  }, [drivers, currentZoom]);

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

        {/* --- DİNAMİK MARKER RENDER --- */}
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
                 icon={createClusterIcon(item.count || 0)}
                 eventHandlers={{
                   click: (e) => {
                     // Kümeye tıklayınca oraya zoom yap
                     e.target._map.flyTo([lat, lng], (item.expansionZoom || currentZoom + 2));
                   }
                 }}
               />
             );
          }

          // B) TEKİL ARAÇ GÖRÜNÜMÜ
          const isActive = activeDriverId === item._id;
          const isCharge = item.serviceType?.includes('sarj');
          const displayName = item.businessName || `${item.firstName} ${item.lastName}` || 'İsimsiz Sürücü';

          return (
            <Marker 
              key={item._id} 
              position={[lat, lng]}
              ref={(el) => { 
                markerRefs.current[item._id] = el; 
                if (el && isActive) el.openPopup(); 
              }}
              icon={createCustomIcon(item.serviceType, currentZoom, isActive)}
              eventHandlers={{
                click: () => onSelectDriver(item._id) 
              }}
            >
              <Popup className="custom-popup" minWidth={240} closeButton={false}>
                <div className="p-1 font-sans">
                  <div className="mb-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm border border-blue-100">
                        {item.serviceType === 'yurt_disi_nakliye' 
                            ? 'YURT DIŞI LOJİSTİK' 
                            : item.serviceType?.replace('_', ' ').toUpperCase()}
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

                  {/* AKSİYON BUTONLARI */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {isCharge ? (
                      <button 
                        onClick={() => {
                            onSelectDriver(null); 
                            if (item.reservationUrl) window.open(item.reservationUrl, '_blank');
                        }} 
                        className={`w-full py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${item.reservationUrl ? 'bg-blue-600 text-white shadow-lg active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        <CalendarCheck size={14} /> REZERVASYON
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