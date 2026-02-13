/**
 * @file page.tsx
 * @description Transport 245 Master Orchestrator.
 * GÜNCELLEME: Marka ismi "Transport 245" olarak revize edildi.
 * GÜNCELLEME: Gezici Şarj için harita sınırı bypass edildi (Türkiye Geneli Veri Çekimi).
 * MANTIK: Sidebar ve ActionPanel arası karşılıklı kapanma senkronizasyonu sağlandı.
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Truck, LifeBuoy, Scale, MessageSquare, MapPin, ShieldCheck } from 'lucide-react';  

import TopBar from '../components/home/TopBar';         
import ActionPanel from '../components/home/ActionPanel';
import Sidebar from '../components/home/Sidebar';
import ProfileModal from '../components/ProfileModal';

// --- LOADER BİLEŞENİ ---
const LOADING_MESSAGES = [
  { text: "Transport 245 nakliye ihtiyacınızı anında karşılar.", sub: "Tır, Kamyon ve Kamyonetler taranıyor...", icon: Truck },
  { text: "Yolda mı kaldınız? Transport 245 her an yanınızda.", sub: "En yakın çekici ve vinç operatörleri bulunuyor...", icon: LifeBuoy },
  { text: "Transport 245, 6563 Sayılı Kanun Uyarınca Aracı Hizmet Sağlayıcıdır.", sub: "Güvenliğiniz için tüm süreçler kayıt altına alınmaktadır.", icon: Scale },
  { text: "Görüşlerinizle Birlikte Gelişiyoruz.", sub: "İşlem sonunda şikayet ve öneri formunu doldurmayı unutmayın.", icon: MessageSquare },
  { text: "Sürücüler ve İstasyonlar Taranıyor...", sub: "Harita verileri ve fiyat tarifeleri güncelleniyor.", icon: MapPin }
];

function ScanningLoader({ onFinish }: { onFinish: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentStep((prev) => (prev + 1) % LOADING_MESSAGES.length), 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const increment = 100 / (3500 / 50);
    const timer = setInterval(() => setProgress((old) => (old >= 100 ? 100 : old + increment)), 50);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { if (progress >= 100) onFinish(); }, [progress, onFinish]);

  const CurrentIcon = LOADING_MESSAGES[currentStep].icon;

  return (
    <div className="fixed inset-0 w-full h-full z-[99999] bg-white/40 backdrop-blur-[25px] flex flex-col items-center justify-center text-gray-800 animate-in fade-in duration-700">
      <div className="relative z-10 bg-white/30 border border-white/60 backdrop-blur-3xl p-10 rounded-[3rem] shadow-2xl ring-1 ring-white/40 mb-16">
         <CurrentIcon className="w-16 h-16 text-gray-900 drop-shadow-md" strokeWidth={1.2} />
      </div>
      <div className="relative z-10 text-center space-y-4 px-10 max-w-xl h-32 flex flex-col justify-center">
        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 leading-tight">{LOADING_MESSAGES[currentStep].text}</h3>
        <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase bg-white/40 px-4 py-1.5 rounded-full inline-block mx-auto">{LOADING_MESSAGES[currentStep].sub}</p>
      </div>
      <div className="absolute bottom-24 w-72 z-10">
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden border border-white/40 shadow-inner">
          <div className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <div className="absolute bottom-8 flex items-center gap-2 bg-white/20 border border-white/40 backdrop-blur-lg px-6 py-2 rounded-full z-10 shadow-sm">
        <ShieldCheck size={14} className="text-blue-600" />
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Transport 245</span>
      </div>
    </div>
  );
}

const Map = dynamic(() => import('../components/Map'), { ssr: false, loading: () => null });
const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

export default function Home() {
  const [drivers, setDrivers] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [actionType, setActionType] = useState('kurtarici'); 
  const [mapZoom, setMapZoom] = useState<number>(13); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  useEffect(() => {
    if (sidebarOpen) setActiveDriverId(null);
  }, [sidebarOpen]);

  useEffect(() => {
    if (activeDriverId) setSidebarOpen(false);
  }, [activeDriverId]);

  const fetchDrivers = useCallback(async (lat: number, lng: number, type: string, zoom: number) => {
    setLoading(true);
    try {
      // 🔥 FIX: Gezici Şarj seçiliyse koordinat/zoom kısıtlaması olmadan tüm listeyi çek (Türkiye Geneli)
      let url = `${API_URL}/users/nearby?lat=${lat}&lng=${lng}&type=${type}&zoom=${zoom}`;
      
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
    if (!searchCoords) fetchDrivers(39.9334, 32.8597, 'kurtarici', 6);
  }, [fetchDrivers, searchCoords]); 

  // --- GELİŞMİŞ FİLTRELEME MANTIĞI ---
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
      else matchesType = s.subType === actionType;

      if (!matchesType) return false;

      if (activeTags.length > 0) {
        return activeTags.some(tag => (s.tags || []).includes(tag));
      }
      
      return true;
    });
  }, [drivers, actionType, activeTags]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white">
      {showLoader && <ScanningLoader onFinish={() => setShowLoader(false)} />}

      <TopBar 
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(true)}
        onProfileClick={() => setShowProfile(true)}
      />

      <div className="absolute inset-0 z-0">
        <Map 
          searchCoords={searchCoords}
          drivers={filteredDrivers}
          activeDriverId={activeDriverId}
          onSelectDriver={setActiveDriverId}
          onMapMove={(lat, lng, zoom) => setMapZoom(zoom)}
          onMapClick={() => setActiveDriverId(null)}
          onStartOrder={() => {}}
        />
      </div>

      <ActionPanel 
        onSearchLocation={(lat, lng) => { 
          setSearchCoords([lat, lng]); 
          fetchDrivers(lat, lng, actionType, 13); 
          setSidebarOpen(false); 
        }}
        onFilterApply={(type) => { 
          setActionType(type); 
          setActiveTags([]); 
          setSidebarOpen(false); 
          const lat = searchCoords ? searchCoords[0] : 39.9334;
          const lng = searchCoords ? searchCoords[1] : 32.8597;
          fetchDrivers(lat, lng, type, mapZoom); 
        }}
        actionType={actionType}
        onActionChange={(t) => { setActionType(t); setSidebarOpen(false); }}
        activeTags={activeTags}
        onTagsChange={setActiveTags}
        drivers={filteredDrivers}
        loading={loading}
        activeDriverId={activeDriverId}
        onSelectDriver={setActiveDriverId}
        onStartOrder={() => {}}
        isSidebarOpen={sidebarOpen} 
      />

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onSelectAction={(type) => { 
          setActionType(type); 
          setActiveTags([]); 
          setSidebarOpen(false); 
          const lat = searchCoords ? searchCoords[0] : 39.9334;
          const lng = searchCoords ? searchCoords[1] : 32.8597;
          fetchDrivers(lat, lng, type, 13);
        }}
        onReportClick={() => {}} 
      />

      <ProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </main>
  );
}