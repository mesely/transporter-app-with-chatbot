'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
 // Yolun doğru olduğundan emin ol
import TopBar from '../components/home/TopBar';         // Yolun doğru olduğundan emin ol
import { MessageCircle, X } from 'lucide-react';  // Chat butonu için
import ActionPanel from '../components/home/ActionPanel';

// Haritayı Client-Side render etmemiz lazım (SSR Hatası almamak için)
const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-screen bg-gray-100 flex items-center justify-center text-gray-400">Harita Yükleniyor...</div>
});

// Yeni DB yapısına uygun tip
interface Driver {
  _id: string;
  businessName: string;
  firstName?: string; // Yedek
  lastName?: string;  // Yedek
  distance: number;
  phoneNumber?: string;
  rating?: number;
  location: { coordinates: [number, number] };
  service?: { mainType: string; subType: string; tags: string[] };
  pricing?: { openingFee: number; pricePerUnit: number };
}

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

export default function Home() {
  // --- STATE YÖNETİMİ ---
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [actionType, setActionType] = useState('kurtarici'); // Varsayılan kategori
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Chat State
  const [chatOpen, setChatOpen] = useState(false);

  // --- VERİ ÇEKME FONKSİYONU ---
  const fetchDrivers = useCallback(async (lat: number, lng: number, type: string) => {
    setLoading(true);
    try {
      // Backend'deki yeni endpoint yapısına uygun istek
      // zoom=13 diyerek "smart map" yerine detaylı liste çekiyoruz
      const res = await fetch(`${API_URL}/users/nearby?lat=${lat}&lng=${lng}&type=${type}&zoom=15`);
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

  // --- HANDLERS (Olay İşleyiciler) ---

  // 1. Konum Değişince (ActionPanel'den veya GPS'ten gelir)
  const handleSearchLocation = (lat: number, lng: number) => {
    setSearchCoords([lat, lng]);
    fetchDrivers(lat, lng, actionType);
  };

  // 2. Kategori/Filtre Değişince
  const handleFilterApply = (type: string) => {
    setActionType(type);
    if (searchCoords) {
      fetchDrivers(searchCoords[0], searchCoords[1], type);
    }
  };

  // 3. Sipariş Başlatma
  const handleStartOrder = (driver: Driver, method: 'call' | 'message') => {
    console.log(`Sipariş: ${driver.businessName} - Yöntem: ${method}`);
    // Buraya sipariş oluşturma API isteği eklenebilir
  };

  // 4. Harita Kaydırılınca (Opsiyonel: Kaydırdıkça yeni veri çekmek istersen)
  const handleMapMove = (lat: number, lng: number, zoom: number) => {
    // Çok sık istek atmamak için debounce eklenebilir
    // Şimdilik sadece konumu güncelleyelim
    // fetchDrivers(lat, lng, actionType); 
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-gray-50">
      
      {/* 1. ÜST BAR (TopBar) */}
      <TopBar 
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onProfileClick={() => console.log("Profil tıklandı")}
        // user={{ firstName: "Ahmet" }} // Giriş yapmışsa burayı doldur
      />

      {/* 2. HARİTA KATMANI (En altta - z-0) */}
      <div className="absolute inset-0 z-0">
        <Map 
          searchCoords={searchCoords}
          drivers={drivers} // Yeni DB uyumlu liste
          onStartOrder={handleStartOrder}
          activeDriverId={activeDriverId}
          onSelectDriver={setActiveDriverId}
          onMapMove={handleMapMove}
          onMapClick={() => setActiveDriverId(null)} // Boşa tıklayınca seçimi kaldır
        />
      </div>

      {/* 3. AKSİYON PANELİ (Alt Çekmece - z-[1000]) */}
      <ActionPanel 
        onSearchLocation={handleSearchLocation}
        onFilterApply={handleFilterApply}
        onStartOrder={handleStartOrder}
        actionType={actionType}
        onActionChange={setActionType}
        drivers={drivers}
        loading={loading}
        onReset={() => {}}
        activeDriverId={activeDriverId}
        onSelectDriver={setActiveDriverId}
      />

      {/* 4. CHAT BUTONU (Sağ Üst - Floating) */}
      <div className="absolute top-28 right-4 z-[900]">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"
        >
          {chatOpen ? <X size={20} /> : <MessageCircle size={24} />}
        </button>
      </div>

      {/* 5. CHAT PENCERESİ (Basit Placeholder) */}
      {chatOpen && (
        <div className="absolute top-44 right-4 w-80 h-96 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 z-[900] p-4 flex flex-col animate-in slide-in-from-right-10 fade-in">
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm font-bold">
            Yapay Zeka Asistanı Burada Olacak
          </div>
        </div>
      )}

      {/* 6. SIDEBAR (Sol Menü - Placeholder) */}
      <div className={`absolute top-0 left-0 h-full w-64 bg-white shadow-2xl z-[1100] transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 pt-20">
          <h2 className="text-xl font-black mb-6">MENÜ</h2>
          <ul className="space-y-4 text-gray-600 font-bold">
            <li className="hover:text-black cursor-pointer">Siparişlerim</li>
            <li className="hover:text-black cursor-pointer">Cüzdan</li>
            <li className="hover:text-black cursor-pointer">Ayarlar</li>
            <li className="text-red-500 mt-10 cursor-pointer">Çıkış Yap</li>
          </ul>
        </div>
      </div>

      {/* Sidebar açılınca arkaplanı karart */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[1050]"
        />
      )}

    </main>
  );
}