'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';

// --- BİLEŞENLER ---
import TopBar from '../components/home/TopBar';
import ActionPanel from '../components/home/ActionPanel';
import Sidebar from '../components/home/Sidebar';
import ActiveOrderPanel from '../components/home/ActiveOrderPanel';
import ChatWidget from '../components/ChatWidget';
import ProviderPanel from '../components/provider/ProviderPanel';
import AuthModal from '../components/AuthModal';

// Loader
import ScanningLoader from '../components/ScanningLoader'; 

// --- MODALLAR ---
import RatingModal from '../components/RatingModal';
import ProfileModal from '../components/ProfileModal';
import ReportModal from '../components/ReportModal';
import CustomerGuide from '../components/CustomerGuide';
import UserAgreementModal from '../components/UserAgreementModal'; 

const MapComponent = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" /> 
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
  const [userRole, setUserRole] = useState<'guest' | 'customer' | 'provider' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProviderId, setCurrentProviderId] = useState<string | null>(null);
  const [showCustomerGuide, setShowCustomerGuide] = useState(false);

  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [allDrivers, setAllDrivers] = useState<any[]>([]); 
  const [loadingDrivers, setLoadingDrivers] = useState(true); 
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const [actionType, setActionType] = useState<string>(''); 
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>(''); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportOrderId, setReportOrderId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const fetchDrivers = useCallback((lat: number, lng: number, type?: string, isBackground: boolean = false) => {
    if (!isBackground) setLoadingDrivers(true);
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
        setAllDrivers(normalizeDriverData(data)); 
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => {
        setLoadingDrivers(false);
        setTimeout(() => { setIsFirstLoad(false); }, 4000); 
      });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSearchCoords([pos.coords.latitude, pos.coords.longitude]);
          fetchDrivers(pos.coords.latitude, pos.coords.longitude, actionType, false);
        },
        () => {
          setSearchCoords([FALLBACK_LAT, FALLBACK_LNG]);
          fetchDrivers(FALLBACK_LAT, FALLBACK_LNG, actionType, false);
        },
        { timeout: 10000 }
      );
    }
  }, []); 

  const finalFilteredDrivers = useMemo(() => {
    let list = [...allDrivers];
    if (!actionType) return list;
    if (actionType === 'yurt_disi') list = list.filter(d => d.serviceType === 'yurt_disi_nakliye');
    else if (actionType === 'nakliye') list = list.filter(d => d.serviceType === 'nakliye'); 
    else if (actionType === 'vinc') list = list.filter(d => d.serviceType === 'vinc');
    else if (actionType === 'oto_kurtarma') list = list.filter(d => d.serviceType === 'oto_kurtarma');
    else if (actionType === 'sarj_istasyonu') list = list.filter(d => d.serviceType === 'sarj_istasyonu');
    else if (actionType === 'seyyar_sarj') list = list.filter(d => d.serviceType === 'seyyar_sarj');
    return list;
  }, [allDrivers, actionType]);

  const handleFilterChange = (type: string) => {
    setActionType(type);
    setActiveDriverId(null);
    setLoadingDrivers(true);
    if (searchCoords) fetchDrivers(searchCoords[0], searchCoords[1], type, false);
  };

  const handleMapMove = (lat: number, lng: number) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchDrivers(lat, lng, actionType, true);
    }, 500);
  };

  // 🔥 ARA/WHATSAPP TIKLANDIĞI AN ÇALIŞAN MERKEZİ TEMİZLİK 🔥
  const handleStartOrder = async (driver: any, method: 'call' | 'message') => {
    setActiveOrder({ ...driver, driverId: driver._id, status: 'IN_PROGRESS', startTime: new Date() });
    
    // Arayüzü anında temizle
    setActiveDriverId(null);
    setActionType(''); 

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

  // 🔥 "VAZGEÇ" VEYA "BİTTİ" DENİNCE HER ŞEYİ SIFIRLAYAN FONKSİYON 🔥
  const resetToMainMenu = () => {
    setActiveOrder(null);
    setActiveDriverId(null);
    setActionType(''); // Alttaki tüm filtreleri ve paneli temizle
    if (searchCoords) fetchDrivers(searchCoords[0], searchCoords[1], '', false);
  };

  const handleRoleSelect = (role: 'customer' | 'provider', providerData?: any) => {
    setUserRole(role);
    localStorage.setItem('transporter_user_role', role);
    if (role === 'provider' && providerData) {
      setCurrentProviderId(providerData._id);
      setCurrentUser(providerData);
      localStorage.setItem('transporter_provider_id', providerData._id); 
    } 
    if (role === 'customer') setShowCustomerGuide(true);
  };

  return (
    <>
      <UserAgreementModal />

      {!userRole ? (
        <AuthModal onRoleSelect={handleRoleSelect} />
      ) : (
        <div className="relative w-full h-screen overflow-hidden bg-gray-50">
          
          {/* HARİTA KATMANI */}
          <div className="absolute inset-0 z-0">
            <MapComponent 
              searchCoords={searchCoords} 
              drivers={finalFilteredDrivers} 
              onStartOrder={handleStartOrder} 
              activeDriverId={activeDriverId} 
              onSelectDriver={setActiveDriverId} 
              onMapMove={handleMapMove} 
              onMapClick={() => setActiveDriverId(null)} 
            />
          </div>
          
          <ChatWidget isOpen={isChatOpen} onToggle={setChatOpen} contextData={{ drivers: allDrivers, userLocation: searchCoords }} />
          <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} onProfileClick={() => setShowProfileModal(true)} sidebarOpen={sidebarOpen} />
          
          {/* SİPARİŞ ONAY/TAKİP PANELİ */}
          <ActiveOrderPanel 
            activeOrder={activeOrder} 
            onComplete={() => { resetToMainMenu(); setShowRatingModal(true); }} 
            onCancel={resetToMainMenu} 
          />

          {/* ALT AKSİYON PANELİ (Sadece sipariş yoksa ve müşteri ise görünür) */}
          {!activeOrder && userRole === 'customer' && (
            <ActionPanel 
              drivers={finalFilteredDrivers} 
              loading={loadingDrivers}
              actionType={actionType} 
              onActionChange={handleFilterChange} 
              onFilterApply={handleFilterChange} 
              onSearchLocation={(lat, lng) => { 
                  setSearchCoords([lat, lng]); 
                  fetchDrivers(lat, lng, actionType, true); 
              }}
              activeDriverId={activeDriverId}
              onSelectDriver={setActiveDriverId} 
              onStartOrder={handleStartOrder}
              onReset={resetToMainMenu}
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

          {/* MODALLAR VE DİĞER UI ELEMANLARI */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onSelectAction={(type) => { setSidebarOpen(false); handleFilterChange(type); }} onReportClick={(id) => { setReportOrderId(id); setShowReportModal(true); setSidebarOpen(false); }} />
          <RatingModal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} onRate={() => {}} />
          <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
          <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} orderId={reportOrderId} />
          
          {showCustomerGuide && <CustomerGuide onClose={() => setShowCustomerGuide(false)} />}
          {isFirstLoad && <ScanningLoader />}
        </div>
      )}
    </>
  );
}