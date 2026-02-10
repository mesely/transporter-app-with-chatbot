'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; 
import { MessageCircle, X } from 'lucide-react';  

// BİLEŞEN IMPORTLARI
import TopBar from '../components/home/TopBar';         
import ActionPanel from '../components/home/ActionPanel';

// Haritayı Client-Side render ediyoruz (SSR Hatası almamak için)
const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center text-gray-400 font-bold animate-pulse">
      Harita Yükleniyor...
    </div>
  )
});

// 🔥 YENİ DB YAPISINA TAM UYUMLU DRIVER TİPİ
// (Map.tsx ve ActionPanel.tsx ile birebir aynı olmalı)
interface Driver {
  _id: string;
  businessName: string;
  distance: number;
  phoneNumber?: string;
  rating?: number;
  location: { coordinates: [number, number] };
  
  // Nested Alanlar
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
  
  // 🔥 ZOOM SEVİYESİ (Menzil kontrolü için kritik)
  const [mapZoom, setMapZoom] = useState<number>(13); 
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- 1. VERİ ÇEKME FONKSİYONU ---
  const fetchDrivers = useCallback(async (lat: number, lng: number, type: string, zoom: number) => {
    setLoading(true);
    try {
      // Backend'e zoom bilgisini de gönderiyoruz. 
      // Backend: if (zoom < 8) Limit = 3000, MaxDistance = 15000km
      const res = await fetch(`${API_URL}/users/nearby?lat=${lat}&lng=${lng}&type=${type}&zoom=${zoom}`);
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

  // --- 2. HANDLERS ---

  // A) Konum Değişince (ActionPanel'den veya GPS'ten)
  const handleSearchLocation = (lat: number, lng: number) => {
    setSearchCoords([lat, lng]);
    // Konum değişince mevcut zoom seviyesiyle yeniden çek
    fetchDrivers(lat, lng, actionType, mapZoom);
  };

  // B) Filtre Değişince (ActionPanel'den)
  const handleFilterApply = (type: string) => {
    setActionType(type);
    // Konum varsa veriyi yenile (Zoom bilgisini de katarak)
    if (searchCoords) {
      fetchDrivers(searchCoords[0], searchCoords[1], type, mapZoom);
    } else {
      // Eğer henüz konum seçilmediyse varsayılan bir lokasyonla veya
      // kullanıcının o anki GPS konumuyla (ActionPanel içinde bulunur) tetiklenir.
    }
  };

  // C) Harita Hareketi ve Zoom (Map Bileşeninden Gelir)
  const handleMapMove = (lat: number, lng: number, zoom: number) => {
    setMapZoom(zoom); // Zoom seviyesini güncelle
    // İstersen burada "Bu alanda ara" butonu koyup fetchDrivers çağırabilirsin.
    // Şimdilik sadece state güncelliyoruz ki sonraki filtrelemede doğru zoom gitsin.
  };

  // D) Sipariş Başlatma
  const handleStartOrder = (driver: Driver, method: 'call' | 'message') => {
    console.log(`Sipariş: ${driver.businessName} - Yöntem: ${method}`);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-gray-50">
      
      {/* 1. ÜST BAR */}
      <TopBar 
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onProfileClick={() => console.log("Profil")}
      />

      {/* 2. HARİTA KATMANI */}
      <div className="absolute inset-0 z-0">
        <Map 
          searchCoords={searchCoords}
          drivers={drivers} 
          onStartOrder={handleStartOrder}
          activeDriverId={activeDriverId}
          onSelectDriver={setActiveDriverId}
          onMapMove={handleMapMove} // 🔥 Zoom takibi için
          onMapClick={() => setActiveDriverId(null)}
        />
      </div>

      {/* 3. AKSİYON PANELİ */}
      <ActionPanel 
        onSearchLocation={handleSearchLocation}
        onFilterApply={handleFilterApply}
        onStartOrder={handleStartOrder}
        actionType={actionType}
        onActionChange={(type) => setActionType(type)}
        drivers={drivers}
        loading={loading}
        onReset={() => {}}
        activeDriverId={activeDriverId}
        onSelectDriver={setActiveDriverId}
      />

      {/* 4. CHAT BUTONU (Yönlendirmeli) */}
      <div className="absolute top-28 right-4 z-[900]">
        <button
          onClick={() => router.push('/chat')} // 🔥 DİREKT SAYFAYA GİT
          className="w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform hover:bg-gray-800 border-2 border-white/20"
        >
          <MessageCircle size={24} />
        </button>
      </div>

      {/* 5. SIDEBAR */}
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

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[1050] transition-opacity duration-300"
        />
      )}

    </main>
  );
}