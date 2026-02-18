/**
 * @file profile/page.tsx
 * @description Transport 245 Driver Profile & Registration.
 * FIX: Özellikler modalına kapatma (X) butonu eklendi ve dışarı tıklayınca kapanma özelliği stabilize edildi.
 * FIX: Branş seçildiğinde alt özellikler modalı otomatik açılır.
 * FIX: Seçili branşa tekrar tıklandığında seçim kaldırılır (deselect).
 * FIX: Telefon numarası çakışmasında onay verilirse, mevcut kaydı girdiğiniz bilgilerle anında günceller.
 * FIX: 'evden_eve' mainType 'NAKLIYE' yapıldı.
 * FIX: Google Maps Geocoding API ve koordinat kontrolleri korundu.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, ShieldCheck, X, Anchor, CarFront, 
  Zap, Navigation, Globe, Home, Package, Container,
  Snowflake, Box, Layers, Archive, Check, Settings2, Wallet, 
  ArrowRight, Users, Bus, Crown, LocateFixed,
  Truck
} from 'lucide-react';

const API_URL = process.env.BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';
const GOOGLE_MAPS_API_KEY = 'AIzaSyCbbq8XeceIkg99CEQui1-_09zMnDtglrk';

const SERVICE_OPTIONS = [
  { id: 'oto_kurtarma', label: 'OTO KURTARMA', icon: CarFront, color: 'red', subs: [] },
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
    red:    isSelected ? 'bg-red-700 text-white' : 'bg-white text-red-700 border-red-50',
    rose:   isSelected ? 'bg-rose-700 text-white' : 'bg-white text-rose-700 border-rose-50',
    indigo: isSelected ? 'bg-indigo-700 text-white' : 'bg-white text-indigo-700 border-indigo-50',
    violet: isSelected ? 'bg-violet-700 text-white' : 'bg-white text-violet-700 border-violet-50',
    purple: isSelected ? 'bg-purple-700 text-white' : 'bg-white text-purple-700 border-purple-50',
    fuchsia: isSelected ? 'bg-fuchsia-700 text-white' : 'bg-white text-fuchsia-700 border-fuchsia-50',
    pink:   isSelected ? 'bg-pink-700 text-white' : 'bg-white text-pink-700 border-pink-50',
    blue:   isSelected ? 'bg-blue-700 text-white' : 'bg-white text-blue-700 border-blue-50',
    cyan:   isSelected ? 'bg-cyan-600 text-white' : 'bg-white text-cyan-700 border-cyan-50',
    emerald: isSelected ? 'bg-emerald-700 text-white' : 'bg-white text-emerald-700 border-emerald-50',
  };
  return base[colorName] || base.blue;
};

const normalizeString = (str: string) => str ? str.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase().trim() : '';

export default function ProfilePage() {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false); 
  const [agreed, setAgreed] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [cityData, setCityData] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState({
    businessName: '', email: '', phoneNumber: '', serviceTypes: [] as string[],
    city: 'İstanbul', district: 'Tuzla', streetAddress: '', 
    filterTags: [] as string[], openingFee: '350', pricePerUnit: '40', website: '' 
  });

  useEffect(() => {
    fetch('/il_ilce.csv').then(res => res.text()).then(text => {
      const dataMap: any = {};
      text.split(/\r?\n/).forEach((line, i) => {
        if (i === 0 || !line.trim()) return;
        const [il, ilce] = line.split(',');
        if (il && ilce) {
          const cleanIl = il.trim();
          if (!dataMap[cleanIl]) dataMap[cleanIl] = [];
          dataMap[cleanIl].push(ilce.trim());
        }
      });
      setCityData(dataMap);
    }).finally(() => setLoading(false));
  }, []);

  const availableDistricts = useMemo(() => cityData[formData.city] || [], [formData.city, cityData]);

  useEffect(() => {
    if (availableDistricts.length > 0 && !availableDistricts.includes(formData.district)) {
      setFormData(prev => ({ ...prev, district: availableDistricts[0] }));
    }
  }, [formData.city, availableDistricts]);

  const getCoordinatesFromAddress = async (addr: string) => {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${GOOGLE_MAPS_API_KEY}&language=tr`);
      const data = await res.json();
      return data.status === 'OK' ? { lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng } : null;
    } catch { return null; }
  };

  const handleSave = async () => {
    if (!agreed) return alert("Hizmet şartlarını onaylayın.");
    if (formData.businessName.length < 2) return alert("İşletme adı girin.");
    if (formData.serviceTypes.length === 0) return alert("Branş seçin.");

    let targetId = existingId;
    let finalMethod = existingId ? 'PUT' : 'POST';

    if (!existingId) {
      try {
        const resCheck = await fetch(`${API_URL}/users/all?phoneNumber=${formData.phoneNumber}`);
        const all = await resCheck.json();
        const found = all.find((u: any) => u.phoneNumber === formData.phoneNumber);
        if (found) {
          if (confirm(`Bu numara zaten kayıtlı. Mevcut kaydı girdiğiniz yeni bilgilerle güncellemek istiyor musunuz?`)) {
            targetId = found._id;
            finalMethod = 'PUT';
          } else { return; }
        }
      } catch {}
    }

    setSaving(true);
    try {
      const selected = formData.serviceTypes[0];
      let mappedMain = 'NAKLIYE';
      if (['oto_kurtarma', 'vinc'].includes(selected)) mappedMain = 'OTO KURTARMA';
      else if (['istasyon', 'seyyar_sarj'].includes(selected)) mappedMain = 'SARJ';
      else if (['yolcu_tasima'].includes(selected)) mappedMain = 'YOLCU_TASIMA';
      else if (['yurt_disi_nakliye'].includes(selected)) mappedMain = 'YURT_DISI';
      else if (['kamyon', 'tir', 'kamyonet', 'evden_eve'].includes(selected)) mappedMain = 'NAKLIYE';

      const combined = `${formData.streetAddress}, ${formData.district}, ${formData.city}, Türkiye`;
      let coords = await getCoordinatesFromAddress(combined) || await getCoordinatesFromAddress(`${formData.district}, ${formData.city}, Türkiye`);

      if (!coords) { setSaving(false); return alert("Adres bulunamadı."); }

      const payload = {
        ...formData, firstName: formData.businessName, mainType: mappedMain, serviceType: selected,
        service: { mainType: mappedMain, subType: selected, tags: formData.filterTags },
        address: `${formData.streetAddress}, ${formData.district}, ${formData.city}`,
        city: formData.city, district: formData.district, role: 'provider',
        pricing: { openingFee: Number(formData.openingFee), pricePerUnit: Number(formData.pricePerUnit) },
        location: { type: "Point", coordinates: [coords.lng, coords.lat] }, lat: coords.lat, lng: coords.lng
      };

      const endpoint = targetId ? `${API_URL}/users/${targetId}` : `${API_URL}/users`;
      const res = await fetch(endpoint, { method: finalMethod, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (res.ok) {
        const data = await res.json();
        setExistingId(data._id || (data.provider && data.provider._id) || targetId);
        setIsSaved(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else { alert("Kaydedilemedi."); }
    } catch { alert("Hata!"); } finally { setSaving(false); }
  };

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999] font-black text-xs uppercase text-gray-400"><Loader2 className="animate-spin mr-2"/> Yükleniyor...</div>;

  if (isSaved) return (
    <div className="fixed inset-0 w-full h-full bg-[#f8fafc] overflow-y-auto p-6 text-center text-gray-900">
      <div className="max-w-2xl mx-auto space-y-8 pt-10">
        <div className="bg-green-50 p-10 rounded-[3rem] shadow-xl"><ShieldCheck size={60} className="text-green-500 mx-auto mb-4" /><h1 className="text-3xl font-black uppercase text-green-900">Profil Güncellendi</h1></div>
        <button onClick={() => window.location.href = '/'} className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase text-xs">Haritaya Dön</button>
        <button onClick={() => setIsSaved(false)} className="text-blue-600 font-black text-xs uppercase underline">Bilgileri Tekrar Düzenle</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 w-full h-full bg-[#f8fafc] overflow-y-auto p-6 text-gray-900">
      <div className="w-full max-w-5xl mx-auto space-y-10 pb-32">
        <header><div className="bg-black text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase w-fit mb-3">Transport 245</div><h1 className="text-4xl font-black uppercase italic">{existingId ? 'GÜNCELLE' : 'KAYIT PANELİ'}</h1></header>
        
        <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
           <input value={formData.businessName} onChange={e=>setFormData({...formData, businessName: e.target.value})} className="bg-gray-50 p-5 rounded-2xl font-black text-sm outline-none" placeholder="İşletme Adı"/>
           <input value={formData.phoneNumber} onChange={e=>setFormData({...formData, phoneNumber: e.target.value})} className="bg-gray-50 p-5 rounded-2xl font-black text-sm outline-none" placeholder="Tel (05...)"/>
           <input value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="bg-gray-50 p-5 rounded-2xl font-black text-sm outline-none md:col-span-2" placeholder="E-Posta"/>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
           {SERVICE_OPTIONS.map(opt=>{
             const isSelected = formData.serviceTypes.includes(opt.id);
             return (
               <div 
                 key={opt.id} 
                 onClick={() => {
                   if (isSelected) {
                     setFormData({ ...formData, serviceTypes: [], filterTags: [] });
                   } else {
                     setFormData({ ...formData, serviceTypes: [opt.id], filterTags: [] });
                     if (opt.subs.length > 0) {
                       setActiveFolder(opt.id);
                     }
                   }
                 }} 
                 className={`p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all flex flex-col items-center text-center ${isSelected ? getColorClasses(opt.color, true) : 'bg-white border-gray-50 text-gray-400'}`}
               >
                  <opt.icon size={42} className="mb-4" />
                  <span className="text-[11px] font-black uppercase">{opt.label}</span>
                  {isSelected && opt.subs.length > 0 && (
                    <button 
                      onClick={e => {
                        e.stopPropagation(); 
                        setActiveFolder(opt.id);
                      }} 
                      className="mt-4 bg-black text-white px-4 py-1 rounded-xl text-[9px] font-black"
                    >
                      ÖZELLİKLER
                    </button>
                  )}
               </div>
             );
           })}
        </section>

        <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-2xl border flex divide-x"><div className="flex-1 px-2"><label className="text-[8px] font-black uppercase text-gray-400">Açılış</label><input type="number" value={formData.openingFee} onChange={e=>setFormData({...formData, openingFee: e.target.value})} className="w-full bg-transparent font-black text-xl outline-none"/></div><div className="flex-1 px-2"><label className="text-[8px] font-black uppercase text-gray-400">Birim</label><input type="number" value={formData.pricePerUnit} onChange={e=>setFormData({...formData, pricePerUnit: e.target.value})} className="w-full bg-transparent font-black text-xl outline-none"/></div></div>
          <div className="grid grid-cols-2 gap-4"><select value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className="bg-gray-50 p-5 rounded-2xl font-black text-xs outline-none">{Object.keys(cityData).map(c=><option key={c} value={c}>{c}</option>)}</select><select value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value})} className="bg-gray-50 p-5 rounded-2xl font-black text-xs outline-none">{availableDistricts.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
          <textarea placeholder="MAHALLE, SOKAK, CADDE..." value={formData.streetAddress} className="bg-gray-50 p-6 rounded-3xl font-bold text-sm h-24 outline-none md:col-span-2" onChange={e=>setFormData({...formData, streetAddress: e.target.value})}/>
        </section>

        <div className="flex flex-col items-center gap-6">
          <label className="flex items-center gap-3 bg-white px-8 py-4 rounded-3xl border"><input type="checkbox" checked={agreed} onChange={()=>setAgreed(!agreed)}/><span className="text-[10px] font-black uppercase text-gray-600">Sözleşmeyi ve KVKK'yı onaylıyorum.</span></label>
          <button onClick={handleSave} disabled={saving || !agreed} className="w-full max-w-sm py-6 bg-black text-white rounded-[2.5rem] font-black uppercase text-sm flex items-center justify-center gap-3 active:scale-95 shadow-2xl transition-all">{saving ? <Loader2 className="animate-spin" size={24}/> : <>{existingId ? 'GÜNCELLEMEYİ TAMAMLA' : 'KAYDI TAMAMLA'} <ArrowRight size={20}/></>}</button>
        </div>
      </div>

      {activeFolder && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4">
          {/* 🔥 DIŞARI TIKLAYINCA KAPANMA ALANI */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setActiveFolder(null)}></div>
          
          <div className="relative w-full sm:max-w-xl bg-gray-100 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
            {/* 🔥 MODAL HEADER & KAPATMA BUTONU */}
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-black uppercase italic">Özellik Seçimi</h2>
               <button 
                 onClick={() => setActiveFolder(null)} 
                 className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-200 transition-all"
               >
                 <X size={20} className="text-gray-400" />
               </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {SERVICE_OPTIONS.find(s=>s.id===activeFolder)?.subs.map(sub=>(
                <button key={sub.id} onClick={()=>setFormData({...formData, filterTags: formData.filterTags.includes(sub.id) ? formData.filterTags.filter(t=>t!==sub.id) : [...formData.filterTags, sub.id]})} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${formData.filterTags.includes(sub.id) ? 'bg-slate-900 text-white border-transparent' : 'bg-white border-gray-100 text-gray-400'}`}><sub.icon size={28}/><span className="text-[10px] font-black uppercase">{sub.label}</span></button>
              ))}
            </div>
            <button onClick={()=>setActiveFolder(null)} className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">SEÇİMİ TAMAMLA</button>
          </div>
        </div>
      )}
    </div>
  );
}