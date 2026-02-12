'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, Phone, MapPin, Truck, 
  Loader2, ShieldCheck, X, Anchor, CarFront, 
  Zap, Navigation, Globe, Home, Package, Container,
  Snowflake, Box, Layers, Archive, Check, Settings2, Wallet, 
  ArrowRight, ChevronDown, Edit3, Save, RefreshCcw
} from 'lucide-react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

const TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
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
  };
  return base[colorName] || base.blue;
};

export default function ProfilePage() {
  const [isSaved, setIsSaved] = useState(false); // Kayıt bitti mi?
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: '', email: '', phoneNumber: '', serviceTypes: [] as string[],
    city: 'İzmir', address: '', filterTags: [] as string[],
    openingFee: '350', pricePerUnit: '40' 
  });

  const toggleService = (id: string, hasSubs: boolean) => {
    setFormData(prev => {
      const isSelected = prev.serviceTypes.includes(id);
      let newTypes = isSelected ? prev.serviceTypes.filter(t => t !== id) : [...prev.serviceTypes, id];
      let newTags = [...prev.filterTags];
      if (isSelected) {
        const config = SERVICE_OPTIONS.find(s => s.id === id);
        if (config?.subs) {
          const subIds = config.subs.map(s => s.id);
          newTags = newTags.filter(t => !subIds.includes(t));
        }
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
    if (!agreed) return alert("Hizmet şartlarını onaylayın.");
    const phoneRegex = /^0\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      return alert("Hatalı Telefon! Numaranız 0 ile başlamalı ve 11 haneli olmalıdır.");
    }
    if (formData.businessName.trim().length < 3) return alert("İşletme adı çok kısa.");

    setLoading(true);
    try {
      let mappedServiceType = formData.serviceTypes[0];
      if (mappedServiceType === 'yurt_disi_nakliye') mappedServiceType = 'YURT_DISI';
      else if (mappedServiceType === 'evden_eve') mappedServiceType = 'NAKLIYE';
      else if (mappedServiceType === 'oto_kurtarma') mappedServiceType = 'KURTARICI';

      const payload = { ...formData, serviceType: mappedServiceType, role: 'provider' };
      const res = await fetch(`${API_URL}/users`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsSaved(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert("Kaydedilirken hata oluştu.");
      }
    } catch (err) { alert("Bağlantı hatası!"); }
    finally { setLoading(false); }
  };

  // --- ÖZET GÖRÜNÜMÜ (Kayıt Sonrası) ---
  if (isSaved) return (
    <div className="fixed inset-0 w-full h-full bg-[#f8fafc] overflow-y-auto custom-scrollbar p-6">
      <div className="w-full max-w-2xl mx-auto space-y-8 pt-10 pb-32">
        <div className="bg-green-50 border border-green-100 rounded-[2.5rem] p-8 text-center shadow-xl animate-in zoom-in duration-500">
           <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
              <ShieldCheck size={40} className="text-white" />
           </div>
           <h1 className="text-3xl font-black text-green-900 uppercase italic">Kayıt Aktif Edildi</h1>
           <p className="text-green-700 text-xs font-bold uppercase tracking-widest mt-2">Bilgileriniz veri merkezine başarıyla iletildi.</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-2xl shadow-gray-200/50 space-y-8">
           <div className="flex justify-between items-center border-b border-gray-50 pb-6">
              <h2 className="text-xl font-black text-gray-900 uppercase">Kayıt Özeti</h2>
              <button onClick={() => setIsSaved(false)} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                 <Edit3 size={14}/> Bilgileri Düzenle
              </button>
           </div>

           <div className="grid grid-cols-1 gap-6">
              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">İşletme Bilgisi</label>
                 <div className="text-sm font-black text-gray-800 uppercase tracking-tight">{formData.businessName}</div>
                 <div className="text-[11px] font-bold text-gray-500 mt-1">{formData.phoneNumber} • {formData.email}</div>
              </div>

              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Hizmet Branşları</label>
                 <div className="flex flex-wrap gap-2">
                    {formData.serviceTypes.map(t => (
                      <span key={t} className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-[10px] font-black uppercase text-gray-700 shadow-sm">{t.replace('_',' ')}</span>
                    ))}
                    {formData.filterTags.map(tag => (
                      <span key={tag} className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-sm">{tag}</span>
                    ))}
                 </div>
              </div>

              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tarife & Bölge</label>
                 <div className="flex items-center gap-4 text-sm font-black text-gray-800 uppercase">
                    <span className="flex items-center gap-1.5"><Wallet size={16} className="text-green-600"/> ₺{formData.openingFee}</span>
                    <span className="flex items-center gap-1.5"><RefreshCcw size={16} className="text-blue-600"/> ₺{formData.pricePerUnit} / Birim</span>
                 </div>
                 <div className="text-[11px] font-bold text-gray-500 mt-3 flex items-center gap-1.5 uppercase"><MapPin size={14} className="text-red-500"/> {formData.city} / {formData.address}</div>
              </div>
           </div>

           <button onClick={() => window.location.href = '/'} className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-gray-900 active:scale-[0.98] transition-all">
              Hizmet Haritasına Dön
           </button>
        </div>
      </div>
    </div>
  );

  // --- KAYIT FORMU ---
  return (
    <div className="fixed inset-0 w-full h-full bg-[#f8fafc] overflow-y-auto custom-scrollbar touch-pan-y">
      <div className="w-full max-w-5xl mx-auto p-6 md:p-12 pb-32">
        <header className="mb-12 flex flex-col items-start gap-3">
          <div className="bg-black text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">Transporter 2026</div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">SÜRÜCÜ <span className="text-blue-600">KAYIT PANELİ</span></h1>
        </header>

        <div className="space-y-10">
          {/* İletişim Bilgileri */}
          <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> İletişim Bilgileri</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input placeholder="İŞLETME ADI" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 font-black text-sm outline-none"/>
                <input placeholder="TELEFON (05XXXXXXXXX)" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 font-black text-sm outline-none"/>
                <input placeholder="E-POSTA" value={formData.email} className="md:col-span-2 w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 font-black text-sm outline-none" onChange={e => setFormData({...formData, email: e.target.value})}/>
             </div>
          </section>

          {/* Hizmet Türü */}
          <section>
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 pl-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-600"></span> Hizmet Türü</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {SERVICE_OPTIONS.map((opt) => {
                   const isSelected = formData.serviceTypes.includes(opt.id);
                   return (
                     <div key={opt.id} onClick={() => toggleService(opt.id, opt.subs.length > 0)} className={`group relative flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 min-h-[180px] ${getColorClasses(opt.color, isSelected)} ${isSelected ? 'shadow-xl scale-[1.02] z-10' : 'hover:scale-[0.98]'}`}>
                        {isSelected && <div className="absolute top-4 right-4 bg-white p-1 rounded-full"><Check size={14} strokeWidth={4} className="text-black"/></div>}
                        <opt.icon size={48} strokeWidth={1.5} className="mb-4" />
                        <span className="text-sm font-black uppercase text-center leading-tight">{opt.label}</span>
                        {isSelected && opt.subs.length > 0 && (
                          <button onClick={(e) => {e.stopPropagation(); setActiveFolder(opt.id)}} className="mt-4 py-2 px-6 bg-black text-white text-[10px] font-black rounded-xl flex items-center gap-2">ÖZELLİK EKLE</button>
                        )}
                     </div>
                   );
                })}
             </div>
          </section>

          {/* Tarife & Adres */}
          <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-600"></span> Tarife & Adres Bilgisi</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-3xl p-1 flex items-center border border-gray-200 divide-x divide-gray-200">
                    <div className="px-4"><Wallet size={20} className="text-green-600"/></div>
                    <div className="flex-1 px-4"><label className="text-[9px] font-black text-gray-400 uppercase">Açılış</label><input type="number" value={formData.openingFee} onChange={e => setFormData({...formData, openingFee: e.target.value})} className="w-full bg-transparent font-black text-xl outline-none"/></div>
                    <div className="flex-1 px-4"><label className="text-[9px] font-black text-gray-400 uppercase">Birim</label><input type="number" value={formData.pricePerUnit} onChange={e => setFormData({...formData, pricePerUnit: e.target.value})} className="w-full bg-transparent font-black text-xl outline-none"/></div>
                </div>
                <div className="bg-gray-50 rounded-3xl p-1 flex items-center border border-gray-200 pr-4">
                   <div className="p-4 bg-white rounded-2xl shadow-sm mr-4"><MapPin size={20} className="text-blue-600"/></div>
                   <select value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-transparent font-black text-sm outline-none cursor-pointer uppercase">
                      {TURKEY_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <textarea placeholder="TAM ADRES VEYA GÜZERGAH..." value={formData.address} className="md:col-span-2 w-full bg-gray-50 border border-gray-200 rounded-3xl p-6 font-bold text-sm h-28 outline-none" onChange={e => setFormData({...formData, address: e.target.value})}/>
             </div>
          </section>

          <div className="flex flex-col items-center gap-6 pt-6">
             <label className="flex items-center gap-3 cursor-pointer group bg-white px-6 py-3 rounded-2xl border border-gray-200 shadow-sm">
                <input type="checkbox" className="hidden" checked={agreed} onChange={() => setAgreed(!agreed)}/>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${agreed ? 'bg-black border-black' : 'border-gray-300'}`}>
                   {agreed && <Check size={14} className="text-white" strokeWidth={4} />}
                </div>
                <span className="text-[10px] font-black text-gray-600 uppercase">Hizmet Şartlarını Onaylıyorum</span>
             </label>
             <button onClick={handleSave} disabled={loading || !agreed} className={`w-full max-w-sm py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${agreed ? 'bg-black text-white hover:bg-gray-900 shadow-blue-500/20' : 'bg-gray-200 text-gray-400'}`}>
                {loading ? <Loader2 className="animate-spin" size={24}/> : <>KAYDI TAMAMLA <ArrowRight size={20}/></>}
             </button>
          </div>
        </div>

        {/* ALT ÖZELLİK MODAL */}
        {activeFolder && SERVICE_OPTIONS.find(s => s.id === activeFolder) && (
            <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setActiveFolder(null)}></div>
                <div className="relative w-full sm:max-w-xl bg-gray-100 rounded-t-[2.5rem] sm:rounded-[3rem] p-8 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-gray-900 animate-in slide-in-from-bottom-20">
                    <div className="flex items-center justify-between mb-8">
                        <div><h2 className="text-2xl font-black uppercase italic">Özellik Seçimi</h2><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Çoklu seçim yapabilirsiniz</p></div>
                        <button onClick={() => setActiveFolder(null)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400"><X size={20} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 overflow-y-auto p-1 flex-1 custom-scrollbar">
                        {SERVICE_OPTIONS.find(s => s.id === activeFolder)?.subs.map(sub => {
                            const isTagSelected = formData.filterTags.includes(sub.id);
                            return (
                                <button key={sub.id} onClick={() => toggleSubOption(sub.id)} className={`relative flex flex-col items-center justify-center py-6 rounded-[2rem] transition-all border-2 ${isTagSelected ? `border-transparent bg-slate-900 text-white shadow-xl` : 'border-white bg-white text-slate-500'}`}>
                                    {isTagSelected && <div className="absolute top-3 right-3 bg-white/20 p-1 rounded-full"><Check size={12} strokeWidth={4} className="text-white"/></div>}
                                    <sub.icon size={32} className="mb-2" />
                                    <span className="text-xs font-black uppercase tracking-tight">{sub.label}</span>
                                </button>
                            )
                        })}
                    </div>
                    <button onClick={() => setActiveFolder(null)} className="mt-6 w-full py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl text-white bg-black active:scale-95">TAMAMLANDI</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}