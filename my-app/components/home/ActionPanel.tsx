/**
 * @file ActionPanel.tsx
 * @description Transport 245 Master UI - Sürücü Arama ve Listeleme Paneli.
 * FIX: Alt özellik (tag) detayları dikey (alt alta) yerine yatay (yan yana) ve sarılı (wrap) şekilde düzenlendi.
 * FIX: Panel büyüyüp küçülürken (resize) oluşan titreme (flickering) sorununu çözmek için CSS transition optimizasyonu ve 'will-change' ipucu eklendi.
 * NOTE: Sadece seçili olan tag'lerin gösterilmesi mantığı zaten mevcuttu, yatay düzen ile bu daha net hale getirildi.
 */

'use client';

import { 
  Truck, Zap, Star, MapPin, Wrench, 
  ChevronDown, ChevronUp, LocateFixed, Loader2, 
  Navigation, Globe, CarFront, Anchor, Home, 
  Package, Container, ArrowUpDown, Map as MapIcon,
  Check, Phone, MessageCircle, Info, Users, Bus, Crown,
  TrendingDown, ThumbsUp, 
  Layers,
  Box,
  Archive,
  Snowflake
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

// --- KOORDİNAT VERİTABANI ---
const CITY_COORDINATES: Record<string, [number, number]> = {
  "Adana": [37.0000, 35.3213], "Adıyaman": [37.7648, 38.2786], "Afyonkarahisar": [38.7507, 30.5567],
  "Ağrı": [39.7191, 43.0503], "Aksaray": [38.3687, 34.0370], "Amasya": [40.6499, 35.8353],
  "Ankara": [39.9334, 32.8597], "Antalya": [36.8969, 30.7133], "Ardahan": [41.1105, 42.7022],
  "Artvin": [41.1828, 41.8183], "Aydın": [37.8560, 27.8416], "Balıkesir": [39.6484, 27.8826],
  "Bartın": [41.6344, 32.3375], "Batman": [37.8812, 41.1351], "Bayburt": [40.2552, 40.2249],
  "Bilecik": [40.1451, 29.9798], "Bingöl": [38.8853, 40.4980], "Bitlis": [38.4006, 42.1095],
  "Bolu": [40.7350, 31.6061], "Burdur": [37.7204, 30.2908], "Bursa": [40.1885, 29.0610],
  "Çanakkale": [40.1553, 26.4142], "Çankırı": [40.6013, 33.6134], "Çorum": [40.5506, 34.9556],
  "Denizli": [37.7765, 29.0864], "Diyarbakır": [37.9144, 40.2306], "Düzce": [40.8438, 31.1565],
  "Edirne": [41.6768, 26.5603], "Elazığ": [38.6810, 39.2264], "Erzincan": [39.7500, 39.5000],
  "Erzurum": [39.9043, 41.2679], "Eskişehir": [39.7667, 30.5256], "Gaziantep": [37.0662, 37.3833],
  "Giresun": [40.9128, 38.3895], "Gümüşhane": [40.4600, 39.4700], "Hakkari": [37.5833, 43.7333],
  "Hatay": [36.4018, 36.3498], "Iğdır": [39.9167, 44.0333], "Isparta": [37.7648, 30.5566],
  "İstanbul": [41.0082, 28.9784], "İzmir": [38.4237, 27.1428], "Kahramanmaraş": [37.5858, 36.9371],
  "Karabük": [41.2061, 32.6204], "Karaman": [37.1759, 33.2287], "Kars": [40.6167, 43.1000],
  "Kastamonu": [41.3887, 33.7827], "Kayseri": [38.7312, 35.4787], "Kilis": [36.7184, 37.1212],
  "Kırıkkale": [39.8468, 33.5153], "Kırklareli": [41.7333, 27.2167], "Kırşehir": [39.1425, 34.1709],
  "Kocaeli": [40.8533, 29.8815], "Konya": [37.8667, 32.4833], "Kütahya": [39.4167, 29.9833],
  "Malatya": [38.3552, 38.3095], "Manisa": [38.6191, 27.4289], "Mardin": [37.3212, 40.7245],
  "Mersin": [36.8000, 34.6333], "Muğla": [37.2153, 28.3636], "Muş": [38.9462, 41.7539],
  "Nevşehir": [38.6244, 34.7144], "Niğde": [37.9667, 34.6833], "Ordu": [40.9839, 37.8764],
  "Osmaniye": [37.0742, 36.2476], "Rize": [41.0201, 40.5234], "Sakarya": [40.7569, 30.3783],
  "Samsun": [41.2928, 36.3313], "Şanlıurfa": [37.1591, 38.7969], "Siirt": [37.9333, 41.9500],
  "Sinop": [42.0231, 35.1531], "Şırnak": [37.5164, 42.4611], "Sivas": [39.7477, 37.0179],
  "Tekirdağ": [40.9833, 27.5167], "Tokat": [40.3167, 36.5500], "Trabzon": [41.0027, 39.7168],
  "Tunceli": [39.1079, 39.5401], "Uşak": [38.6823, 29.4082], "Van": [38.4891, 43.4089],
  "Yalova": [40.6500, 29.2667], "Yozgat": [39.8181, 34.8147], "Zonguldak": [41.4564, 31.7987]
};

const DEFAULT_LAT = 39.9334; 
const DEFAULT_LNG = 32.8597;

// --- SERVICE_OPTIONS VE ALT SEÇENEKLER ---
const SERVICE_OPTIONS = [
  { id: 'oto_kurtarma', label: 'KURTARICI', icon: CarFront, color: 'bg-red-600', subs: [] },
  { id: 'vinc', label: 'VİNÇ', icon: Anchor, color: 'bg-rose-600', subs: [] },
  { id: 'yurt_disi_nakliye', label: 'YURT DIŞI NAKLİYE', icon: Globe, color: 'bg-indigo-600', subs: [] },
  { 
    id: 'tir', label: 'TIR', icon: Container, color: 'bg-violet-600',
    subs: [
      { id: 'tenteli', label: 'TENTELİ', icon: Archive },
      { id: 'frigorifik', label: 'FRİGORİFİK', icon: Snowflake },
      { id: 'lowbed', label: 'LOWBED', icon: Layers },
      { id: 'konteyner', label: 'KONTEYNER', icon: Container },
      { id: 'acik_kasa', label: 'AÇIK KASA', icon: Box }
    ]
  },
  { 
    id: 'kamyon', label: 'KAMYON', icon: Truck, color: 'bg-purple-600',
    subs: [
      { id: '6_teker', label: '6 TEKER', icon: Truck },
      { id: '8_teker', label: '8 TEKER', icon: Truck },
      { id: '10_teker', label: '10 TEKER', icon: Truck },
      { id: '12_teker', label: '12 TEKER', icon: Truck },
      { id: 'kirkayak', label: 'KIRKAYAK', icon: Layers }
    ]
  },
  { 
    id: 'kamyonet', label: 'KAMYONET', icon: Package, color: 'bg-fuchsia-600',
    subs: [
      { id: 'panelvan', label: 'PANELVAN', icon: CarFront },
      { id: 'acik_kasa', label: 'AÇIK KASA', icon: Box },
      { id: 'kapali_kasa', label: 'KAPALI KASA', icon: Archive }
    ]
  },
  { id: 'evden_eve', label: 'EVDEN EVE', icon: Home, color: 'bg-pink-600', subs: [] },
  { 
    id: 'yolcu_tasima', label: 'YOLCU TAŞIMA', icon: Users, color: 'bg-emerald-600',
    subs: [
      { id: 'minibus', label: 'MİNİBÜS', icon: CarFront },
      { id: 'otobus', label: 'OTOBÜS', icon: Bus },
      { id: 'midibus', label: 'MİDİBÜS', icon: Bus },
      { id: 'vip_tasima', label: 'VIP TRANSFER', icon: Crown }
    ]
  },
  { id: 'istasyon', label: 'İSTASYON', icon: Navigation, color: 'bg-blue-600', subs: [] },
  { id: 'seyyar_sarj', label: 'MOBİL ŞARJ', icon: Zap, color: 'bg-cyan-500', subs: [] },
];

const SUB_FILTERS: Record<string, { id: string, label: string }[]> = {
  tir: [{ id: 'tenteli', label: 'Tenteli' }, { id: 'frigorifik', label: 'Frigorifik' }, { id: 'lowbed', label: 'Lowbed' }, { id: 'konteyner', label: 'Konteyner' }, { id: 'acik_kasa', label: 'Açık Kasa' }],
  kamyon: [{ id: '6_teker', label: '6 Teker' }, { id: '8_teker', label: '8 Teker' }, { id: '10_teker', label: '10 Teker' }, { id: '12_teker', label: '12 Teker' }, { id: 'kirkayak', label: 'Kırkayak' }],
  kamyonet: [{ id: 'panelvan', label: 'Panelvan' }, { id: 'acik_kasa', label: 'Açık Kasa' }, { id: 'kapali_kasa', label: 'Kapalı Kasa' }],
  yolcu: [{ id: 'minibus', label: 'Minibüs' }, { id: 'otobus', label: 'Otobüs' }, { id: 'midibus', label: 'Midibüs' }, { id: 'vip_tasima', label: 'VIP' }]
};

// Alt Özellikler için Detaylı Bilgi Veritabanı
const TAG_DETAILS: Record<string, { tasima: string, kapasite: string }> = {
  'tenteli': { tasima: 'Paletli yük, Genel kargo', kapasite: '24 ton' },
  'frigorifik': { tasima: 'Gıda, İlaç, Soğuk zincir', kapasite: '22-24 ton' },
  'lowbed': { tasima: 'Ağır iş makineleri, Proje yükleri', kapasite: '30-100+ ton' },
  'konteyner': { tasima: 'Konteyner taşımacılığı', kapasite: '20-30 ton' },
  'acik_kasa': { tasima: 'Demir-çelik, Makine, Vinç', kapasite: '22-24 ton' },
  '6_teker': { tasima: 'Paletli yük, Kısa mesafe', kapasite: '15-20 ton' },
  '8_teker': { tasima: 'İnşaat malzemesi, Hafriyat', kapasite: '18-22 ton' },
  '10_teker': { tasima: 'İç, Ağır taşıma, Uzun mesafe', kapasite: '20-25 ton' },
  '12_teker': { tasima: 'Ağır ve uzun yol, Fabrika yükleri', kapasite: '20-25 ton' },
  'kirkayak': { tasima: 'Ağır sanayi, Büyük hacim', kapasite: '25-30 ton' },
  'panelvan': { tasima: 'Kargo, Eşya, Hafif yük', kapasite: '1-3 ton' },
  'kapali_kasa': { tasima: 'Ev eşyası, Koli, Tekstil', kapasite: '3-5 ton' },
};

// TİP TANIMLAMASI
interface ActionPanelProps {
  onSearchLocation: (lat: number, lng: number) => void;
  onFilterApply: (type: string) => void;
  onStartOrder: (driver: any, method: 'call' | 'message') => void;
  actionType: string;
  onActionChange: (t: string) => void;
  drivers: any[];
  loading: boolean;
  activeDriverId: string | null;
  onSelectDriver: (id: string | null) => void;
  activeTags: string[];
  onTagsChange: (tags: string[] | ((prev: string[]) => string[])) => void;
  isSidebarOpen: boolean;
}

export default function ActionPanel({ 
  onSearchLocation, onFilterApply, onStartOrder, actionType, onActionChange, 
  drivers, loading, activeDriverId, onSelectDriver, activeTags, onTagsChange, isSidebarOpen 
}: ActionPanelProps) {
  
  const [panelState, setPanelState] = useState<0 | 1 | 2 | 3>(1); 
  
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedCity, setSelectedCity] = useState(''); 
  const [sortMode, setSortMode] = useState<'distance' | 'rating' | 'price_asc' | 'price_desc'>('distance');

  const [showTowRow, setShowTowRow] = useState(false);
  const [showChargeRow, setShowChargeRow] = useState(false);
  const [showDomesticRow, setShowDomesticRow] = useState(false);
  const [showPassengerRow, setShowPassengerRow] = useState(false);
  
  const [activeTransportFilter, setActiveTransportFilter] = useState<string | null>(null);
  const dragStartY = useRef<number | null>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const listContainerRef = useRef<HTMLDivElement>(null);

  const activeThemeColor = useMemo(() => {
    if (actionType === 'seyyar_sarj') return 'bg-cyan-600';
    if (actionType.includes('sarj') || actionType === 'sarj_istasyonu') return 'bg-blue-600';
    if (actionType.includes('kurtarici') || actionType === 'oto_kurtarma' || actionType === 'vinc') return 'bg-red-600';
    if (actionType.includes('yolcu') || ['minibus','otobus','midibus','vip_tasima'].includes(actionType)) return 'bg-emerald-600';
    return 'bg-purple-600'; 
  }, [actionType]);

  const activeThemeText = useMemo(() => {
    if (actionType === 'seyyar_sarj') return 'text-cyan-600';
    if (actionType.includes('sarj') || actionType === 'sarj_istasyonu') return 'text-blue-600';
    if (actionType.includes('kurtarici') || actionType === 'oto_kurtarma' || actionType === 'vinc') return 'text-red-600';
    if (actionType.includes('yolcu') || ['minibus','otobus','midibus','vip_tasima'].includes(actionType)) return 'text-emerald-600';
    return 'text-purple-600'; 
  }, [actionType]);

  useEffect(() => {
    if (activeDriverId) {
      if (panelState < 2) setPanelState(2);
      setTimeout(() => { itemRefs.current[activeDriverId]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
    }
  }, [activeDriverId]);

  const handleMainCategoryClick = (category: string) => {
    setPanelState(current => (current <= 1 ? 2 : current));
    setActiveTransportFilter(null); onTagsChange([]); 
    
    if (category === 'kurtarici') {
        setShowTowRow(!showTowRow); setShowChargeRow(false); setShowDomesticRow(false); setShowPassengerRow(false);
        onActionChange('kurtarici'); onFilterApply('kurtarici');
    } else if (category === 'nakliye') {
        setShowTowRow(false); setShowChargeRow(false); setShowDomesticRow(true); setShowPassengerRow(false);
        onActionChange('nakliye'); onFilterApply('nakliye');
    } else if (category === 'sarj') {
        setShowTowRow(false); setShowChargeRow(!showChargeRow); setShowDomesticRow(false); setShowPassengerRow(false);
        onActionChange('sarj'); onFilterApply('sarj');
    } else if (category === 'yolcu') {
        setShowTowRow(false); setShowChargeRow(false); setShowDomesticRow(false); setShowPassengerRow(!showPassengerRow);
        onActionChange('yolcu'); onFilterApply('yolcu');
    }
  };

  const handleTransportTypeClick = (type: string) => {
    if (activeTransportFilter === type) {
        setActiveTransportFilter(null); onTagsChange([]);
        onFilterApply(type === 'yolcu' ? 'yolcu' : 'nakliye');
    } else {
        setActiveTransportFilter(type); onTagsChange([]); 
        onFilterApply(type); onActionChange(type);
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    if (city && CITY_COORDINATES[city]) {
      const [lat, lng] = CITY_COORDINATES[city];
      onSearchLocation(lat, lng);
    }
  };

  const getPricing = (driver: any) => {
    const matched = tariffs.find(t => t.serviceType === driver.service?.subType);
    const opening = driver.pricing?.openingFee ?? matched?.openingFee ?? 350;
    const unit = driver.pricing?.pricePerUnit ?? matched?.pricePerUnit ?? 40;
    const total = opening + (Math.max(1, (driver.distance || 0) / 1000) * unit);
    return { total, unit, opening };
  };

  const displayDrivers = useMemo(() => {
    let list = Array.isArray(drivers) ? [...drivers] : [];
    
    const isSpecialAction = actionType === 'seyyar_sarj' || actionType === 'yolcu' || ['minibus', 'otobus', 'midibus', 'vip_tasima', 'yolcu_tasima'].includes(actionType);
    
    if (selectedCity && !isSpecialAction) {
        list = list.filter(d => d.address?.city?.toLocaleLowerCase('tr') === selectedCity.toLocaleLowerCase('tr'));
    }

    if (activeTransportFilter && SUB_FILTERS[activeTransportFilter]) {
        const allowedSubTypes = [activeTransportFilter, ...SUB_FILTERS[activeTransportFilter].map(s => s.id)];
        list = list.filter(d => allowedSubTypes.includes(d.service?.subType));
    }

    list.sort((a, b) => {
      const priceA = getPricing(a).total;
      const priceB = getPricing(b).total;
      if (sortMode === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortMode === 'price_asc') return priceA - priceB;
      if (sortMode === 'price_desc') return priceB - priceA;
      return (a.distance || 0) - (b.distance || 0);
    });
    return list;
  }, [drivers, sortMode, selectedCity, tariffs, actionType, activeTransportFilter]); 

  const findMyLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { 
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          onSearchLocation(lat, lng);
          setIsLocating(false); 
        },
        () => { onSearchLocation(39.9334, 32.8597); setIsLocating(false); }
      );
    } else { onSearchLocation(39.9334, 32.8597); setIsLocating(false); }
  };

  useEffect(() => {
    findMyLocation();
    fetch(`${API_URL}/tariffs`).then(res => res.json()).then(data => { if (Array.isArray(data)) setTariffs(data); });
  }, []);

  const handleDragEnd = (y: number) => {
    if (dragStartY.current === null) return;
    const diff = dragStartY.current - y; 
    if (diff > 40) { setPanelState(p => Math.min(p + 1, 3) as 0|1|2|3); } 
    else if (diff < -40) { setPanelState(p => Math.max(p - 1, 0) as 0|1|2|3); }
    dragStartY.current = null;
  };

  const sizeClass = panelState === 3 ? 'h-[92vh]' : panelState === 2 ? 'h-[55vh]' : panelState === 1 ? 'h-36' : 'h-14'; 

  return (
    <div 
      onClick={() => panelState > 1 && setPanelState(prev => prev === 3 ? 2 : 1)}
      // 🔥 FIX: Titreme sorunu için transition özellikleri optimize edildi ve will-change eklendi.
      className={`fixed inset-x-0 bottom-0 z-[2000] transition-[height,transform,opacity] duration-500 cubic-bezier(0.32, 0.72, 0, 1) will-change-[height,transform] rounded-t-[3.5rem] flex flex-col ${sizeClass} ${isSidebarOpen ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'} bg-white/10 backdrop-blur-md border-t border-white/30 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] overflow-hidden text-gray-900`}
    >
      <div 
        onMouseDown={(e) => { e.stopPropagation(); dragStartY.current = e.clientY; }}
        onMouseUp={(e) => { e.stopPropagation(); handleDragEnd(e.clientY); }}
        onTouchStart={(e) => { e.stopPropagation(); dragStartY.current = e.touches[0].clientY; }}
        onTouchEnd={(e) => { e.stopPropagation(); handleDragEnd(e.changedTouches[0].clientY); }}
        onClick={(e) => { e.stopPropagation(); setPanelState(p => p === 3 ? 1 : p + 1 as 0|1|2|3); }}
        className="relative w-full flex justify-center py-5 cursor-grab active:cursor-grabbing shrink-0 z-[2001] hover:opacity-80 transition-opacity"
      >
        <div className="w-16 h-1.5 bg-gray-400/50 rounded-full shadow-sm"></div>

        {/* Dinamik Boyut Kontrol Okları */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 z-[2002]">
          <button 
            onClick={(e) => { e.stopPropagation(); setPanelState(p => Math.max(p - 1, 0) as 0|1|2|3); }}
            className={`p-1.5 rounded-full bg-white shadow-md transition-all active:scale-90 ${activeThemeText} hover:${activeThemeColor} hover:text-white`}
          >
            <ChevronDown size={18} strokeWidth={3} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setPanelState(p => Math.min(p + 1, 3) as 0|1|2|3); }}
            className={`p-1.5 rounded-full bg-white shadow-md transition-all active:scale-90 ${activeThemeText} hover:${activeThemeColor} hover:text-white`}
          >
            <ChevronUp size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()} className={`px-6 pb-6 flex flex-col h-full overflow-hidden relative ${panelState === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-opacity duration-300'}`}>
        <div className="flex gap-2 shrink-0 mb-4">
          <button onClick={() => handleMainCategoryClick('kurtarici')} className={`flex-1 py-4 rounded-[2rem] flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 ${actionType.includes('kurtarici') || showTowRow ? 'bg-red-600 text-white shadow-red-500/30' : 'bg-white/80 text-red-600 border border-white/40'}`}>
            <Wrench size={22} className="mb-1" /> <span className="text-[9px] font-black uppercase">Kurtarıcı</span>
          </button>
          <button onClick={() => handleMainCategoryClick('nakliye')} className={`flex-1 py-4 rounded-[2rem] flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 ${(actionType.includes('nakliye') || actionType === 'yurt_disi_nakliye' || actionType === 'evden_eve' || showDomesticRow) ? 'bg-purple-700 text-white shadow-purple-500/30' : 'bg-white/80 text-purple-700 border border-white/40'}`}>
            <Truck size={22} className="mb-1" /> <span className="text-[9px] font-black uppercase">Nakliye</span>
          </button>
          <button onClick={() => handleMainCategoryClick('sarj')} className={`flex-1 py-4 rounded-[2rem] flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 ${(actionType.includes('sarj') || actionType === 'seyyar_sarj' || showChargeRow) ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-white/80 text-blue-600 border border-white/40'}`}>
            <Zap size={22} className="mb-1" /> <span className="text-[9px] font-black uppercase">Şarj</span>
          </button>
          <button onClick={() => handleMainCategoryClick('yolcu')} className={`flex-1 py-4 rounded-[2rem] flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 ${(actionType.includes('yolcu') || showPassengerRow) ? 'bg-emerald-600 text-white shadow-emerald-500/30' : 'bg-white/80 text-emerald-600 border border-white/40'}`}>
            <Users size={22} className="mb-1" /> <span className="text-[9px] font-black uppercase">Yolcu</span>
          </button>
        </div>

        <div className="space-y-3 shrink-0 mb-2">
          {showTowRow && (
            <div className="flex gap-2 animate-in slide-in-from-top-2">
              <button onClick={() => { onFilterApply('oto_kurtarma'); }} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md flex items-center justify-center gap-2 transition-all ${actionType === 'oto_kurtarma' ? 'bg-red-800 text-white' : 'bg-red-50 text-red-600 border border-red-100'}`}><CarFront size={14}/> Oto Kurtarma</button>
              <button onClick={() => { onFilterApply('vinc'); }} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md flex items-center justify-center gap-2 transition-all ${actionType === 'vinc' ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800 border border-red-200'}`}><Anchor size={14}/> Vinç</button>
            </div>
          )}
          {(showDomesticRow || actionType === 'yurt_disi_nakliye' || ['evden_eve','tir','kamyon','kamyonet'].includes(actionType)) && (
             <div className="flex gap-2 animate-in slide-in-from-top-2">
                <button onClick={() => { setShowDomesticRow(true); onFilterApply('nakliye'); setActiveTransportFilter(null); }} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md ${(actionType !== 'yurt_disi_nakliye' && actionType !== 'evden_eve') ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>Yurt İçi</button>
                <button onClick={() => { setShowDomesticRow(false); onFilterApply('yurt_disi_nakliye'); setActiveTransportFilter(null); }} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md ${actionType === 'yurt_disi_nakliye' ? 'bg-indigo-800 text-white' : 'bg-indigo-50 text-indigo-800 border border-indigo-100'}`}><Globe size={14} className="inline mr-1"/> Yurt Dışı</button>
             </div>
          )}
          {showDomesticRow && actionType !== 'yurt_disi_nakliye' && (
            <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-top-2">
               <button onClick={() => { onFilterApply('evden_eve'); setActiveTransportFilter(null); }} className={`py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex flex-col items-center justify-center gap-1 ${actionType === 'evden_eve' ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-700'}`}><Home size={14}/> Evden Eve</button>
               <button onClick={() => handleTransportTypeClick('tir')} className={`py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex flex-col items-center justify-center gap-1 ${activeTransportFilter === 'tir' ? 'bg-purple-700 text-white scale-105' : 'bg-purple-50 text-purple-700'}`}><Container size={14}/> Tır</button>
               <button onClick={() => handleTransportTypeClick('kamyon')} className={`py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex flex-col items-center justify-center gap-1 ${activeTransportFilter === 'kamyon' ? 'bg-purple-700 text-white scale-105' : 'bg-purple-50 text-purple-700'}`}><Truck size={14}/> Kamyon</button>
               <button onClick={() => handleTransportTypeClick('kamyonet')} className={`py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex flex-col items-center justify-center gap-1 ${activeTransportFilter === 'kamyonet' ? 'bg-purple-700 text-white scale-105' : 'bg-purple-50 text-purple-700'}`}><Package size={14}/> Kamyonet</button>
            </div>
          )}
          {activeTransportFilter && SUB_FILTERS[activeTransportFilter] && (
             <div className="grid gap-2 animate-in slide-in-from-top-2 pt-1" style={{ gridTemplateColumns: `repeat(${SUB_FILTERS[activeTransportFilter].length}, minmax(0, 1fr))` }}>
                {SUB_FILTERS[activeTransportFilter].map((sub) => (
                    <button key={sub.id} onClick={() => onTagsChange(activeTags.includes(sub.id) ? activeTags.filter((t:any) => t !== sub.id) : [...activeTags, sub.id])} className={`py-3 rounded-xl text-[8px] font-black uppercase shadow-sm flex items-center justify-center gap-1 transition-all ${activeTags.includes(sub.id) ? 'bg-purple-700 text-white' : 'bg-white/40 text-gray-700'}`}>
                        {activeTags.includes(sub.id) && <Check size={10} strokeWidth={4} />} {sub.label}
                    </button>
                ))}
             </div>
          )}
          {showChargeRow && (
            <div className="flex gap-2 animate-in slide-in-from-top-2">
              <button onClick={() => onFilterApply('sarj_istasyonu')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md flex items-center justify-center gap-2 transition-all ${actionType === 'sarj_istasyonu' ? 'bg-blue-800 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}><Zap size={14}/> İstasyon</button>
              <button onClick={() => onFilterApply('seyyar_sarj')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md flex items-center justify-center gap-2 transition-all ${actionType === 'seyyar_sarj' ? 'bg-cyan-600 text-white' : 'bg-cyan-50 text-cyan-600 border border-cyan-100'}`}>
                <img src="/icons/GeziciIcon.png" className={`w-5 h-5 ${actionType === 'seyyar_sarj' ? 'invert brightness-200' : 'opacity-80'}`} alt="G" /> Gezici Şarj
              </button>
            </div>
          )}
          {showPassengerRow && (
            <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-top-2">
               {SUB_FILTERS.yolcu.map((sub) => (
                  <button key={sub.id} onClick={() => onFilterApply(sub.id)} className={`py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex flex-col items-center justify-center gap-1 transition-all ${actionType === sub.id ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                    {sub.id === 'minibus' && <CarFront size={14}/>} {sub.id === 'otobus' && <Bus size={14}/>} {sub.id === 'midibus' && <Bus size={14}/>} {sub.id === 'vip_tasima' && <Crown size={14}/>}
                    {sub.label}
                  </button>
               ))}
            </div>
          )}
        </div>

        {panelState > 0 && (
          <div className="flex items-center gap-2 mb-4 py-2 shrink-0 overflow-x-auto no-scrollbar">
              <div className="relative shrink-0 w-[130px] shadow-lg rounded-2xl active:scale-95 transition-transform">
                <select 
                  value={selectedCity} 
                  onChange={handleCityChange} 
                  className={`w-full appearance-none ${activeThemeColor} text-white pl-3 pr-8 py-3 rounded-2xl text-[9px] font-black uppercase focus:outline-none border border-white/10 truncate transition-colors duration-300`}
                >
                  <option value="">TÜM TÜRKİYE</option>
                  {Object.keys(CITY_COORDINATES).map(city => <option key={city} value={city}>{city.toUpperCase()}</option>)}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50"><ChevronDown size={12} /></div>
              </div>

              <div className="flex bg-white/80 p-1 rounded-2xl shrink-0 border border-white/40 shadow-sm gap-1">
                <button onClick={() => setSortMode('distance')} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1 ${sortMode === 'distance' ? `${activeThemeColor} text-white shadow-md` : `text-gray-500 hover:${activeThemeText}`}`}><Navigation size={12}/> YAKIN</button>
                <button onClick={() => setSortMode('price_asc')} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1 ${sortMode === 'price_asc' ? `${activeThemeColor} text-white shadow-md` : `text-gray-500 hover:${activeThemeText}`}`}><TrendingDown size={12}/> UCUZ</button>
                <button onClick={() => setSortMode('rating')} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1 ${sortMode === 'rating' ? `${activeThemeColor} text-white shadow-md` : `text-gray-500 hover:${activeThemeText}`}`}><ThumbsUp size={12}/> PUAN</button>
              </div>

              <button onClick={findMyLocation} className={`w-10 h-10 flex items-center justify-center text-white rounded-2xl shadow-lg active:scale-95 shrink-0 ml-auto transition-colors ${isLocating ? 'bg-yellow-500' : activeThemeColor}`}>{isLocating ? <Loader2 size={16} className="animate-spin"/> : <LocateFixed size={16} />}</button>
          </div>
        )}

        <div ref={listContainerRef} className="flex-1 overflow-y-auto pb-40 custom-scrollbar overscroll-contain contain-content transform-gpu">
          {loading ? ( <div className="space-y-4 py-10 text-center"><Loader2 className="animate-spin mx-auto text-gray-400" size={32}/><p className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest">Yükleniyor...</p></div> ) : (
            displayDrivers.map((driver) => {
                const isSelected = activeDriverId === driver._id;
                const p = getPricing(driver);
                const sub = driver.service?.subType || '';
                
                const isMobileCharge = sub === 'seyyar_sarj';
                const isPassenger = ['minibus', 'otobus', 'midibus', 'vip_tasima', 'yolcu_tasima'].includes(sub);
                const isSpecialCategory = isMobileCharge || isPassenger;
                
                let uiConfig = SERVICE_OPTIONS.find(o => o.id === sub);
                let subIcon = null;

                if (!uiConfig) {
                  for (const opt of SERVICE_OPTIONS) {
                    const match = opt.subs.find(s => s.id === sub);
                    if (match) {
                      uiConfig = opt;
                      subIcon = match.icon;
                      break;
                    }
                  }
                }
                const DisplayIcon = subIcon || uiConfig?.icon || Truck;
                
                let iconBg = 'bg-gray-600'; 
                if (sub === 'istasyon') iconBg = 'bg-blue-800';
                else if (isMobileCharge) iconBg = 'bg-cyan-600';
                else if (sub.includes('kurtarma') || sub === 'vinc') iconBg = 'bg-red-600';
                else if (isPassenger) iconBg = 'bg-emerald-600';
                else if (['nakliye', 'kamyon', 'tir', 'evden_eve', 'yurt_disi_nakliye'].some(t => sub.includes(t))) iconBg = 'bg-purple-600';

                return (
                <div key={driver._id} ref={el => { itemRefs.current[driver._id] = el; }} onClick={(e) => { e.stopPropagation(); onSelectDriver(isSelected ? null : driver._id); }} className={`bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 mb-4 shadow-xl border transition-all duration-300 cursor-pointer active:scale-[0.98] ${isSelected ? 'border-green-500 ring-4 ring-green-500/10' : 'border-white/40'}`}>
                    <div className="flex justify-between items-start text-gray-900">
                        <div className="flex gap-4 flex-1">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${iconBg} text-white`}>
                               {isMobileCharge ? ( <img src="/icons/GeziciIcon.png" className="w-7 h-7 invert brightness-200" alt="G" /> ) : ( <DisplayIcon size={24} strokeWidth={2.5} /> )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-black text-sm uppercase truncate leading-tight">{driver.businessName}</h4>
                                <div className="flex items-center gap-1 mt-1">
                                    {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= (driver.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}/>)}
                                    
                                    {!isSpecialCategory && driver.distance && <span className="text-[9px] text-gray-400 font-bold ml-1">{(driver.distance / 1000).toFixed(1)} km</span>}
                                    
                                    {/* Adres Gösterimi (Tam Adres, Çoklu Satır) */}
                                    {!isSpecialCategory && driver.address?.fullText && (
                                        <span className="text-[9px] text-gray-500 opacity-70 font-bold ml-2 pl-2 border-l border-gray-300 leading-tight inline-block align-middle whitespace-normal break-words">
                                            {driver.address.fullText}
                                        </span>
                                    )}

                                    {isSpecialCategory && <span className={`text-[9px] font-black ml-1 uppercase opacity-80 ${isPassenger ? 'text-emerald-600' : 'text-cyan-600'}`}>Türkiye Geneli</span>}
                                </div>
                                
                                {/* 🔥 FIX: Detaylı Alt Özellik (Tag) Bilgileri - YATAY DÜZEN (flex-wrap gap-2) */}
                                {driver.service?.tags?.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2 items-start">
                                    {driver.service.tags.map((tag: string) => {
                                      const details = TAG_DETAILS[tag];
                                      if (!details) return null;
                                      return (
                                        <div key={tag} className="text-[8px] text-gray-500 flex flex-col leading-tight bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                          <span className="font-black uppercase text-gray-700">{tag.replace('_', ' ')}</span>
                                          <span><span className="font-bold">Taşıma:</span> {details.tasima}</span>
                                          <span><span className="font-bold">Kapasite:</span> {details.kapasite}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                            </div>
                        </div>
                        {!isSpecialCategory && (
                          <div className="text-right shrink-0"><div className="text-xl font-black leading-none">₺{p.unit}</div><div className="text-[8px] text-gray-400 font-bold uppercase mt-1">/Birim</div></div>
                        )}
                    </div>
                    {isSelected && (
                    <div className="mt-6 pt-6 border-t border-white/20 space-y-4 animate-in fade-in slide-in-from-top-2">
                        {!isSpecialCategory && (
                          <div className="grid grid-cols-2 gap-2 text-gray-900"><div className="bg-gray-100/50 p-3 rounded-2xl text-center"><div className="text-[8px] font-black text-gray-400 uppercase mb-1">Açılış</div><div className="text-sm font-black">₺{p.opening}</div></div><div className="bg-gray-100/50 p-3 rounded-2xl text-center"><div className="text-[8px] font-black text-gray-400 uppercase mb-1">Birim</div><div className="text-sm font-black">₺{p.unit}</div></div></div>
                        )}
                        {!isSpecialCategory && (
                          <button onClick={(e) => { e.stopPropagation(); window.open(`http://googleusercontent.com/maps.google.com/maps?q=${driver.location?.coordinates[1]},${driver.location?.coordinates[0]}`, '_blank'); }} className="w-full py-4 rounded-[2rem] font-black text-[10px] active:scale-95 shadow-lg uppercase flex items-center justify-center gap-2 text-white bg-gray-800 transition-transform"><MapIcon size={16} /> HARİTADA GİT (ROTA)</button>
                        )}
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); onStartOrder(driver, 'call'); window.location.href=`tel:${driver.phoneNumber}`; }} className="flex-1 bg-black text-white py-5 rounded-[2rem] font-black text-[10px] active:scale-95 shadow-lg uppercase flex items-center justify-center gap-2"><Phone size={14}/> ARA</button>
                          
                          {isSpecialCategory ? (
                            <button onClick={(e) => { e.stopPropagation(); window.open(driver.website || driver.link || 'https://transport245.com', '_blank'); }} className={`flex-1 text-white py-5 rounded-[2rem] font-black text-[10px] active:scale-95 shadow-lg uppercase flex items-center justify-center gap-2 ${iconBg}`}><Globe size={14}/> SİTEYE GİT</button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); onStartOrder(driver, 'message'); window.location.href=`sms:${driver.phoneNumber}`; }} className="flex-1 bg-green-600 text-white py-5 rounded-[2rem] font-black text-[10px] active:scale-95 shadow-lg uppercase flex items-center justify-center gap-2"><MessageCircle size={14}/> MESAJ AT</button>
                          )}
                        </div>
                    </div>)}
                </div>
                );
            })
          )}
        </div>
      </div>
    </div>
  );
}