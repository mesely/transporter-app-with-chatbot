'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation'; 
import { MessageCircle, X, User, Truck, LifeBuoy, Scale, MessageSquare, MapPin, ShieldCheck } from 'lucide-react';  

import TopBar from '../components/home/TopBar';         
import ActionPanel from '../components/home/ActionPanel';

// --- LOADER BİLEŞENİ (ScanningLoader) ---
const LOADING_MESSAGES = [
  { text: "Transporter nakliye ihtiyacınızı anında karşılar.", sub: "Tır, Kamyon ve Kamyonetler taranıyor...", icon: Truck },
  { text: "Yolda mı kaldınız? Transporter her an yanınızda.", sub: "En yakın çekici ve vinç operatörleri bulunuyor...", icon: LifeBuoy },
  { text: "Transporter 6563 Sayılı Kanun Uyarınca Aracı Hizmet Sağlayıcıdır.", sub: "Güvenliğiniz için tüm süreçler kayıt altına alınmaktadır.", icon: Scale },
  { text: "Görüşlerinizle Birlikte Gelişiyoruz.", sub: "İşlem sonunda şikayet ve öneri formunu doldurmayı unutmayın.", icon: MessageSquare },
  { text: "Sürücüler ve İstasyonlar Taranıyor...", sub: "Harita verileri ve fiyat tarifeleri güncelleniyor.", icon: MapPin }
];

function ScanningLoader({ onFinish }: { onFinish: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const totalTime = 3500; 
    const intervalTime = 50; 
    const increment = 100 / (totalTime / intervalTime);

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) return 100;
        return oldProgress + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      onFinish();
    }
  }, [progress, onFinish]);

  const CurrentIcon = LOADING_MESSAGES[currentStep].icon;

  return (
    <div className="fixed inset-0 z-[99999] bg-white/60 backdrop-blur-[15px] flex flex-col items-center justify-center text-gray-800 cursor-wait overflow-hidden animate-in fade-in duration-700">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-400/15 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative flex items-center justify-center mb-16 scale-110">
        <div className="absolute w-64 h-64 border border-blue-500/10 rounded-full animate-[ping_4s_linear_infinite]"></div>
        <div className="absolute w-80 h-80 border border-white/30 rounded-full animate-[pulse_3s_linear_infinite] shadow-inner"></div>
        <div className="relative z-10 bg-white/30 border border-white/60 backdrop-blur-2xl p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] ring-1 ring-white/40">
           <CurrentIcon className="w-16 h-16 text-gray-900 transition-all duration-700 drop-shadow-md" strokeWidth={1.2} />
        </div>
      </div>

      <div className="relative z-10 text-center space-y-4 px-10 max-w-xl h-32 flex flex-col justify-center">
        <h3 key={`text-${currentStep}`} className="text-xl font-black uppercase tracking-tight text-gray-900 animate-in fade-in slide-in-from-bottom-4 duration-700 leading-tight">
          {LOADING_MESSAGES[currentStep].text}
        </h3>
        <div key={`sub-${currentStep}`} className="bg-white/40 border border-white/50 backdrop-blur-md px-4 py-1.5 rounded-full inline-block mx-auto animate-in fade-in zoom-in-95 duration-1000">
           <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase">{LOADING_MESSAGES[currentStep].sub}</p>
        </div>
      </div>

      <div className="absolute bottom-24 flex flex-col items-center gap-4 w-72 z-10">
        <div className="flex justify-between w-full px-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sistem Taraması</span>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-lg border border-blue-100/40 shadow-sm">%{Math.round(progress)}</span>
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-xl border border-white/60 shadow-inner">
          <div className="h-full bg-gradient-to-r from-gray-800 via-blue-600 to-gray-900 rounded-full transition-all duration-150 ease-linear shadow-[0_0_15px_rgba(59,130,246,0.3)]" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="absolute bottom-8 flex items-center gap-2 bg-white/20 border border-white/40 backdrop-blur-lg px-6 py-2 rounded-full z-10 shadow-sm">
        <ShieldCheck size={14} className="text-blue-600" />
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Transporter <span className="text-gray-900">2026</span></span>
      </div>
    </div>
  );
}

// --- HARİTA VE ANA SAYFA ---
const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => null
});

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
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [actionType, setActionType] = useState('kurtarici'); 
  const [mapZoom, setMapZoom] = useState<number>(13); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const fetchDrivers = useCallback(async (lat: number, lng: number, type: string, zoom: number) => {
    setLoading(true);
    try {
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

  useEffect(() => {
    if (!searchCoords) {
        fetchDrivers(39.1667, 35.6667, 'kurtarici', 6);
    }
  }, [fetchDrivers, searchCoords]); 

  const filteredDrivers = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];
    return drivers.filter(d => {
      const s = d.service;
      if (!s) return false;
      let matchesType = false;
      if (actionType === 'yurt_disi') matchesType = s.subType === 'yurt_disi_nakliye';
      else if (actionType === 'sarj_istasyonu') matchesType = s.subType === 'istasyon';
      else if (actionType === 'seyyar_sarj') matchesType = s.subType === 'seyyar_sarj';
      else if (actionType === 'kurtarici') matchesType = s.mainType === 'KURTARICI';
      else if (actionType === 'nakliye') matchesType = s.mainType === 'NAKLIYE';
      else if (actionType === 'sarj') matchesType = s.mainType === 'SARJ';
      else matchesType = s.subType === actionType;
      if (!matchesType) return false;
      if (activeTags.length > 0) {
          const driverTags = s.tags || [];
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
    setActiveTags([]); 
    if (searchCoords) {
      fetchDrivers(searchCoords[0], searchCoords[1], type, mapZoom);
    } 
  };

  const handleLoaderFinish = useCallback(() => {
    if (!loading) {
      setShowLoader(false);
    } else {
      setTimeout(handleLoaderFinish, 1000);
    }
  }, [loading]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-gray-50">
      
      {/* SCANNING LOADER (Giriş Modalı Silindi, Doğrudan Loader Başlar) */}
      {showLoader && (
        <ScanningLoader onFinish={handleLoaderFinish} />
      )}

      <TopBar 
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onProfileClick={() => router.push('/register')} // Kayıt sayfasına yönlendirme
      />

      <div className="absolute inset-0 z-0">
        <Map 
          searchCoords={searchCoords}
          drivers={filteredDrivers}
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
        activeTags={activeTags}
        onTagsChange={setActiveTags}
        drivers={filteredDrivers}
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

      {/* Chat Butonu */}
      <div className="absolute top-28 right-4 z-[900]">
        <button
          onClick={() => router.push('/chat')} 
          className="w-14 h-14 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform hover:bg-gray-800 border-2 border-white/20"
        >
          <MessageCircle size={24} />
        </button>
      </div>

      {/* Sidebar (Menü) */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[1100] transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 pt-24 h-full flex flex-col">
          <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={24} className="text-gray-400" />
              </div>
              <div>
                  <h3 className="font-black text-sm uppercase">Misafir Kullanıcı</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Sürüm: 2026.1</p>
              </div>
          </div>
          
          <div className="space-y-2">
            <button onClick={() => router.push('/register')} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs">Sürücü Kaydı Yap</button>
            <button onClick={() => router.push('/admin')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs">Yönetim Paneli</button>
          </div>

          <button className="w-full py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black uppercase text-xs flex items-center justify-center gap-2 mt-auto">
             <X size={18} /> Kapat
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1050] transition-opacity duration-300" />
      )}
    </main>
  );
}