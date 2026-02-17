/**
 * @file page.tsx
 * @description Transport 245 Master Orchestrator.
 * FIX: Harita yorum satırından çıkarıldı ve aktif edildi.
 * FIX: Sidebar sadece açık olduğunda render edilerek bellek tasarrufu sağlandı.
 * FIX: iOS WebView crash (SIGKILL) koruması için gereksiz blur efektleri loader'dan temizlendi.
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Truck, Scale, MessageSquare, MapPin, ShieldCheck } from 'lucide-react';  

import TopBar from '../components/home/TopBar';         
import ActionPanel from '../components/home/ActionPanel';
import Sidebar from '../components/home/Sidebar';
import ProfileModal from '../components/ProfileModal';

// --- ALT KATEGORİ HİYERARŞİSİ ---
const CATEGORY_MAP: Record<string, string[]> = {
  tir: ['tenteli', 'frigorifik', 'lowbed', 'konteyner', 'acik_kasa'],
  kamyon: ['6_teker', '8_teker', '10_teker', '12_teker', 'kirkayak'],
  kamyonet: ['panelvan', 'acik_kasa', 'kapali_kasa'],
  yolcu: ['minibus', 'otobus', 'midibus', 'vip_tasima']
};

// --- LOADER BİLEŞENİ ---
const LOADING_MESSAGES = [
  { text: "Transport 245 nakliye ihtiyacınızı anında karşılar.", sub: "Tır, Kamyon ve Kamyonetler taranıyor...", icon: Truck },
  { text: "Güvenliğiniz için tüm süreçler kayıt altına alınmaktadır.", sub: "6563 Sayılı Kanun Uyarınca Aracı Hizmet Sağlayıcı.", icon: Scale },
  { text: "Sürücüler ve İstasyonlar Taranıyor...", sub: "Harita verileri ve fiyat tarifeleri güncelleniyor.", icon: MapPin }
];

function ScanningLoader({ onFinish }: { onFinish: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentStep((prev) => (prev + 1) % LOADING_MESSAGES.length), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setProgress((old) => (old >= 100 ? 100 : old + 2)), 40);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { if (progress >= 100) onFinish(); }, [progress, onFinish]);

  const CurrentIcon = LOADING_MESSAGES[currentStep].icon;

  return (
    <div className="fixed inset-0 w-full h-full z-[99999] bg-white flex flex-col items-center justify-center text-gray-800">
      <div className="bg-gray-50 p-8 rounded-[3rem] shadow-sm mb-12 border border-gray-100">
         <CurrentIcon className="w-12 h-12 text-blue-600" />
      </div>
      <div className="text-center space-y-3 px-10 max-w-xl h-24">
        <h3 className="text-lg font-black uppercase text-gray-900 leading-tight">{LOADING_MESSAGES[currentStep].text}</h3>
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{LOADING_MESSAGES[currentStep].sub}</p>
      </div>
      <div className="w-64 h-1 bg-gray-100 rounded-full overflow-hidden mt-10">
        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}

// Harita bileşeni dinamik yükleme
const Map = dynamic(() => import('../components/Map'), { ssr: false, loading: () => null });
const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

export default function Home() {
  const [drivers, setDrivers] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [actionType, setActionType] = useState('kurtarici'); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Sidebar açıldığında detay panelini kapat (Bellek yönetimi)
  useEffect(() => {
    if (sidebarOpen && activeDriverId !== null) {
      setActiveDriverId(null);
    }
  }, [sidebarOpen, activeDriverId]);

  const fetchDrivers = useCallback(async (lat: number, lng: number, type: string) => {
    setLoading(true);
    try {
      // Zoom 9 ile geniş alan taraması
      let url = `${API_URL}/users/nearby?lat=${lat}&lng=${lng}&type=${type}&zoom=9`;
      if (type === 'seyyar_sarj') {
        url = `${API_URL}/users/all?type=seyyar_sarj`; 
      }
      const res = await fetch(url);
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (error) {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchCoords) fetchDrivers(39.9334, 32.8597, 'kurtarici');
  }, [fetchDrivers, searchCoords]); 

  const filteredDrivers = useMemo(() => {
    if (!drivers) return [];
    return drivers.filter(d => {
      const s = d.service;
      if (!s) return false;

      let matchesType = false;
      if (actionType === 'seyyar_sarj') matchesType = s.subType === 'seyyar_sarj';
      else if (actionType === 'yurt_disi_nakliye') matchesType = s.subType === 'yurt_disi_nakliye';
      else if (actionType === 'evden_eve') matchesType = s.subType === 'evden_eve';
      else if (actionType === 'sarj_istasyonu') matchesType = s.subType === 'istasyon';
      else if (actionType === 'kurtarici') matchesType = s.mainType === 'KURTARICI';
      else if (actionType === 'nakliye') matchesType = s.mainType === 'NAKLIYE';
      else if (actionType === 'sarj') matchesType = s.mainType === 'SARJ';
      else if (actionType === 'yolcu') matchesType = s.mainType === 'YOLCU';
      else if (CATEGORY_MAP[actionType]) {
        matchesType = s.subType === actionType || CATEGORY_MAP[actionType].includes(s.subType);
      }
      else matchesType = s.subType === actionType;

      if (!matchesType) return false;
      if (activeTags.length > 0) {
        return activeTags.some(tag => (s.tags || []).includes(tag));
      }
      return true;
    });
  }, [drivers, actionType, activeTags]);

  const handleStartOrder = (driver: any, method: 'call' | 'message') => {
    console.log(`Starting order with ${driver.businessName} via ${method}`);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white">
      {showLoader && <ScanningLoader onFinish={() => setShowLoader(false)} />}

      <TopBar 
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(true)}
        onProfileClick={() => setShowProfile(true)}
      />

      {/* Harita Bileşeni Artık Aktif */}
      <div className="absolute inset-0 z-0">
        <Map 
          searchCoords={searchCoords}
          drivers={filteredDrivers}
          activeDriverId={activeDriverId}
          onSelectDriver={setActiveDriverId}
          onMapClick={() => setActiveDriverId(null)}
          onStartOrder={handleStartOrder}
        />
      </div>

      <ActionPanel 
        onSearchLocation={(lat, lng) => { 
          setSearchCoords([lat, lng]); 
          fetchDrivers(lat, lng, actionType); 
          setSidebarOpen(false); 
        }}
        onFilterApply={(type) => { 
          setActionType(type); 
          setActiveTags([]); 
          const lat = searchCoords ? searchCoords[0] : 39.9334;
          const lng = searchCoords ? searchCoords[1] : 32.8597;
          fetchDrivers(lat, lng, type); 
        }}
        actionType={actionType}
        onActionChange={(t) => { setActionType(t); }}
        activeTags={activeTags}
        onTagsChange={setActiveTags}
        drivers={filteredDrivers}
        loading={loading}
        activeDriverId={activeDriverId}
        onSelectDriver={setActiveDriverId}
        onStartOrder={handleStartOrder}
        isSidebarOpen={sidebarOpen} 
      />

      {/* 🔥 KRİTİK: Sidebar'ı sadece açıksa render ediyoruz (Bellek tasarrufu) */}
      {sidebarOpen && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          onSelectAction={(type) => { 
            setSidebarOpen(false); 
            // Seçimden hemen sonra işlemciyi rahatlatmak için kısa bir gecikme
            setTimeout(() => {
              setActionType(type); 
              setActiveTags([]); 
              const lat = searchCoords ? searchCoords[0] : 39.9334;
              const lng = searchCoords ? searchCoords[1] : 32.8597;
              fetchDrivers(lat, lng, type);
            }, 100);
          }}
        />
      )}

      <ProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </main>
  );
}