'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

// --- BİLEŞENLER ---
import TopBar from '../components/home/TopBar';
import ActionPanel from '../components/home/ActionPanel';
import Sidebar from '../components/home/Sidebar';
import ActiveOrderPanel from '../components/home/ActiveOrderPanel';
import ChatWidget from '../components/ChatWidget';
import ProviderPanel from '../components/provider/ProviderPanel';
import AuthModal from '../components/AuthModal';

// 👇 LOADER IMPORT 👇
import ScanningLoader from '../components/ScanningLoader'; 

// --- MODALLAR ---
import RatingModal from '../components/RatingModal';
import ProfileModal from '../components/ProfileModal';
import ReportModal from '../components/ReportModal';
import CustomerGuide from '../components/CustomerGuide';

// Harita Bileşeni (SSR devre dışı)
const MapComponent = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <ScanningLoader /> 
});

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';
const FALLBACK_LAT = 38.4237; 
const FALLBACK_LNG = 27.1428;

const normalizeDriverData = (data: any[]) => {
  if (!Array.isArray(data)) return [];
  return data.map(d => ({
    ...d,
    location: Array.isArray(d.location) 
      ? { coordinates: d.location } 
      : d.location?.coordinates 
        ? d.location 
        : { coordinates: [FALLBACK_LNG, FALLBACK_LAT] },
    address: d.address || 'Konum verisi alınıyor...'
  }));
};

export default function Home() {
  // --- STATE YÖNETİMİ ---
  const [userRole, setUserRole] = useState<'guest' | 'customer' | 'provider' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProviderId, setCurrentProviderId] = useState<string | null>(null);
  const [showCustomerGuide, setShowCustomerGuide] = useState(false);

  // 🌍 KONUM VE VERİ
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [allDrivers, setAllDrivers] = useState<any[]>([]); 
  const [filteredDrivers, setFilteredDrivers] = useState<any[]>([]); 
  const [loadingDrivers, setLoadingDrivers] = useState(true); 
  
  // 👇 İLK YÜKLEME STATE'İ 👇
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // 🎯 AKSİYON VE SENKRONİZASYON
  const [actionType, setActionType] = useState<string>(''); 
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  
  // 📦 SİPARİŞ VE UI
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>(''); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  
  // Modallar
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportOrderId, setReportOrderId] = useState<string | null>(null);

  // 🚦 Referanslar
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // BAŞLANGIÇ
  useEffect(() => {
    let storedId = localStorage.getItem('transporter_device_id');
    if (!storedId) {
      storedId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('transporter_device_id', storedId);
    }
    setDeviceId(storedId);

    const savedRole = localStorage.getItem('transporter_user_role');
    const savedProviderId = localStorage.getItem('transporter_provider_id');

    if (savedRole) {
      setUserRole(savedRole as any);
      if (savedRole === 'provider' && savedProviderId) {
        setCurrentProviderId(savedProviderId);
      }
    }
  }, []);

  // 🔥 GÜÇLENDİRİLMİŞ VERİ ÇEKME (SESSİZ MOD DESTEKLİ) 🔥
  const fetchDrivers = useCallback((lat: number, lng: number, type?: string, isBackground: boolean = false) => {
    
    // Eğer kategori değişimi ise (isBackground=false), kullanıcıya yükleniyor göster.
    // Eğer harita kaydırma ise (isBackground=true), sessizce hallet.
    if (!isBackground) {
        setLoadingDrivers(true);
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const url = new URL(`${API_URL}/users/nearby`);
    url.searchParams.append('lat', lat.toString());
    url.searchParams.append('lng', lng.toString());
    if (type) url.searchParams.append('type', type);

    fetch(url.toString(), { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        const cleanData = normalizeDriverData(data);
        setAllDrivers(cleanData);
        setFilteredDrivers(cleanData);
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error("Veri çekilemedi:", err);
      })
      .finally(() => {
        setLoadingDrivers(false);
        setTimeout(() => { setIsFirstLoad(false); }, 1500);
      });
  }, []);

  // KONUM BULMA
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setSearchCoords([latitude, longitude]);
          fetchDrivers(latitude, longitude, actionType, false);
        },
        () => {
          setSearchCoords([FALLBACK_LAT, FALLBACK_LNG]);
          fetchDrivers(FALLBACK_LAT, FALLBACK_LNG, actionType, false);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      fetchDrivers(FALLBACK_LAT, FALLBACK_LNG, actionType, false);
    }
  }, []); 

  // --- HANDLER'LAR ---

  // 🔥 FİLTRE DEĞİŞİMİ (Üst butonlara basınca burası çalışır)
  const handleFilterChange = (type: string) => {
    setActionType(type);
    setActiveDriverId(null);
    
    // Eski verileri temizle ki kullanıcı karışıklık yaşamasın
    setFilteredDrivers([]); 
    setLoadingDrivers(true);

    if (searchCoords) {
      // false = Loading göstererek çek
      fetchDrivers(searchCoords[0], searchCoords[1], type, false);
    }
  };

  // 🔥 HARİTA HAREKETİ (Sessiz güncelleme)
  const handleMapMove = (lat: number, lng: number) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      // true = Loading GÖSTERME (Arka planda sessizce çek)
      fetchDrivers(lat, lng, actionType, true);
    }, 500);
  };

  const handleStartOrder = async (driver: any, method: 'call' | 'message') => {
    setActiveOrder({
      ...driver,
      driverId: driver._id,
      status: 'IN_PROGRESS',
      startTime: new Date()
    });
    
    try {
      await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: deviceId,
          driverId: driver._id,
          driverName: `${driver.firstName} ${driver.lastName}`,
          serviceType: driver.serviceType,
          location: driver.location,
          method: method
        })
      });
    } catch (e) { console.error(e); }
  };

  const handleRoleSelect = (role: 'customer' | 'provider', providerData?: any) => {
    setUserRole(role);
    localStorage.setItem('transporter_user_role', role);
    if (role === 'provider' && providerData) {
      setCurrentProviderId(providerData._id);
      setCurrentUser(providerData);
      localStorage.setItem('transporter_provider_id', providerData._id); 
      setAllDrivers(prev => [...prev, providerData]);
    } 
    if (role === 'customer') setShowCustomerGuide(true);
  };

  if (!userRole) return <AuthModal onRoleSelect={handleRoleSelect} />;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      
      {/* 1. YÜKLEME EKRANI */}
      {isFirstLoad && <ScanningLoader />}

      {/* 2. HARİTA */}
      <MapComponent 
        searchCoords={searchCoords} 
        drivers={filteredDrivers} 
        onStartOrder={handleStartOrder} 
        activeDriverId={activeDriverId} 
        onSelectDriver={setActiveDriverId} 
        onMapMove={handleMapMove} 
        // 🔥 Boşluğa tıklayınca paneli kapatır
        onMapClick={() => setActiveDriverId(null)} 
      />
      
      {/* 3. DİĞER BİLEŞENLER */}
      <ChatWidget 
        isOpen={isChatOpen} 
        onToggle={setChatOpen} 
        contextData={{ drivers: allDrivers, userLocation: searchCoords }}
      />
      
      <TopBar 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        onProfileClick={() => setShowProfileModal(true)} 
        sidebarOpen={sidebarOpen} 
      />
      
      <ActiveOrderPanel 
        activeOrder={activeOrder} 
        onComplete={() => { setActiveOrder(null); setShowRatingModal(true); }} 
        onCancel={() => setActiveOrder(null)} 
      />

      {/* 4. AKSİYON PANELİ */}
      {!activeOrder && userRole === 'customer' && (
        <ActionPanel 
          drivers={filteredDrivers} 
          loading={loadingDrivers}
          actionType={actionType} 
          
          // 🔥 KRİTİK DÜZELTME: Üst butonlara basınca veri çeker 🔥
          onActionChange={handleFilterChange} 
          
          // Alt butonlara basınca veri çeker
          onFilterApply={handleFilterChange} 
          
          // Konum arayınca sessiz güncelleme yapar (true)
          onSearchLocation={(lat, lng) => { 
              setSearchCoords([lat, lng]); 
              fetchDrivers(lat, lng, actionType, true); 
          }}
          
          activeDriverId={activeDriverId}
          onSelectDriver={setActiveDriverId} 
          onStartOrder={handleStartOrder}
          onReset={() => { handleFilterChange(''); }}
        />
      )}

      {userRole === 'provider' && currentProviderId && (
        <ProviderPanel 
          providerId={currentProviderId} 
          providerData={currentUser || allDrivers.find(d => d._id === currentProviderId)} 
          onComplete={() => window.location.reload()} 
          onCancel={() => window.location.reload()}
        /> 
      )}

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onSelectAction={(type) => {
            setSidebarOpen(false);
            handleFilterChange(type);
        }} 
        onReportClick={(id) => { setReportOrderId(id); setShowReportModal(true); setSidebarOpen(false); }}
      />

      <RatingModal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} onRate={() => {}} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} orderId={reportOrderId} />
      {showCustomerGuide && <CustomerGuide onClose={() => setShowCustomerGuide(false)} />}
    </div>
  );
}