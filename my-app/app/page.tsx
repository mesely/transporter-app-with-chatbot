'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

// --- BİLEŞENLER ---
import TopBar from '../components/home/TopBar';
import ActionPanel from '../components/home/ActionPanel';
import Sidebar from '../components/home/Sidebar';
import ActiveOrderPanel from '../components/home/ActiveOrderPanel';
import ChatWidget from '../components/ChatWidget';
import ProviderPanel from '../components/provider/ProviderPanel';

// --- MODALLAR ---
import RatingModal from '../components/RatingModal';
import ProfileModal from '../components/ProfileModal';
import ReportModal from '../components/ReportModal';
import CustomerGuide from '../components/CustomerGuide';
import AuthModal from '../components/AuthModal';

// Harita Bileşeni (SSR devre dışı - Tarayıcıda çalışması için)
const MapComponent = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sistem Yükleniyor...</p>
    </div>
  )
});

/** * 🌐 AKILLI API_URL YÖNETİMİ
 * Local'deysen 3005'e, Render'daysan otomatik olarak canlı linke bağlanır.
 */
const API_URL = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3005'
  : 'https://transporter-app-with-chatbot.onrender.com';

// 📍 KONUM BULUNAMAZSA VARSAYILAN (ALSANCAK)
const FALLBACK_LAT = 38.4382; 
const FALLBACK_LNG = 27.1418;

export default function Home() {
  // --- STATE YÖNETİMİ ---
  const [userRole, setUserRole] = useState<'guest' | 'customer' | 'provider' | null>(null);
  const [currentProviderId, setCurrentProviderId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null); 
  const [showCustomerGuide, setShowCustomerGuide] = useState(false);

  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [allDrivers, setAllDrivers] = useState<any[]>([]);      
  const [mapDrivers, setMapDrivers] = useState<any[]>([]);      
  const [panelDrivers, setPanelDrivers] = useState<any[]>([]);  
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [actionType, setActionType] = useState<string>('');     

  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>(''); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportOrderId, setReportOrderId] = useState<string | null>(null);

  // 1. Cihaz Kimliği ve Kullanıcı Rolü Yükleme
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

  // 2. Filtreleme Mantığı (Kategorilere Göre Ayrım)
  const applyFilter = useCallback((type: string, data: any[]) => {
    if (!type) {
      setMapDrivers(data);
      setPanelDrivers([]); 
      return;
    }
    let filtered;
    if (type === 'sarj') {
      filtered = data.filter(d => d.serviceType === 'sarj_istasyonu' || d.serviceType === 'seyyar_sarj');
    } else {
      filtered = data.filter(d => d.serviceType === type);
    }
    setMapDrivers(filtered);
    setPanelDrivers(filtered);
  }, []);

  /**
   * 📡 VERİ ÇEKME MANTIĞI
   * MongoDB Atlas'taki gerçek verileri konuma göre çeker.
   */
  const fetchAllData = useCallback((lat: number, lng: number) => {
    setLoadingDrivers(true);
    setSearchCoords([lat, lng]);
    
    fetch(`${API_URL}/users/nearby?lat=${lat}&lng=${lng}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const cleanData = data.map((d: any) => ({
            ...d,
            address: (typeof d.address === 'string') ? d.address : 'Konum bilgisi yok'
          }));
          setAllDrivers(cleanData);
          applyFilter(actionType, cleanData);
        } else {
          setAllDrivers([]);
        }
      })
      .catch(err => {
        console.error("❌ API Bağlantı Hatası:", err);
        setAllDrivers([]);
      })
      .finally(() => setLoadingDrivers(false));
  }, [actionType, applyFilter]);

  // 3. Konum Bulma (Geolocation)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchAllData(pos.coords.latitude, pos.coords.longitude),
        () => fetchAllData(FALLBACK_LAT, FALLBACK_LNG),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      fetchAllData(FALLBACK_LAT, FALLBACK_LNG);
    }
  }, [fetchAllData]);

  // --- HANDLER'LAR ---

  const handleFilterChange = (type: string) => {
    setActionType(type);
    applyFilter(type, allDrivers);
    setChatOpen(false);
  };

  const handleResetMap = () => {
    setActionType(''); 
    setMapDrivers(allDrivers); 
    setPanelDrivers([]); 
  };

  const handleChatToggle = (isOpen: boolean) => {
    setChatOpen(isOpen);
    if (isOpen) {
      handleResetMap(); 
      setSidebarOpen(false); 
    }
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

  const handleStartOrder = async (driver: any, method: 'call' | 'message') => {
    if (!deviceId) return;
    setActiveOrder({
      driverId: driver._id,
      driverName: `${driver.firstName} ${driver.lastName}`,
      serviceType: driver.serviceType,
      phoneNumber: driver.phoneNumber,
      startTime: new Date(),
      status: 'IN_PROGRESS'
    });
    setPanelDrivers([]);
    setSidebarOpen(false);
    setChatOpen(false); 

    try {
      const res = await fetch(`${API_URL}/orders`, {
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
      const newOrderData = await res.json();
      if (newOrderData._id) {
        setActiveOrder((prev: any) => ({ ...prev, _id: newOrderData._id }));
      }
    } catch (e) { console.error("Sipariş hatası:", e); }
  };

  const handleCompleteOrder = async () => {
    if (activeOrder?._id) {
      try {
        await fetch(`${API_URL}/orders/${activeOrder._id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETED' })
        });
      } catch (e) {}
    }
    setActiveOrder(null); 
    setShowRatingModal(true); 
  };

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
    if (!sidebarOpen) {
      handleResetMap();
      setChatOpen(false);
    }
  };

  const handleActionSelect = (type: any) => {
    setSidebarOpen(false); 
    handleFilterChange(type);
  };

  // --- RENDERING ---

  if (!userRole) {
    return <AuthModal onRoleSelect={handleRoleSelect} />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* 1. HARİTA */}
      <MapComponent 
        searchCoords={searchCoords} 
        drivers={mapDrivers} 
        onStartOrder={handleStartOrder} 
      />
      
      {/* 2. CHATBOT */}
      <ChatWidget 
        isOpen={isChatOpen} 
        onToggle={handleChatToggle} 
        contextData={{
          drivers: allDrivers,
          userLocation: searchCoords,
          activeOrder: activeOrder,
          userRole: userRole
        }}
      />
      
      {showCustomerGuide && <CustomerGuide onClose={() => setShowCustomerGuide(false)} />}
      
      {/* 3. ÜST ARAÇ ÇUBUĞU */}
      <TopBar 
        onMenuClick={handleMenuClick} 
        onProfileClick={() => setShowProfileModal(true)} 
        sidebarOpen={sidebarOpen} 
      />
      
      {/* 4. SİPARİŞ TAKİBİ */}
      <ActiveOrderPanel 
        activeOrder={activeOrder} 
        onComplete={handleCompleteOrder} 
        onCancel={() => { setActiveOrder(null); handleResetMap(); }} 
      />

      {/* 5. MODALLAR */}
      <RatingModal isOpen={showRatingModal} onRate={() => { setShowRatingModal(false); handleResetMap(); }} onClose={() => { setShowRatingModal(false); handleResetMap(); }} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} orderId={reportOrderId} />
      
      {/* 6. MÜŞTERİ PANELİ */}
      {!activeOrder && userRole === 'customer' && (
        <ActionPanel 
          onSearchLocation={fetchAllData} 
          onFilterApply={handleFilterChange} 
          onStartOrder={handleStartOrder}
          actionType={actionType} 
          onActionChange={handleActionSelect} 
          drivers={panelDrivers} 
          loading={loadingDrivers}
          onReset={handleResetMap}
        />
      )}

      {/* 7. KURUMSAL PANEL */}
      {userRole === 'provider' && currentProviderId && (
        <ProviderPanel 
          providerId={currentProviderId} 
          providerData={currentUser || allDrivers.find(d => d._id === currentProviderId)} 
          onComplete={() => window.location.reload()} 
          onCancel={() => window.location.reload()}
        /> 
      )}

      {/* 8. YAN MENÜ */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onSelectAction={handleActionSelect} 
        onReportClick={(id) => { setReportOrderId(id); setShowReportModal(true); setSidebarOpen(false); }} 
      />
    </div>
  );
}