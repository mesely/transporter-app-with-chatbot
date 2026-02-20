/**
 * @file ProviderModule.tsx
 * @description Transport 245 Yönetici Paneli - Kurum/Sürücü Yönetim Modülü.
 * FIX: 'handleBulkDelete', 'toggleServiceType' ve 'handleDelete' tanımlanmama hataları giderildi.
 * FIX: Telefon numarası çakışmasında formu bozmadan anında güncelleme yapar.
 * FIX: 'evden_eve' kategorisi 'NAKLIYE' mainType'ı ile eşleştirildi.
 * UPDATE: Arka plan #8ccde6 rengine çevrildi, tasarıma Glassmorphism eklendi ve Mobil Şarj ikonu güncellendi.
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Search, Phone, Edit, Trash2, MapPin, X, 
  Loader2, Truck, Zap, Anchor, CarFront, Globe, 
  Navigation, Filter, Home, Package, Container, 
  Snowflake, Layers, Archive, Box, Check, Users, Bus, Crown,
  ArrowRight, Settings2
} from 'lucide-react';

const API_URL = process.env.BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';
const GOOGLE_MAPS_API_KEY = 'AIzaSyCbbq8XeceIkg99CEQui1-_09zMnDtglrk';

const TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

const SERVICE_OPTIONS = [
  { id: 'oto_kurtarma', label: 'KURTARICI', icon: CarFront, color: 'bg-red-600', subs: [] },
  { id: 'vinc', label: 'VİNÇ', icon: Anchor, color: 'bg-rose-600', subs: [] },
  { id: 'yurt_disi_nakliye', label: 'YURT DIŞI NAKLİYE', icon: Globe, color: 'bg-indigo-600', subs: [] },
  { id: 'tir', label: 'TIR', icon: Container, color: 'bg-violet-600', subs: [
      { id: 'tenteli', label: 'TENTELİ', icon: Archive },
      { id: 'frigorifik', label: 'FRİGORİFİK', icon: Snowflake },
      { id: 'lowbed', label: 'LOWBED', icon: Layers },
      { id: 'konteyner', label: 'KONTEYNER', icon: Container },
      { id: 'acik_kasa', label: 'AÇIK KASA', icon: Box }
  ]},
  { id: 'kamyon', label: 'KAMYON', icon: Truck, color: 'bg-purple-600', subs: [
      { id: '6_teker', label: '6 TEKER', icon: Truck },
      { id: '8_teker', label: '8 TEKER', icon: Truck },
      { id: '10_teker', label: '10 TEKER', icon: Truck },
      { id: '12_teker', label: '12 TEKER', icon: Truck },
      { id: 'kirkayak', label: 'KIRKAYAK', icon: Layers }
  ]},
  { id: 'kamyonet', label: 'KAMYONET', icon: Package, color: 'bg-fuchsia-600', subs: [
      { id: 'panelvan', label: 'PANELVAN', icon: CarFront },
      { id: 'acik_kasa', label: 'AÇIK KASA', icon: Box },
      { id: 'kapali_kasa', label: 'KAPALI KASA', icon: Archive }
  ]},
  { id: 'evden_eve', label: 'EVDEN EVE', icon: Home, color: 'bg-pink-600', subs: [] },
  { id: 'yolcu', label: 'YOLCU TAŞIMA', icon: Users, color: 'bg-emerald-600', subs: [
      { id: 'minibus', label: 'MİNİBÜS', icon: CarFront },
      { id: 'otobus', label: 'OTOBÜS', icon: Bus },
      { id: 'midibus', label: 'MİDİBÜS', icon: Bus },
      { id: 'vip_tasima', label: 'VIP TRANSFER', icon: Crown }
  ]},
  { id: 'istasyon', label: 'İSTASYON', icon: Navigation, color: 'bg-blue-600', subs: [] },
  { id: 'seyyar_sarj', label: 'MOBİL ŞARJ', icon: Zap, color: 'bg-cyan-500', subs: [] },
];

export default function ProviderModule() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('Tümü');
  const [filterType, setFilterType] = useState('Tümü');
  const [cityData, setCityData] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState<any>({
    _id: '', businessName: '', email: '', phoneNumber: '', city: 'İstanbul', district: 'Tuzla', address: '',
    serviceTypes: [] as string[], openingFee: 350, pricePerUnit: 40, filterTags: [] as string[], website: '' 
  });

  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/il_ilce.csv').then(res => res.text()).then(text => {
      const dataMap: any = {};
      text.split(/\r?\n/).forEach((line, i) => {
        if (i === 0 || !line.trim()) return;
        const [il, ilce] = line.split(',');
        if (il && ilce) {
          const cIl = il.trim();
          if (!dataMap[cIl]) dataMap[cIl] = [];
          dataMap[cIl].push(ilce.trim());
        }
      });
      setCityData(dataMap);
    }).catch(e => console.error("CSV loading error", e));
  }, []);

  const availableDistricts = useMemo(() => cityData[formData.city] || [], [formData.city, cityData]);

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterCity !== 'Tümü') query.append('city', filterCity);
      if (filterType !== 'Tümü') query.append('type', filterType);
      const res = await fetch(`${API_URL}/users/all?${query.toString()}`);
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : []);
    } catch (err) { setProviders([]); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [filterCity, filterType]);

  const toggleProviderSelection = (id: string) => {
    setSelectedProviders(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = async (e: any, id: string) => {
    e.stopPropagation();
    if (!confirm("Seçili kurumu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { alert("Silinirken bir hata oluştu."); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedProviders.length} adet kurumu silmeyi onaylıyor musunuz?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedProviders.map(id => fetch(`${API_URL}/users/${id}`, { method: 'DELETE' })));
      setSelectedProviders([]);
      loadData();
    } catch (err) { alert("Toplu silme hatası."); }
    finally { setLoading(false); }
  };

  const toggleServiceType = (id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(id) ? [] : [id],
      filterTags: []
    }));
  };

  const toggleSubOption = (subId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      filterTags: prev.filterTags.includes(subId) 
        ? prev.filterTags.filter((t: string) => t !== subId) 
        : [...prev.filterTags, subId]
    }));
  };

  const getCoordinatesFromAddress = async (addr: string) => {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${GOOGLE_MAPS_API_KEY}&language=tr`);
      const data = await res.json();
      return data.status === 'OK' ? { lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng } : null;
    } catch { return null; }
  };

  const openEdit = (p: any) => {
    if(!p) return;
    const addr = p.address || {};
    const streetPart = (typeof p.address === 'string' ? p.address : addr.fullText || '').split(',')[0].trim();
    setFormData({
      _id: p._id, businessName: p.businessName || p.firstName || '', email: p.email || '', phoneNumber: p.phoneNumber || '',
      city: addr.city || 'İstanbul', district: addr.district || 'Tuzla', address: streetPart,
      serviceTypes: (p.service?.mainType === 'YOLCU' ? ['yolcu'] : [p.service?.subType || p.serviceType || '']),
      openingFee: p.pricing?.openingFee || 350, pricePerUnit: p.pricing?.pricePerUnit || 40,
      filterTags: p.service?.tags || [], website: p.website || p.link || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!/^0\d{10}$/.test(formData.phoneNumber)) return alert("Hatalı Numara! 0 ile başlayan 11 hane girin.");
    if (formData.serviceTypes.length === 0) return alert("Hizmet türü seçiniz.");

    let targetId = formData._id;
    let finalMethod = isEditing ? 'PUT' : 'POST';

    if (!isEditing) {
      const found = providers.find(p => p.phoneNumber === formData.phoneNumber);
      if (found) {
        if (confirm(`Bu numara (${formData.phoneNumber}) zaten kayıtlı.\nMevcut kaydı bu bilgilerle güncellemek istiyor musunuz?`)) {
          targetId = found._id;
          finalMethod = 'PUT';
        } else { return; }
      }
    }

    setLoading(true);
    try {
      const selected = formData.serviceTypes[0];
      let mappedMain = 'NAKLIYE';
      if (['oto_kurtarma', 'vinc'].includes(selected)) mappedMain = 'KURTARICI';
      else if (['istasyon', 'seyyar_sarj'].includes(selected)) mappedMain = 'SARJ';
      else if (['yolcu'].includes(selected)) mappedMain = 'YOLCU';
      else if (['yurt_disi_nakliye'].includes(selected)) mappedMain = 'YURT_DISI';
      else if (['kamyon', 'tir', 'kamyonet', 'evden_eve'].includes(selected)) mappedMain = 'NAKLIYE';

      const combined = `${formData.address}, ${formData.district}, ${formData.city}, Türkiye`;
      let coords = await getCoordinatesFromAddress(combined) || await getCoordinatesFromAddress(`${formData.district}, ${formData.city}, Türkiye`);
      
      if (!coords) { setLoading(false); return alert("Adres haritada bulunamadı."); }

      const payload: any = {
        firstName: formData.businessName, businessName: formData.businessName, email: formData.email, phoneNumber: formData.phoneNumber,
        mainType: mappedMain, serviceType: selected,
        service: { mainType: mappedMain, subType: selected, tags: formData.filterTags },
        address: `${formData.address}, ${formData.district}, ${formData.city}`,
        city: formData.city, district: formData.district, role: 'provider', website: formData.website,
        pricing: { openingFee: Number(formData.openingFee), pricePerUnit: Number(formData.pricePerUnit) },
        location: { type: "Point", coordinates: [coords.lng, coords.lat] },
        lat: coords.lat, lng: coords.lng
      };

      const res = await fetch(targetId ? `${API_URL}/users/${targetId}` : `${API_URL}/users`, {
        method: finalMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) { setShowModal(false); loadData(); } else { 
        const err = await res.json();
        alert(`Hata: ${err.message || "Kaydedilemedi"}`); 
      }
    } catch (e) { alert("Bağlantı hatası."); } finally { setLoading(false); }
  };

  const currentFolderConfig = SERVICE_OPTIONS.find(s => s.id === activeFolder);

  return (
    <div className="w-full min-h-screen p-6 bg-[#8ccde6] selection:bg-white/30 text-gray-900">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase mb-3 w-fit tracking-widest shadow-md">Transport 245 Admin</div>
          <h1 className="text-4xl font-black text-gray-900 uppercase italic drop-shadow-sm">Hizmet Ağı <span className="text-blue-800">Yönetimi</span></h1>
        </div>
        <div className="flex gap-3">
          {selectedProviders.length > 0 && <button onClick={handleBulkDelete} className="bg-red-600 text-white px-6 py-4 rounded-3xl text-xs font-black uppercase shadow-xl hover:bg-red-700 transition-colors flex items-center gap-2"><Trash2 size={18}/> Sil ({selectedProviders.length})</button>}
          <button onClick={() => { setIsEditing(false); setFormData({_id:'', businessName:'', email:'', phoneNumber:'', city:'İstanbul', district:'Tuzla', address:'', serviceTypes:[], openingFee:350, pricePerUnit:40, filterTags:[], website:''}); setShowModal(true); }} className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-3xl text-xs font-black uppercase shadow-xl transition-colors flex items-center gap-2"><Plus size={20}/> Yeni Kurum</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/60 backdrop-blur-md border border-white/50 p-2 flex items-center shadow-sm rounded-2xl"><Search className="ml-4 text-gray-500" size={20}/><input placeholder="İSİM/TEL ARA..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-transparent p-3 font-bold text-xs outline-none uppercase placeholder-gray-500 text-gray-900"/></div>
        <div className="bg-white/60 backdrop-blur-md border border-white/50 p-2 flex items-center shadow-sm rounded-2xl"><MapPin className="ml-4 text-gray-500" size={20}/><select value={filterCity} onChange={e=>setFilterCity(e.target.value)} className="w-full bg-transparent p-3 font-bold text-xs outline-none uppercase appearance-none cursor-pointer text-gray-900"><option value="Tümü">TÜM TÜRKİYE</option>{Object.keys(cityData).map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div className="bg-white/60 backdrop-blur-md border border-white/50 p-2 flex items-center shadow-sm rounded-2xl"><Filter className="ml-4 text-gray-500" size={20}/><select value={filterType} onChange={e=>setFilterType(e.target.value)} className="w-full bg-transparent p-3 font-bold text-xs outline-none uppercase appearance-none cursor-pointer text-gray-900"><option value="Tümü">TÜM HİZMETLER</option>{SERVICE_OPTIONS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
      </div>

      <div ref={listContainerRef} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        {loading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-white inline drop-shadow-md" size={48}/></div> : 
          providers.filter(p=>(p.businessName||p.firstName||'').toLowerCase().includes(searchTerm.toLowerCase())).map(p=>{
            let ui = SERVICE_OPTIONS.find(o=>o.id === p.service?.subType || o.id === p.serviceType);
            if(!ui) { for(const opt of SERVICE_OPTIONS){ const m = opt.subs.find(s=>s.id===(p.service?.subType || p.serviceType)); if(m){ ui=opt; break; } } }
            if(!ui) ui = SERVICE_OPTIONS[0];
            const isSel = selectedProviders.includes(p._id);
            const addr = typeof p.address === 'string' ? p.address : p.address?.fullText || `${p.address?.city || ''} / ${p.address?.district || ''}`;
            const isMobileCharge = p.service?.subType === 'seyyar_sarj' || p.serviceType === 'seyyar_sarj';

            return(
              <div key={p._id} onClick={()=>toggleProviderSelection(p._id)} className={`bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/50 transition-all cursor-pointer shadow-xl hover:shadow-2xl ${isSel ? 'ring-4 ring-blue-500/30 bg-white/80' : ''}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4 items-center">
                    <div className={`w-14 h-14 ${ui.color} text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0`}>
                      {isMobileCharge ? (
                        <img src="/icons/GeziciIcon.png" className="w-7 h-7 invert brightness-200" alt="G" />
                      ) : p.service?.subType === 'minibus' ? <Users size={28} strokeWidth={1}/> : p.service?.subType === 'otobus' ? <Bus size={28} strokeWidth={1.5}/> : <ui.icon size={28} strokeWidth={1.5}/>}
                    </div>
                    <div className="overflow-hidden"><h3 className="font-black text-slate-900 text-sm uppercase truncate">{p.businessName || p.firstName}</h3><span className="text-[8px] font-black text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded uppercase">{p.service?.subType || p.serviceType || 'Genel'}</span></div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 ml-2" onClick={e=>e.stopPropagation()}><button onClick={()=>openEdit(p)} className="p-2 bg-white/50 backdrop-blur-sm text-slate-500 hover:text-blue-600 rounded-xl transition-colors shadow-sm"><Edit size={16}/></button><button onClick={e=>handleDelete(e,p._id)} className="p-2 bg-white/50 backdrop-blur-sm text-red-400 hover:text-red-600 rounded-xl transition-colors shadow-sm"><Trash2 size={16}/></button></div>
                </div>
                <div className="space-y-2"><div className="flex items-center gap-3 text-[10px] font-bold text-slate-700 bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/40"><Phone size={14} className="text-green-600"/> {p.phoneNumber}</div><div className="flex items-center gap-3 text-[10px] font-bold text-slate-700 bg-white/50 backdrop-blur-sm p-3 rounded-2xl overflow-hidden border border-white/40"><MapPin size={14} className="text-red-500 shrink-0"/><span className="truncate">{addr}</span></div></div>
              </div>
            )
          })
        }
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/50 w-full max-w-5xl h-[90vh] rounded-[3rem] p-10 shadow-2xl relative overflow-y-auto custom-scrollbar text-gray-900 animate-in fade-in zoom-in-95">
            <button onClick={()=>setShowModal(false)} className="absolute top-8 right-8 p-3 bg-white/50 border border-white/60 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"><X size={24}/></button>
            <h2 className="text-3xl font-black uppercase italic mb-10 text-slate-900"> {isEditing ? 'Düzenle' : 'Yeni Kayıt'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <input placeholder="İŞLETME ADI" value={formData.businessName} onChange={e=>setFormData({...formData, businessName: e.target.value})} className="w-full bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-5 font-black text-sm outline-none placeholder-gray-500 focus:bg-white/80 transition-colors text-gray-900"/>
                <div className="grid grid-cols-2 gap-4"><input placeholder="E-POSTA" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-5 font-bold text-xs outline-none placeholder-gray-500 focus:bg-white/80 transition-colors text-gray-900"/><input placeholder="TEL (05...)" value={formData.phoneNumber} onChange={e=>setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-5 font-bold text-xs outline-none placeholder-gray-500 focus:bg-white/80 transition-colors text-gray-900"/></div>
                <div className="grid grid-cols-2 gap-4"><select value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className="w-full bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-5 font-black text-xs outline-none focus:bg-white/80 transition-colors text-gray-900">{Object.keys(cityData).map(c=><option key={c} value={c}>{c}</option>)}</select><select value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value})} className="w-full bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-5 font-bold text-xs outline-none focus:bg-white/80 transition-colors text-gray-900">{availableDistricts.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                <textarea placeholder="MAHALLE, SOKAK, CADDE, NO..." value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-5 font-medium text-xs h-32 outline-none resize-none placeholder-gray-500 focus:bg-white/80 transition-colors text-gray-900"/>
                <input placeholder="WEB SİTESİ" value={formData.website} onChange={e=>setFormData({...formData, website: e.target.value})} className="w-full bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-5 font-bold text-xs outline-none placeholder-gray-500 focus:bg-white/80 transition-colors text-gray-900"/>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {SERVICE_OPTIONS.map(opt=>(
                    <div key={opt.id} className="relative">
                      <button onClick={()=>toggleServiceType(opt.id)} className={`w-full flex flex-col items-center justify-center p-4 rounded-3xl border border-white/40 transition-all gap-2 h-24 shadow-sm ${formData.serviceTypes.includes(opt.id) ? `${opt.color} text-white shadow-lg border-transparent` : 'bg-white/60 text-[#49b5c2] hover:bg-white/80'}`}>
                        {opt.id === 'seyyar_sarj' ? (
                          <img src="/icons/GeziciIcon.png" className={`w-6 h-6 object-contain ${formData.serviceTypes.includes(opt.id) ? 'invert brightness-200' : 'opacity-80'}`} style={!formData.serviceTypes.includes(opt.id) ? { filter: 'sepia(1) hue-rotate(140deg) saturate(2.5) brightness(0.9)' } : {}} alt="Mobil Şarj" />
                        ) : (
                          <opt.icon size={22} strokeWidth={1.5}/>
                        )}
                        <span className="text-[9px] font-black uppercase text-center">{opt.label}</span>
                      </button>
                      {formData.serviceTypes.includes(opt.id) && opt.subs.length > 0 && <button onClick={e=>{e.stopPropagation(); setActiveFolder(opt.id)}} className="absolute -top-2 -right-2 bg-slate-900 text-white p-1.5 rounded-full z-10 shadow-lg hover:bg-black transition-colors"><Settings2 size={12}/></button>}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4"><div className="bg-white/50 backdrop-blur-sm border border-white/40 p-4 rounded-2xl"><label className="text-[8px] font-black uppercase text-gray-500 block mb-1">Açılış</label><input type="number" value={formData.openingFee} onChange={e=>setFormData({...formData, openingFee: e.target.value})} className="w-full bg-transparent font-black text-xl outline-none text-gray-900"/></div><div className="bg-white/50 backdrop-blur-sm border border-white/40 p-4 rounded-2xl"><label className="text-[8px] font-black uppercase text-gray-500 block mb-1">Birim</label><input type="number" value={formData.pricePerUnit} onChange={e=>setFormData({...formData, pricePerUnit: e.target.value})} className="w-full bg-transparent font-black text-xl outline-none text-gray-900"/></div></div>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-white/50 backdrop-blur-sm border border-white/50 border-dashed rounded-2xl shadow-inner">{formData.filterTags.map((t:any)=>(<span key={t} className="bg-slate-800 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 shadow-sm">{t.replace('_',' ')} <X size={12} className="cursor-pointer hover:text-red-400 transition-colors" onClick={()=>setFormData({...formData, filterTags: formData.filterTags.filter((tag:any)=>tag!==t)})}/></span>))}</div>
              </div>
            </div>
            <button onClick={handleSave} disabled={loading} className="w-full mt-10 bg-slate-900 hover:bg-black text-white py-6 rounded-[2rem] font-black uppercase text-sm flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl disabled:bg-slate-400 disabled:cursor-not-allowed">{loading ? <Loader2 className="animate-spin" size={24}/> : <>{isEditing ? 'GÜNCELLEMEYİ TAMAMLA' : 'KAYDI TAMAMLA'} <ArrowRight size={20}/></>}</button>
          </div>
        </div>
      )}

      {activeFolder && currentFolderConfig && (
        <div className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 transition-opacity">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/50 w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative flex flex-col max-h-[80vh] text-gray-900 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-10">
            <h2 className="text-2xl font-black uppercase italic mb-6 text-slate-900">{currentFolderConfig.label} Seçimi</h2>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 mb-6 pr-2 custom-scrollbar">
              {currentFolderConfig.subs.map(sub => (
                <button key={sub.id} onClick={() => toggleSubOption(sub.id)} className={`p-6 rounded-3xl border border-white/40 transition-all flex flex-col items-center gap-2 shadow-sm ${formData.filterTags.includes(sub.id) ? `${currentFolderConfig.color} text-white shadow-lg border-transparent scale-[1.02]` : 'bg-white/60 backdrop-blur-sm text-[#49b5c2] hover:bg-white/80'}`}><sub.icon size={28} strokeWidth={1.5}/><span className="text-[10px] font-black uppercase">{sub.label}</span></button>
              ))}
            </div>
            <button onClick={()=>setActiveFolder(null)} className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">TAMAMLANDI</button>
          </div>
        </div>
      )}
    </div>
  );
}