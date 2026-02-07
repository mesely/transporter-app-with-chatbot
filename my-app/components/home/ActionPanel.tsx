'use client';

import { 
  Truck, Zap, Star, MapPin, Wrench, 
  ChevronDown, LocateFixed, Loader2, 
  MessageCircle, Phone, Navigation
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

const CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

const DEFAULT_LAT = 38.4237; 
const DEFAULT_LNG = 27.1428;

interface Driver {
  _id: string; firstName: string; lastName: string; distance: number;
  phoneNumber?: string; address?: string | any; serviceType?: string; 
  rating?: number; location?: { coordinates: [number, number] };
  companyStatus?: string; vehicleType?: 'kamyonet' | 'kamyon' | 'tir';
  routes?: string; reservationUrl?: string; extraWarnings?: string;
  city?: string; openingFee?: number; pricePerUnit?: number; minAmount?: number;
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

export default function ActionPanel({ 
  onSearchLocation, onFilterApply, onStartOrder, 
  actionType, onActionChange, drivers, loading, onReset,
  activeDriverId, onSelectDriver
}: ActionPanelProps) {
  
  const [isExpanded, setIsExpanded] = useState(false); 
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);

  // UI State'leri (Alt Menüler)
  const [showTowRow, setShowTowRow] = useState(false);
  const [showShipRow, setShowShipRow] = useState(false);
  const [showTicariRow, setShowTicariRow] = useState(false);
  const [showChargeRow, setShowChargeRow] = useState(false);

  // LAZY LOADING STATE'İ (Sayfalama)
  // İlk açılışta 20 tane gösteriyoruz.
  const [visibleItems, setVisibleItems] = useState(20);

  const [sortMode, setSortMode] = useState<'distance' | 'price' | 'rating'>('distance');
  const [selectedCity, setSelectedCity] = useState('');

  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const dragStartY = useRef<number | null>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // --- 🧭 SENKRONİZASYON 1: Haritadan Seçilince Panele Odakla ---
  useEffect(() => {
    if (activeDriverId) {
      setIsExpanded(true);
      setTimeout(() => {
        itemRefs.current[activeDriverId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  }, [activeDriverId]);

  // --- 🧭 SENKRONİZASYON 2: Filtre Değişince Sıfırla ---
  useEffect(() => {
    // Filtre veya sıralama değişince listeyi başa sar (Reset Lazy Load)
    setVisibleItems(20);

    if (!actionType) {
        setShowTowRow(false); setShowShipRow(false); setShowTicariRow(false); setShowChargeRow(false);
        return;
    }

    setIsExpanded(true); 

    if (['kurtarici', 'vinc', 'oto_kurtarma'].some(t => actionType.includes(t))) {
        setShowTowRow(true); setShowShipRow(false); setShowTicariRow(false); setShowChargeRow(false);
    } else if (['nakliye', 'kamyon', 'tir', 'kamyonet', 'evden_eve'].some(t => actionType.includes(t))) {
        setShowShipRow(true); setShowTowRow(false); setShowChargeRow(false);
        if (['kamyon', 'tir', 'kamyonet'].some(t => actionType.includes(t))) {
            setShowTicariRow(true);
        } else {
            setShowTicariRow(false); 
        }
    } else if (['sarj', 'sarj_istasyonu', 'seyyar_sarj'].some(t => actionType.includes(t))) {
        setShowChargeRow(true); setShowTowRow(false); setShowShipRow(false); setShowTicariRow(false);
    }
  }, [actionType, sortMode, selectedCity]);

  // Haritada boşluğa tıklanınca paneli kapat
  useEffect(() => {
    if (!activeDriverId && !actionType) {
       setIsExpanded(false);
    }
  }, [activeDriverId, actionType]);

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
    fetch(`${API_URL}/tariffs`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTariffs(data); })
      .catch(err => console.error(err));
  }, []);

  const handleDragStart = (y: number) => { dragStartY.current = y; };
  const handleDragMove = (y: number) => {
    if (dragStartY.current === null) return;
    const diff = dragStartY.current - y;
    if (diff > 80) { setIsExpanded(true); setIsFullHeight(true); }
    if (diff < -80) { setIsFullHeight(false); if (diff < -200) { setIsExpanded(false); resetAllStates(); } }
  };

  const resetAllStates = () => {
    setShowTowRow(false); setShowShipRow(false); setShowTicariRow(false); setShowChargeRow(false);
    setSelectedCity(''); setSortMode('distance'); onReset(); onSelectDriver(null);
  };

  const getPricing = (driver: Driver) => {
    const matched = tariffs.find(t => t.serviceType === driver.serviceType);
    const opening = driver.openingFee ?? matched?.openingFee ?? 250;
    const unit = driver.pricePerUnit ?? matched?.pricePerUnit ?? 30;
    const min = driver.minAmount ?? matched?.minAmount;
    const calculated = opening + ((driver.distance / 1000) * unit);
    return { total: min ? Math.max(calculated, min).toFixed(0) : calculated.toFixed(0), opening, unit, min };
  };

  const displayDrivers = useMemo(() => {
    let list = [...safeDrivers];
    if (selectedCity) {
      list = list.filter(d => 
        d.city?.toLocaleLowerCase('tr') === selectedCity.toLocaleLowerCase('tr') ||
        d.address?.toString().toLocaleLowerCase('tr').includes(selectedCity.toLocaleLowerCase('tr'))
      );
    }
    list.sort((a, b) => {
      if (sortMode === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortMode === 'price') return Number(getPricing(a).total) - Number(getPricing(b).total);
      return a.distance - b.distance;
    });
    return list;
  }, [safeDrivers, sortMode, selectedCity, tariffs]);

  // 🔥 GÜÇLENDİRİLMİŞ SCROLL HANDLER (Infinite Scroll Logic)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Toleransı arttırdık: Listenin sonuna 250px kala yeni veri yükle (Daha akıcı)
    // Eskiden: clientHeight + 50 idi.
    if (scrollHeight - scrollTop <= clientHeight + 250) {
      
      // Eğer gösterilecek daha fazla sürücü varsa...
      if (visibleItems < displayDrivers.length) {
        // Her seferinde 20 tane daha aç (Eskiden 10 idi)
        setVisibleItems(prev => Math.min(prev + 20, displayDrivers.length));
      }
    }
  };

  // Görünür olanları kes (Lazy Load için)
  const renderedDrivers = displayDrivers.slice(0, visibleItems);

  return (
    <div 
      onMouseDown={(e) => handleDragStart(e.clientY)}
      onMouseMove={(e) => e.buttons === 1 && handleDragMove(e.clientY)}
      onMouseUp={() => { dragStartY.current = null; }}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
      onTouchEnd={() => { dragStartY.current = null; }}
      // Tasarım: Şeffaf arka plan, blur efekti ve yuvarlak köşeler korundu.
      className={`fixed inset-x-0 bottom-0 z-[400] transition-all duration-700 rounded-t-[3.5rem] flex flex-col ${
        isFullHeight ? 'h-[85vh]' : isExpanded ? 'h-[65vh]' : 'h-36'
      } bg-white/5 backdrop-blur-sm border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pt-2 overflow-visible`}
    >
      {/* Sürükleme Kulpu */}
      <div onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0">
        <div className="w-20 h-1.5 bg-white/40 rounded-full shadow-sm"></div>
      </div>

      <div className="px-6 pb-6 flex flex-col h-full overflow-hidden relative">
        
        {/* ANA KATEGORİLER */}
        <div className="flex gap-3 shrink-0 mb-4">
          <button onClick={() => { 
            setIsExpanded(true); 
            setShowShipRow(false); setShowChargeRow(false); setShowTicariRow(false);
            setShowTowRow(!showTowRow); 
            onActionChange('kurtarici'); 
          }} className={`flex-1 py-5 rounded-[2.2rem] flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 ${showTowRow ? 'bg-red-600 text-white scale-105' : 'bg-white/90 text-red-600 border border-white/20'}`}>
            <Wrench size={26} className="mb-1" /> <span className="text-[10px] font-black uppercase tracking-tighter">Kurtarıcı</span>
          </button>
          
          <button onClick={() => { 
            setIsExpanded(true); 
            setShowTowRow(false); setShowChargeRow(false); setShowTicariRow(false);
            setShowShipRow(!showShipRow); 
            onActionChange('nakliye'); 
          }} className={`flex-1 py-5 rounded-[2.2rem] flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 ${showShipRow || showTicariRow ? 'bg-purple-600 text-white scale-105' : 'bg-white/90 text-purple-600 border border-white/20'}`}>
            <Truck size={26} className="mb-1" /> <span className="text-[10px] font-black uppercase tracking-tighter">Nakliye</span>
          </button>
          
          <button onClick={() => { 
            setIsExpanded(true); 
            setShowTowRow(false); setShowShipRow(false); setShowTicariRow(false);
            setShowChargeRow(!showChargeRow); 
            onActionChange('sarj'); 
          }} className={`flex-1 py-5 rounded-[2.2rem] flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 ${showChargeRow ? 'bg-blue-600 text-white scale-105' : 'bg-white/90 text-blue-600 border border-white/20'}`}>
            <Zap size={26} className="mb-1" /> <span className="text-[10px] font-black uppercase tracking-tighter">Şarj</span>
          </button>
        </div>

        {/* ALT SEÇENEKLER */}
        <div className="space-y-3 shrink-0 mb-4">
          {showTowRow && (
            <div className="flex gap-2 animate-in slide-in-from-top-1">
              <button onClick={() => onFilterApply('kurtarici')} className={`flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg ${actionType === 'kurtarici' ? 'bg-red-800 ring-2 ring-red-400' : 'bg-red-600'}`}>Oto Kurtarma</button>
              <button onClick={() => onFilterApply('vinc')} className={`flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg ${actionType === 'vinc' ? 'bg-red-900 ring-2 ring-red-400' : 'bg-red-700'}`}>Vinç</button>
            </div>
          )}
          {showShipRow && (
            <div className="flex gap-2 animate-in slide-in-from-top-1">
              <button onClick={() => {setShowTicariRow(false); onFilterApply('nakliye');}} className={`flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg ${actionType === 'nakliye' && !showTicariRow ? 'bg-purple-900 ring-2 ring-purple-400' : 'bg-purple-600'}`}>Evden Eve</button>
              <button onClick={() => setShowTicariRow(true)} className={`flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg ${showTicariRow ? 'bg-yellow-600 shadow-inner' : 'bg-yellow-500'}`}>Ticari Araç</button>
            </div>
          )}
          {showTicariRow && (
            <div className="flex gap-2 animate-in zoom-in-95">
              <button onClick={() => onFilterApply('kamyonet')} className={`flex-1 py-4 text-white rounded-2xl flex flex-col items-center gap-1 text-[9px] font-black uppercase shadow-md ${actionType === 'kamyonet' ? 'bg-yellow-700 ring-2 ring-yellow-400' : 'bg-yellow-500'}`}><Truck size={20}/> Kamyonet</button>
              <button onClick={() => onFilterApply('kamyon')} className={`flex-1 py-4 text-white rounded-2xl flex flex-col items-center gap-1 text-[9px] font-black uppercase shadow-md ${actionType === 'kamyon' ? 'bg-yellow-700 ring-2 ring-yellow-400' : 'bg-yellow-500'}`}><Truck size={20}/> Kamyon</button>
              <button onClick={() => onFilterApply('tir')} className={`flex-1 py-4 text-white rounded-2xl flex flex-col items-center gap-1 text-[9px] font-black uppercase shadow-md ${actionType === 'tir' ? 'bg-yellow-700 ring-2 ring-yellow-400' : 'bg-yellow-500'}`}><Truck size={20}/> TIR</button>
            </div>
          )}
          {showChargeRow && (
            <div className="flex gap-2 animate-in slide-in-from-top-1">
              <button onClick={() => onFilterApply('sarj_istasyonu')} className={`flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg ${actionType === 'sarj_istasyonu' ? 'bg-blue-800 ring-2 ring-blue-300' : 'bg-blue-600'}`}>İstasyon</button>
              <button onClick={() => onFilterApply('seyyar_sarj')} className={`flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg ${actionType === 'seyyar_sarj' ? 'bg-cyan-700 ring-2 ring-cyan-300' : 'bg-cyan-600'}`}>Mobil Şarj</button>
            </div>
          )}
        </div>

        {/* FİLTRE VE SIRALAMA */}
        {isExpanded && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide py-1 shrink-0">
              <div className="relative shrink-0">
                <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="appearance-none bg-black text-white pl-4 pr-8 py-2.5 rounded-xl text-[10px] font-black uppercase focus:outline-none border border-white/20 shadow-lg">
                  <option value="">TÜRKİYE (İL)</option>
                  {CITIES.map(city => <option key={city} value={city}>{city.toUpperCase()}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
              </div>
              <button onClick={() => setSortMode('distance')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black border transition-all shrink-0 ${sortMode === 'distance' ? 'bg-black text-white' : 'bg-white/90 text-gray-700 border-white/20'}`}>EN YAKIN</button>
              <button onClick={() => setSortMode('price')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black border transition-all shrink-0 ${sortMode === 'price' ? 'bg-black text-white' : 'bg-white/90 text-gray-700 border-white/20'}`}>EN UCUZ</button>
              <button onClick={findMyLocation} className={`px-3 py-2.5 text-white rounded-xl bg-blue-600 shadow-lg active:scale-95 shrink-0 ml-auto transition-colors ${isLocating ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                 <LocateFixed size={18} />
              </button>
          </div>
        )}

        {/* SÜRÜCÜ LİSTESİ - onScroll EKLENDİ */}
        <div 
          className="flex-1 overflow-y-auto pb-40 custom-scrollbar"
          onScroll={handleScroll} // 🔥 KAYDIRMA TETİKLEYİCİSİ BURADA
        >
          {loading ? (
             <div className="flex flex-col items-center py-20 text-gray-400 font-black uppercase text-[10px] tracking-widest animate-pulse"><Loader2 size={32} className="animate-spin mb-2" />Sana En Yakınlar Bulunuyor...</div>
          ) : renderedDrivers.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-[10px] font-black uppercase">Sonuç Bulunamadı.</div>
          ) : renderedDrivers.map((driver) => {
            const isSelected = activeDriverId === driver._id;
            const pricing = getPricing(driver);
            
            const type = driver.serviceType || '';
            let iconBg = 'bg-gray-600'; 

            if (type.includes('sarj')) {
                iconBg = 'bg-blue-600'; 
            } else if (type.includes('kurtar') || type.includes('vinc')) {
                iconBg = 'bg-red-600'; 
            } else if (['kamyon', 'tir', 'kamyonet', 'ticari'].some(t => type.includes(t))) {
                iconBg = 'bg-yellow-500'; // SARI ZEMİN
            } else if (type.includes('nakliye') || type.includes('evden')) {
                iconBg = 'bg-purple-600'; 
            }

            return (
              <div 
                key={driver._id} 
                ref={el => { itemRefs.current[driver._id] = el; }}
                onClick={() => onSelectDriver(isSelected ? null : driver._id)} 
                className={`bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 mb-4 shadow-xl border transition-all duration-300 ${isSelected ? 'border-green-500 scale-[1.02] ring-4 ring-green-500/10' : 'border-white/40'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${iconBg}`}>
                       {type.includes('sarj') ? (
                         <Zap color="white" strokeWidth={2.5} /> 
                       ) : (
                         // TİCARİ İKON RENGİ (SARI ZEMİN ÜZERİNE BEYAZ)
                         <Truck color={'white'} strokeWidth={2.5} /> 
                       )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-gray-900 text-sm uppercase tracking-tighter truncate">
                        {driver.firstName} {driver.lastName} 
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= (driver.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}/>)}
                        </div>
                      </h4>
                      <div className="flex items-center gap-1 mt-1 text-gray-500 text-[10px] font-bold truncate">
                        <MapPin size={10} className="text-green-500 shrink-0" /> {driver.city || 'Konum Belirtilmedi'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-gray-900 leading-none">₺{pricing.unit}</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">Birim Ücret</div>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-6 pt-6 border-t border-gray-100/50 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 p-3 rounded-2xl text-center"><div className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Açılış</div><div className="text-sm font-black">₺{pricing.opening}</div></div>
                        <div className="bg-gray-50 p-3 rounded-2xl text-center"><div className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Birim</div><div className="text-sm font-black">₺{pricing.unit}</div></div>
                        <div className="bg-green-50 p-3 rounded-2xl text-center border border-green-100"><div className="text-[8px] font-black text-green-600 uppercase mb-1 tracking-tighter">Mesafe</div><div className="text-sm font-black text-green-700">{(driver.distance/1000).toFixed(1)} km</div></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); onStartOrder(driver, 'call'); window.location.href=`tel:${driver.phoneNumber}`; }} className="flex-1 bg-black text-white py-5 rounded-[2rem] font-black text-[10px] active:scale-95 shadow-lg uppercase flex items-center justify-center gap-2 tracking-widest"><Phone size={14}/> Sürücüyü Ara</button>
                      <button onClick={(e) => { e.stopPropagation(); onStartOrder(driver, 'message'); window.open(`https://wa.me/${driver.phoneNumber?.replace(/\D/g, '')}`); }} className="flex-1 bg-green-600 text-white py-5 rounded-[2rem] font-black text-[10px] active:scale-95 shadow-lg uppercase flex items-center justify-center gap-2 tracking-widest"><MessageCircle size={14}/> WHATSAPP</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {/* Lazy Loading Göstergesi */}
          {visibleItems < displayDrivers.length && (
             <div className="py-4 text-center text-[10px] text-gray-400 font-bold animate-pulse">
               Daha Fazla Yükleniyor...
             </div>
          )}
        </div>
      </div>
    </div>
  );
}