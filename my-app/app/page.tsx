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

// --- MODALLAR ---
import RatingModal from '../components/RatingModal';
import ProfileModal from '../components/ProfileModal';
import ReportModal from '../components/ReportModal';
import CustomerGuide from '../components/CustomerGuide';

// Harita Bileşeni (SSR devre dışı - Siyah ekran önlemi)
const MapComponent = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-700 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Uydu Bağlantısı Kuruluyor...</p>
    </div>
  )
});

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';
const FALLBACK_LAT = 38.4237; 
const FALLBACK_LNG = 27.1428;

// 🛠️ PERFORMANS: Veri Normalizasyonu (Backend formatını standartlaştırır)
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
  const [allDrivers, setAllDrivers] = useState<any[]>([]); // Ham veri
  const [filteredDrivers, setFilteredDrivers] = useState<any[]>([]); // Ekranda görünenler
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  
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

  // 🚦 Referanslar (Performans İçin)
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. BAŞLANGIÇ AYARLARI
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

  // 2. İSTEMCİ TARAFLI FİLTRELEME
  const applyClientSideFilter = (type: string, sourceData: any[]) => {
    if (!type) {
      setFilteredDrivers(sourceData);
      return;
    }
    const filtered = sourceData.filter(d => {
      if (type === 'kurtarici') return d.serviceType?.includes('kurtarici') || d.serviceType?.includes('vinc');
      if (type === 'nakliye') return d.serviceType?.includes('nakliye') || d.serviceType?.includes('kamyon') || d.serviceType?.includes('tir');
      if (type === 'sarj') return d.serviceType?.includes('sarj');
      return d.serviceType === type;
    });
    setFilteredDrivers(filtered);
  };

  // 3. VERİ ÇEKME MANTIĞI
  const fetchDrivers = useCallback((lat: number, lng: number, type?: string) => {
    setSearchCoords([lat, lng]);
    setLoadingDrivers(true);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let url = `${API_URL}/users/nearby?lat=${lat}&lng=${lng}`;

    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        const cleanData = normalizeDriverData(data);
        setAllDrivers(cleanData);
        
        if (type || actionType) {
          applyClientSideFilter(type || actionType, cleanData);
        } else {
          setFilteredDrivers(cleanData);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error("Veri çekilemedi:", err);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoadingDrivers(false);
      });
  }, [actionType]);

  // 4. KONUM BULMA
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchDrivers(pos.coords.latitude, pos.coords.longitude),
        () => fetchDrivers(FALLBACK_LAT, FALLBACK_LNG),
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      fetchDrivers(FALLBACK_LAT, FALLBACK_LNG);
    }
  }, [fetchDrivers]);

  // --- HANDLER'LAR ---

  const handleFilterChange = (type: string) => {
    setActionType(type);
    applyClientSideFilter(type, allDrivers);
    setActiveDriverId(null);
  };

  // İleride Map bileşeni güncellenince burası bağlanacak
  const handleMapMove = (lat: number, lng: number) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchDrivers(lat, lng, actionType);
    }, 500);
  };

  const handleStartOrder = async (driver: any, method: 'call' | 'message') => {
    setActiveOrder({
      ...driver,
      driverId: driver._id,
      status: 'IN_PROGRESS',
      startTime: new Date()
    });
    
    // API isteği burada yapılacak
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

  const handleDriverSelect = (id: string | null) => {
    setActiveDriverId(id);
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

  // --- RENDERING ---

  if (!userRole) return <AuthModal onRoleSelect={handleRoleSelect} />;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* 1. HARİTA 
         Not: onMapMove prop'u kaldırıldı çünkü Map bileşeni henüz bunu desteklemiyor.
         Map.tsx güncellendiğinde buraya tekrar eklenecek.
      */}
      <MapComponent 
        searchCoords={searchCoords} 
        drivers={filteredDrivers} 
        onStartOrder={handleStartOrder} 
        activeDriverId={activeDriverId} 
        onSelectDriver={handleDriverSelect} 
      />
      
      {/* 2. CHATBOT */}
      <ChatWidget 
        isOpen={isChatOpen} 
        onToggle={setChatOpen} 
        contextData={{ drivers: allDrivers, userLocation: searchCoords }}
      />
      
      {/* 3. ÜST MENU */}
      <TopBar 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        onProfileClick={() => setShowProfileModal(true)} 
        sidebarOpen={sidebarOpen} 
      />
      
      {/* 4. SİPARİŞ PANELİ */}
      <ActiveOrderPanel 
        activeOrder={activeOrder} 
        onComplete={() => { setActiveOrder(null); setShowRatingModal(true); }} 
        onCancel={() => setActiveOrder(null)} 
      />

      {/* 5. AKSİYON PANELİ */}
      {!activeOrder && userRole === 'customer' && (
        <ActionPanel 
          drivers={filteredDrivers} 
          loading={loadingDrivers}
          actionType={actionType} 
          onActionChange={setActionType}
          onFilterApply={handleFilterChange} 
          onSearchLocation={(lat, lng) => fetchDrivers(lat, lng, actionType)}
          activeDriverId={activeDriverId}
          onSelectDriver={setActiveDriverId} 
          onStartOrder={handleStartOrder}
          onReset={() => {
            setActionType('');
            setFilteredDrivers(allDrivers);
            setActiveDriverId(null);
          }}
        />
      )}

      {/* 6. KURUMSAL PANEL */}
      {userRole === 'provider' && currentProviderId && (
        <ProviderPanel 
          providerId={currentProviderId} 
          providerData={currentUser || allDrivers.find(d => d._id === currentProviderId)} 
          onComplete={() => window.location.reload()} 
          onCancel={() => window.location.reload()}
        /> 
      )}

      {/* 7. YAN MENÜ */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onSelectAction={(type) => {
            setSidebarOpen(false);
            handleFilterChange(type);
        }} 
        onReportClick={(id) => { setReportOrderId(id); setShowReportModal(true); setSidebarOpen(false); }}
      />

      {/* Modallar */}
      <RatingModal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} onRate={() => {}} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} orderId={reportOrderId} />
      {showCustomerGuide && <CustomerGuide onClose={() => setShowCustomerGuide(false)} />}
    </div>
  );
}