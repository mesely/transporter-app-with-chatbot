/**
 * @file ProviderModule.tsx
 * @description Transport 245 Yönetici Paneli - Kurum/Sürücü Yönetim Modülü.
 * GÜNCELLEME: Yolcu Taşıma, 8 Teker ve Gezici Şarj tam entegrasyonu.
 * GÜNCELLEME: mainType (NAKLIYE/KURTARICI/SARJ/YOLCU) mapping sistemi eklendi.
 * FIX: listContainerRef hatası giderildi.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Phone, Edit, Trash2, MapPin, X, 
  Loader2, Truck, Zap, Anchor, CarFront, Globe, 
  Navigation, Filter, Home, Package, Container, 
  Snowflake, Layers, Archive, Box, Check, Users, Bus, Crown,
  ArrowRight, Settings2
} from 'lucide-react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

const TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

const SERVICE_OPTIONS = [
  { id: 'oto_kurtarma', label: 'KURTARICI', icon: CarFront, color: 'bg-red-600', hover: 'hover:border-red-400', subs: [] },
  { id: 'vinc', label: 'VİNÇ', icon: Anchor, color: 'bg-rose-600', hover: 'hover:border-rose-400', subs: [] },
  { id: 'yurt_disi_nakliye', label: 'YURT DIŞI NAKLİYE', icon: Globe, color: 'bg-indigo-600', hover: 'hover:border-indigo-400', subs: [] },
  { 
    id: 'tir', label: 'TIR', icon: Container, color: 'bg-violet-600', hover: 'hover:border-violet-400',
    subs: [
      { id: 'tenteli', label: 'TENTELİ', icon: Archive },
      { id: 'frigorifik', label: 'FRİGORİFİK', icon: Snowflake },
      { id: 'lowbed', label: 'LOWBED', icon: Layers },
      { id: 'konteyner', label: 'KONTEYNER', icon: Container },
      { id: 'acik_kasa', label: 'AÇIK KASA', icon: Box }
    ]
  },
  { 
    id: 'kamyon', label: 'KAMYON', icon: Truck, color: 'bg-purple-600', hover: 'hover:border-purple-400',
    subs: [
      { id: '6_teker', label: '6 TEKER', icon: Truck },
      { id: '8_teker', label: '8 TEKER', icon: Truck },
      { id: '10_teker', label: '10 TEKER', icon: Truck },
      { id: '12_teker', label: '12 TEKER', icon: Truck },
      { id: 'kirkayak', label: 'KIRKAYAK', icon: Layers }
    ]
  },
  { 
    id: 'kamyonet', label: 'KAMYONET', icon: Package, color: 'bg-fuchsia-600', hover: 'hover:border-fuchsia-400',
    subs: [
      { id: 'panelvan', label: 'PANELVAN', icon: CarFront },
      { id: 'acik_kasa', label: 'AÇIK KASA', icon: Box },
      { id: 'kapali_kasa', label: 'KAPALI KASA', icon: Archive }
    ]
  },
  { id: 'evden_eve', label: 'EVDEN EVE', icon: Home, color: 'bg-pink-600', hover: 'hover:border-pink-400', subs: [] },
  { 
    id: 'yolcu_tasima', label: 'YOLCU TAŞIMA', icon: Users, color: 'bg-emerald-600', hover: 'hover:border-emerald-400',
    subs: [
      { id: 'minibus', label: 'MİNİBÜS', icon: CarFront },
      { id: 'otobus', label: 'OTOBÜS', icon: Bus },
      { id: 'midibus', label: 'MİDİBÜS', icon: Bus },
      { id: 'vip_tasima', label: 'VIP TRANSFER', icon: Crown }
    ]
  },
  { id: 'istasyon', label: 'İSTASYON', icon: Navigation, color: 'bg-blue-600', hover: 'hover:border-blue-400', subs: [] },
  { id: 'seyyar_sarj', label: 'MOBİL ŞARJ', icon: Zap, color: 'bg-cyan-500', hover: 'hover:border-cyan-400', subs: [] },
];

export default function ProviderModule() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  
  const [filterCity, setFilterCity] = useState('Tümü');
  const [filterType, setFilterType] = useState('Tümü');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<any>({
    businessName: '', email: '', phoneNumber: '', city: 'İzmir', district: '', address: '',
    serviceTypes: [] as string[], openingFee: 350, pricePerUnit: 40, filterTags: [] as string[]
  });

  // 🔥 FIX: listContainerRef tanımlandı
  const listContainerRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterCity !== 'Tümü') query.append('city', filterCity);
      if (filterType !== 'Tümü') query.append('type', filterType);
      const res = await fetch(`${API_URL}/users/all?${query.toString()}`);
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : []);
    } catch (err) { 
      setProviders([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, [filterCity, filterType]);

  const toggleProviderSelection = (id: string) => {
    setSelectedProviders(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Bu kurumu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { alert("Hata oluştu."); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedProviders.length} kurumu toplu silmek istediğinize emin misiniz?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedProviders.map(id => fetch(`${API_URL}/users/${id}`, { method: 'DELETE' })));
      setSelectedProviders([]);
      loadData();
    } catch (err) { alert("Toplu silme sırasında hata."); }
    finally { setLoading(false); }
  };

  const toggleServiceType = (id: string) => {
    setFormData((prev: any) => {
      const isSelected = prev.serviceTypes.includes(id);
      // Tekil seçim mantığı: Seçiliyse boşalt, değilse yeni id'yi ata
      let newTypes = isSelected ? [] : [id];
      
      let newTags = [...prev.filterTags];
      // Eğer seçim kaldırıldıysa veya yeni seçim yapıldıysa eski tagleri temizle
      if (isSelected || newTypes.length > 0) {
         newTags = [];
      }
      return { ...prev, serviceTypes: newTypes, filterTags: newTags };
    });
  };

  const toggleSubOption = (subId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      filterTags: prev.filterTags.includes(subId) 
        ? prev.filterTags.filter((t: string) => t !== subId) 
        : [...prev.filterTags, subId]
    }));
  };

  const handleSave = async () => {
    const phoneRegex = /^0\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      return alert("Hatalı Telefon Formatı! Numaranız 0 ile başlamalı ve toplam 11 haneli olmalıdır.");
    }
    
    if (formData.serviceTypes.length === 0) {
      return alert("Lütfen bir hizmet branşı seçiniz.");
    }

    setLoading(true);
    const endpoint = isEditing ? `${API_URL}/users/${formData._id}` : `${API_URL}/users`;
    
    try {
      const mappedServiceType = formData.serviceTypes[0];
      let mappedMain = 'NAKLIYE'; // Varsayılan

      // 🔥 mainType Mapping Mantığı
      if (['yurt_disi_nakliye'].includes(mappedServiceType)) mappedMain = 'YURT_DISI';
      else if (['oto_kurtarma', 'vinc'].includes(mappedServiceType)) mappedMain = 'KURTARICI';
      else if (['istasyon', 'seyyar_sarj'].includes(mappedServiceType)) mappedMain = 'SARJ';
      else if (['yolcu_tasima'].includes(mappedServiceType)) mappedMain = 'YOLCU';

      const res = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          firstName: formData.businessName, 
          mainType: mappedMain, 
          serviceType: mappedServiceType, 
          role: 'provider',
          pricing: {
            openingFee: Number(formData.openingFee),
            pricePerUnit: Number(formData.pricePerUnit)
          }
        })
      });
      
      if (res.ok) { 
        setShowModal(false); 
        loadData(); 
      } else {
        alert("Kaydetme işlemi sırasında hata oluştu.");
      }
    } catch (err) { 
      alert("Sunucuya bağlanılamadı!"); 
    } finally { 
      setLoading(false); 
    }
  };

  const openEdit = (p: any) => {
    setFormData({
      _id: p._id,
      businessName: p.businessName || p.firstName || '',
      email: p.email || '',
      phoneNumber: p.phoneNumber || '',
      city: p.address?.city || 'İzmir',
      district: p.address?.district || '',
      address: p.address?.fullText || '',
      serviceTypes: p.service?.subType ? [p.service.subType] : [],
      openingFee: p.pricing?.openingFee || 350,
      pricePerUnit: p.pricing?.pricePerUnit || 40,
      filterTags: p.service?.tags || []
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const currentFolderConfig = SERVICE_OPTIONS.find(s => s.id === activeFolder);

  return (
    <div className="w-full min-h-screen p-6 space-y-8 bg-slate-50 selection:bg-blue-100">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="min-w-fit">
          <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-lg mb-3 w-fit">
            Transport 245 Panel v2.0
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 uppercase italic tracking-tighter leading-none whitespace-nowrap">
            Hizmet Ağı <span className="text-blue-600">Yönetimi</span>
          </h1>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {selectedProviders.length > 0 && (
            <button onClick={handleBulkDelete} className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-[2rem] text-xs font-black uppercase flex items-center justify-center gap-2 shadow-xl shadow-red-500/20">
              <Trash2 size={18} /> ({selectedProviders.length}) Seçileni Sil
            </button>
          )}
          <button 
            onClick={() => { setIsEditing(false); setFormData({businessName:'', email:'', phoneNumber:'', city:'İzmir', district:'', address:'', serviceTypes:[], openingFee:350, pricePerUnit:40, filterTags:[]}); setShowModal(true); }}
            className="flex-1 md:flex-none bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-[2rem] text-xs font-black uppercase flex items-center justify-center gap-3 shadow-xl"
          >
            <Plus size={20} /> Yeni Kurum
          </button>
        </div>
      </header>

      {/* FİLTRELER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2 flex items-center">
          <Search className="ml-4 text-slate-400" size={20} />
          <input placeholder="İSİM VEYA TEL İLE ARA..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent p-3 font-bold text-xs uppercase outline-none"/>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2 flex items-center">
          <MapPin className="ml-4 text-slate-400" size={20} />
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="w-full bg-transparent p-3 font-bold text-xs outline-none cursor-pointer uppercase appearance-none">
            <option value="Tümü">TÜM TÜRKİYE</option>
            {TURKEY_CITIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2 flex items-center">
          <Filter className="ml-4 text-slate-400" size={20} />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full bg-transparent p-3 font-bold text-xs outline-none cursor-pointer uppercase appearance-none">
            <option value="Tümü">TÜM HİZMETLER</option>
            {SERVICE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* LİSTE */}
      <div ref={listContainerRef} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        {loading ? (
          <div className="col-span-full flex flex-col items-center py-20"><Loader2 className="animate-spin mb-4" size={40}/></div>
        ) : (
          providers.filter(p => (p.businessName || p.firstName || p.email || '').toLowerCase().includes(searchTerm.toLowerCase())).map((p) => {
            const ui = SERVICE_OPTIONS.find(o => o.id === (p.service?.subType)) || SERVICE_OPTIONS[0];
            const isSelected = selectedProviders.includes(p._id);
            return (
              <div 
                key={p._id} 
                onClick={() => toggleProviderSelection(p._id)}
                className={`group relative bg-white p-6 rounded-[2.5rem] border-2 transition-all duration-300 cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-white shadow-xl hover:shadow-2xl'}`}
              >
                {isSelected && <div className="absolute top-4 right-4 bg-blue-600 text-white p-1 rounded-full"><Check size={14} strokeWidth={4}/></div>}
                
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 ${ui.color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                      <ui.icon size={32} strokeWidth={1.5}/>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg uppercase truncate max-w-[150px] leading-tight">{p.businessName || p.firstName}</h3>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{p.service?.subType}</span>
                        {p.service?.tags?.map((t:string) => <span key={t} className="text-[8px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{t.replace('_',' ')}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(p)} className="p-2.5 bg-white text-slate-400 hover:text-blue-600 rounded-xl shadow-sm border border-slate-100"><Edit size={16}/></button>
                    <button onClick={(e) => handleDelete(e, p._id)} className="p-2.5 bg-white text-red-300 hover:text-red-600 rounded-xl shadow-sm border border-slate-100"><Trash2 size={16}/></button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl"><Phone size={14} className="text-green-500"/> {p.phoneNumber}</div>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl"><MapPin size={14} className="text-red-500"/> {p.address?.city} / {p.address?.district}</div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[92vh] rounded-[3.5rem] p-8 md:p-12 shadow-2xl relative overflow-y-auto border border-white/50 custom-scrollbar">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-4 bg-slate-100 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={24}/></button>
            <header className="mb-10">
              <h2 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter">
                {isEditing ? 'Kaydı Düzenle' : 'Yeni Kayıt Tanımla'}
              </h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Kurumsal Bilgiler</h3>
                <input placeholder="İŞLETME ADI" value={formData.businessName} onChange={e=>setFormData({...formData, businessName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-black text-sm outline-none"/>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="E-POSTA" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-bold text-xs outline-none"/>
                  <input placeholder="TELEFON" value={formData.phoneNumber} onChange={e=>setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-bold text-xs outline-none"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-black text-xs outline-none">
                    {TURKEY_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input placeholder="İLÇE" value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-bold text-xs outline-none"/>
                </div>
                <textarea placeholder="TAM ADRES..." value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-medium text-xs outline-none h-32 resize-none"/>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-600"></span> Hizmet & Özellikler</h3>
                <div className="grid grid-cols-3 gap-3">
                  {SERVICE_OPTIONS.map((opt) => {
                    const isSelected = formData.serviceTypes.includes(opt.id);
                    const hasSubs = opt.subs.length > 0;
                    return (
                      <div key={opt.id} className="relative">
                        <button
                          onClick={() => toggleServiceType(opt.id)}
                          className={`w-full flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-2 h-24 ${isSelected ? `${opt.color} text-white shadow-xl scale-[1.02] border-transparent` : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                        >
                          <opt.icon size={22} />
                          <span className="text-[9px] font-black uppercase text-center leading-none">{opt.label}</span>
                        </button>
                        {isSelected && hasSubs && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveFolder(opt.id); }}
                            className="absolute -top-2 -right-2 bg-slate-900 text-white p-1.5 rounded-full shadow-lg z-10"
                          >
                            <Settings2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Açılış Ücreti</label>
                    <input type="number" value={formData.openingFee} onChange={e=>setFormData({...formData, openingFee: e.target.value})} className="w-full bg-transparent font-black text-xl outline-none"/>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Birim Fiyat</label>
                    <input type="number" value={formData.pricePerUnit} onChange={e=>setFormData({...formData, pricePerUnit: e.target.value})} className="w-full bg-transparent font-black text-xl outline-none"/>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">Seçili Özellikler</h3>
                  <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-slate-50 border border-slate-200 rounded-3xl">
                    {formData.filterTags.map((tag: string) => (
                      <span key={tag} className="flex items-center gap-1 bg-slate-800 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-md">
                        {tag.replace('_',' ')} <button onClick={() => setFormData({...formData, filterTags: formData.filterTags.filter((t:string)=>t!==tag)})} className="hover:text-red-400 ml-1"><X size={12}/></button>
                      </span>
                    ))}
                    {formData.filterTags.length === 0 && <span className="text-[10px] text-slate-300 italic uppercase">Henüz özellik seçilmedi...</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-slate-900 text-white py-6 px-16 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl active:scale-95 flex items-center gap-3 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" size={24}/> : <>KAYDI TAMAMLA <ArrowRight size={20}/></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALT ÖZELLİK MODAL */}
      {activeFolder && currentFolderConfig && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setActiveFolder(null)}></div>
          <div className="relative w-full sm:max-w-xl bg-gray-100 rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-gray-900">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black uppercase italic text-slate-800 leading-tight">{currentFolderConfig.label}</h2>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Çoklu Seçim Yapabilirsiniz</p>
              </div>
              <button onClick={() => setActiveFolder(null)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 overflow-y-auto p-1 flex-1 custom-scrollbar">
              {currentFolderConfig.subs.map(sub => {
                const isTagSelected = formData.filterTags.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    onClick={() => toggleSubOption(sub.id)}
                    className={`relative flex flex-col items-center justify-center py-8 rounded-[2rem] transition-all border-2 ${isTagSelected ? `${currentFolderConfig.color} text-white shadow-xl scale-[1.02]` : 'border-white bg-white text-slate-400'}`}
                  >
                    {isTagSelected && <div className="absolute top-3 right-3 bg-white/20 p-1 rounded-full"><Check size={12} strokeWidth={4} className="text-white"/></div>}
                    <sub.icon size={32} className="mb-2" strokeWidth={1.5}/>
                    <span className="text-xs font-black uppercase tracking-tight">{sub.label}</span>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setActiveFolder(null)} className="mt-6 w-full py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl text-white bg-slate-900">TAMAMLANDI</button>
          </div>
        </div>
      )}
    </div>
  );
}