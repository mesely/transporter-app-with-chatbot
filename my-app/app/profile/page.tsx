'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, Phone, MapPin, Truck, 
  Loader2, ShieldCheck, X, Anchor, CarFront, 
  Zap, Navigation, Plus, Globe, Home, Package, Container,
  Snowflake, Box, Layers, Archive, Check, Settings2, Wallet
} from 'lucide-react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

const TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "İçel (Mersin)", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

// --- HİZMET YAPILANDIRMASI ---
const SERVICE_OPTIONS = [
  { id: 'oto_kurtarma', label: 'KURTARICI', icon: CarFront, color: 'red', subs: [] },
  { id: 'vinc', label: 'VİNÇ', icon: Anchor, color: 'rose', subs: [] },
  { id: 'yurt_disi_nakliye', label: 'GLOBAL', icon: Globe, color: 'indigo', subs: [] },
  
  // 🔥 TIR
  { 
    id: 'tir', 
    label: 'TIR', 
    icon: Container, 
    color: 'violet',
    subs: [
      { id: 'tenteli', label: 'TENTELİ', icon: Archive },
      { id: 'frigorifik', label: 'FRİGORİFİK', icon: Snowflake },
      { id: 'lowbed', label: 'LOWBED', icon: Layers },
      { id: 'konteyner', label: 'KONTEYNER', icon: Container }
    ]
  },
  
  // 🔥 KAMYON
  { 
    id: 'kamyon', 
    label: 'KAMYON', 
    icon: Truck, 
    color: 'purple',
    subs: [
      { id: '6_teker', label: '6 TEKER', icon: Truck },
      { id: '8_teker', label: '8 TEKER', icon: Truck }, 
      { id: '10_teker', label: '10 TEKER', icon: Truck },
      { id: '12_teker', label: '12 TEKER', icon: Truck },
      { id: 'kirkayak', label: 'KIRKAYAK', icon: Layers }
    ]
  },
  
  // 🔥 KAMYONET
  { 
    id: 'kamyonet', 
    label: 'KAMYONET', 
    icon: Package, 
    color: 'fuchsia',
    subs: [
      { id: 'panelvan', label: 'PANELVAN', icon: CarFront },
      { id: 'acik_kasa', label: 'AÇIK KASA', icon: Box },
      { id: 'kapali_kasa', label: 'KAPALI KASA', icon: Archive }
    ]
  },

  { id: 'nakliye', label: 'EVDEN EVE', icon: Home, color: 'pink', subs: [] },
  { id: 'sarj_istasyonu', label: 'İSTASYON', icon: Navigation, color: 'blue', subs: [] },
  { id: 'seyyar_sarj', label: 'MOBİL ŞARJ', icon: Zap, color: 'cyan', subs: [] },
];

const getColorClasses = (colorName: string, isSelected: boolean, isSub: boolean = false) => {
  const base = {
    red:    isSelected ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-600 border-red-100',
    rose:   isSelected ? 'bg-rose-700 text-white border-rose-700' : 'bg-rose-50 text-rose-700 border-rose-100',
    indigo: isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-600 border-indigo-100',
    violet: isSelected ? 'bg-violet-700 text-white border-violet-700' : 'bg-violet-50 text-violet-700 border-violet-100',
    purple: isSelected ? 'bg-purple-700 text-white border-purple-700' : 'bg-purple-50 text-purple-700 border-purple-100',
    fuchsia: isSelected ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
    pink:   isSelected ? 'bg-pink-600 text-white border-pink-600' : 'bg-pink-50 text-pink-600 border-pink-100',
    blue:   isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 border-blue-100',
    cyan:   isSelected ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-cyan-50 text-cyan-600 border-cyan-100',
  };

  const subBase = {
    red:    isSelected ? 'bg-red-800 text-white shadow-red-500/50' : 'bg-white text-red-700 hover:bg-red-50',
    rose:   isSelected ? 'bg-rose-800 text-white shadow-rose-500/50' : 'bg-white text-rose-700 hover:bg-rose-50',
    indigo: isSelected ? 'bg-indigo-800 text-white shadow-indigo-500/50' : 'bg-white text-indigo-700 hover:bg-indigo-50',
    violet: isSelected ? 'bg-violet-900 text-white shadow-violet-500/50' : 'bg-white text-violet-800 hover:bg-violet-50',
    purple: isSelected ? 'bg-purple-900 text-white shadow-purple-500/50' : 'bg-white text-purple-800 hover:bg-purple-50',
    fuchsia: isSelected ? 'bg-fuchsia-800 text-white shadow-fuchsia-500/50' : 'bg-white text-fuchsia-700 hover:bg-fuchsia-50',
    pink:   isSelected ? 'bg-pink-800 text-white shadow-pink-500/50' : 'bg-white text-pink-700 hover:bg-pink-50',
    blue:   isSelected ? 'bg-blue-800 text-white shadow-blue-500/50' : 'bg-white text-blue-700 hover:bg-blue-50',
    cyan:   isSelected ? 'bg-cyan-800 text-white shadow-cyan-500/50' : 'bg-white text-cyan-700 hover:bg-cyan-50',
  };

  return isSub ? (subBase[colorName as keyof typeof subBase] || subBase.purple) : (base[colorName as keyof typeof base] || base.purple);
};

export default function ProfilePage() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  
  const [priceError, setPriceError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '', lastName: 'Hizmetleri', email: '', phoneNumber: '',
    serviceTypes: [] as string[], city: 'İzmir', address: '', routes: '', 
    filterTags: [] as string[],
    pricePerUnit: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('transporter_provider_id');
    if (saved) setIsRegistered(true);
  }, []);

  // --- ANA HİZMET SEÇİMİ ---
  const toggleService = (serviceId: string) => {
    setFormData(prev => {
      const isSelected = prev.serviceTypes.includes(serviceId);
      let newTypes;
      let newTags = [...prev.filterTags];

      if (isSelected) {
        newTypes = prev.serviceTypes.filter(id => id !== serviceId);
        // Seçim kaldırılırsa alt etiketleri de temizle
        const serviceConfig = SERVICE_OPTIONS.find(s => s.id === serviceId);
        if (serviceConfig && serviceConfig.subs.length > 0) {
          const subIds = serviceConfig.subs.map(sub => sub.id);
          newTags = newTags.filter(tag => !subIds.includes(tag));
        }
      } else {
        newTypes = [...prev.serviceTypes, serviceId];
      }
      return { ...prev, serviceTypes: newTypes, filterTags: newTags };
    });
  };

  // --- ALT SEÇENEK SEÇİMİ ---
  const toggleSubOption = (subId: string) => {
    setFormData(prev => {
      const isSelected = prev.filterTags.includes(subId);
      return {
        ...prev,
        filterTags: isSelected ? prev.filterTags.filter(t => t !== subId) : [...prev.filterTags, subId]
      };
    });
  };

  const openFolder = (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation(); 
    setActiveFolder(serviceId);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setPriceError('');
      setFormData({ ...formData, pricePerUnit: val });
    } else {
      setPriceError('Sadece sayısal değer giriniz!');
    }
  };

  const isChargingService = formData.serviceTypes.some(id => ['sarj_istasyonu', 'seyyar_sarj'].includes(id));

  const handleRegister = async () => {
    if (!agreed) return alert("Lütfen hizmet sözleşmesini onaylayın.");
    if (!formData.firstName || !formData.phoneNumber || !formData.email) return alert("Eksik bilgi!");
    if (formData.serviceTypes.length === 0) return alert("En az bir hizmet türü seçmelisiniz.");
    if (!formData.pricePerUnit) return alert("Lütfen bir fiyat belirtin.");

    setLoading(true);
    try {
      const payload = { 
          ...formData, 
          serviceType: formData.serviceTypes[0], 
          allServiceTypes: formData.serviceTypes 
      };
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('transporter_provider_id', data._id || 'true');
        setIsRegistered(true);
      } else { alert("Kayıt başarısız."); }
    } catch (err) { alert("Bağlantı hatası!"); }
    finally { setLoading(false); }
  };

  const currentFolderConfig = SERVICE_OPTIONS.find(s => s.id === activeFolder);

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/70 backdrop-blur-3xl border border-white p-10 rounded-[3rem] shadow-2xl text-center">
          <ShieldCheck size={64} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black uppercase italic">Kayıt Onaylandı</h1>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Tebrikler! Sisteme başarıyla dahil oldunuz.</p>
          <button onClick={() => { localStorage.removeItem('transporter_provider_id'); setIsRegistered(false); }} className="mt-8 text-[10px] font-black text-gray-300 uppercase hover:text-red-500 transition-all">Yeni Kayıt</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#f8fafc] overflow-y-auto custom-scrollbar selection:bg-blue-100">
      <div className="w-full max-w-5xl mx-auto p-6 md:p-12 relative">
        
        <header className="mb-10 flex flex-col items-start">
          <div className="bg-gray-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] mb-3">
            Transporter 2026
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Kurumsal Kayıt</h1>
        </header>

        <div className="space-y-12">
          {/* 1. İLETİŞİM */}
          <section className="space-y-4">
             <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-6 h-0.5 bg-blue-600"></div> İletişim Bilgileri
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="FİRMA ADI" onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl p-5 font-bold text-sm outline-none shadow-sm"/>
                <input placeholder="TELEFON" type="tel" onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl p-5 font-bold text-sm outline-none shadow-sm"/>
                <input placeholder="E-POSTA" type="email" onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl p-5 font-bold text-sm outline-none shadow-sm md:col-span-2"/>
             </div>
          </section>

          {/* 2. HİZMET TÜRÜ */}
          <section className="space-y-4">
             <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-6 h-0.5 bg-gray-400"></div> Hizmet Türü
             </h3>
             
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {SERVICE_OPTIONS.map((opt) => {
                   const isSelected = formData.serviceTypes.includes(opt.id);
                   const hasSubs = opt.subs.length > 0;
                   const colorClass = getColorClasses(opt.color, isSelected);
                   
                   const activeSubLabels = opt.subs
                      .filter(sub => formData.filterTags.includes(sub.id))
                      .map(sub => sub.label);

                   return (
                     <div 
                        key={opt.id}
                        onClick={() => {
                            // 🔥 YENİ MANTIK: Tıklandığında önce SEÇ, sonra alt seçenek varsa AÇ
                            if (hasSubs && !isSelected) {
                                toggleService(opt.id); // Seç
                                setActiveFolder(opt.id); // Aç
                            } else {
                                toggleService(opt.id); // Normal Seç/Kaldır
                            }
                        }}
                        // 🔥 TASARIM: scale-95 ile %5 küçüldü
                        className={`
                            group relative flex flex-col items-center justify-between p-4 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 min-h-[220px] scale-95
                            ${colorClass}
                            ${isSelected ? 'shadow-xl z-10' : 'hover:scale-[0.98]'}
                        `}
                     >
                        {/* Seçili İkonu */}
                        {isSelected && (
                            <div className="absolute top-3 right-3 bg-white/20 p-1.5 rounded-full backdrop-blur-sm animate-in zoom-in">
                                <Check size={14} strokeWidth={4} className="text-white" />
                            </div>
                        )}

                        <div className="flex flex-col items-center justify-center flex-1 w-full">
                            {/* 🔥 İKON: 2.5 Kat Büyük (size=80) */}
                            <opt.icon size={80} strokeWidth={1.2} className={`mb-4 transition-transform duration-300 group-hover:scale-110 ${isSelected ? 'text-white' : ''}`} />
                            
                            {/* 🔥 YAZI: 2.5 Kat Büyük (text-2xl) */}
                            <span className="text-2xl font-black uppercase tracking-tighter text-center leading-none">
                                {opt.label}
                            </span>
                        </div>

                        {/* 🔥 ETİKETLER: 2 Kat Büyük */}
                        {isSelected && activeSubLabels.length > 0 && (
                            <div className="w-full flex flex-wrap justify-center gap-1.5 mt-4 animate-in slide-in-from-bottom-2">
                                {activeSubLabels.map(label => (
                                    <span key={label} className="text-[11px] font-black bg-white text-black px-3 py-1.5 rounded-lg tracking-wider shadow-sm uppercase border border-black/10 scale-110">
                                        {label}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        {/* DÜZENLE BUTONU (Seçiliyse) */}
                        {hasSubs && isSelected && (
                           <button 
                              onClick={(e) => openFolder(e, opt.id)}
                              className="mt-3 w-full py-3 bg-black/10 hover:bg-black/20 text-white text-[10px] font-black tracking-widest rounded-xl shadow-none flex items-center justify-center gap-1 active:scale-95 transition-all"
                           >
                              <Settings2 size={14} /> DÜZENLE
                           </button>
                        )}
                     </div>
                   );
                })}
             </div>
          </section>

          {/* 3. BÖLGE VE FİYATLANDIRMA */}
          <section className="space-y-4">
             <h3 className="text-[11px] font-black text-purple-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-6 h-0.5 bg-purple-600"></div> Bölge ve Fiyatlandırma
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-1 flex items-center shadow-sm">
                   <MapPin className="ml-4 text-gray-300" size={18} />
                   <select value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-transparent p-4 font-black text-[10px] uppercase outline-none cursor-pointer">
                      {TURKEY_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                   </select>
                </div>

                {/* Fiyat Girişi */}
                <div className="relative">
                    <div className={`bg-white rounded-2xl border p-1 flex items-center shadow-sm ${priceError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-100'}`}>
                        <Wallet className={`ml-4 ${priceError ? 'text-red-500' : 'text-gray-300'}`} size={18} />
                        <input 
                            placeholder={isChargingService ? "KW ÜCRETİ" : "KM BAŞINA FİYAT"} 
                            type="number"
                            inputMode="decimal"
                            value={formData.pricePerUnit}
                            onChange={handlePriceChange}
                            className="w-full bg-transparent p-4 font-black text-[10px] uppercase outline-none"
                        />
                        <span className="mr-4 text-[10px] font-black text-gray-400 select-none">(TL)</span>
                    </div>
                    {priceError && <p className="absolute -bottom-5 left-2 text-[9px] font-bold text-red-500 animate-pulse">{priceError}</p>}
                </div>

                <input placeholder="HİZMET VERDİĞİNİZ ROTALAR" onChange={e => setFormData({...formData, routes: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl p-5 font-bold text-[10px] outline-none shadow-sm"/>
                <textarea placeholder="TAM ADRES" onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl p-5 font-bold text-xs outline-none shadow-sm md:col-span-2 h-20 resize-none"/>
             </div>
          </section>

          {/* 4. ONAY */}
          <section className="flex flex-col items-center pt-2 pb-20 space-y-6">
             <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setAgreed(!agreed)}>
                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${agreed ? 'bg-blue-600 border-blue-600 shadow-xl' : 'border-gray-200 bg-white'}`}>
                   {agreed && <CheckCircle2 size={20} className="text-white" />}
                </div>
                <span className="text-[10px] font-black text-gray-700 uppercase">Sözleşmeyi Okudum ve Kabul Ediyorum</span>
             </div>

             <button 
                onClick={handleRegister} 
                disabled={loading || !agreed || !!priceError} 
                className={`w-full max-w-md py-7 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${agreed && !priceError ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
             >
                {loading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20} />} 
                KAYDI TAMAMLA
             </button>
          </section>
        </div>

        {/* --- iOS TARZI KLASÖR MODAL --- */}
        {activeFolder && currentFolderConfig && (
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
                <div 
                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl transition-opacity"
                    onClick={() => setActiveFolder(null)}
                ></div>

                <div className="relative w-full sm:max-w-2xl bg-[#f2f2f7] rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 flex flex-col max-h-[85vh]">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-300/50">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl bg-${currentFolderConfig.color}-600`}>
                                <currentFolderConfig.icon size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none text-gray-900">{currentFolderConfig.label}</h2>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Özellik Seçimi</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveFolder(null)} className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all">
                            <X size={20} className="text-gray-900" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar p-2">
                        {currentFolderConfig.subs.map(sub => {
                            const isSelected = formData.filterTags.includes(sub.id);
                            const subColorClass = getColorClasses(currentFolderConfig.color, isSelected, true);

                            return (
                                <button
                                    key={sub.id}
                                    onClick={() => toggleSubOption(sub.id)}
                                    className={`
                                        group relative flex flex-col items-center justify-center py-10 rounded-[2.5rem] border-2 transition-all duration-300 active:scale-95
                                        ${subColorClass}
                                        ${isSelected ? 'shadow-xl border-transparent scale-[1.02]' : 'border-transparent shadow-sm bg-white'}
                                    `}
                                >
                                    {isSelected && (
                                        <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full">
                                            <Check size={16} strokeWidth={4} className="text-white" />
                                        </div>
                                    )}
                                    
                                    {sub.icon ? <sub.icon size={48} className="mb-4 drop-shadow-md" strokeWidth={1.5} /> : <div className="w-4 h-4 rounded-full bg-current mb-4"/>}
                                    
                                    <span className="text-sm font-black uppercase tracking-tight text-center px-2 leading-tight">
                                        {sub.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-8 pt-4">
                        <button 
                            onClick={() => setActiveFolder(null)}
                            className={`w-full py-6 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl transition-transform active:scale-95 text-white bg-${currentFolderConfig.color}-600 hover:opacity-90`}
                        >
                            TAMAMLANDI
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}