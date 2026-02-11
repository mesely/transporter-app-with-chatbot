'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation'; 
import { MessageCircle, Menu, X, User } from 'lucide-react';  

import TopBar from '../components/home/TopBar';         
import ActionPanel from '../components/home/ActionPanel';

const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
       <div className="flex flex-col items-center gap-2">
         <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
         <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Harita Yükleniyor...</span>
       </div>
    </div>
  )
});

// --- ORTAK TİP ---
interface Driver {
  _id: string;
  businessName: string;
  distance: number;
  phoneNumber?: string;
  rating?: number;
  location: { coordinates: [number, number] };
  address?: { city?: string; district?: string; fullText?: string; };
  service?: { mainType: string; subType: string; tags: string[]; };
  pricing?: { openingFee: number; pricePerUnit: number; };
}

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

export default function Home() {
  const router = useRouter(); 

  const [drivers, setDrivers] = useState<Driver[]>([]); 
  const [loading, setLoading] = useState(false);
  
  // State
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [actionType, setActionType] = useState('kurtarici'); 
  const [mapZoom, setMapZoom] = useState<number>(13); 
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 🔥 YENİ: Etiket State'i (Lowbed, Tenteli vb.)
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Veri Çekme
  const fetchDrivers = useCallback(async (lat: number, lng: number, type: string, zoom: number) => {
    setLoading(true);
    try {
      // Backend zoom < 9 ise limit yok (tüm Türkiye)
      const url = `${API_URL}/users/nearby?lat=${lat}&lng=${lng}&type=${type}&zoom=${zoom}`;
      const res = await fetch(url);
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Hata:", error);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // İlk Açılış
  useEffect(() => {
    if (!searchCoords) {
        fetchDrivers(39.1667, 35.6667, 'kurtarici', 6);
    }
  }, [fetchDrivers, searchCoords]); 

  // 🔥 ANA FİLTRELEME (Harita ve Panel Buradan Beslenir)
  const filteredDrivers = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];
    
    return drivers.filter(d => {
      const s = d.service;
      if (!s) return false;

      // 1. Kategori Kontrolü
      let matchesType = false;
      if (actionType === 'yurt_disi') matchesType = s.subType === 'yurt_disi_nakliye';
      else if (actionType === 'sarj_istasyonu') matchesType = s.subType === 'istasyon';
      else if (actionType === 'seyyar_sarj') matchesType = s.subType === 'seyyar_sarj';
      else if (actionType === 'kurtarici') matchesType = s.mainType === 'KURTARICI';
      else if (actionType === 'nakliye') matchesType = s.mainType === 'NAKLIYE';
      else if (actionType === 'sarj') matchesType = s.mainType === 'SARJ';
      else matchesType = s.subType === actionType; // 'tir', 'kamyon' vb.

      if (!matchesType) return false;

      // 2. Etiket Kontrolü (Varsa)
      if (activeTags.length > 0) {
          const driverTags = s.tags || [];
          // Seçili etiketlerden en az birine sahip mi?
          return activeTags.some(tag => driverTags.includes(tag));
      }

      return true;
    });
  }, [drivers, actionType, activeTags]);

  const handleSearchLocation = (lat: number, lng: number) => {
    setSearchCoords([lat, lng]);
    fetchDrivers(lat, lng, actionType, 13);
  };

  const handleFilterApply = (type: string) => {
    setActionType(type);
    setActiveTags([]); // Kategori değişirse etiketleri temizle
    if (searchCoords) {
      fetchDrivers(searchCoords[0], searchCoords[1], type, mapZoom);
    } 
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-gray-50">
      
      <TopBar 
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onProfileClick={() => router.push('/profile')}
      />

      <div className="absolute inset-0 z-0">
        <Map 
          searchCoords={searchCoords}
          drivers={filteredDrivers} // Süzülmüş veri
          onStartOrder={() => {}}
          activeDriverId={activeDriverId}
          onSelectDriver={setActiveDriverId}
          onMapMove={(lat, lng, zoom) => setMapZoom(zoom)}
          onMapClick={() => setActiveDriverId(null)}
        />
      </div>

      <ActionPanel 
        onSearchLocation={handleSearchLocation}
        onFilterApply={handleFilterApply}
        onStartOrder={() => {}}
        actionType={actionType}
        onActionChange={(type) => setActionType(type)}
        
        // Etiketleri Page yönetiyor
        activeTags={activeTags}
        onTagsChange={setActiveTags}

        drivers={filteredDrivers} // Liste de süzülmüş
        loading={loading}
        onReset={() => {
           setSearchCoords(null);
           setActionType('kurtarici');
           setActiveTags([]);
           fetchDrivers(39.1667, 35.6667, 'kurtarici', 6);
        }}
        activeDriverId={activeDriverId}
        onSelectDriver={setActiveDriverId}
      />

      <div className="absolute top-28 right-4 z-[900]">
        <button
          onClick={() => router.push('/chat')} 
          className="w-14 h-14 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform hover:bg-gray-800 border-2 border-white/20"
        >
          <MessageCircle size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[1100] transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 pt-24 h-full flex flex-col">
          <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={24} className="text-gray-400" />
              </div>
              <div>
                  <h3 className="font-black text-sm uppercase">Misafir Kullanıcı</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">ID: 2026-TR</p>
              </div>
          </div>
          <button className="w-full py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black uppercase text-xs flex items-center justify-center gap-2 mt-auto">
             <X size={18} /> Çıkış Yap
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1050] transition-opacity duration-300" />
      )}
    </main>
  );
}