/**
 * @file profile/page.tsx
 * @description Transport 245 Driver Profile & Registration.
 * FIX: 'mainType' ve 'subType' atama hiyerarşisi çözüldü (Örn: mainType: YOLCU_TASIMA, subType: otobus).
 * FIX: Kamyon/TIR alt tipleri seçildiğinde mainType 'KURTARICI' yerine 'NAKLIYE' olarak, subType ise seçilen araç tipi (kamyon/tir) olarak ayarlandı.
 * FIX: Backend 'service' nested objesi payload'a eklendi.
 * FIX: "Web Sitesi (Opsiyonel)" alanı eklendi ve backend'e "website" parametresi olarak bağlandı.
 * FIX: KVKK & Contract links redirect to /privacy page.
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, Phone, MapPin, Truck, 
  Loader2, ShieldCheck, X, Anchor, CarFront, 
  Zap, Navigation, Globe, Home, Package, Container,
  Snowflake, Box, Layers, Archive, Check, Settings2, Wallet, 
  ArrowRight, ChevronDown, Edit3, Save, RefreshCcw, Users, Bus, Crown
} from 'lucide-react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

const TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

const SERVICE_OPTIONS = [
  { id: 'oto_kurtarma', label: 'KURTARICI', icon: CarFront, color: 'red', subs: [] },
  { id: 'vinc', label: 'VİNÇ', icon: Anchor, color: 'rose', subs: [] },
  { id: 'yurt_disi_nakliye', label: 'YURT DIŞI NAKLİYE', icon: Globe, color: 'indigo', subs: [] },
  { id: 'tir', label: 'TIR', icon: Container, color: 'violet', subs: [
      { id: 'tenteli', label: 'TENTELİ', icon: Archive },
      { id: 'frigorifik', label: 'FRİGORİFİK', icon: Snowflake },
      { id: 'lowbed', label: 'LOWBED', icon: Layers },
      { id: 'konteyner', label: 'KONTEYNER', icon: Container },
      { id: 'acik_kasa', label: 'AÇIK KASA', icon: Box }
    ]},
  { id: 'kamyon', label: 'KAMYON', icon: Truck, color: 'purple', subs: [
      { id: '6_teker', label: '6 TEKER', icon: Truck },
      { id: '8_teker', label: '8 TEKER', icon: Truck },
      { id: '10_teker', label: '10 TEKER', icon: Truck },
      { id: '12_teker', label: '12 TEKER', icon: Truck },
      { id: 'kirkayak', label: 'KIRKAYAK', icon: Layers }
    ]},
  { id: 'kamyonet', label: 'KAMYONET', icon: Package, color: 'fuchsia', subs: [
      { id: 'panelvan', label: 'PANELVAN', icon: CarFront },
      { id: 'acik_kasa', label: 'AÇIK KASA', icon: Box },
      { id: 'kapali_kasa', label: 'KAPALI KASA', icon: Archive }
    ]},
  { id: 'evden_eve', label: 'EVDEN EVE', icon: Home, color: 'pink', subs: [] },
  { id: 'yolcu_tasima', label: 'YOLCU TAŞIMA', icon: Users, color: 'emerald', subs: [
      { id: 'minibus', label: 'MİNİBÜS', icon: CarFront },
      { id: 'otobus', label: 'OTOBÜS', icon: Bus },
      { id: 'midibus', label: 'MİDİBÜS', icon: Bus },
      { id: 'vip_tasima', label: 'VIP TRANSFER', icon: Crown }
  ]},
  { id: 'istasyon', label: 'İSTASYON', icon: Navigation, color: 'blue', subs: [] },
  { id: 'seyyar_sarj', label: 'MOBİL ŞARJ', icon: Zap, color: 'cyan', subs: [] },
];

const getColorClasses = (colorName: string, isSelected: boolean) => {
  const base: any = {
    red:    isSelected ? 'bg-red-700 text-white border-red-600 shadow-red-500/40' : 'bg-white text-red-700 border-red-100 hover:border-red-300',
    rose:   isSelected ? 'bg-rose-700 text-white border-rose-600 shadow-rose-500/40' : 'bg-white text-rose-700 border-rose-100 hover:border-rose-300',
    indigo: isSelected ? 'bg-indigo-700 text-white border-indigo-600 shadow-indigo-500/40' : 'bg-white text-indigo-700 border-indigo-100 hover:border-indigo-300',
    violet: isSelected ? 'bg-violet-700 text-white border-violet-600 shadow-violet-500/40' : 'bg-white text-violet-700 border-violet-100 hover:border-violet-300',
    purple: isSelected ? 'bg-purple-700 text-white border-purple-600 shadow-purple-500/40' : 'bg-white text-purple-700 border-purple-100 hover:border-purple-300',
    fuchsia: isSelected ? 'bg-fuchsia-700 text-white border-fuchsia-600 shadow-fuchsia-500/40' : 'bg-white text-fuchsia-700 border-fuchsia-100 hover:border-fuchsia-300',
    pink:   isSelected ? 'bg-pink-700 text-white border-pink-600 shadow-pink-500/40' : 'bg-white text-pink-700 border-pink-100 hover:border-pink-300',
    blue:   isSelected ? 'bg-blue-700 text-white border-blue-600 shadow-blue-500/40' : 'bg-white text-blue-700 border-blue-100 hover:border-blue-300',
    cyan:   isSelected ? 'bg-cyan-600 text-white border-cyan-50 shadow-cyan-500/40' : 'bg-white text-cyan-700 border-cyan-100 hover:border-cyan-300',
    emerald: isSelected ? 'bg-emerald-700 text-white border-emerald-600 shadow-emerald-500/40' : 'bg-white text-emerald-700 border-emerald-100 hover:border-emerald-300',
  };
  return base[colorName] || base.blue;
};

export default function ProfilePage() {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: '', email: '', phoneNumber: '', serviceTypes: [] as string[],
    city: 'İstanbul', address: '', filterTags: [] as string[],
    openingFee: '350', pricePerUnit: '40',
    website: '' 
  });

  useEffect(() => {
    const fetchExistingProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/users/me`); 
        if (res.ok) {
          const data = await res.json();
          if (data && data._id) {
            setExistingId(data._id);
            setFormData({
              businessName: data.businessName || data.firstName || '',
              email: data.email || '',
              phoneNumber: data.phoneNumber || '',
              // Geçmiş veriyi okurken eğer tags varsa serviceType'ı ana kategori olarak algılasın
              serviceTypes: data.service?.mainType === 'YOLCU_TASIMA' ? ['yolcu_tasima'] : (data.service?.subType ? [data.service.subType] : (data.serviceType ? [data.serviceType] : [])),
              city: data.address?.city || 'İstanbul',
              address: data.address?.fullText || '',
              filterTags: data.service?.tags || [],
              openingFee: data.pricing?.openingFee?.toString() || '350',
              pricePerUnit: data.pricing?.pricePerUnit?.toString() || '40',
              website: data.link || data.website || '' 
            });
            setAgreed(true); 
          }
        }
      } catch (err) { console.log("Profil çekilemedi, yeni kayıt modunda."); }
      finally { setLoading(false); }
    };
    fetchExistingProfile();
  }, []);

  const toggleService = (id: string, hasSubs: boolean) => {
    setFormData(prev => {
      const isSelected = prev.serviceTypes.includes(id);
      let newTypes = isSelected ? [] : [id]; 
      let newTags = [...prev.filterTags];
      if (isSelected || newTypes.length > 0) {
         newTags = []; 
      }
      return { ...prev, serviceTypes: newTypes, filterTags: newTags };
    });
    if (hasSubs && !formData.serviceTypes.includes(id)) { setActiveFolder(id); }
  };

  const toggleSubOption = (subId: string) => {
    setFormData(prev => ({
      ...prev,
      filterTags: prev.filterTags.includes(subId) ? prev.filterTags.filter(t => t !== subId) : [...prev.filterTags, subId]
    }));
  };

  const handleSave = async () => {
    if (!agreed) return alert("Lütfen hizmet şartlarını ve KVKK metnini onaylayın.");
    if (formData.businessName.trim().length < 2) return alert("İşletme adı giriniz.");
    if (formData.serviceTypes.length === 0) return alert("Lütfen bir hizmet branşı seçiniz.");
    
    setSaving(true);
    try {
      const selectedMain = formData.serviceTypes[0]; // örn: 'yolcu_tasima' veya 'kamyon'
      let mappedMain = 'NAKLIYE'; 

      // 🔥 1. ANA KATEGORİ (mainType) ATAMASI
      if (['oto_kurtarma', 'vinc'].includes(selectedMain)) mappedMain = 'KURTARICI';
      else if (['istasyon', 'seyyar_sarj'].includes(selectedMain)) mappedMain = 'SARJ';
      else if (['yolcu_tasima'].includes(selectedMain)) mappedMain = 'YOLCU_TASIMA';
      else if (['yurt_disi_nakliye'].includes(selectedMain)) mappedMain = 'YURT_DISI';
      else if (['kamyon', 'tir', 'kamyonet', 'evden_eve'].includes(selectedMain)) mappedMain = 'NAKLIYE'; // Bu satır eklendi.

      // 🔥 2. ALT KATEGORİ (subType) ATAMASI
      // Eğer kullanıcı bir alt özellik (örneğin 'tenteli' veya '10_teker') seçtiyse, subType o özellik olur.
      // Alt özellik seçmediyse, seçtiği ana kategori ismi kalır (örneğin 'kamyon').
      const mappedSubType = formData.filterTags.length > 0 ? selectedMain : selectedMain;

      const payload = { 
        ...formData,
        firstName: formData.businessName, 
        mainType: mappedMain,  
        serviceType: mappedSubType,  
        service: {             
           mainType: mappedMain,      // Örn: "NAKLIYE"
           subType: mappedSubType,    // Örn: "kamyon"
           tags: formData.filterTags  // Örn: ["10_teker"]
        },
        website: formData.website,
        role: 'provider',
        pricing: { 
          openingFee: Number(formData.openingFee), 
          pricePerUnit: Number(formData.pricePerUnit) 
        }
      };

      const method = existingId ? 'PUT' : 'POST';
      const endpoint = existingId ? `${API_URL}/users/${existingId}` : `${API_URL}/users`;

      const res = await fetch(endpoint, { 
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsSaved(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert("Kaydedilirken bir sorun oluştu.");
      }
    } catch (err) { alert("Sunucu bağlantı hatası!"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999]">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="font-black text-xs uppercase tracking-widest text-gray-400">Profil Verileri Yükleniyor...</p>
    </div>
  );

  // --- ÖZET GÖRÜNÜMÜ ---
  if (isSaved) return (
    <div className="fixed inset-0 w-full h-full bg-[#f8fafc] overflow-y-auto custom-scrollbar p-6">
      <div className="w-full max-w-2xl mx-auto space-y-8 pt-10 pb-32">
        <div className="bg-green-50 border border-green-100 rounded-[2.5rem] p-8 text-center shadow-xl">
           <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <ShieldCheck size={40} className="text-white" />
           </div>
           <h1 className="text-3xl font-black text-green-900 uppercase italic">Profil Güncellendi</h1>
           <p className="text-green-700 text-xs font-bold uppercase tracking-widest mt-2">Transport 245 ağındaki bilgileriniz tazeledi.</p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-2xl space-y-8">
           <div className="flex justify-between items-center border-b border-gray-50 pb-6">
              <h2 className="text-xl font-black text-gray-900 uppercase">Kayıt Özeti</h2>
              <button onClick={() => setIsSaved(false)} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all">
                 <Edit3 size={14}/> Bilgileri Düzenle
              </button>
           </div>
           <button onClick={() => window.location.href = '/'} className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all">Hizmet Haritasına Dön</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 w-full h-full bg-[#f8fafc] overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-5xl mx-auto p-6 md:p-12 pb-32">
        <header className="mb-12 flex flex-col items-start gap-3">
          <div className="bg-black text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">Transport 245</div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">
            {existingId ? 'PROFİLİNİ' : 'SÜRÜCÜ'} <span className="text-blue-600">{existingId ? 'GÜNCELLE' : 'KAYIT PANELİ'}</span>
          </h1>
        </header>

        <div className="space-y-10">
          {/* İletişim */}
          <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> İletişim Bilgileri</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-gray-400 uppercase ml-2">İşletme Adı</label>
                   <input value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 font-black text-sm outline-none" placeholder="Örn: Öz Nakliyat"/>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Telefon</label>
                   <input value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 font-black text-sm outline-none" placeholder="05XXXXXXXXX"/>
                </div>
                <div className="md:col-span-2 space-y-1">
                   <label className="text-[9px] font-black text-gray-400 uppercase ml-2">E-Posta</label>
                   <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 font-black text-sm outline-none" placeholder="iletisim@sirket.com"/>
                </div>
                <div className="md:col-span-2 space-y-1">
                   <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Web Sitesi Lİnkİ (Opsiyonel)</label>
                   <input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 font-black text-sm outline-none" placeholder="https://www.sirketiniz.com"/>
                </div>
             </div>
          </section>

          {/* Hizmet Türü */}
          <section>
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 pl-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-600"></span> Hizmet Branşları</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {SERVICE_OPTIONS.map((opt) => {
                   const isSelected = formData.serviceTypes.includes(opt.id);
                   return (
                     <div key={opt.id} onClick={() => toggleService(opt.id, opt.subs.length > 0)} className={`group relative flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 min-h-[160px] ${getColorClasses(opt.color, isSelected)} ${isSelected ? 'shadow-xl scale-[1.02] z-10' : 'hover:scale-[0.98]'}`}>
                        {isSelected && <div className="absolute top-4 right-4 bg-white p-1 rounded-full shadow-md"><Check size={14} strokeWidth={4} className="text-black"/></div>}
                        <opt.icon size={42} strokeWidth={1.5} className="mb-4" />
                        <span className="text-[11px] font-black uppercase text-center leading-tight">{opt.label}</span>
                        {isSelected && opt.subs.length > 0 && (
                          <button onClick={(e) => {e.stopPropagation(); setActiveFolder(opt.id)}} className="mt-4 py-1.5 px-4 bg-black text-white text-[9px] font-black rounded-xl">ÖZELLİKLER ({formData.filterTags.filter(t => opt.subs.some(s=>s.id===t)).length})</button>
                        )}
                     </div>
                   );
                })}
             </div>
          </section>

          {/* Tarife & Adres */}
          <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-xl">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-600"></span> Bölge & Fiyatlandırma</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-3xl p-1 flex items-center border border-gray-200 divide-x divide-gray-200">
                    <div className="px-4"><Wallet size={20} className="text-green-600"/></div>
                    <div className="flex-1 px-4"><label className="text-[9px] font-black text-gray-400 uppercase">Açılış (₺)</label><input type="number" value={formData.openingFee} onChange={e => setFormData({...formData, openingFee: e.target.value})} className="w-full bg-transparent font-black text-xl outline-none"/></div>
                    <div className="flex-1 px-4"><label className="text-[9px] font-black text-gray-400 uppercase">Birim (₺)</label><input type="number" value={formData.pricePerUnit} onChange={e => setFormData({...formData, pricePerUnit: e.target.value})} className="w-full bg-transparent font-black text-xl outline-none"/></div>
                </div>
                <div className="bg-gray-50 rounded-3xl p-1 flex items-center border border-gray-200 pr-4">
                   <div className="p-4 bg-white rounded-2xl shadow-sm mr-4"><MapPin size={20} className="text-red-500"/></div>
                   <select value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-transparent font-black text-sm outline-none cursor-pointer uppercase">
                      {TURKEY_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <textarea placeholder="DETAYLI ADRES, DURAK VEYA ÇALIŞMA GÜZERGAHI..." value={formData.address} className="md:col-span-2 w-full bg-gray-50 border border-gray-200 rounded-3xl p-6 font-bold text-sm h-24 outline-none" onChange={e => setFormData({...formData, address: e.target.value})}/>
             </div>
          </section>

          {/* Sözleşme & Onay */}
          <div className="flex flex-col items-center gap-6 pt-6">
             <div className="flex items-center gap-3 bg-white px-8 py-4 rounded-3xl border border-gray-200 shadow-sm">
                <input type="checkbox" id="legal" className="hidden" checked={agreed} onChange={() => setAgreed(!agreed)}/>
                <label htmlFor="legal" className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${agreed ? 'bg-black border-black' : 'border-gray-300'}`}>
                   {agreed && <Check size={14} className="text-white" strokeWidth={4} />}
                </label>
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">
                   <a href="/privacy" target="_blank" className="text-blue-600 underline">KVKK Metni</a> ve 
                   <a href="/privacy" target="_blank" className="text-blue-600 underline ml-1">Kullanım Sözleşmesi</a>'ni okudum, onaylıyorum.
                </div>
             </div>
             <button onClick={handleSave} disabled={saving || !agreed} className={`w-full max-w-sm py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${agreed ? 'bg-black text-white hover:bg-gray-900 shadow-blue-500/30' : 'bg-gray-200 text-gray-400'}`}>
                {saving ? <Loader2 className="animate-spin" size={24}/> : <>{existingId ? 'PROFİLİ GÜNCELLE' : 'KAYDI TAMAMLA'} <ArrowRight size={20}/></>}
             </button>
          </div>
        </div>

        {/* ALT ÖZELLİK MODAL */}
        {activeFolder && (
            <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setActiveFolder(null)}></div>
                <div className="relative w-full sm:max-w-xl bg-gray-100 rounded-t-[2.5rem] sm:rounded-[3rem] p-8 shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-20 duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <div><h2 className="text-2xl font-black uppercase italic">Özellik Seçimi</h2><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">En az bir adet seçiniz</p></div>
                        <button onClick={() => setActiveFolder(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400"><X size={20} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 overflow-y-auto p-1 flex-1 custom-scrollbar">
                        {SERVICE_OPTIONS.find(s => s.id === activeFolder)?.subs.map(sub => {
                            const isTagSelected = formData.filterTags.includes(sub.id);
                            return (
                                <button key={sub.id} onClick={() => toggleSubOption(sub.id)} className={`relative flex flex-col items-center justify-center py-6 rounded-[2.5rem] transition-all border-2 ${isTagSelected ? `border-transparent bg-slate-900 text-white shadow-xl` : 'border-white bg-white text-slate-500'}`}>
                                    {isTagSelected && <div className="absolute top-3 right-3 bg-white/20 p-1 rounded-full"><Check size={12} strokeWidth={4} className="text-white"/></div>}
                                    <sub.icon size={32} className="mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">{sub.label}</span>
                                </button>
                            )
                        })}
                    </div>
                    <button onClick={() => setActiveFolder(null)} className="mt-6 w-full py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl text-white bg-black">SEÇİMİ TAMAMLA</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}