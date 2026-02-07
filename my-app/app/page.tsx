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

// Harita Bileşeni (SSR devre dışı)
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

// 🛠️ PERFORMANS: Veri Normalizasyonu
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

  // 🚦 Referanslar
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
    // Backend zaten filtreliyor ama ani geçişler için client-side filtre de tutuyoruz
    const filtered = sourceData.filter(d => {
      const sType = d.serviceType || '';
      if (type === 'kurtarici') return sType.includes('kurtarici') || sType.includes('vinc');
      if (type === 'nakliye') return sType.includes('nakliye') || sType.includes('kamyon') || sType.includes('tir');
      if (type === 'sarj') return sType.includes('sarj');
      return sType.includes(type);
    });
    setFilteredDrivers(filtered);
  };

  // 3. VERİ ÇEKME MANTIĞI (Backend ile Zoom Out uyumlu)
  const fetchDrivers = useCallback((lat: number, lng: number, type?: string) => {
    setLoadingDrivers(true);

    // Önceki isteği iptal et (Performans)
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // URL Oluşturma
    const url = new URL(`${API_URL}/users/nearby`);
    url.searchParams.append('lat', lat.toString());
    url.searchParams.append('lng', lng.toString());
    if (type) url.searchParams.append('type', type);

    fetch(url.toString(), { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        const cleanData = normalizeDriverData(data);
        setAllDrivers(cleanData);
        // Gelen veri zaten backend'den filtrelenmiş geliyor, direkt basıyoruz.
        setFilteredDrivers(cleanData);
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error("Veri çekilemedi:", err);
      })
      .finally(() => {
        setLoadingDrivers(false);
      });
  }, []);

  // 4. KONUM BULMA (İlk Açılış)
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setSearchCoords([latitude, longitude]);
          fetchDrivers(latitude, longitude, actionType);
        },
        () => {
          setSearchCoords([FALLBACK_LAT, FALLBACK_LNG]);
          fetchDrivers(FALLBACK_LAT, FALLBACK_LNG, actionType);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      fetchDrivers(FALLBACK_LAT, FALLBACK_LNG, actionType);
    }
  }, []); // Sadece ilk açılışta

  // --- HANDLER'LAR ---

  // Filtre Değişimi
  const handleFilterChange = (type: string) => {
    setActionType(type);
    setActiveDriverId(null);
    // Filtre değişince mevcut koordinatta yeni arama yap
    if (searchCoords) {
      fetchDrivers(searchCoords[0], searchCoords[1], type);
    }
  };

  // 🔥 HARİTA KAYDIRMA (ZOOM OUT DESTEĞİ)
  const handleMapMove = (lat: number, lng: number) => {
    // Debounce: Kullanıcı kaydırmayı bitirince istek at (500ms)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    
    debounceTimerRef.current = setTimeout(() => {
      // Koordinatı güncelleme, sadece veriyi yenile
      // setSearchCoords([lat, lng]); // Bunu açarsak marker da hareket eder, gerek yok.
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

  // --- RENDERING ---

  if (!userRole) return <AuthModal onRoleSelect={handleRoleSelect} />;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* 1. HARİTA (Senkronize) */}
      <MapComponent 
        searchCoords={searchCoords} 
        drivers={filteredDrivers} 
        onStartOrder={handleStartOrder} 
        // 👇 ÇİFT YÖNLÜ BAĞLANTI BURADA KURULDU 👇
        activeDriverId={activeDriverId} 
        onSelectDriver={setActiveDriverId} // Pin'e basınca state güncelle
        onMapMove={handleMapMove} // Kaydırınca yeni veri çek
        onMapClick={() => setActiveDriverId(null)} // Boşluğa basınca seçimi kaldır
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

      {/* 5. AKSİYON PANELİ (Senkronize) */}
      {!activeOrder && userRole === 'customer' && (
        <ActionPanel 
          drivers={filteredDrivers} 
          loading={loadingDrivers}
          actionType={actionType} 
          onActionChange={setActionType}
          onFilterApply={handleFilterChange} 
          onSearchLocation={(lat, lng) => {
            setSearchCoords([lat, lng]);
            fetchDrivers(lat, lng, actionType);
          }}
          // 👇 ÇİFT YÖNLÜ BAĞLANTI BURADA DA VAR 👇
          activeDriverId={activeDriverId}
          onSelectDriver={setActiveDriverId} 
          onStartOrder={handleStartOrder}
          onReset={() => {
            setActionType('');
            handleFilterChange(''); // Hepsini getir
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