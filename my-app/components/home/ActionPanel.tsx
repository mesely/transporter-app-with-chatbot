/**
 * @file ActionPanel.tsx
 * @description Transport 245 Master UI.
 * FIX: Gezici Şarj için "Tüm Türkiye" arama mantığı (Şehir filtresi bypass).
 * FIX: Gezici Şarj kurum listesindeki ikon arka planı butondaki Cyan rengiyle (bg-cyan-600) eşitlendi.
 * FIX: İkon renkleri ve stilleri standardize edildi.
 */

'use client';

import { 
  Truck, Zap, Star, MapPin, Wrench, 
  ChevronDown, LocateFixed, Loader2, 
  Navigation, Globe, CarFront, Anchor, Home, 
  Package, Container, ArrowUpDown, Map as MapIcon,
  Check, Phone, MessageCircle, Info, Users, Bus, Crown 
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

const CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

const DEFAULT_LAT = 39.9334; 
const DEFAULT_LNG = 32.8597;

const VEHICLE_SPECS: Record<string, { capacity: string, desc: string }> = {
  frigorifik: { capacity: '22-24 ton', desc: 'Gıda - İlaç' },
  tenteli:    { capacity: '24 ton', desc: 'Genel Kargo' },
  acik_kasa:  { capacity: '22-24 ton', desc: 'Demir-çelik' },
  lowbed:     { capacity: '30-60 ton', desc: 'İş makinesi' },
  konteyner:  { capacity: '25-30 ton', desc: 'Liman' },
  '6_teker':  { capacity: '15-20 ton', desc: 'Palteli Yük' },
  '8_teker':  { capacity: '18-22 ton', desc: 'Genel Yük' },
  '10_teker': { capacity: '20-25 ton', desc: 'Uzun Mesafe' },
  kirkayak:   { capacity: '25-30 ton', desc: 'Büyük Hacim' },
  panelvan:    { capacity: '1-1.5 ton', desc: 'Hızlı Dağıtım' },
  kapali_kasa: { capacity: '2-3 ton', desc: 'Mobilya' },
  otobus:      { capacity: '46-54 Kişi', desc: 'Turizm' },
  minibus:     { capacity: '14-20 Kişi', desc: 'Personel' },
  vip_tasima:  { capacity: '4-9 Kişi', desc: 'Özel Transfer' }
};

const SUB_FILTERS: Record<string, { id: string, label: string }[]> = {
  tir: [{ id: 'tenteli', label: 'Tenteli' }, { id: 'frigorifik', label: 'Frigorifik' }, { id: 'lowbed', label: 'Lowbed' }, { id: 'konteyner', label: 'Konteyner' }, { id: 'acik_kasa', label: 'Açık Kasa' }],
  kamyon: [{ id: '6_teker', label: '6 Teker' }, { id: '8_teker', label: '8 Teker' }, { id: '10_teker', label: '10 Teker' }, { id: '12_teker', label: '12 Teker' }, { id: 'kirkayak', label: 'Kırkayak' }],
  kamyonet: [{ id: 'panelvan', label: 'Panelvan' }, { id: 'acik_kasa', label: 'Açık Kasa' }, { id: 'kapali_kasa', label: 'Kapalı Kasa' }],
  yolcu: [{ id: 'minibus', label: 'Minibüs' }, { id: 'otobus', label: 'Otobüs' }, { id: 'midibus', label: 'Midibüs' }, { id: 'vip_tasima', label: 'VIP' }]
};

export default function ActionPanel({ 
  onSearchLocation, onFilterApply, onStartOrder, actionType, onActionChange, 
  drivers, loading, activeDriverId, onSelectDriver, activeTags, onTagsChange, isSidebarOpen 
}: any) {
  
  const [panelState, setPanelState] = useState<0 | 1 | 2>(0); 
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [sortMode, setSortMode] = useState<'distance' | 'rating' | 'price_asc' | 'price_desc'>('distance');
  const [visibleItems, setVisibleItems] = useState(5);

  const [showTowRow, setShowTowRow] = useState(false);
  const [showChargeRow, setShowChargeRow] = useState(false);
  const [showDomesticRow, setShowDomesticRow] = useState(false);
  const [showPassengerRow, setShowPassengerRow] = useState(false);
  
  const [activeTransportFilter, setActiveTransportFilter] = useState<string | null>(null);
  const dragStartY = useRef<number | null>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeDriverId) {
      if (panelState === 0) setPanelState(1);
      setTimeout(() => { itemRefs.current[activeDriverId]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
    }
  }, [activeDriverId]);

  const handleMainCategoryClick = (category: string) => {
    setPanelState(current => (current === 0 ? 1 : current));
    setVisibleItems(5); setActiveTransportFilter(null); onTagsChange([]); 
    
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

  const getPricing = (driver: any) => {
    const matched = tariffs.find(t => t.serviceType === driver.service?.subType);
    const opening = driver.pricing?.openingFee ?? matched?.openingFee ?? 350;
    const unit = driver.pricing?.pricePerUnit ?? matched?.pricePerUnit ?? 40;
    const total = opening + (Math.max(1, (driver.distance || 0) / 1000) * unit);
    return { total, unit, opening };
  };

  const displayDrivers = useMemo(() => {
    let list = Array.isArray(drivers) ? [...drivers] : [];
    
    // 🔥 FIX: "Gezici Şarj" (seyyar_sarj) için şehir filtresini baypas et (Tüm Türkiye)
    if (selectedCity && actionType !== 'seyyar_sarj') {
        list = list.filter(d => d.address?.city?.toLocaleLowerCase('tr') === selectedCity.toLocaleLowerCase('tr'));
    }

    list.sort((a, b) => {
      if (sortMode === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortMode === 'price_asc') return getPricing(a).total - getPricing(b).total;
      if (sortMode === 'price_desc') return getPricing(b).total - getPricing(a).total;
      return (a.distance || 0) - (b.distance || 0);
    });
    return list;
  }, [drivers, sortMode, selectedCity, tariffs, actionType]); 

  const findMyLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { onSearchLocation(pos.coords.latitude, pos.coords.longitude); setIsLocating(false); },
        () => { onSearchLocation(DEFAULT_LAT, DEFAULT_LNG); setIsLocating(false); }
      );
    } else { onSearchLocation(DEFAULT_LAT, DEFAULT_LNG); setIsLocating(false); }
  };

  useEffect(() => {
    findMyLocation();
    fetch(`${API_URL}/tariffs`).then(res => res.json()).then(data => { if (Array.isArray(data)) setTariffs(data); });
  }, []);

  const handleDragEnd = (y: number) => {
    if (dragStartY.current === null) return;
    const diff = dragStartY.current - y; 
    if (diff > 40) { if (panelState === 0) setPanelState(1); else if (panelState === 1) setPanelState(2); } 
    else if (diff < -40) { if (panelState === 2) setPanelState(1); else if (panelState === 1) setPanelState(0); }
    dragStartY.current = null;
  };

  const sizeClass = panelState === 2 ? 'h-[92vh]' : panelState === 1 ? 'h-[55vh]' : 'h-36'; 

  return (
    <div 
      onClick={() => panelState > 0 && setPanelState(prev => prev === 2 ? 1 : 0)}
      className={`fixed inset-x-0 bottom-0 z-[2000] transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) rounded-t-[3.5rem] flex flex-col ${sizeClass} ${isSidebarOpen ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'} bg-white/10 backdrop-blur-md border-t border-white/30 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pt-2 overflow-visible text-gray-900`}
    >
      {/* DRAG HANDLE */}
      <div 
        onMouseDown={(e) => { e.stopPropagation(); dragStartY.current = e.clientY; }}
        onMouseUp={(e) => { e.stopPropagation(); handleDragEnd(e.clientY); }}
        onTouchStart={(e) => { e.stopPropagation(); dragStartY.current = e.touches[0].clientY; }}
        onTouchEnd={(e) => { e.stopPropagation(); handleDragEnd(e.changedTouches[0].clientY); }}
        onClick={(e) => { e.stopPropagation(); setPanelState(prev => prev === 2 ? 1 : prev === 1 ? 2 : 1); }}
        className="w-full flex justify-center py-6 cursor-grab active:cursor-grabbing shrink-0 z-[2001] hover:opacity-80 transition-opacity"
      >
        <div className="w-16 h-1.5 bg-gray-400/40 rounded-full shadow-sm"></div>
      </div>

      <div onClick={(e) => e.stopPropagation()} className="px-6 pb-6 flex flex-col h-full overflow-hidden relative">
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
               <button onClick={() => { setActiveTransportFilter('tir'); onFilterApply('tir'); }} className={`py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex flex-col items-center justify-center gap-1 ${activeTransportFilter === 'tir' ? 'bg-purple-700 text-white scale-105' : 'bg-purple-50 text-purple-700'}`}><Container size={14}/> Tır</button>
               <button onClick={() => { setActiveTransportFilter('kamyon'); onFilterApply('kamyon'); }} className={`py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex flex-col items-center justify-center gap-1 ${activeTransportFilter === 'kamyon' ? 'bg-purple-700 text-white scale-105' : 'bg-purple-50 text-purple-700'}`}><Truck size={14}/> Kamyon</button>
               <button onClick={() => { setActiveTransportFilter('kamyonet'); onFilterApply('kamyonet'); }} className={`py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex flex-col items-center justify-center gap-1 ${activeTransportFilter === 'kamyonet' ? 'bg-purple-700 text-white scale-105' : 'bg-purple-50 text-purple-700'}`}><Package size={14}/> Kamyonet</button>
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
                {/* 🔥 GEZİCİ ŞARJ İKONU: SAF BEYAZ ve PARLAK */}
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
          <div className="flex items-center gap-2 mb-4 py-2 shrink-0">
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="appearance-none bg-black text-white pl-4 pr-10 py-3 rounded-2xl text-[10px] font-black uppercase focus:outline-none border border-white/10 shadow-lg active:scale-95 transition-transform">
                  <option value="">TÜRKİYE (İL)</option>
                  {CITIES.map(city => <option key={city} value={city}>{city.toUpperCase()}</option>)}
              </select>
              <button onClick={() => setSortMode(s => s === 'distance' ? 'rating' : s === 'rating' ? 'price_asc' : s === 'price_asc' ? 'price_desc' : 'distance')} className={`px-4 py-3 rounded-2xl text-[10px] font-black border transition-all shrink-0 flex items-center gap-2 shadow-lg active:scale-95 ${sortMode !== 'distance' ? 'bg-gray-900 text-white border-black' : 'bg-white/80 text-gray-700 border-white/20'}`}>
                 <ArrowUpDown size={14} /> {sortMode === 'distance' ? 'YAKIN' : sortMode === 'rating' ? 'PUAN' : sortMode === 'price_asc' ? 'UCUZ' : 'PAHALI'}
              </button>
              <button onClick={findMyLocation} className={`px-4 py-3 text-white rounded-2xl shadow-lg active:scale-95 shrink-0 ml-auto transition-colors ${isLocating ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                 {isLocating ? <Loader2 size={18} className="animate-spin"/> : <LocateFixed size={18} />}
              </button>
          </div>
        )}

        <div ref={listContainerRef} className="flex-1 overflow-y-auto pb-40 custom-scrollbar overscroll-contain">
          {loading ? ( <div className="space-y-4 py-10 text-center"><Loader2 className="animate-spin mx-auto text-gray-400" size={32}/><p className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest">Yükleniyor...</p></div> ) : (
            displayDrivers.slice(0, visibleItems).map((driver) => {
                const isSelected = activeDriverId === driver._id;
                const p = getPricing(driver);
                const sub = driver.service?.subType || '';
                
                // 🔥 İKON ARKA PLAN VE RENK MANTIĞI DÜZELTİLDİ
                let iconBg = 'bg-gray-600'; 
                if (sub === 'istasyon') iconBg = 'bg-blue-800';
                else if (sub === 'seyyar_sarj') iconBg = 'bg-cyan-600'; // BUTON RENGİYLE EŞİTLENDİ (CYAN)
                else if (sub.includes('kurtarma') || sub === 'vinc') iconBg = 'bg-red-600';
                else if (['minibus', 'otobus', 'midibus', 'vip_tasima'].includes(sub)) iconBg = 'bg-emerald-600';
                else if (['nakliye', 'kamyon', 'tir', 'evden_eve', 'yurt_disi_nakliye'].some(t => sub.includes(t))) iconBg = 'bg-purple-600';

                return (
                <div key={driver._id} ref={el => { itemRefs.current[driver._id] = el; }} onClick={(e) => { e.stopPropagation(); onSelectDriver(isSelected ? null : driver._id); }} className={`bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 mb-4 shadow-xl border transition-all duration-300 cursor-pointer active:scale-[0.98] ${isSelected ? 'border-green-500 ring-4 ring-green-500/10' : 'border-white/40'}`}>
                    <div className="flex justify-between items-start text-gray-900">
                        <div className="flex gap-4 flex-1">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${iconBg} text-white`}>
                               {sub === 'seyyar_sarj' ? (
                                 <img src="/icons/GeziciIcon.png" className="w-7 h-7 invert brightness-200" alt="G" />
                               ) : (
                                 sub === 'istasyon' ? <Zap size={24} strokeWidth={2.5} /> : <Truck size={24} strokeWidth={2.5} />
                               )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-black text-sm uppercase truncate leading-tight">{driver.businessName}</h4>
                                <div className="flex items-center gap-1 mt-1">
                                    {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= (driver.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}/>)}
                                    {driver.distance && <span className="text-[9px] text-gray-400 font-bold ml-1">{(driver.distance / 1000).toFixed(1)} km</span>}
                                </div>
                                {driver.service?.tags?.some((t:any) => t.includes('teker')) && (
                                  <div className="mt-2 text-[8px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-black uppercase w-fit tracking-tighter">
                                    {driver.service.tags.find((t:any) => t.includes('teker')).replace('_',' ')} Mevcut
                                  </div>
                                )}
                            </div>
                        </div>
                        <div className="text-right shrink-0"><div className="text-xl font-black leading-none">₺{p.unit}</div><div className="text-[8px] text-gray-400 font-bold uppercase mt-1">/Birim</div></div>
                    </div>
                    {isSelected && (
                    <div className="mt-6 pt-6 border-t border-white/20 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-2 text-gray-900"><div className="bg-gray-100/50 p-3 rounded-2xl text-center"><div className="text-[8px] font-black text-gray-400 uppercase mb-1">Açılış</div><div className="text-sm font-black">₺{p.opening}</div></div><div className="bg-gray-100/50 p-3 rounded-2xl text-center"><div className="text-[8px] font-black text-gray-400 uppercase mb-1">Birim</div><div className="text-sm font-black">₺{p.unit}</div></div></div>
                        <button onClick={(e) => { e.stopPropagation(); window.open(`http://googleusercontent.com/maps.google.com/maps?q=${driver.location?.coordinates[1]},${driver.location?.coordinates[0]}`, '_blank'); }} className="w-full py-4 rounded-[2rem] font-black text-[10px] active:scale-95 shadow-lg uppercase flex items-center justify-center gap-2 text-white bg-gray-800 transition-transform"><MapIcon size={16} /> HARİTADA GİT (ROTA)</button>
                        <div className="flex gap-2"><button onClick={(e) => { e.stopPropagation(); onStartOrder(driver, 'call'); window.location.href=`tel:${driver.phoneNumber}`; }} className="flex-1 bg-black text-white py-5 rounded-[2rem] font-black text-[10px] active:scale-95 shadow-lg uppercase flex items-center justify-center gap-2"><Phone size={14}/> ARA</button><button onClick={(e) => { e.stopPropagation(); onStartOrder(driver, 'message'); window.open(`https://wa.me/${(driver.phoneNumber || '').replace(/\D/g, '')}`); }} className="flex-1 bg-green-600 text-white py-5 rounded-[2rem] font-black text-[10px] active:scale-95 shadow-lg uppercase flex items-center justify-center gap-2"><MessageCircle size={14}/> WHATSAPP</button></div>
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