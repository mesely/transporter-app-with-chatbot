'use client';

import { 
  Truck, Zap, Star, MapPin, Wrench, 
  ChevronDown, LocateFixed, Loader2, 
  MessageCircle, Phone, Navigation,
  Globe, CarFront, Anchor, Home, 
  Package, Container, ArrowUpDown, Banknote
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

const CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

const DEFAULT_LAT = 38.4237; 
const DEFAULT_LNG = 27.1428;

// 🔥 YENİ VERİTABANI YAPISINA UYGUN INTERFACE 🔥
interface Driver {
  _id: string;
  businessName: string; // Artık firstName yok, İşletme Adı var
  distance: number;
  phoneNumber?: string;
  rating?: number;
  location?: { coordinates: [number, number] };
  
  // Yeni Nested Yapılar
  address?: {
    city?: string;
    district?: string;
    fullText?: string;
  };
  service?: {
    mainType: string; // KURTARICI, NAKLIYE, SARJ
    subType: string;  // vinc, tir, mobil_unit vb.
    tags: string[];
  };
  pricing?: {
    openingFee: number;
    pricePerUnit: number;
  };
}

interface ActionPanelProps {
  onSearchLocation: (lat: number, lng: number) => void;
  onFilterApply: (type: string) => void; 
  onStartOrder: (driver: Driver, method: 'call' | 'message') => void;
  actionType: string; 
  onActionChange: (type: string) => void;
  drivers: Driver[]; 
  loading: boolean; 
  onReset: () => void;
  activeDriverId: string | null;
  onSelectDriver: (id: string | null) => void;
}

const SkeletonCard = () => (
  <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-6 mb-4 border border-white/40 shadow-sm animate-pulse">
    <div className="flex justify-between items-start">
      <div className="flex gap-4 flex-1">
        <div className="w-14 h-14 bg-gray-200/50 rounded-2xl shrink-0" />
        <div className="space-y-2 w-full pt-1">
          <div className="h-4 bg-gray-200/50 rounded w-3/4" />
          <div className="h-3 bg-gray-200/50 rounded w-1/2" />
        </div>
      </div>
      <div className="w-16 h-8 bg-gray-200/50 rounded-lg" />
    </div>
  </div>
);

export default function ActionPanel({ 
  onSearchLocation, onFilterApply, onStartOrder, 
  actionType, onActionChange, drivers, loading, onReset,
  activeDriverId, onSelectDriver
}: ActionPanelProps) {
  
  const [panelState, setPanelState] = useState<0 | 1 | 2>(0); 
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  
  // Alt Satır Kontrolleri
  const [showTowRow, setShowTowRow] = useState(false);
  const [showChargeRow, setShowChargeRow] = useState(false);
  const [showDomesticRow, setShowDomesticRow] = useState(false);

  // Sonsuz Kaydırma ve Sıralama
  const [visibleItems, setVisibleItems] = useState(5); 
  const [sortMode, setSortMode] = useState<'distance' | 'rating' | 'price_asc' | 'price_desc'>('distance');
  const [selectedCity, setSelectedCity] = useState('');
  
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const dragStartY = useRef<number | null>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Aktif sürücü değişince scrolle
  useEffect(() => {
    if (activeDriverId) {
      if (panelState === 0) setPanelState(1);
      setTimeout(() => {
        itemRefs.current[activeDriverId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [activeDriverId]);

  // Kategori butonlarına basınca UI yönetimi
  const handleMainCategoryClick = (category: 'kurtarici' | 'nakliye' | 'sarj') => {
    setPanelState(1);
    setVisibleItems(5); // Reset scroll
    if (listContainerRef.current) listContainerRef.current.scrollTop = 0;

    if (category === 'kurtarici') {
        setShowTowRow(!showTowRow); setShowChargeRow(false); setShowDomesticRow(false);
        onActionChange('kurtarici');
    } else if (category === 'nakliye') {
        setShowTowRow(false); setShowChargeRow(false); setShowDomesticRow(false);
        onActionChange('nakliye');
    } else if (category === 'sarj') {
        setShowTowRow(false); setShowChargeRow(!showChargeRow); setShowDomesticRow(false);
        onActionChange('sarj');
    }
  };

  const findMyLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSearchLocation(position.coords.latitude, position.coords.longitude);
          setIsLocating(false);
        },
        () => {
          onSearchLocation(DEFAULT_LAT, DEFAULT_LNG);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  useEffect(() => {
    findMyLocation();
    fetch(`${API_URL}/tariffs`).then(res => res.json()).then(data => { if (Array.isArray(data)) setTariffs(data); });
  }, []);

  const handleDragStart = (y: number) => { dragStartY.current = y; };
  
  const handleDragEnd = (y: number) => {
    if (dragStartY.current === null) return;
    const diff = dragStartY.current - y; 
    const threshold = 50; 

    if (diff > threshold) {
        if (panelState === 0) setPanelState(1);
        else if (panelState === 1) setPanelState(2);
    } 
    else if (diff < -threshold) {
        if (panelState === 2) setPanelState(1);
        else if (panelState === 1) setPanelState(0);
    }
    dragStartY.current = null;
  };

  // 🔥 YENİ FİYAT HESAPLAMA (Nested Pricing'e Göre)
  const getPricing = (driver: Driver) => {
    const subType = driver.service?.subType;
    const matched = tariffs.find(t => t.serviceType === subType);
    
    // Veritabanındaki 'pricing' objesinden al, yoksa tarifeden al
    const opening = driver.pricing?.openingFee ?? matched?.openingFee ?? 350;
    const unit = driver.pricing?.pricePerUnit ?? matched?.pricePerUnit ?? 40;
    
    // Basit mesafe bazlı hesap (simülasyon için)
    const distKm = driver.distance ? driver.distance / 1000 : 1; 
    const calculated = opening + (distKm * unit);
    
    return { 
        total: calculated, 
        displayTotal: calculated.toFixed(0), 
        opening, 
        unit 
    };
  };

  const openGoogleMaps = (e: React.MouseEvent, driver: Driver) => {
    e.stopPropagation();
    const lat = driver.location?.coordinates[1];
    const lng = driver.location?.coordinates[0];
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  // --- 🔥 GÜNCELLENMİŞ FİLTRELEME & SIRALAMA MANTIĞI (YENİ DB UYUMLU) ---
  const displayDrivers = useMemo(() => {
    let list = [...safeDrivers];

    // 1. Şehir Filtresi (Adres objesinden)
    if (selectedCity) {
      list = list.filter(d => d.address?.city?.toLocaleLowerCase('tr') === selectedCity.toLocaleLowerCase('tr'));
    }
    
    // 2. Kategori Filtresi (Service objesinden)
    if (actionType) {
        // Özel Filtreler (SubType kontrolü)
        if (actionType === 'yurt_disi') { list = list.filter(d => d.service?.subType === 'yurt_disi_nakliye'); }
        else if (actionType === 'vinc') { list = list.filter(d => d.service?.subType === 'vinc'); }
        else if (actionType === 'oto_kurtarma') { list = list.filter(d => d.service?.subType === 'oto_kurtarma'); }
        else if (actionType === 'sarj_istasyonu') { list = list.filter(d => d.service?.subType === 'sarj_istasyonu'); }
        else if (actionType === 'seyyar_sarj') { list = list.filter(d => d.service?.subType === 'seyyar_sarj' || d.service?.subType === 'MOBIL_UNIT'); }
        
        // Yurt İçi Alt Kırılımları
        else if (['nakliye', 'tir', 'kamyon', 'kamyonet'].includes(actionType)) { 
            if (actionType === 'nakliye') {
                 // Genel Nakliye seçildiyse hepsini getir
                 list = list.filter(d => ['nakliye', 'kamyon', 'tir', 'kamyonet'].includes(d.service?.subType || ''));
            } else {
                 // Spesifik (Tır vs)
                 list = list.filter(d => d.service?.subType === actionType);
            }
        }
        
        // Ana Kategori Seçimleri (MainType kontrolü)
        else if (actionType === 'kurtarici') {
            list = list.filter(d => d.service?.mainType === 'KURTARICI');
        }
        else if (actionType === 'sarj') {
            list = list.filter(d => d.service?.mainType === 'SARJ');
        }
    }

    // 3. Sıralama Mantığı
    list.sort((a, b) => {
      if (sortMode === 'rating') return (b.rating || 0) - (a.rating || 0);
      
      if (sortMode === 'price_asc') {
          return getPricing(a).total - getPricing(b).total;
      }
      
      if (sortMode === 'price_desc') {
          return getPricing(b).total - getPricing(a).total;
      }

      return a.distance - b.distance; // Default
    });

    return list;

  }, [safeDrivers, sortMode, selectedCity, actionType]); 

  // --- INFINITE SCROLL ---
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (visibleItems < displayDrivers.length) {
        setVisibleItems(prev => prev + 5);
      }
    }
  }, [visibleItems, displayDrivers.length]);

  const renderedDrivers = displayDrivers.slice(0, visibleItems);
  
  let heightClass = 'h-36'; 
  if (panelState === 1) heightClass = 'h-[55vh]'; 
  if (panelState === 2) heightClass = 'h-[92vh]'; 

  const getSortLabel = () => {
      switch(sortMode) {
          case 'distance': return 'YAKIN';
          case 'rating': return 'PUAN';
          case 'price_asc': return 'UCUZ';
          case 'price_desc': return 'PAHALI';
          default: return 'SIRALA';
      }
  };

  const cycleSortMode = () => {
      if (sortMode === 'distance') setSortMode('rating');
      else if (sortMode === 'rating') setSortMode('price_asc');
      else if (sortMode === 'price_asc') setSortMode('price_desc');
      else setSortMode('distance');
  };

  return (
    <div 
      onMouseDown={(e) => handleDragStart(e.clientY)}
      onMouseUp={(e) => handleDragEnd(e.clientY)}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
      onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientY)}
      className={`fixed inset-x-0 bottom-0 z-[1000] transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) rounded-t-[3.5rem] flex flex-col ${heightClass} bg-white/10 backdrop-blur-md border-t border-white/30 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pt-2 overflow-visible`}
    >
      <div 
        onClick={() => setPanelState(prev => prev === 0 ? 1 : prev === 1 ? 2 : 0)} 
        className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0 z-50 hover:opacity-80 transition-opacity"
      >
        <div className="w-16 h-1.5 bg-gray-400/30 rounded-full shadow-sm"></div>
      </div>

      <div className="px-6 pb-6 flex flex-col h-full overflow-hidden relative">
        
        {/* --- 1. ANA KATEGORİ BUTONLARI --- */}
        <div className="flex gap-3 shrink-0 mb-4">
          <button 
            onClick={() => handleMainCategoryClick('kurtarici')} 
            className={`flex-1 py-5 rounded-[2.2rem] flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 duration-300 ${actionType.includes('kurtarici') || showTowRow ? 'bg-red-600 text-white scale-105 shadow-red-500/30' : 'bg-white/80 text-red-600 border border-white/40'}`}
          >
            <Wrench size={26} className="mb-1" /> <span className="text-[10px] font-black uppercase tracking-tighter">Kurtarıcı</span>
          </button>
          
          <button 
            onClick={() => handleMainCategoryClick('nakliye')} 
            className={`flex-1 py-5 rounded-[2.2rem] flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 duration-300 ${(actionType.includes('nakliye') || actionType === 'yurt_disi' || showDomesticRow) ? 'bg-purple-600 text-white scale-105 shadow-purple-500/30' : 'bg-white/80 text-purple-600 border border-white/40'}`}
          >
            <Truck size={26} className="mb-1" /> <span className="text-[10px] font-black uppercase tracking-tighter">Nakliye</span>
          </button>
          
          <button 
            onClick={() => handleMainCategoryClick('sarj')} 
            className={`flex-1 py-5 rounded-[2.2rem] flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 duration-300 ${(actionType.includes('sarj') || showChargeRow) ? 'bg-blue-600 text-white scale-105 shadow-blue-500/30' : 'bg-white/80 text-blue-600 border border-white/40'}`}
          >
            <Zap size={26} className="mb-1" /> <span className="text-[10px] font-black uppercase tracking-tighter">Şarj</span>
          </button>
        </div>

        {/* --- 2. ALT FİLTRELER --- */}
        <div className="space-y-3 shrink-0 mb-2 transition-all duration-300">
          
          {showTowRow && (
            <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
              <button onClick={() => { onFilterApply('oto_kurtarma'); setVisibleItems(5); }} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md flex items-center justify-center gap-2 transition-all ${actionType === 'oto_kurtarma' ? 'bg-red-800 text-white ring-2 ring-red-400' : 'bg-red-50 text-red-600 border border-red-100'}`}><CarFront size={14}/> Oto Kurtarma</button>
              <button onClick={() => { onFilterApply('vinc'); setVisibleItems(5); }} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md flex items-center justify-center gap-2 transition-all ${actionType === 'vinc' ? 'bg-red-900 text-white ring-2 ring-red-400' : 'bg-red-100 text-red-800 border border-red-200'}`}><Anchor size={14}/> Vinç</button>
            </div>
          )}

          {(['nakliye', 'yurt_disi', 'tir', 'kamyon', 'kamyonet'].some(t => actionType === t) || showDomesticRow) && (
             <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
                <button 
                  onClick={() => { setShowDomesticRow(true); onFilterApply('nakliye'); setVisibleItems(5); }} 
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md flex items-center justify-center gap-2 transition-all ${actionType !== 'yurt_disi' ? 'bg-purple-700 text-white ring-2 ring-purple-300' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}
                >
                  <Truck size={14}/> Yurt İçi
                </button>
                <button 
                  onClick={() => { setShowDomesticRow(false); onFilterApply('yurt_disi'); setVisibleItems(5); }} 
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md flex items-center justify-center gap-2 transition-all ${actionType === 'yurt_disi' ? 'bg-indigo-800 text-white ring-2 ring-indigo-300' : 'bg-indigo-50 text-indigo-800 border border-indigo-100'}`}
                >
                  <Globe size={14}/> Yurt Dışı
                </button>
             </div>
          )}

          {showDomesticRow && actionType !== 'yurt_disi' && (
            <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
               <button onClick={() => { onFilterApply('nakliye'); setVisibleItems(5); }} className={`py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex flex-col items-center justify-center gap-1 transition-all ${actionType === 'nakliye' ? 'bg-purple-800 text-white ring-1 ring-purple-400' : 'bg-purple-50 text-purple-800 border border-purple-100'}`}>
                 <Home size={14}/> Tümü
               </button>
               <button onClick={() => { onFilterApply('tir'); setVisibleItems(5); }} className={`py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex flex-col items-center justify-center gap-1 transition-all ${actionType === 'tir' ? 'bg-purple-800 text-white ring-1 ring-purple-400' : 'bg-purple-50 text-purple-800 border border-purple-100'}`}>
                 <Truck size={14}/> Tır
               </button>
               <button onClick={() => { onFilterApply('kamyon'); setVisibleItems(5); }} className={`py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex flex-col items-center justify-center gap-1 transition-all ${actionType === 'kamyon' ? 'bg-purple-800 text-white ring-1 ring-purple-400' : 'bg-purple-50 text-purple-800 border border-purple-100'}`}>
                 <Container size={14}/> Kamyon
               </button>
               <button onClick={() => { onFilterApply('kamyonet'); setVisibleItems(5); }} className={`py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex flex-col items-center justify-center gap-1 transition-all ${actionType === 'kamyonet' ? 'bg-purple-800 text-white ring-1 ring-purple-400' : 'bg-purple-50 text-purple-800 border border-purple-100'}`}>
                 <Package size={14}/> Kamyonet
               </button>
            </div>
          )}

          {showChargeRow && (
            <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
              <button onClick={() => { onFilterApply('sarj_istasyonu'); setVisibleItems(5); }} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md flex items-center justify-center gap-2 transition-all ${actionType === 'sarj_istasyonu' ? 'bg-blue-800 text-white ring-2 ring-blue-300' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}><Navigation size={14}/> İstasyon</button>
              <button onClick={() => { onFilterApply('seyyar_sarj'); setVisibleItems(5); }} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md flex items-center justify-center gap-2 transition-all ${actionType === 'seyyar_sarj' ? 'bg-cyan-600 text-white ring-2 ring-cyan-300' : 'bg-cyan-50 text-cyan-600 border border-cyan-100'}`}><Zap size={14}/> Mobil Şarj</button>
            </div>
          )}
        </div>

        {/* --- 3. BAR --- */}
        {panelState > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide py-2 shrink-0">
              <div className="relative shrink-0 group">
                <select value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setVisibleItems(5); }} className="appearance-none bg-black text-white pl-4 pr-10 py-3 rounded-2xl text-[10px] font-black uppercase focus:outline-none border border-white/10 shadow-lg active:scale-95 transition-transform">
                  <option value="">TÜRKİYE (İL)</option>
                  {CITIES.map(city => <option key={city} value={city}>{city.toUpperCase()}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
              </div>

              <button 
                onClick={cycleSortMode} 
                className={`px-4 py-3 rounded-2xl text-[10px] font-black border transition-all shrink-0 flex items-center gap-2 shadow-lg active:scale-95 ${sortMode !== 'distance' ? 'bg-gray-900 text-white border-black' : 'bg-white/80 text-gray-700 border-white/20'}`}
              >
                 {sortMode === 'price_asc' || sortMode === 'price_desc' ? <Banknote size={14} /> : <ArrowUpDown size={14} />}
                 {getSortLabel()}
              </button>

              <button onClick={findMyLocation} className={`px-4 py-3 text-white rounded-2xl bg-blue-600 shadow-lg active:scale-95 shrink-0 ml-auto transition-colors ${isLocating ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                 {isLocating ? <Loader2 size={18} className="animate-spin"/> : <LocateFixed size={18} />}
              </button>
          </div>
        )}

        {/* --- 4. SÜRÜCÜ LİSTESİ --- */}
        <div 
            ref={listContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pb-40 custom-scrollbar overscroll-contain"
        >
          {loading ? (
             <div className="space-y-3">
               {[1,2,3].map(i => <SkeletonCard key={i} />)}
             </div>
          ) : renderedDrivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
               <div className="bg-gray-100 p-4 rounded-full mb-3"><MapPin size={32} className="text-gray-400" /></div>
               <h3 className="text-gray-800 font-black text-sm uppercase mb-1">Araç Bulunamadı</h3>
               <button onClick={() => document.querySelector('select')?.focus()} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95">ŞEHİR SEÇİNİZ</button>
            </div>
          ) : (
            <>
            {renderedDrivers.map((driver) => {
                const isSelected = activeDriverId === driver._id;
                const pricing = getPricing(driver);
                // 🔥 YENİ DB YAPISI: subType kontrolü
                const type = driver.service?.subType || '';
                
                let iconBg = 'bg-gray-600'; 
                let IconComponent = Truck;

                if (type === 'sarj_istasyonu') { iconBg = 'bg-blue-600'; IconComponent = Navigation; }
                else if (type === 'seyyar_sarj' || type === 'MOBIL_UNIT') { iconBg = 'bg-cyan-500'; IconComponent = Zap; }
                else if (type === 'vinc') { iconBg = 'bg-red-900'; IconComponent = Anchor; }
                else if (type === 'oto_kurtarma' || type.includes('kurtar')) { iconBg = 'bg-red-600'; IconComponent = CarFront; }
                else if (type === 'yurt_disi_nakliye') { iconBg = 'bg-indigo-600'; IconComponent = Globe; }
                else if (type === 'nakliye') { iconBg = 'bg-purple-500'; IconComponent = Home; }
                else if (type === 'tir') { iconBg = 'bg-purple-800'; IconComponent = Truck; }
                else if (type === 'kamyonet') { iconBg = 'bg-purple-400'; IconComponent = Package; }
                else if (['nakliye', 'kamyon'].some(t => type.includes(t))) { iconBg = 'bg-purple-600'; IconComponent = Truck; }

                return (
                <div 
                    key={driver._id} 
                    ref={el => { itemRefs.current[driver._id] = el; }} 
                    onClick={() => onSelectDriver(isSelected ? null : driver._id)} 
                    className={`bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 mb-4 shadow-xl border transition-all duration-300 cursor-pointer active:scale-[0.98] ${isSelected ? 'border-green-500 ring-4 ring-green-500/10' : 'border-white/40'}`}
                >
                    <div className="flex justify-between items-start">
                    <div className="flex gap-4 flex-1 min-w-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${iconBg} text-white`}>
                        <IconComponent strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                        <h4 className="font-black text-gray-900 text-sm uppercase truncate leading-tight">
                            {/* 🔥 YENİ DB: businessName */}
                            {driver.businessName} 
                            <span className="flex items-center gap-1 mt-1">
                                {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= (driver.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}/>)}
                                <span className="text-[9px] text-gray-400 font-bold ml-1">{(driver.distance / 1000).toFixed(1)} km</span>
                            </span>
                        </h4>
                        {/* 🔥 YENİ DB: address.city */}
                        <div className="flex items-center gap-1 mt-1.5 text-gray-500 text-[10px] font-bold truncate"><MapPin size={10} className="text-green-500" /> {driver.address?.city || 'Merkez'}</div>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-xl font-black text-gray-900 leading-none">₺{pricing.unit}</div>
                        <div className="text-[8px] text-gray-400 font-bold uppercase mt-1">/Birim</div>
                    </div>
                    </div>
                    
                    {isSelected && (
                    <div className="mt-6 pt-6 border-t border-white/20 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-100/50 p-3 rounded-2xl text-center"><div className="text-[8px] font-black text-gray-400 uppercase mb-1">Açılış</div><div className="text-sm font-black">₺{pricing.opening}</div></div>
                            <div className="bg-gray-100/50 p-3 rounded-2xl text-center"><div className="text-[8px] font-black text-gray-400 uppercase mb-1">Birim</div><div className="text-sm font-black">₺{pricing.unit}</div></div>
                        </div>
                        
                        <button 
                            onClick={(e) => openGoogleMaps(e, driver)}
                            className={`w-full py-4 rounded-[2rem] font-black text-[10px] active:scale-95 shadow-lg uppercase flex items-center justify-center gap-2 text-white transition-transform ${type.includes('sarj') || type === 'MOBIL_UNIT' ? 'bg-blue-600 shadow-blue-500/30' : 'bg-gray-800 shadow-black/20'}`}
                        >
                            <Navigation size={16} /> YOL TARİFİ AL
                        </button>

                        <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onStartOrder(driver, 'call'); window.location.href=`tel:${driver.phoneNumber}`; }} className="flex-1 bg-black text-white py-5 rounded-[2rem] font-black text-[10px] active:scale-95 shadow-lg uppercase flex items-center justify-center gap-2"><Phone size={14}/> ARA</button>
                        <button onClick={(e) => { e.stopPropagation(); onStartOrder(driver, 'message'); window.open(`https://wa.me/${driver.phoneNumber?.replace(/\D/g, '')}`); }} className="flex-1 bg-green-600 text-white py-5 rounded-[2rem] font-black text-[10px] active:scale-95 shadow-lg uppercase flex items-center justify-center gap-2"><MessageCircle size={14}/> WHATSAPP</button>
                        </div>
                    </div>
                    )}
                </div>
                );
            })}
            
            {visibleItems < displayDrivers.length && (
               <div className="w-full py-4 flex justify-center">
                  <Loader2 className="animate-spin text-gray-400" size={24} />
               </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}