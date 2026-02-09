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




// Haritayı SSR (Server Side Rendering) olmadan yükle
const MapComponent = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Harita Yükleniyor...</div> 
});

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';
const FALLBACK_LAT = 38.4237; // İzmir
const FALLBACK_LNG = 27.1428;

// Veriyi güvenli hale getirme (Crash önleyici)
const normalizeDriverData = (data: any[]) => {
  if (!Array.isArray(data)) return [];
  return data.map(d => ({
    ...d,
    location: {
      coordinates: Array.isArray(d.location?.coordinates) 
        ? [d.location.coordinates[0], d.location.coordinates[1]] 
        : (Array.isArray(d.location) ? d.location : [FALLBACK_LNG, FALLBACK_LAT])
    },
    address: d.address || 'Konum verisi alınıyor...',
    serviceType: d.serviceType || 'other',
    rating: d.rating || 5,
    distance: d.distance || 0
  }));
};

export default function Home() {
  // --- STATE YÖNETİMİ ---
  const [userRole, setUserRole] = useState<'guest' | 'customer' | 'provider' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProviderId, setCurrentProviderId] = useState<string | null>(null);
  
  // UI Kontrolleri
  const [showCustomerGuide, setShowCustomerGuide] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Harita ve Veri
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [allDrivers, setAllDrivers] = useState<any[]>([]); 
  const [loadingDrivers, setLoadingDrivers] = useState(true); 
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Aksiyon ve Filtreleme
  const [actionType, setActionType] = useState<string>(''); // 'nakliye', 'kurtarici', 'vinc' vb.
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>(''); 
  const [reportOrderId, setReportOrderId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- BAŞLANGIÇ AYARLARI ---
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

  // --- VERİ ÇEKME (API) ---
  const fetchDrivers = useCallback((lat: number, lng: number, isBackground: boolean = false) => {
    if (!isBackground) setLoadingDrivers(true);
    
    // Önceki isteği iptal et (Hızlı harita hareketlerinde çakışmayı önler)
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const url = new URL(`${API_URL}/users/nearby`);
    url.searchParams.append('lat', lat.toString());
    url.searchParams.append('lng', lng.toString());
    // Not: API'ye type göndermiyoruz, tüm veriyi çekip client-side filtreliyoruz (daha hızlı UI için)

    fetch(url.toString(), { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        setAllDrivers(normalizeDriverData(data)); 
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => {
        setLoadingDrivers(false);
        if (!isBackground) setTimeout(() => { setIsFirstLoad(false); }, 1500); 
      });
  }, []);

  // İlk konum alma
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSearchCoords([pos.coords.latitude, pos.coords.longitude]);
          fetchDrivers(pos.coords.latitude, pos.coords.longitude, false);
        },
        () => {
          setSearchCoords([FALLBACK_LAT, FALLBACK_LNG]);
          fetchDrivers(FALLBACK_LAT, FALLBACK_LNG, false);
        },
        { timeout: 10000 }
      );
    }
  }, [fetchDrivers]); 

  // --- FİLTRELEME MANTIĞI ---
  const filteredDrivers = useMemo(() => {
    // 1. Eğer hiç veri yoksa boş dön
    if (!allDrivers.length) return [];

    // 2. Eğer hiçbir kategori seçili değilse (ana ekran), yine de haritada veri gösterelim mi?
    // Genelde "Yakınımdaki her şey" mantığı iyidir. Ama ActionPanel kapalıysa sadece map görünür.
    let list = [...allDrivers];

    // 3. ActionType'a göre filtreleme
    if (actionType) {
      // KURTARICI GRUBU
      if (actionType === 'kurtarici') {
        // Genel kurtarıcı seçildiyse: oto_kurtarma, vinc, kurtarici hepsi gelsin
        list = list.filter(d => ['kurtarici', 'oto_kurtarma', 'vinc'].includes(d.serviceType));
      } 
      else if (actionType === 'vinc') {
        list = list.filter(d => d.serviceType === 'vinc');
      }
      else if (actionType === 'oto_kurtarma') {
        list = list.filter(d => d.serviceType === 'oto_kurtarma');
      }
      // NAKLİYE GRUBU
      else if (actionType === 'nakliye') {
        // Genel nakliye seçildiyse: nakliye, kamyon, tir, evden_eve hepsi gelsin (yurt dışı hariç)
        list = list.filter(d => ['nakliye', 'kamyon', 'tir', 'evden_eve'].includes(d.serviceType));
      }
      else if (actionType === 'yurt_disi' || actionType === 'yurt_disi_nakliye') {
        list = list.filter(d => d.serviceType === 'yurt_disi_nakliye');
      }
      // ŞARJ GRUBU
      else if (actionType === 'sarj') {
         list = list.filter(d => ['sarj_istasyonu', 'seyyar_sarj'].includes(d.serviceType));
      }
      else if (actionType === 'sarj_istasyonu') {
        list = list.filter(d => d.serviceType === 'sarj_istasyonu');
      }
      else if (actionType === 'seyyar_sarj') {
        list = list.filter(d => d.serviceType === 'seyyar_sarj');
      }
    }

    return list;
  }, [allDrivers, actionType]);

  // --- UI HANDLERS ---

  // Harita hareket ettikçe veri güncelle (Debounce ile)
  const handleMapMove = (lat: number, lng: number) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchDrivers(lat, lng, true);
    }, 500);
  };

  // Kategori değişimi (ActionPanel'den gelen tetik)
  const handleActionChange = (type: string) => {
    setActionType(type);
    setActiveDriverId(null); // Kategori değişince seçili kişi iptal
  };

  // Sipariş Başlatma
  const handleStartOrder = async (driver: any, method: 'call' | 'message') => {
    setActiveOrder({ ...driver, driverId: driver._id, status: 'IN_PROGRESS', startTime: new Date() });
    
    // Arayüzü temizle
    setActiveDriverId(null);
    setActionType(''); 
    setSidebarOpen(false);

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
    } catch (e) { console.error("Sipariş hatası:", e); }
  };

  // Sıfırlama
  const resetToMainMenu = () => {
    setActiveOrder(null);
    setActiveDriverId(null);
    setActionType(''); 
    if (searchCoords) fetchDrivers(searchCoords[0], searchCoords[1], false);
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
          
          {/* HARİTA */}
          <div className="absolute inset-0 z-0">
            <MapComponent 
              searchCoords={searchCoords} 
              drivers={filteredDrivers} // Filtrelenmiş veri gidiyor
              onStartOrder={handleStartOrder} 
              activeDriverId={activeDriverId} 
              onSelectDriver={setActiveDriverId} 
              onMapMove={handleMapMove} 
              onMapClick={() => setActiveDriverId(null)} 
            />
          </div>
          
          {/* ÜST BAR VE MENÜLER */}
          <ChatWidget isOpen={isChatOpen} onToggle={setChatOpen} contextData={{ drivers: allDrivers, userLocation: searchCoords }} />
          <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} onProfileClick={() => setShowProfileModal(true)} sidebarOpen={sidebarOpen} />
          
          {/* AKTİF SİPARİŞ VARSA GÖSTER */}
          <ActiveOrderPanel 
            activeOrder={activeOrder} 
            onComplete={() => { resetToMainMenu(); setShowRatingModal(true); }} 
            onCancel={resetToMainMenu} 
          />

          {/* MÜŞTERİ İÇİN AKSİYON PANELİ */}
          {!activeOrder && userRole === 'customer' && (
            <ActionPanel 
              drivers={filteredDrivers} // Harita ile aynı veri
              loading={loadingDrivers}
              
              // Seçim State'leri
              actionType={actionType} 
              onActionChange={handleActionChange} // Ana kategori değişimi
              onFilterApply={handleActionChange} // Alt filtre değişimi (aynı state'i kullanıyoruz)
              
              // Konum
              onSearchLocation={(lat, lng) => { 
                  setSearchCoords([lat, lng]); 
                  fetchDrivers(lat, lng, false); 
              }}
              
              // Sürücü Seçimi
              activeDriverId={activeDriverId}
              onSelectDriver={setActiveDriverId} 
              
              // Aksiyonlar
              onStartOrder={handleStartOrder}
              onReset={resetToMainMenu}
            />
          )}

          {/* TEDARİKÇİ PANELİ */}
          {userRole === 'provider' && currentProviderId && (
            <ProviderPanel 
              providerId={currentProviderId} 
              providerData={currentUser || allDrivers.find(d => d._id === currentProviderId)} 
              onComplete={() => window.location.reload()} 
              onCancel={() => window.location.reload()} 
            /> 
          )}

          {/* DİĞER MODALLAR */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onSelectAction={(type) => { setSidebarOpen(false); handleActionChange(type); }} onReportClick={(id) => { setReportOrderId(id); setShowReportModal(true); setSidebarOpen(false); }} />
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