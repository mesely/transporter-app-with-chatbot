/**
 * @file profile/page.tsx
 * @description Transport 245 Driver Profile & Registration.
 * FIX: Özellikler modalına kapatma (X) butonu eklendi ve dışarı tıklayınca kapanma özelliği stabilize edildi.
 * FIX: Branş seçildiğinde alt özellikler modalı otomatik açılır.
 * FIX: Seçili branşa tekrar tıklandığında seçim kaldırılır (deselect).
 * FIX: Telefon numarası çakışmasında onay verilirse, mevcut kaydı girdiğiniz bilgilerle anında günceller.
 * FIX: 'evden_eve' mainType 'NAKLIYE' yapıldı.
 * FIX: Google Maps Geocoding API ve koordinat kontrolleri korundu.
 * UPDATE: Arka plan #8ccde6 rengine çevrildi, tasarıma Glassmorphism eklendi. Seçili olmayan ikonlar turkuaz rengine çevrildi.
 * UPDATE: Sözleşme ve KVKK aynı sayfada klasör yapısı gibi açılır. İşletme Adı → İşletme veya Şahıs Adı.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Loader2, ShieldCheck, X, Anchor, CarFront,
  Zap, Globe, Home, Package, Container,
  Snowflake, Box, Layers, Archive, Check, Settings2, Wallet,
  ArrowRight, Users, Bus, Crown, LocateFixed,
  Truck, ChevronDown, ChevronUp, FileText, Shield, Image as ImageIcon
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';
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
  { id: 'istasyon', label: 'İSTASYON', icon: Zap, color: 'blue', subs: [] },
  { id: 'seyyar_sarj', label: 'MOBİL ŞARJ', icon: Zap, color: 'cyan', subs: [] },
];

const getColorClasses = (colorName: string, isSelected: boolean) => {
  const base: any = {
    red:    isSelected ? 'bg-red-700 text-white border-transparent' : 'bg-white/60 text-[#00c5c0] border-white/40',
    rose:   isSelected ? 'bg-rose-700 text-white border-transparent' : 'bg-white/60 text-[#00c5c0] border-white/40',
    indigo: isSelected ? 'bg-indigo-700 text-white border-transparent' : 'bg-white/60 text-[#00c5c0] border-white/40',
    violet: isSelected ? 'bg-violet-700 text-white border-transparent' : 'bg-white/60 text-[#00c5c0] border-white/40',
    purple: isSelected ? 'bg-purple-700 text-white border-transparent' : 'bg-white/60 text-[#00c5c0] border-white/40',
    fuchsia: isSelected ? 'bg-fuchsia-700 text-white border-transparent' : 'bg-white/60 text-[#00c5c0] border-white/40',
    pink:   isSelected ? 'bg-pink-700 text-white border-transparent' : 'bg-white/60 text-[#00c5c0] border-white/40',
    blue:   isSelected ? 'bg-blue-700 text-white border-transparent' : 'bg-white/60 text-[#00c5c0] border-white/40',
    cyan:   isSelected ? 'bg-cyan-600 text-white border-transparent' : 'bg-white/60 text-[#00c5c0] border-white/40',
    emerald: isSelected ? 'bg-emerald-700 text-white border-transparent' : 'bg-white/60 text-[#00c5c0] border-white/40',
  };
  return base[colorName] || base.blue;
};

// --- KVKK ve Sözleşme içerikleri ---
const KVKK_SECTIONS = [
  { h: "1. Veri Sorumlusu", p: "Kişisel verileriniz, mobil uygulamanın işletmecisi olan Platform (Transport 245) tarafından, 6698 sayılı KVKK'ya uygun olarak işlenmektedir." },
  { h: "2. İşlenen Kişisel Veriler", p: "Uygulama kapsamında şu veriler işlenir: Kimlik, İletişim, Profil, Kullanım kayıtları ve Konum bilgisi. Ödeme bilgileri Apple/Google üzerinden işlenir, Platform tarafından saklanmaz." },
  { h: "3. İşlenme Amaçları", p: "Verileriniz; hizmetlerin sunulması, hesap güvenliği, eşleştirme, talep yönetimi ve hukuki yükümlülükler amacıyla işlenir." },
  { h: "4. Verilerin Aktarılması", p: "Kişisel veriler; yasal yükümlülükler kapsamında kamu kurumlarına aktarılabilir. Üçüncü kişilere satılmaz veya ticari amaçla paylaşılmaz." },
  { h: "5. Saklama Süresi", p: "Veriler, işlenme amacının gerektirdiği süre ve yasal saklama süreleri boyunca muhafaza edilir. Hesap silindiğinde, yasal zorunluluk dışındaki veriler silinir." },
  { h: "6. Haklarınız (Madde 11)", p: "Verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme ve silinmesini isteme haklarına sahipsiniz." },
];

const AGREEMENT_SECTIONS = [
  { h: "1. Platformun Niteliği", p: "Transport 245, kullanıcılar ile hizmet sağlayıcıları bir araya getiren aracı bir teknoloji platformudur. Hizmetlerin doğrudan sağlayıcısı değildir." },
  { h: "2. Kullanım Koşulları", p: "Kullanıcı, uygulamayı hukuka ve genel ahlaka uygun kullanacağını kabul eder." },
  { h: "3. Ücretlendirme (ÖNEMLİ)", p: "İlk kayıt tarihinden itibaren 12 ay ÜCRETSİZDİR. Ücretsiz sürenin sonunda yıllık abonelik (1 USD) gereklidir. Ödemeler App Store / Google Play üzerinden yapılır." },
  { h: "4. Gizlilik ve Hesap Silme", p: "Kullanıcı verileri KVKK metnine uygun korunur. Dilediğiniz zaman hesabınızı silebilirsiniz." },
  { h: "5. Yürürlük", p: "Uygulamayı kullanmaya başlamanız, bu sözleşme hükümlerini okuduğunuz ve kabul ettiğiniz anlamına gelir." },
];

const normalizeString = (str: string) => str ? str.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase().trim() : '';

export default function ProfilePage() {
  type VehicleEntry = { name: string; photoUrls: string[] };
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [cityData, setCityData] = useState<Record<string, string[]>>({});
  const [showLegalContent, setShowLegalContent] = useState(false);
  const [legalTab, setLegalTab] = useState<'kvkk' | 'sozlesme'>('kvkk');
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeVehicleIndex, setActiveVehicleIndex] = useState<number>(0);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [lastAddressKey, setLastAddressKey] = useState('');
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [formData, setFormData] = useState({
    businessName: '', email: '', phoneNumber: '', serviceTypes: [] as string[],
    city: 'İstanbul', district: 'Tuzla', streetAddress: '',
    filterTags: [] as string[], pricePerUnit: '40', website: '',
    taxNumber: '',
    vehicleItems: [{ name: '', photoUrls: [] }] as VehicleEntry[],
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

  const normalizePhone = (value: string) => value.replace(/\D/g, '');
  const normalizeAddressKey = (street: string, district: string, city: string) =>
    `${String(street || '').trim().toLocaleLowerCase('tr')}|${String(district || '').trim().toLocaleLowerCase('tr')}|${String(city || '').trim().toLocaleLowerCase('tr')}`;

  const handlePhoneLookup = async () => {
    const phone = normalizePhone(formData.phoneNumber);
    if (phone.length < 10) return;
    setCheckingPhone(true);
    try {
      const res = await fetch(`${API_URL}/users/by-phone?phone=${phone}`);
      if (!res.ok) return;
      const found = await res.json();
      if (!found?._id) return;

      const addrText = typeof found.address === 'string'
        ? found.address
        : (found.address?.fullText || '');
      const mainAddress = addrText.split(',')[0]?.trim() || '';
      const foundCoords = Array.isArray(found?.location?.coordinates) && found.location.coordinates.length === 2
        ? { lng: Number(found.location.coordinates[0]), lat: Number(found.location.coordinates[1]) }
        : null;

      setExistingId(found._id);
      setFormData(prev => ({
        ...prev,
        businessName: found.businessName || prev.businessName,
        email: found.email || prev.email,
        phoneNumber: found.phoneNumber || prev.phoneNumber,
        serviceTypes: [found.service?.subType || found.serviceType || prev.serviceTypes[0]].filter(Boolean) as string[],
        city: found.address?.city || found.city || prev.city,
        district: found.address?.district || found.district || prev.district,
        streetAddress: mainAddress || prev.streetAddress,
        filterTags: found.service?.tags || [],
        website: found.website || found.link || prev.website,
        pricePerUnit: String(found.pricing?.pricePerUnit || prev.pricePerUnit),
        taxNumber: found.taxNumber || prev.taxNumber,
        vehicleItems: Array.isArray(found.vehicleItems) && found.vehicleItems.length > 0
          ? found.vehicleItems
          : [{
              name: found.vehicleInfo || '',
              photoUrls: found.vehiclePhotos || (found.photoUrl ? [found.photoUrl] : [])
            }],
      }));
      setLastAddressKey(normalizeAddressKey(mainAddress, found.address?.district || found.district || '', found.address?.city || found.city || ''));
      setLastCoords(foundCoords);
    } catch {
      // sessiz fail
    } finally {
      setCheckingPhone(false);
    }
  };

  const handlePhotoUpload = async (vehicleIndex: number, file: File) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch(`${API_URL}/upload/vehicle-photo`, {
        method: 'POST',
        body: fd
      });
      if (!res.ok) {
        let message = 'Fotoğraf yüklenemedi.';
        try {
          const err = await res.json();
          message = err?.message || message;
        } catch {
          // noop
        }
        throw new Error(message);
      }
      const data = await res.json();
      const url = data.url || '';
      if (url) {
        setFormData(prev => ({
          ...prev,
          vehicleItems: prev.vehicleItems.map((v, i) => i === vehicleIndex
            ? { ...v, photoUrls: [...(v.photoUrls || []), url] }
            : v
          )
        }));
      }
    } catch (error: any) {
      alert(error?.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addVehicleRow = () => {
    setFormData(prev => ({ ...prev, vehicleItems: [...prev.vehicleItems, { name: '', photoUrls: [] }] }));
    setActiveVehicleIndex(formData.vehicleItems.length);
  };

  const removeVehicleRow = (index: number) => {
    setFormData(prev => {
      const next = prev.vehicleItems.filter((_, i) => i !== index);
      return { ...prev, vehicleItems: next.length ? next : [{ name: '', photoUrls: [] }] };
    });
    setActiveVehicleIndex(0);
  };

  const handleRemoveFromList = async () => {
    if (!existingId) return;
    if (!confirm('Aracınızı listeden kaldırmak istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/users/self/${existingId}`, { method: 'DELETE' });
      if (res.ok) {
        setExistingId(null);
        setIsSaved(false);
        setFormData({
          businessName: '', email: '', phoneNumber: '', serviceTypes: [],
          city: 'İstanbul', district: 'Tuzla', streetAddress: '',
          filterTags: [], pricePerUnit: '40', website: '', taxNumber: '',
          vehicleItems: [{ name: '', photoUrls: [] }]
        });
        alert('Kayıt kaldırıldı.');
      }
    } catch {
      alert('Kaldırma işlemi başarısız.');
    }
  };

  const handleSave = async () => {
    if (!agreed) return alert("Hizmet şartlarını onaylayın.");
    if (formData.businessName.length < 2) return alert("İşletme veya şahıs adı girin.");
    if (formData.serviceTypes.length === 0) return alert("Branş seçin.");
    if (!String(formData.taxNumber || '').trim()) return alert("Vergi levhası bilgisi zorunludur.");

    let targetId = existingId;
    let finalMethod = existingId ? 'PUT' : 'POST';

    if (!existingId) {
      try {
        const resCheck = await fetch(`${API_URL}/users/by-phone?phone=${normalizePhone(formData.phoneNumber)}`);
        const found = await resCheck.json();
        if (found?._id) {
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
      const extraServiceTypes = formData.serviceTypes.slice(1);
      let mappedMain = 'NAKLIYE';
      if (['oto_kurtarma', 'vinc'].includes(selected)) mappedMain = 'KURTARICI';
      else if (['istasyon', 'seyyar_sarj'].includes(selected)) mappedMain = 'SARJ';
      else if (['yolcu_tasima', 'minibus', 'otobus', 'midibus', 'vip_tasima'].includes(selected)) mappedMain = 'YOLCU';
      else if (['yurt_disi_nakliye'].includes(selected)) mappedMain = 'YURT_DISI';
      else if (['kamyon', 'tir', 'kamyonet', 'evden_eve'].includes(selected)) mappedMain = 'NAKLIYE';

      const currentAddressKey = normalizeAddressKey(formData.streetAddress, formData.district, formData.city);
      const shouldReuseCoords = Boolean(existingId) && currentAddressKey === lastAddressKey && lastCoords;
      let coords = shouldReuseCoords ? lastCoords : null;
      if (!coords) {
        const combined = `${formData.streetAddress}, ${formData.district}, ${formData.city}, Türkiye`;
        coords = await getCoordinatesFromAddress(combined) || await getCoordinatesFromAddress(`${formData.district}, ${formData.city}, Türkiye`);
      }

      if (!coords) { setSaving(false); return alert("Adres bulunamadı."); }

      const cleanVehicleItems = formData.vehicleItems
        .map(v => ({
          name: String(v.name || '').trim(),
          photoUrls: Array.isArray(v.photoUrls) ? v.photoUrls.filter(Boolean) : []
        }))
        .filter(v => v.name || v.photoUrls.length > 0);
      const flatPhotos = cleanVehicleItems.flatMap(v => v.photoUrls);

      const payload = {
        ...formData, firstName: formData.businessName, mainType: mappedMain, serviceType: selected,
        service: {
          mainType: mappedMain,
          subType: selected,
          tags: Array.from(new Set([...(formData.filterTags || []), ...extraServiceTypes])),
        },
        address: `${formData.streetAddress}, ${formData.district}, ${formData.city}`,
        city: formData.city, district: formData.district, role: 'provider',
        isVerified: true,
        pricing: { pricePerUnit: Number(formData.pricePerUnit) },
        taxNumber: String(formData.taxNumber || '').trim(),
        vehicleItems: cleanVehicleItems,
        vehicleInfo: cleanVehicleItems.map(v => v.name).filter(Boolean).join(', '),
        photoUrl: flatPhotos[0] || '',
        vehiclePhotos: flatPhotos,
        location: { type: "Point", coordinates: [coords.lng, coords.lat] }, lat: coords.lat, lng: coords.lng
      };

      const endpoint = targetId ? `${API_URL}/users/${targetId}` : `${API_URL}/users`;
      const res = await fetch(endpoint, { method: finalMethod, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (res.ok) {
        const data = await res.json();
        setExistingId(data._id || (data.provider && data.provider._id) || targetId);
        setLastAddressKey(currentAddressKey);
        setLastCoords({ lat: coords.lat, lng: coords.lng });
        setIsSaved(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else { alert("Kaydedilemedi."); }
    } catch { alert("Hata!"); } finally { setSaving(false); }
  };

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-[#8ccde6] z-[9999] font-black text-xs uppercase text-gray-800"><Loader2 className="animate-spin mr-2"/> Yükleniyor...</div>;

  if (isSaved) return (
    <div className="fixed inset-0 w-full h-full bg-[#8ccde6] overflow-y-auto p-6 text-center text-gray-900">
      <div className="max-w-2xl mx-auto space-y-8 pt-10">
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-10 rounded-[3rem] shadow-xl"><ShieldCheck size={60} className="text-green-600 mx-auto mb-4" /><h1 className="text-3xl font-black uppercase text-green-900">Profil Güncellendi</h1></div>
        <button onClick={() => window.location.href = '/'} className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-transform">Haritaya Dön</button>
        <button onClick={() => setIsSaved(false)} className="text-gray-800 font-black text-xs uppercase underline hover:text-black transition-colors">Bilgileri Tekrar Düzenle</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 w-full h-full bg-[#8ccde6] overflow-y-auto p-6 text-gray-900">
      <div className="w-full max-w-5xl mx-auto space-y-10 pb-32">
        <header><div className="bg-black text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase w-fit mb-3 shadow-md">Transport 245</div><h1 className="text-4xl font-black uppercase italic text-gray-900 drop-shadow-sm">{existingId ? 'GÜNCELLE' : 'KAYIT PANELİ'}</h1></header>

        <section className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/50 grid grid-cols-1 md:grid-cols-2 gap-6">
           <input value={formData.businessName} onChange={e=>setFormData({...formData, businessName: e.target.value})} className="bg-white/50 backdrop-blur-sm border border-white/40 p-5 rounded-2xl font-black text-sm outline-none placeholder-[#00c5c0] text-[#3d686b] focus:bg-white/80 transition-colors" placeholder="İşletme veya Şahıs Adı"/>
           <div className="flex gap-2">
             <input
               value={formData.phoneNumber}
               onChange={e=>setFormData({...formData, phoneNumber: e.target.value})}
               onBlur={handlePhoneLookup}
               className="flex-1 bg-white/50 backdrop-blur-sm border border-white/40 p-5 rounded-2xl font-black text-sm outline-none placeholder-[#00c5c0] text-[#3d686b] focus:bg-white/80 transition-colors"
               placeholder="Tel (05...)"
             />
             <button
               type="button"
               onClick={handlePhoneLookup}
               className="px-4 rounded-2xl bg-black text-white text-[10px] font-black uppercase"
             >
               {checkingPhone ? '...' : 'Sorgula'}
             </button>
           </div>
           <input value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="bg-white/50 backdrop-blur-sm border border-white/40 p-5 rounded-2xl font-black text-sm outline-none placeholder-[#00c5c0] text-[#3d686b] focus:bg-white/80 transition-colors md:col-span-2" placeholder="E-Posta"/>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
           {SERVICE_OPTIONS.map(opt=>{
             const isSelected = formData.serviceTypes.includes(opt.id);
             return (
               <div
                 key={opt.id}
                 onClick={() => {
                   if (isSelected) {
                     setFormData(prev => ({ ...prev, serviceTypes: prev.serviceTypes.filter((id) => id !== opt.id) }));
                   } else {
                     setFormData(prev => ({ ...prev, serviceTypes: [...prev.serviceTypes, opt.id] }));
                     if (opt.subs.length > 0) {
                       setActiveFolder(opt.id);
                     }
                   }
                 }}
                 className={`p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center shadow-md backdrop-blur-md ${isSelected ? getColorClasses(opt.color, true) : 'bg-white/60 border-white/40 text-[#00c5c0] hover:bg-white/80'}`}
               >
                  {opt.id === 'seyyar_sarj' ? (
                     <img src="/icons/GeziciIcon.png" className={`w-10 h-10 mb-4 object-contain ${isSelected ? 'invert brightness-200' : 'opacity-80'}`} style={!isSelected ? { filter: 'sepia(1) hue-rotate(130deg) saturate(3) brightness(0.8)' } : {}} alt="Mobil Şarj" />
                  ) : (
                     <opt.icon size={42} strokeWidth={1} className="mb-4" />
                  )}

                  <span className="text-[11px] font-black uppercase">{opt.label}</span>
                  {isSelected && opt.subs.length > 0 && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setActiveFolder(opt.id);
                      }}
                      className="mt-4 bg-black text-white px-4 py-1.5 rounded-xl text-[9px] font-black shadow-lg"
                    >
                      ÖZELLİKLER
                    </button>
                  )}
               </div>
             );
           })}
        </section>

        <section className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/50 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/40 shadow-sm">
            <label className="text-[8px] font-black uppercase text-[#00c5c0]">Birim Fiyat (km / kW)</label>
            <input type="number" value={formData.pricePerUnit} onChange={e=>setFormData({...formData, pricePerUnit: e.target.value})} className="w-full bg-transparent font-black text-xl outline-none text-[#3d686b]"/>
          </div>
          <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/40 shadow-sm">
            <label className="text-[8px] font-black uppercase text-[#00c5c0]">Vergi Levhası No (Zorunlu)</label>
            <input type="text" value={formData.taxNumber} onChange={e=>setFormData({...formData, taxNumber: e.target.value})} className="w-full bg-transparent font-bold text-sm outline-none text-[#3d686b]" placeholder="Vergi levhası no"/>
          </div>
          <div className="grid grid-cols-2 gap-4"><select value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className="bg-white/50 backdrop-blur-sm border border-white/40 p-5 rounded-2xl font-black text-xs outline-none focus:bg-white/80 transition-colors text-[#3d686b]">{Object.keys(cityData).map(c=><option key={c} value={c}>{c}</option>)}</select><select value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value})} className="bg-white/50 backdrop-blur-sm border border-white/40 p-5 rounded-2xl font-black text-xs outline-none focus:bg-white/80 transition-colors text-[#3d686b]">{availableDistricts.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
          <div className="bg-white/50 backdrop-blur-sm border border-white/40 p-4 rounded-2xl md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[8px] font-black uppercase text-[#00c5c0] block">Araçlar ve Fotoğraflar (Opsiyonel)</label>
              <button type="button" onClick={addVehicleRow} className="px-3 py-1 rounded-xl bg-black text-white text-[9px] font-black uppercase">Araç Ekle</button>
            </div>
            <div className="space-y-3">
              {formData.vehicleItems.map((vehicle, idx) => (
                <div key={idx} className="border border-white/40 rounded-2xl p-3 bg-white/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={vehicle.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vehicleItems: prev.vehicleItems.map((v, i) => i === idx ? { ...v, name: e.target.value } : v)
                      }))}
                      className="flex-1 bg-transparent font-bold text-xs outline-none text-[#3d686b]"
                      placeholder={`Araç ${idx + 1} (örn: 2020 Isuzu NPR)`}
                    />
                    <button type="button" onClick={() => removeVehicleRow(idx)} className="px-2 rounded-lg border border-red-200 text-red-600 text-[9px] font-black">Sil</button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e)=>{ const file = e.target.files?.[0]; if (file) { setActiveVehicleIndex(idx); handlePhotoUpload(idx, file); } }}
                      className="text-[10px] font-bold"
                    />
                    {uploadingPhoto && activeVehicleIndex === idx && <span className="text-[10px] font-black text-[#3d686b]">Yükleniyor...</span>}
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, pIdx) => {
                      const url = vehicle.photoUrls?.[pIdx];
                      if (url) {
                        return (
                          <div key={pIdx} className="relative h-10 rounded-lg overflow-hidden border border-white/50 bg-white/70">
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoUrl(url)}
                              className="w-full h-full"
                              title={`Fotoğraf ${pIdx + 1}`}
                            >
                              <img src={url} alt={`Araç fotoğrafı ${pIdx + 1}`} className="w-full h-full object-cover" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                vehicleItems: prev.vehicleItems.map((v, i) => i === idx
                                  ? { ...v, photoUrls: (v.photoUrls || []).filter((_, photoIdx) => photoIdx !== pIdx) }
                                  : v
                                )
                              }))}
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[8px] font-black"
                              aria-label="Fotoğrafı sil"
                            >
                              X
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div key={pIdx} className="h-10 rounded-lg border border-white/50 bg-white/50 flex items-center justify-center">
                          <ImageIcon size={12} className="text-gray-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <textarea placeholder="MAHALLE, SOKAK, CADDE..." value={formData.streetAddress} className="bg-white/50 backdrop-blur-sm border border-white/40 p-6 rounded-3xl font-bold text-sm h-24 outline-none md:col-span-2 placeholder-[#00c5c0] text-[#3d686b] focus:bg-white/80 transition-colors" onChange={e=>setFormData({...formData, streetAddress: e.target.value})}/>
        </section>

        {/* KVKK ve Sözleşme - Inline Klasör Yapısı */}
        <div className="flex flex-col gap-4">

          {/* Toggle Butonu */}
          <button
            type="button"
            onClick={() => setShowLegalContent(!showLegalContent)}
            className="flex items-center justify-between bg-white/60 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/50 shadow-md cursor-pointer hover:bg-white/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-[#00c5c0]" />
              <span className="text-[10px] font-black uppercase text-[#3d686b]">Sözleşme ve KVKK Metni</span>
            </div>
            {showLegalContent ? <ChevronUp size={18} className="text-[#00c5c0]" /> : <ChevronDown size={18} className="text-[#00c5c0]" />}
          </button>

          {/* Inline İçerik */}
          {showLegalContent && (
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2rem] overflow-hidden shadow-xl">

              {/* Tab Başlıkları */}
              <div className="flex border-b border-white/40">
                <button
                  onClick={() => setLegalTab('kvkk')}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${legalTab === 'kvkk' ? 'bg-white text-green-700 border-b-2 border-green-500' : 'text-[#3d686b] hover:bg-white/40'}`}
                >
                  <Shield size={14} /> KVKK
                </button>
                <button
                  onClick={() => setLegalTab('sozlesme')}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${legalTab === 'sozlesme' ? 'bg-white text-blue-700 border-b-2 border-blue-500' : 'text-[#3d686b] hover:bg-white/40'}`}
                >
                  <FileText size={14} /> Sözleşme
                </button>
              </div>

              {/* İçerik Alanı */}
              <div className="p-6 max-h-72 overflow-y-auto space-y-4 custom-scrollbar">
                {legalTab === 'kvkk' && KVKK_SECTIONS.map((s, i) => (
                  <div key={i}>
                    <h5 className="text-[9px] font-black uppercase text-green-700 mb-1 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-green-500 inline-block"></span> {s.h}
                    </h5>
                    <p className="text-[9px] text-gray-600 leading-relaxed pl-3 border-l border-green-200">{s.p}</p>
                  </div>
                ))}
                {legalTab === 'sozlesme' && AGREEMENT_SECTIONS.map((s, i) => (
                  <div key={i}>
                    <h5 className="text-[9px] font-black uppercase text-blue-700 mb-1 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-blue-500 inline-block"></span> {s.h}
                    </h5>
                    <p className="text-[9px] text-gray-600 leading-relaxed pl-3 border-l border-blue-200">{s.p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Onay Checkbox */}
          <label className="flex items-center gap-3 bg-white/60 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/50 shadow-md cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={()=>setAgreed(!agreed)} className="w-4 h-4"/>
            <span className="text-[10px] font-black uppercase text-[#3d686b]">
              Sözleşmeyi ve KVKK&apos;yı okudum, onaylıyorum.
            </span>
          </label>

          <button onClick={handleSave} disabled={saving || !agreed} className={`w-full max-w-sm mx-auto py-6 bg-black text-white rounded-[2.5rem] font-black uppercase text-sm flex items-center justify-center gap-3 active:scale-95 shadow-2xl transition-all ${(!agreed || saving) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-900'}`}>{saving ? <Loader2 className="animate-spin" size={24}/> : <>{existingId ? 'GÜNCELLEMEYİ TAMAMLA' : 'KAYDI TAMAMLA'} <ArrowRight size={20}/></>}</button>
          {existingId && (
            <button
              type="button"
              onClick={handleRemoveFromList}
              className="w-full max-w-sm mx-auto py-4 bg-red-50 border border-red-200 text-red-600 rounded-[2rem] font-black uppercase text-xs"
            >
              Aracımı Listeden Kaldır
            </button>
          )}
        </div>
      </div>

      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-[10020] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-[92vw] max-h-[82vh]" onClick={(e) => e.stopPropagation()}>
            <img src={previewPhotoUrl} alt="Araç fotoğrafı büyük önizleme" className="max-w-[92vw] max-h-[82vh] rounded-2xl object-contain border border-white/30 shadow-2xl" />
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-gray-800 font-black text-xs"
              aria-label="Kapat"
            >
              X
            </button>
          </div>
        </div>
      )}

      {activeFolder && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setActiveFolder(null)}></div>

          <div className="relative w-full sm:max-w-xl bg-white/80 backdrop-blur-2xl border border-white/50 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-10">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-black uppercase italic text-gray-900">Özellik Seçimi</h2>
               <button
                 onClick={() => setActiveFolder(null)}
                 className="w-10 h-10 bg-white/50 border border-white/60 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all active:scale-90"
               >
                 <X size={20} className="text-gray-600" />
               </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {SERVICE_OPTIONS.find(s=>s.id===activeFolder)?.subs.map(sub=>(
                <button key={sub.id} onClick={()=>setFormData({...formData, filterTags: formData.filterTags.includes(sub.id) ? formData.filterTags.filter(t=>t!==sub.id) : [...formData.filterTags, sub.id]})} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 shadow-sm ${formData.filterTags.includes(sub.id) ? 'bg-slate-900 text-white border-transparent shadow-lg scale-[1.02]' : 'bg-white/60 backdrop-blur-md border-white/40 text-[#00c5c0] hover:bg-white/80'}`}><sub.icon size={28}/><span className="text-[10px] font-black uppercase">{sub.label}</span></button>
              ))}
            </div>
            <button onClick={()=>setActiveFolder(null)} className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">SEÇİMİ TAMAMLA</button>
          </div>
        </div>
      )}
    </div>
  );
}
