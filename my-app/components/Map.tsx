'use client';

// --- LEAFLET & REACT ---
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// --- ICONS (LUCIDE REACT) ---
import { 
  Truck, Zap, Anchor, Star, 
  CalendarCheck, CarFront, Globe, Home, Navigation, Phone, MessageCircle, Package, MapPin
} from 'lucide-react';

// --- 1. TİPLER (DB VE FRONTEND UYUMLU) ---
interface Driver {
  _id: string;
  businessName: string; 
  distance?: number;
  phoneNumber?: string;
  rating?: number;
  location: {
    coordinates: [number, number]; // [lng, lat] formatı (MongoDB GeoJSON)
  };
  reservationUrl?: string;
  
  // 🔥 KÜMELEME İÇİN KRİTİK: ŞEHİR BİLGİSİ
  address?: {
    city?: string;
    district?: string;
  };

  // HİZMET TİPLERİ
  service?: {
    mainType: string;
    subType: string; // 'istasyon', 'MOBIL_UNIT', 'vinc' vs.
    tags: string[];
  };

  // FRONTEND STATE (Hesaplananlar)
  isCluster?: boolean;
  count?: number;
  expansionZoom?: number;
  clusterServiceType?: string; // Kümenin rengi için
}

interface MapProps {
  searchCoords: [number, number] | null; // Arama yapılınca gelen koordinat
  drivers: Driver[]; // Tüm DB verisi
  onStartOrder: (driver: Driver, method: 'call' | 'message') => void;
  activeDriverId: string | null;
  onSelectDriver: (id: string | null) => void;
  onMapMove?: (lat: number, lng: number, zoom: number) => void;
  onMapClick?: () => void;
}

// --- 2. SERVİS RENK VE İKON YAPILANDIRMASI (KOYU TON MANTIĞI) ---
const SERVICE_CONFIG: any = {
  // KURTARICI GRUBU (Kırmızı Tonları)
  kurtarici:    { color: '#ef4444', Icon: CarFront, label: 'Kurtarıcı' },        
  oto_kurtarma: { color: '#dc2626', Icon: CarFront, label: 'Oto Kurtarma' },   // Daha koyu
  vinc:         { color: '#b91c1c', Icon: Anchor, label: 'Vinç' },             // En koyu
  
  // NAKLİYE GRUBU (Mor Tonları)
  nakliye:           { color: '#a855f7', Icon: Truck, label: 'Nakliye' },             
  evden_eve:         { color: '#9333ea', Icon: Home, label: 'Evden Eve' },           
  kamyon:            { color: '#7e22ce', Icon: Truck, label: 'Kamyon' },             
  tir:               { color: '#6b21a8', Icon: Truck, label: 'TIR' },               // Çok koyu mor
  kamyonet:          { color: '#581c87', Icon: Package, label: 'Kamyonet' },        // En koyu mor
  yurt_disi_nakliye: { color: '#4338ca', Icon: Globe, label: 'Uluslararası' },      // İndigo (Farklılaşsın diye)
  yurt_disi:         { color: '#4338ca', Icon: Globe, label: 'Uluslararası' }, 
  
  // ŞARJ GRUBU (Mavi Tonları)
  sarj:           { color: '#3b82f6', Icon: Zap, label: 'Şarj' }, 
  sarj_istasyonu: { color: '#2563eb', Icon: Navigation, label: 'İstasyon' },
  istasyon:       { color: '#1d4ed8', Icon: Navigation, label: 'İstasyon' },      // Koyu mavi
  seyyar_sarj:    { color: '#0ea5e9', Icon: Zap, label: 'Mobil Şarj' },           // Açık mavi (Cyan)

  // DİĞER
  other: { color: '#6b7280', Icon: MapPin, label: 'Hizmet' }
};

// --- 3. İKON OLUŞTURUCULAR ---

// A) TEKİL ARAÇ İKONU
const createCustomIcon = (type: string | undefined, zoom: number, isActive: boolean) => {
  const config = SERVICE_CONFIG[type || ''] || SERVICE_CONFIG.other;
  
  // Zoom seviyesine göre ikon boyutu (mobil uyumlu)
  const baseSize = Math.max(32, Math.min(50, isActive ? zoom * 3.5 : zoom * 2.8)); 
  const innerSize = baseSize * 0.55;

  const iconHtml = renderToStaticMarkup(
    <config.Icon size={innerSize} color="white" strokeWidth={2.5} />
  );

  return L.divIcon({
    className: `custom-pin-marker ${isActive ? 'z-[999]' : ''}`,
    html: `
      <div style="
        background-color: ${isActive ? '#16a34a' : config.color}; 
        width: ${baseSize}px; 
        height: ${baseSize}px; 
        border-radius: 50% 50% 50% 0; 
        transform: rotate(-45deg); 
        border: ${isActive ? '3px' : '2px'} solid white; 
        box-shadow: ${isActive ? '0 0 20px rgba(22, 163, 74, 0.6)' : '0 3px 8px rgba(0,0,0,0.3)'}; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        transition: all 0.2s ease-out;">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
          ${iconHtml}
        </div>
      </div>
    `,
    iconSize: [baseSize, baseSize], 
    iconAnchor: [baseSize / 2, baseSize], // Pinin ucu tam konuma
    popupAnchor: [0, -baseSize] 
  });
};

// B) KÜME (CLUSTER) İKONU
const createClusterIcon = (count: number, type: string) => {
  const config = SERVICE_CONFIG[type || ''] || SERVICE_CONFIG.other;
  const size = 40 + (Math.min(count, 100) / 100) * 15; // 40px ile 55px arası değişir

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
        border: 3px solid rgba(255,255,255,0.9);
        box-shadow: 0 4px 15px rgba(0,0,0,0.25);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 0.95;">
        
        <div style="margin-bottom: -2px;">${iconHtml}</div>
        
        <div style="
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont;
          font-weight: 800;
          font-size: ${size * 0.28}px;
          color: white;
          line-height: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
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
      // Sadece harita zeminine tıklanırsa tetikle (marker'a değil)
      // @ts-ignore
      if (e.originalEvent.target.classList.contains('leaflet-container')) {
        if (onMapClick) onMapClick();
      }
    }
  });
  return null;
}

// Koordinat değişince uçuş animasyonu
function MapController({ coords, activeDriverCoords }: { coords: [number, number] | null, activeDriverCoords: [number, number] | null }) {
  const map = useMap();
  const hasFlown = useRef(false);

  useEffect(() => {
    // Aktif bir sürücü seçildiyse oraya git
    if (activeDriverCoords) {
      map.flyTo(activeDriverCoords, 16, { duration: 1.2, easeLinearity: 0.25 });
    } 
    // Kullanıcı arama yaptıysa oraya git
    else if (coords) {
      map.flyTo(coords, 14, { duration: 1.5 });
      hasFlown.current = true;
    }
  }, [coords, activeDriverCoords, map]);
  
  return null;
}

// --- 5. ANA BİLEŞEN ---
export default function Map({ searchCoords, drivers, onStartOrder, activeDriverId, onSelectDriver, onMapMove, onMapClick }: MapProps) {
  // Varsayılan zoom: Eğer arama yoksa 6 (Tüm Türkiye), varsa 13
  const [currentZoom, setCurrentZoom] = useState(searchCoords ? 13 : 6);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});

  // Harita Merkezi: Arama varsa orası, yoksa Türkiye'nin ortası
  const initialCenter: [number, number] = searchCoords || [39.1667, 35.6667]; 

  const activeDriverCoords = useMemo(() => {
    if (!activeDriverId) return null;
    const driver = drivers.find(d => d._id === activeDriverId);
    if (driver && driver.location) return [driver.location.coordinates[1], driver.location.coordinates[0]] as [number, number];
    return null;
  }, [activeDriverId, drivers]);

  // --- KÜMELEME MANTIĞI ---
  const visibleMarkers = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];

    // Zoom 11 ve üzeri ise (Şehir içi/Mahalle) kümelemeyi kapat, hepsini göster
    if (currentZoom >= 11) {
      return drivers.map(d => ({ ...d, isCluster: false }));
    }

    const clusters: Driver[] = [];
    const processedIndices = new Set<number>();
    
    // Zoom seviyesine göre birleştirme mesafesi (derece cinsinden)
    // Zoom uzaklaştıkça (değer düştükçe) threshold artar
    const threshold = 60 / Math.pow(2, currentZoom); 

    drivers.forEach((driver, index) => {
      // Aktif seçili sürücü asla kümelenmez
      if (driver._id === activeDriverId) {
        clusters.push({ ...driver, isCluster: false });
        processedIndices.add(index);
        return;
      }

      if (processedIndices.has(index)) return;

      const clusterGroup = [driver];
      processedIndices.add(index);

      // Lider özellikleri
      const groupSubType = driver.service?.subType || 'other';
      const groupCity = driver.address?.city;

      for (let i = index + 1; i < drivers.length; i++) {
        if (processedIndices.has(i)) continue;
        const other = drivers[i];
        
        if (other._id === activeDriverId) continue;
        if (!other.location) continue;

        // Farklı şehirleri asla birleştirme (Opsiyonel: İstersen bu satırı kaldırabilirsin)
        if (groupCity && other.address?.city && groupCity !== other.address.city) {
            continue; 
        }

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
          clusterServiceType: groupSubType,
          isCluster: true,
          count: clusterGroup.length,
          expansionZoom: currentZoom + 3 // Tıklanınca ne kadar zoom yapacağı
        } as Driver);
      } else {
        clusters.push({ ...driver, isCluster: false });
      }
    });

    return clusters;
  }, [drivers, currentZoom, activeDriverId]);

  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-gray-50">
      <MapContainer 
        center={initialCenter} 
        zoom={currentZoom} 
        zoomControl={false} 
        className="w-full h-full"
        minZoom={5}
        maxZoom={18}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          // Daha temiz bir harita stili için CartoDB Voyager kullanıyoruz
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapEvents 
          onZoomChange={setCurrentZoom} 
          onMapMove={onMapMove} 
          onMapClick={onMapClick} 
        />
        
        <MapController coords={searchCoords} activeDriverCoords={activeDriverCoords} />

        {/* Kullanıcı Konum Pini (Arama Yapıldıysa) */}
        {searchCoords && (
          <Marker position={searchCoords} icon={
            L.divIcon({
              className: 'user-marker',
              html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 10px rgba(59, 130, 246, 0.2); animation: pulse 2s infinite;"></div>`,
              iconSize: [20, 20], iconAnchor: [10, 10],
            })
          }>
            <Popup>Seçilen Konum</Popup>
          </Marker>
        )}

        {/* Markerlar ve Kümeler */}
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
                 icon={createClusterIcon(item.count || 0, item.clusterServiceType || 'other')}
                 eventHandlers={{
                   click: (e) => {
                     // Kümeye tıklanınca içine zoom yap
                     e.target._map.flyTo([lat, lng], (item.expansionZoom || currentZoom + 3));
                   }
                 }}
               />
             );
          }

          // B) TEKİL GÖRÜNÜM
          const isActive = activeDriverId === item._id;
          const subType = item.service?.subType || 'other';
          const config = SERVICE_CONFIG[subType] || SERVICE_CONFIG.other;
          
          const isStation = subType === 'istasyon' || subType === 'sarj_istasyonu';
          const displayName = item.businessName || 'İsimsiz İşletme';

          return (
            <Marker 
              key={item._id} 
              position={[lat, lng]}
              ref={(el) => { 
                markerRefs.current[item._id] = el; 
                if (el && isActive) setTimeout(() => el.openPopup(), 100);
              }}
              icon={createCustomIcon(subType, currentZoom, isActive)}
              eventHandlers={{
                click: () => onSelectDriver(item._id) 
              }}
            >
              <Popup className="custom-popup" minWidth={260} closeButton={false}>
                <div className="p-0.5 font-sans text-gray-800">
                  {/* Başlık ve Etiket */}
                  <div className="mb-3">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-sm" style={{ backgroundColor: config.color }}>
                        {config.label}
                      </span>
                      {item.distance && (
                         <span className="text-[10px] text-gray-500 font-medium">{item.distance.toFixed(1)} km</span>
                      )}
                    </div>
                    <div className="font-extrabold text-sm text-gray-900 leading-tight">
                      {displayName}
                    </div>
                    {/* Yıldızlar */}
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={11} className={`${s <= (item.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                      ))}
                      <span className="text-[10px] text-gray-400 ml-1">({item.rating || 0})</span>
                    </div>
                  </div>

                  {/* Aksiyon Butonları */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {isStation ? (
                      <button 
                        onClick={() => {
                            onSelectDriver(null); 
                            if (item.reservationUrl) window.open(item.reservationUrl, '_blank');
                        }} 
                        className={`w-full py-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-2 transition-all ${item.reservationUrl ? 'bg-blue-600 text-white shadow-md active:scale-95 hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
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
                            className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-2 active:scale-95 shadow-md hover:bg-black transition-colors"
                        >
                            <Phone size={14} /> ARA
                        </button>
                        <button 
                            onClick={() => { 
                                onStartOrder(item, 'message'); 
                                onSelectDriver(null); 
                                window.open(`https://wa.me/${item.phoneNumber?.replace(/\D/g, '')}`, '_blank'); 
                            }} 
                            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-2 active:scale-95 shadow-md hover:bg-green-700 transition-colors"
                        >
                            <MessageCircle size={14} /> WHATSAPP
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