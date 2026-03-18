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
  ArrowRight, LocateFixed
} from 'lucide-react';
import { mapProviderMainType, normalizeProviderServiceType, providerMatchesActionType } from '../../../utils/providerServices';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';

const TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

const SERVICE_IMAGE_ICONS: Record<string, string> = {
  seyyar_sarj: '/icons/GeziciIcon.png',
  kamyonet: '/icons/kamyonet.png',
  vinc: '/icons/vinc.png',
  lastik: '/icons/lastikci.png',
  tir: '/icons/tir.png',
};

const SERVICE_OPTIONS = [
  { id: 'oto_kurtarma', label: 'KURTARICI', icon: CarFront, color: 'bg-red-600', subs: [] },
  { id: 'vinc', label: 'VİNÇ', icon: Anchor, color: 'bg-rose-600', subs: [] },
  { id: 'lastikci', label: 'LASTİKÇİ', icon: Truck, color: 'bg-orange-600', subs: [] },
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

const getIconBadgeClass = (serviceId: string) => {
  if (['vinc', 'lastik', 'lastikci', 'oto_kurtarma'].includes(serviceId)) {
    return 'bg-rose-50 border border-rose-100';
  }
  if (['tir', 'kamyon', 'kamyonet', 'evden_eve', 'yurt_disi_nakliye'].includes(serviceId)) {
    return 'bg-violet-50 border border-violet-100';
  }
  return 'bg-white/90 border border-white/80';
};

const renderServiceIcon = (serviceId: string, sizeClass = 'w-6 h-6') => {
  const imageSrc = SERVICE_IMAGE_ICONS[serviceId];
  if (!imageSrc) return null;

  return (
    <img
      src={imageSrc}
      alt={serviceId}
      className={`${sizeClass} object-contain`}
    />
  );
};

export default function ProviderModule() {
  type VehicleEntry = { name: string; photoUrls: string[] };
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeVehicleIndex, setActiveVehicleIndex] = useState<number>(0);
  const [addressLocating, setAddressLocating] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [formData, setFormData] = useState<any>({
    _id: '', businessName: '', email: '', phoneNumber: '', city: 'İstanbul', district: 'Tuzla', address: '',
    serviceTypes: [] as string[], pricePerUnit: 40, filterTags: [] as string[], website: '',
    taxNumber: '', vehicleItems: [{ name: '', photoUrls: [] }] as VehicleEntry[]
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
      const res = await fetch(`${API_URL}/users/all?${query.toString()}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setProviders(
        filterType === 'Tümü'
          ? list
          : list.filter((provider) => providerMatchesActionType(provider?.service, provider?.serviceType, filterType))
      );
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
    const option = SERVICE_OPTIONS.find((s) => s.id === id);
    if (!option) return;
    const isSelected = formData.serviceTypes.includes(id);
    const allSubIds = SERVICE_OPTIONS.flatMap((service) => service.subs.map((sub) => sub.id));

    if (!isSelected) {
      setFormData((prev: any) => ({
        ...prev,
        serviceTypes: [id],
        filterTags: (prev.filterTags || []).filter((tag: string) => !allSubIds.includes(tag)),
      }));
      if (option.subs.length > 0) setActiveFolder(id);
      return;
    }

    const subIds = option.subs.map((sub) => sub.id);
    setFormData((prev: any) => ({
      ...prev,
      serviceTypes: [],
      filterTags: (prev.filterTags || []).filter((t: string) => !subIds.includes(t)),
    }));
    if (activeFolder === id) setActiveFolder(null);
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
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=tr&q=${encodeURIComponent(addr)}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const first = Array.isArray(data) ? data[0] : null;
      const lat = Number(first?.lat);
      const lng = Number(first?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    } catch { return null; }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=tr`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const addr = data?.address || {};
      return {
        city: String(addr.city || addr.town || addr.province || addr.state || '').trim(),
        district: String(addr.town || addr.suburb || addr.county || addr.city_district || '').trim(),
        address: [addr.road, addr.house_number].filter(Boolean).join(' ').trim() || String(data?.display_name || '').split(',').slice(0, 2).join(',').trim(),
      };
    } catch {
      return null;
    }
  };

  const useCurrentLocationForAddress = async () => {
    if (!navigator?.geolocation) {
      alert('Konum servisi desteklenmiyor.');
      return;
    }
    setAddressLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        })
      );
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setSelectedCoords(coords);
      const parsed = await reverseGeocode(coords.lat, coords.lng);
      if (parsed) {
        setFormData((prev: any) => ({
          ...prev,
          city: parsed.city || prev.city,
          district: parsed.district || prev.district,
          address: parsed.address || prev.address,
        }));
      }
    } catch {
      alert('Mevcut konum alınamadı.');
    } finally {
      setAddressLocating(false);
    }
  };

  const openEdit = (p: any) => {
    if(!p) return;
    const addr = p.address || {};
    const streetPart = (typeof p.address === 'string' ? p.address : addr.fullText || '').split(',')[0].trim();
    setFormData({
      _id: p._id, businessName: p.businessName || p.firstName || '', email: p.email || '', phoneNumber: p.phoneNumber || '',
      city: addr.city || 'İstanbul', district: addr.district || 'Tuzla', address: streetPart,
      serviceTypes: (() => {
        const tags: string[] = Array.isArray(p.service?.tags) ? p.service.tags : [];
        const fromTags = tags
          .filter((t) => String(t).startsWith('type:'))
          .map((t) => normalizeProviderServiceType(String(t).replace(/^type:/, '')))
          .filter(Boolean);
        if (fromTags.length > 0) return Array.from(new Set(fromTags));
        const fallback = normalizeProviderServiceType(p.service?.subType || p.serviceType || '');
        return fallback ? [fallback] : [];
      })(),
      pricePerUnit: p.pricing?.pricePerUnit || 40,
      filterTags: (Array.isArray(p.service?.tags) ? p.service.tags : []).filter((t: string) => !String(t).startsWith('type:')),
      website: p.website || p.link || '',
      taxNumber: p.taxNumber || '',
      vehicleItems: Array.isArray(p.vehicleItems) && p.vehicleItems.length > 0
        ? p.vehicleItems
        : [{
            name: p.vehicleInfo || '',
            photoUrls: p.vehiclePhotos || (p.photoUrl ? [p.photoUrl] : [])
          }]
    });
    const existingCoords = Array.isArray(p?.location?.coordinates) && p.location.coordinates.length === 2
      ? { lng: Number(p.location.coordinates[0]), lat: Number(p.location.coordinates[1]) }
      : null;
    setSelectedCoords(existingCoords);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!/^0\d{10}$/.test(formData.phoneNumber)) return alert("Hatalı Numara! 0 ile başlayan 11 hane girin.");
    if (formData.serviceTypes.length === 0) return alert("Hizmet türü seçiniz.");
    if (!String(formData.taxNumber || '').trim()) return alert('Vergi numarası zorunludur.');

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
      const normalizedServiceTypes = (formData.serviceTypes || []).map((s: string) => normalizeProviderServiceType(s)).filter(Boolean);
      const selected = normalizedServiceTypes[0];
      const mappedMain = mapProviderMainType(selected);

      const combined = `${formData.address}, ${formData.district}, ${formData.city}, Türkiye`;
      let coords = selectedCoords || await getCoordinatesFromAddress(combined) || await getCoordinatesFromAddress(`${formData.district}, ${formData.city}, Türkiye`);
      
      if (!coords) { setLoading(false); return alert("Adres haritada bulunamadı."); }

      const payload: any = {
        firstName: formData.businessName, businessName: formData.businessName, email: formData.email, phoneNumber: formData.phoneNumber,
        mainType: mappedMain, serviceType: selected,
        service: {
          mainType: mappedMain,
          subType: selected,
          tags: Array.from(new Set([...(formData.filterTags || []), ...normalizedServiceTypes.map((t: string) => `type:${t}`)])),
        },
        address: `${formData.address}, ${formData.district}, ${formData.city}`,
        city: formData.city, district: formData.district, role: 'provider', website: formData.website,
        pricing: { pricePerUnit: Number(formData.pricePerUnit) },
        taxNumber: formData.taxNumber,
        vehicleItems: formData.vehicleItems
          .map((v: VehicleEntry) => ({
            name: String(v.name || '').trim(),
            photoUrls: Array.isArray(v.photoUrls) ? v.photoUrls.filter(Boolean) : []
          }))
          .filter((v: VehicleEntry) => v.name || v.photoUrls.length > 0),
        isVerified: finalMethod === 'PUT' ? undefined : false,
        location: { type: "Point", coordinates: [coords.lng, coords.lat] },
        lat: coords.lat, lng: coords.lng
      };
      if (finalMethod === 'PUT') {
        delete payload.isVerified;
      }
      const cleanVehicleItems = payload.vehicleItems as VehicleEntry[];
      const flatPhotos = cleanVehicleItems.flatMap(v => v.photoUrls);
      payload.vehicleInfo = cleanVehicleItems.map(v => v.name).filter(Boolean).join(', ');
      payload.vehiclePhotos = flatPhotos;
      payload.photoUrl = flatPhotos[0] || '';

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

  const handlePhotoUpload = async (vehicleIndex: number, file: File) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch(`${API_URL}/upload/vehicle-photo`, { method: 'POST', body: fd });
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
      if (!url) return;
      setFormData((prev: any) => ({
        ...prev,
        vehicleItems: prev.vehicleItems.map((v: VehicleEntry, i: number) => i === vehicleIndex
          ? { ...v, photoUrls: [...(v.photoUrls || []), url] }
          : v
        )
      }));
    } catch (error: any) {
      alert(error?.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addVehicleRow = () => {
    setFormData((prev: any) => ({
      ...prev,
      vehicleItems: [...(prev.vehicleItems || []), { name: '', photoUrls: [] }]
    }));
    setActiveVehicleIndex((formData.vehicleItems || []).length);
  };

  const removeVehicleRow = (index: number) => {
    setFormData((prev: any) => {
      const next = (prev.vehicleItems || []).filter((_: VehicleEntry, i: number) => i !== index);
      return { ...prev, vehicleItems: next.length ? next : [{ name: '', photoUrls: [] }] };
    });
    setActiveVehicleIndex(0);
  };

  const currentFolderConfig = SERVICE_OPTIONS.find(s => s.id === activeFolder);

  return (
    <div className="w-full min-h-screen bg-white p-6 text-gray-900">
      <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">
            <img src="/apple-icon.png" alt="Transport 245" className="w-4 h-4 rounded-md object-cover" />
            Transport 245 Admin
          </div>
          <h1 className="text-4xl font-black uppercase text-gray-900">Hizmet Ağı <span className="text-slate-500">Yönetimi</span></h1>
        </div>
        <div className="flex gap-3">
          {selectedProviders.length > 0 && <button onClick={handleBulkDelete} className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-xs font-black uppercase text-white hover:bg-red-700"><Trash2 size={18}/> Sil ({selectedProviders.length})</button>}
          <button onClick={() => { setIsEditing(false); setSelectedCoords(null); setFormData({_id:'', businessName:'', email:'', phoneNumber:'', city:'İstanbul', district:'Tuzla', address:'', serviceTypes:[], pricePerUnit:40, filterTags:[], website:'', taxNumber: '', vehicleItems: [{ name: '', photoUrls: [] }]}); setShowModal(true); }} className="flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3 text-xs font-black uppercase text-white hover:bg-black"><Plus size={20}/> Yeni Kurum</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><Search className="ml-4 text-gray-500" size={20}/><input placeholder="İSİM/TEL ARA..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-transparent p-3 font-bold text-xs outline-none uppercase placeholder-gray-500 text-gray-900"/></div>
        <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><MapPin className="ml-4 text-gray-500" size={20}/><select value={filterCity} onChange={e=>setFilterCity(e.target.value)} className="w-full bg-transparent p-3 font-bold text-xs outline-none uppercase appearance-none cursor-pointer text-gray-900"><option value="Tümü">TÜM TÜRKİYE</option>{Object.keys(cityData).map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><Filter className="ml-4 text-gray-500" size={20}/><select value={filterType} onChange={e=>setFilterType(e.target.value)} className="w-full bg-transparent p-3 font-bold text-xs outline-none uppercase appearance-none cursor-pointer text-gray-900"><option value="Tümü">TÜM HİZMETLER</option>{SERVICE_OPTIONS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
      </div>

      <div ref={listContainerRef} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        {loading ? <div className="col-span-full py-20 text-center"><Loader2 className="inline animate-spin text-slate-700" size={48}/></div> :
          providers.filter(p=>(p.businessName||p.firstName||'').toLowerCase().includes(searchTerm.toLowerCase())).map(p=>{
            let ui = SERVICE_OPTIONS.find(o=>o.id === p.service?.subType || o.id === p.serviceType);
            if(!ui) { for(const opt of SERVICE_OPTIONS){ const m = opt.subs.find(s=>s.id===(p.service?.subType || p.serviceType)); if(m){ ui=opt; break; } } }
            if(!ui) ui = SERVICE_OPTIONS[0];
            const isSel = selectedProviders.includes(p._id);
            const addr = typeof p.address === 'string' ? p.address : p.address?.fullText || `${p.address?.city || ''} / ${p.address?.district || ''}`;
            const resolvedServiceType = p.service?.subType || p.serviceType || '';
            const listIcon = renderServiceIcon(resolvedServiceType, 'w-7 h-7');
            const iconContainerClass = listIcon
              ? getIconBadgeClass(resolvedServiceType)
              : `${ui.color} text-white`;

            return(
              <div key={p._id} onClick={()=>toggleProviderSelection(p._id)} className={`cursor-pointer rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md ${isSel ? 'ring-2 ring-slate-300' : ''}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4 items-center">
                    <div className={`w-14 h-14 ${iconContainerClass} rounded-2xl flex items-center justify-center shadow-lg shrink-0`}>
                      {listIcon || (p.service?.subType === 'minibus' ? <Users size={28} strokeWidth={1}/> : p.service?.subType === 'otobus' ? <Bus size={28} strokeWidth={1.5}/> : <ui.icon size={28} strokeWidth={1.5}/>)}
                    </div>
                    <div className="overflow-hidden"><h3 className="font-black text-slate-900 text-sm uppercase truncate">{p.businessName || p.firstName}</h3><span className="text-[8px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded uppercase">{p.service?.subType || p.serviceType || 'Genel'}</span></div>
                  </div>
                  <div className="ml-2 flex shrink-0 flex-col gap-2" onClick={e=>e.stopPropagation()}><button onClick={()=>openEdit(p)} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:text-slate-900"><Edit size={16}/></button><button onClick={e=>handleDelete(e,p._id)} className="rounded-xl border border-slate-200 p-2 text-red-400 transition-colors hover:text-red-600"><Trash2 size={16}/></button></div>
                </div>
                <div className="space-y-2"><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[10px] font-bold text-slate-700"><Phone size={14} className="text-green-600"/> {p.phoneNumber}</div><div className="flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[10px] font-bold text-slate-700"><MapPin size={14} className="shrink-0 text-red-500"/><span className="truncate">{addr}</span></div></div>
              </div>
            )
          })
        }
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 p-4 transition-opacity">
          <div className="relative h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-10 text-gray-900 shadow-xl">
            <button onClick={()=>setShowModal(false)} className="absolute top-8 right-8 rounded-full border border-slate-200 bg-white p-3 transition-all hover:bg-red-500 hover:text-white"><X size={24}/></button>
            <div className="mb-10 flex items-center gap-3">
              <img src="/apple-icon.png" alt="Transport 245 Uygulama Ikonu" className="w-10 h-10 rounded-2xl object-cover shadow-md" />
              <h2 className="text-3xl font-black uppercase text-slate-900"> {isEditing ? 'Düzenle' : 'Yeni Kayıt'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <input placeholder="İŞLETME ADI" value={formData.businessName} onChange={e=>setFormData({...formData, businessName: e.target.value})} className="w-full border-b border-slate-300 px-1 py-4 font-black text-sm outline-none placeholder-gray-500 text-gray-900"/>
                <div className="grid grid-cols-2 gap-4"><input placeholder="E-POSTA" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full border-b border-slate-300 px-1 py-4 font-bold text-xs outline-none placeholder-gray-500 text-gray-900"/><input placeholder="TEL (05...)" value={formData.phoneNumber} onChange={e=>setFormData({...formData, phoneNumber: e.target.value})} className="w-full border-b border-slate-300 px-1 py-4 font-bold text-xs outline-none placeholder-gray-500 text-gray-900"/></div>
                <div className="grid grid-cols-2 gap-4"><select value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className="w-full border-b border-slate-300 bg-white px-1 py-4 font-black text-xs outline-none text-gray-900">{Object.keys(cityData).map(c=><option key={c} value={c}>{c}</option>)}</select><select value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value})} className="w-full border-b border-slate-300 bg-white px-1 py-4 font-bold text-xs outline-none text-gray-900">{availableDistricts.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                <textarea placeholder="MAHALLE, SOKAK, CADDE, NO..." value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="h-32 w-full resize-none border-b border-slate-300 px-1 py-4 font-medium text-xs outline-none placeholder-gray-500 text-gray-900"/>
                <button
                  type="button"
                  onClick={useCurrentLocationForAddress}
                  disabled={addressLocating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-[10px] font-black uppercase text-white disabled:opacity-60"
                >
                  {addressLocating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                  Mevcut Konumu Kullan
                </button>
                <input placeholder="WEB SİTESİ" value={formData.website} onChange={e=>setFormData({...formData, website: e.target.value})} className="w-full border-b border-slate-300 px-1 py-4 font-bold text-xs outline-none placeholder-gray-500 text-gray-900"/>
                <input placeholder="VERGİ NUMARASI (ZORUNLU)" value={formData.taxNumber} onChange={e=>setFormData({...formData, taxNumber: e.target.value})} className="w-full border-b border-slate-300 px-1 py-4 font-bold text-xs outline-none placeholder-gray-500 text-gray-900"/>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {SERVICE_OPTIONS.map(opt=>(
                    <div key={opt.id} className="relative">
                      <button onClick={()=>toggleServiceType(opt.id)} className={`min-h-[106px] w-full rounded-3xl border p-3 shadow-sm transition-all flex flex-col items-center justify-center gap-2 ${formData.serviceTypes.includes(opt.id) ? `${opt.color} text-white shadow-md border-transparent` : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                        {renderServiceIcon(opt.id, 'w-6 h-6') ? (
                          <span className={`inline-flex items-center justify-center rounded-xl p-1.5 ${getIconBadgeClass(opt.id)}`}>
                            {renderServiceIcon(opt.id, 'w-6 h-6')}
                          </span>
                        ) : (
                          <opt.icon size={22} strokeWidth={1.5}/>
                        )}
                        <span className="text-[9px] font-black uppercase text-center leading-tight break-words">{opt.label}</span>
                      </button>
                      {formData.serviceTypes.includes(opt.id) && opt.subs.length > 0 && (
                        <button
                          onClick={e=>{e.stopPropagation(); setActiveFolder(opt.id);}}
                          className="absolute -bottom-2 right-2 bg-slate-900 text-white px-2 py-1 rounded-xl z-10 shadow-lg hover:bg-black transition-colors text-[9px] font-black uppercase"
                        >
                          Düzenle
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-4"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><label className="mb-1 block text-[8px] font-black uppercase text-gray-500">Birim</label><input type="number" value={formData.pricePerUnit} onChange={e=>setFormData({...formData, pricePerUnit: e.target.value})} className="w-full border-b border-slate-300 bg-transparent py-2 font-black text-xl outline-none text-gray-900"/></div></div>
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] font-black uppercase text-gray-500 block">Araçlar ve Fotoğraflar (Opsiyonel)</label>
                    <button type="button" onClick={addVehicleRow} className="rounded-xl bg-slate-900 px-3 py-1.5 text-[9px] font-black uppercase text-white">Araç Ekle</button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {formData.vehicleItems.map((vehicle: VehicleEntry, idx: number) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={vehicle.name}
                            onChange={(e)=>setFormData((prev: any) => ({
                              ...prev,
                              vehicleItems: prev.vehicleItems.map((v: VehicleEntry, i: number) => i === idx ? { ...v, name: e.target.value } : v)
                            }))}
                            placeholder={`Araç ${idx + 1} (örn: Isuzu NPR)`}
                            className="flex-1 border-b border-slate-300 bg-transparent py-1 font-bold text-[11px] outline-none text-gray-900"
                          />
                          <button type="button" onClick={() => removeVehicleRow(idx)} className="px-2 rounded-lg border border-red-200 text-red-600 text-[9px] font-black">Sil</button>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) { setActiveVehicleIndex(idx); handlePhotoUpload(idx, file); } }}
                            className="text-[10px] font-bold"
                          />
                          {uploadingPhoto && activeVehicleIndex === idx && <span className="text-[9px] font-black text-gray-600">Yükleniyor...</span>}
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {Array.from({ length: 3 }).map((_, slotIdx) => {
                            const url = vehicle.photoUrls?.[slotIdx];
                            return (
                              <div key={slotIdx} className="aspect-square rounded-xl border border-white/60 bg-white/60 overflow-hidden flex items-center justify-center">
                                {url ? (
                                  <div className="w-full h-full relative">
                                    <img src={url} alt={`Araç ${idx + 1} Foto ${slotIdx + 1}`} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setFormData((prev: any) => ({
                                        ...prev,
                                        vehicleItems: prev.vehicleItems.map((v: VehicleEntry, i: number) => i === idx
                                          ? { ...v, photoUrls: (v.photoUrls || []).filter((_: string, photoIdx: number) => photoIdx !== slotIdx) }
                                          : v
                                        )
                                      }))}
                                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white text-[9px] font-black"
                                    >
                                      X
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[9px] font-black text-gray-400 uppercase">Boş</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex min-h-[60px] flex-wrap gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-4">{formData.filterTags.map((t:any)=>(<span key={t} className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-[9px] font-black uppercase text-white">{t.replace('_',' ')} <X size={12} className="cursor-pointer transition-colors hover:text-red-400" onClick={()=>setFormData({...formData, filterTags: formData.filterTags.filter((tag:any)=>tag!==t)})}/></span>))}</div>
              </div>
            </div>
            <button onClick={handleSave} disabled={loading} className="mt-10 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 py-5 text-sm font-black uppercase text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-400">{loading ? <Loader2 className="animate-spin" size={24}/> : <>{isEditing ? 'GÜNCELLEMEYİ TAMAMLA' : 'KAYDI TAMAMLA'} <ArrowRight size={20}/></>}</button>
          </div>
        </div>
      )}

      {activeFolder && currentFolderConfig && (
        <div className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 transition-opacity">
          <div className="relative flex max-h-[80vh] w-full max-w-xl flex-col rounded-[2rem] border border-slate-200 bg-white p-8 text-gray-900 shadow-xl">
            <button
              onClick={() => setActiveFolder(null)}
              className="absolute top-5 right-5 h-8 w-8 rounded-full border border-slate-200 bg-white text-gray-700 transition-colors hover:bg-red-500 hover:text-white"
            >
              <X size={14} className="mx-auto" />
            </button>
            <h2 className="mb-6 text-2xl font-black uppercase text-slate-900">{currentFolderConfig.label} Seçimi</h2>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 mb-6 pr-2 custom-scrollbar">
              {currentFolderConfig.subs.map(sub => (
                <button key={sub.id} onClick={() => toggleSubOption(sub.id)} className={`flex flex-col items-center gap-2 rounded-3xl border p-6 shadow-sm transition-all ${formData.filterTags.includes(sub.id) ? `${currentFolderConfig.color} scale-[1.02] border-transparent text-white shadow-md` : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}><sub.icon size={28} strokeWidth={1.5}/><span className="text-[10px] font-black uppercase">{sub.label}</span></button>
              ))}
            </div>
            <button onClick={()=>setActiveFolder(null)} className="w-full rounded-xl bg-slate-900 py-4 text-xs font-black uppercase text-white hover:bg-black">TAMAMLANDI</button>
          </div>
        </div>
      )}
    </div>
  );
}
