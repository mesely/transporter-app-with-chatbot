'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation'; 
import { MessageCircle } from 'lucide-react';  

// BİLEŞEN IMPORTLARI
import TopBar from '../components/home/TopBar';         
import ActionPanel from '../components/home/ActionPanel';

// Haritayı Client-Side render ediyoruz
const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center text-gray-400 font-bold animate-pulse">
      Harita Yükleniyor...
    </div>
  )
});

interface Driver {
  _id: string;
  businessName: string;
  distance: number;
  phoneNumber?: string;
  rating?: number;
  location: { coordinates: [number, number] };
  address?: {
    city?: string;
    district?: string;
    fullText?: string;
  };
  service?: { 
    mainType: string; 
    subType: string; 
    tags: string[] 
  };
  pricing?: { 
    openingFee: number; 
    pricePerUnit: number; 
  };
}

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

export default function Home() {
  const router = useRouter(); 

  // --- STATE YÖNETİMİ ---
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Konum ve Seçim
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [actionType, setActionType] = useState('kurtarici'); 
  const [mapZoom, setMapZoom] = useState<number>(13); 
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- 1. VERİ ÇEKME FONKSİYONU ---
  const fetchDrivers = useCallback(async (lat: number, lng: number, type: string, zoom: number) => {
    setLoading(true);
    try {
      // Backend filtrelemesi bazen geniş olabilir, bu yüzden type'ı URL'e ekliyoruz ama
      // asıl hassas filtrelemeyi aşağıda "filteredForMap" kısmında yapacağız.
      const url = `${API_URL}/users/nearby?lat=${lat}&lng=${lng}&type=${type}&zoom=${zoom}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setDrivers(data);
      } else {
        setDrivers([]);
      }
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔥 EKLENEN KISIM: Harita için Hassas Filtreleme 🔥
  // ActionPanel'deki filtreleme mantığının aynısını buraya uyguluyoruz.
  // Böylece harita, seçilen kategoriye birebir uyan araçları gösterir.
  const filteredForMap = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];
    
    return drivers.filter(d => {
      // 1. Özel Eşleştirmeler (ActionPanel ile uyumlu)
      if (actionType === 'yurt_disi') return d.service?.subType === 'yurt_disi_nakliye';
      if (actionType === 'sarj_istasyonu') return d.service?.subType === 'istasyon';
      if (actionType === 'seyyar_sarj') return d.service?.subType === 'MOBIL_UNIT';
      
      // 2. Ana Kategoriler (Tümünü göster)
      if (actionType === 'kurtarici') return d.service?.mainType === 'KURTARICI';
      if (actionType === 'nakliye') return d.service?.mainType === 'NAKLIYE';
      if (actionType === 'sarj') return d.service?.mainType === 'SARJ';

      // 3. Alt Tipler (Tır, Kamyon, Vinç, Oto Kurtarma vb.)
      // Eğer actionType spesifik bir alt tip ise (örn: 'tir'), sadece onları getir.
      return d.service?.subType === actionType;
    });
  }, [drivers, actionType]);


  // --- BAŞLANGIÇ YÜKLEMESİ ---
  useEffect(() => {
    const TURKEY_CENTER_LAT = 39.1667;
    const TURKEY_CENTER_LNG = 35.6667;
    const INITIAL_ZOOM = 6;
    
    // Sayfa ilk açıldığında 'kurtarici' varsayılan olarak seçili gelir.
    fetchDrivers(TURKEY_CENTER_LAT, TURKEY_CENTER_LNG, 'kurtarici', INITIAL_ZOOM);
  }, [fetchDrivers]); 


  // --- 2. HANDLERS ---
  const handleSearchLocation = (lat: number, lng: number) => {
    setSearchCoords([lat, lng]);
    fetchDrivers(lat, lng, actionType, 13);
  };

  const handleFilterApply = (type: string) => {
    setActionType(type);
    // Filtre değişince veri çek, ama asıl işi yukarıdaki 'filteredForMap' yapacak.
    if (searchCoords) {
      fetchDrivers(searchCoords[0], searchCoords[1], type, mapZoom);
    } else {
      fetchDrivers(39.1667, 35.6667, type, 6);
    }
  };

  const handleMapMove = (lat: number, lng: number, zoom: number) => {
    setMapZoom(zoom); 
  };

  const handleStartOrder = (driver: Driver, method: 'call' | 'message') => {
    console.log(`Sipariş: ${driver.businessName} - Yöntem: ${method}`);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-gray-50">
      
      <TopBar 
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onProfileClick={() => console.log("Profil")}
      />

      {/* HARİTA KISMI */}
      <div className="absolute inset-0 z-0">
        <Map 
          searchCoords={searchCoords}
          // 🔥 DEĞİŞİKLİK BURADA: Artık ham 'drivers' değil, süzülmüş 'filteredForMap' gidiyor.
          drivers={filteredForMap} 
          onStartOrder={handleStartOrder}
          activeDriverId={activeDriverId}
          onSelectDriver={setActiveDriverId}
          onMapMove={handleMapMove}
          onMapClick={() => setActiveDriverId(null)}
        />
      </div>

      <ActionPanel 
        onSearchLocation={handleSearchLocation}
        onFilterApply={handleFilterApply}
        onStartOrder={handleStartOrder}
        actionType={actionType}
        onActionChange={(type) => setActionType(type)}
        drivers={filteredForMap} // Listeye de süzülmüş veriyi göndermek daha tutarlı olur
        loading={loading}
        onReset={() => {
           setSearchCoords(null);
           setActionType('kurtarici'); // Resetlenince başa dön
           fetchDrivers(39.1667, 35.6667, 'kurtarici', 6);
        }}
        activeDriverId={activeDriverId}
        onSelectDriver={setActiveDriverId}
      />

      <div className="absolute top-28 right-4 z-[900]">
        <button
          onClick={() => router.push('/chat')} 
          className="w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform hover:bg-gray-800 border-2 border-white/20"
        >
          <MessageCircle size={24} />
        </button>
      </div>

      <div className={`absolute top-0 left-0 h-full w-72 bg-white shadow-2xl z-[1100] transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 pt-24">
          <h2 className="text-2xl font-black mb-8 tracking-tight">MENÜ</h2>
          <ul className="space-y-6 text-gray-600 font-bold text-lg">
            <li className="hover:text-black cursor-pointer transition-colors">Siparişlerim</li>
            <li className="hover:text-black cursor-pointer transition-colors">Cüzdan</li>
            <li className="hover:text-black cursor-pointer transition-colors">Favoriler</li>
            <li className="hover:text-black cursor-pointer transition-colors">Ayarlar</li>
            <li className="pt-10 text-red-500 hover:text-red-700 cursor-pointer transition-colors">Çıkış Yap</li>
          </ul>
        </div>
      </div>

      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[1050] transition-opacity duration-300"
        />
      )}

    </main>
  );
}