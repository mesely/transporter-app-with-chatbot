'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Box,
  Bus,
  CarFront,
  Check,
  Crown,
  Globe,
  Home,
  Layers,
  Loader2,
  LocateFixed,
  Navigation,
  Package,
  ShieldCheck,
  Snowflake,
  Trash2,
  Truck,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import KVKKModal from '../../components/KVKKModal';
import { mapProviderMainType, normalizeProviderServiceType } from '../../utils/providerServices';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';

type VehicleEntry = {
  name: string;
  photoUrls: string[];
};

type ServiceOption = {
  id: string;
  label: string;
  color: string;
  icon: any;
  subs: Array<{ id: string; label: string; icon: any }>;
};

const SERVICE_OPTIONS: ServiceOption[] = [
  { id: 'oto_kurtarma', label: 'Kurtarici', color: 'bg-red-600', icon: CarFront, subs: [] },
  { id: 'vinc', label: 'Vinc', color: 'bg-rose-700', icon: Navigation, subs: [] },
  { id: 'lastikci', label: 'Lastikci', color: 'bg-orange-600', icon: Truck, subs: [] },
  {
    id: 'tir',
    label: 'Tir',
    color: 'bg-violet-700',
    icon: Truck,
    subs: [
      { id: 'tenteli', label: 'Tenteli', icon: Archive },
      { id: 'frigorifik', label: 'Frigorifik', icon: Snowflake },
      { id: 'lowbed', label: 'Lowbed', icon: Layers },
      { id: 'konteyner', label: 'Konteyner', icon: Box },
      { id: 'acik_kasa', label: 'Acik Kasa', icon: Box },
    ],
  },
  {
    id: 'kamyon',
    label: 'Kamyon',
    color: 'bg-purple-700',
    icon: Truck,
    subs: [
      { id: '6_teker', label: '6 Teker', icon: Truck },
      { id: '8_teker', label: '8 Teker', icon: Truck },
      { id: '10_teker', label: '10 Teker', icon: Truck },
      { id: '12_teker', label: '12 Teker', icon: Truck },
      { id: 'kirkayak', label: 'Kirkayak', icon: Layers },
    ],
  },
  {
    id: 'kamyonet',
    label: 'Kamyonet',
    color: 'bg-fuchsia-700',
    icon: Package,
    subs: [
      { id: 'panelvan', label: 'Panelvan', icon: CarFront },
      { id: 'acik_kasa', label: 'Acik Kasa', icon: Box },
      { id: 'kapali_kasa', label: 'Kapali Kasa', icon: Archive },
    ],
  },
  { id: 'evden_eve', label: 'Evden Eve', color: 'bg-pink-600', icon: Home, subs: [] },
  { id: 'istasyon_sarj', label: 'Istasyon Sarj', color: 'bg-blue-700', icon: Zap, subs: [] },
  { id: 'gezici_sarj', label: 'Gezici Sarj', color: 'bg-cyan-700', icon: Zap, subs: [] },
  { id: 'minibus', label: 'Minibus', color: 'bg-emerald-700', icon: Bus, subs: [] },
  { id: 'otobus', label: 'Otobus', color: 'bg-emerald-700', icon: Bus, subs: [] },
  { id: 'midibus', label: 'Midibus', color: 'bg-emerald-700', icon: Bus, subs: [] },
  { id: 'vip_tasima', label: 'VIP Tasima', color: 'bg-emerald-800', icon: Crown, subs: [] },
  { id: 'yurt_disi_nakliye', label: 'Yurt Disi', color: 'bg-indigo-700', icon: Globe, subs: [] },
];

const COPY = {
  tr: {
    pageTitle: 'Kurum Kayit Formu',
    companyInfo: 'Kurum Bilgileri',
    serviceInfo: 'Hizmet ve Arac Bilgileri',
    kvkkView: 'KVKK Metnini Goruntule',
    kvkkAccept: 'KVKK Aydinlatma metnini okudum ve kabul ediyorum.',
    contractAccept: 'Kurum kayit basvuru sozlesmesini kabul ediyorum.',
    submit: 'Basvuruyu Gonder',
    sent: 'Kurum kayit talebiniz alindi. Ekibimiz en kisa surede inceleyecektir.',
    businessName: 'Isletme Adi',
    email: 'E-posta',
    phone: 'Telefon (05...)',
    city: 'Sehir',
    district: 'Ilce',
    address: 'Mahalle, sokak, cadde, no...',
    currentLocation: 'Mevcut Konumu Kullan',
    website: 'Web Sitesi',
    taxNumber: 'Vergi Numarasi (Zorunlu)',
    servicePrice: 'Birim Fiyat (Opsiyonel)',
    vehicleSection: 'Arac Modeli ve Fotograf',
    addVehicle: 'Arac Ekle',
    uploadPhoto: 'Fotograf Yukle',
    uploading: 'Yukleniyor...',
    edit: 'Duzenle',
    complete: 'Tamamlandi',
    subTypeSelect: 'Alt Tur Secimi',
    useTr: 'TR',
    useEn: 'EN',
    alerts: {
      locationUnsupported: 'Konum servisi desteklenmiyor.',
      locationFailed: 'Konum alinamadi.',
      uploadFailed: 'Fotograf yukleme hatasi.',
      businessRequired: 'Isletme adi zorunlu.',
      phoneInvalid: 'Telefon 0 ile baslayan 11 hane olmali.',
      emailInvalid: 'Gecerli e-posta girin.',
      serviceRequired: 'En az bir hizmet turu secin.',
      addressRequired: 'Sehir, ilce ve adres zorunlu.',
      taxRequired: 'Vergi numarasi zorunlu.',
      kvkkRequired: 'KVKK onayi gerekli.',
      contractRequired: 'Kurum kayit sozlesmesi onayi gerekli.',
      addressNotFound: 'Adres haritada bulunamadi.',
      submitFailed: 'Kayit tamamlanamadi.',
      networkFailed: 'Baglanti hatasi.',
    },
  },
  en: {
    pageTitle: 'Company Registration Form',
    companyInfo: 'Company Details',
    serviceInfo: 'Service and Vehicle Details',
    kvkkView: 'View Privacy Notice',
    kvkkAccept: 'I have read and accept the privacy notice.',
    contractAccept: 'I accept the company registration application agreement.',
    submit: 'Submit Application',
    sent: 'Your company registration request has been received. Our team will review it shortly.',
    businessName: 'Company Name',
    email: 'Email',
    phone: 'Phone (05...)',
    city: 'City',
    district: 'District',
    address: 'Neighborhood, street, avenue, no...',
    currentLocation: 'Use Current Location',
    website: 'Website',
    taxNumber: 'Tax Number (Required)',
    servicePrice: 'Unit Price (Optional)',
    vehicleSection: 'Vehicle Model and Photos',
    addVehicle: 'Add Vehicle',
    uploadPhoto: 'Upload Photo',
    uploading: 'Uploading...',
    edit: 'Edit',
    complete: 'Done',
    subTypeSelect: 'Select Sub Type',
    useTr: 'TR',
    useEn: 'EN',
    alerts: {
      locationUnsupported: 'Location services are not supported.',
      locationFailed: 'Could not get current location.',
      uploadFailed: 'Photo upload failed.',
      businessRequired: 'Company name is required.',
      phoneInvalid: 'Phone number must be 11 digits and start with 0.',
      emailInvalid: 'Enter a valid email address.',
      serviceRequired: 'Select at least one service type.',
      addressRequired: 'City, district and address are required.',
      taxRequired: 'Tax number is required.',
      kvkkRequired: 'Privacy notice approval is required.',
      contractRequired: 'Registration agreement approval is required.',
      addressNotFound: 'Address could not be located on the map.',
      submitFailed: 'Registration could not be completed.',
      networkFailed: 'Network error.',
    },
  },
} as const;

const SERVICE_LABELS = {
  en: {
    oto_kurtarma: 'Tow',
    vinc: 'Crane',
    lastikci: 'Tire',
    tir: 'Trailer',
    kamyon: 'Truck',
    kamyonet: 'Van',
    evden_eve: 'Moving',
    istasyon_sarj: 'Station Charge',
    gezici_sarj: 'Mobile Charge',
    minibus: 'Minibus',
    otobus: 'Bus',
    midibus: 'Midibus',
    vip_tasima: 'VIP Transfer',
    yurt_disi_nakliye: 'International',
    tenteli: 'Curtainsider',
    frigorifik: 'Refrigerated',
    lowbed: 'Lowbed',
    konteyner: 'Container',
    acik_kasa: 'Open Bed',
    '6_teker': '6 Wheels',
    '8_teker': '8 Wheels',
    '10_teker': '10 Wheels',
    '12_teker': '12 Wheels',
    kirkayak: 'Heavy Truck',
    panelvan: 'Panel Van',
    kapali_kasa: 'Closed Box',
  },
} as const;

export function CompanyRegisterPage({ forcedLang }: { forcedLang?: 'tr' | 'en' } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const lang = forcedLang || (pathname?.includes('=EN') ? 'en' : 'tr');
  const tx = COPY[lang];
  const getLabel = (id: string, fallback: string) => {
    if (lang === 'tr') return fallback;
    return SERVICE_LABELS.en[id as keyof typeof SERVICE_LABELS.en] || fallback;
  };

  const [cityData, setCityData] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [addressLocating, setAddressLocating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showKvkk, setShowKvkk] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: '',
    email: '',
    phoneNumber: '',
    city: 'Istanbul',
    district: '',
    address: '',
    website: '',
    taxNumber: '',
    serviceTypes: [] as string[],
    filterTags: [] as string[],
    pricePerUnit: '40',
    vehicleItems: [{ name: '', photoUrls: [] }] as VehicleEntry[],
  });

  useEffect(() => {
    fetch('/il_ilce.csv')
      .then((res) => res.text())
      .then((text) => {
        const dataMap: Record<string, string[]> = {};
        text.split(/\r?\n/).forEach((line, i) => {
          if (i === 0 || !line.trim()) return;
          const [il, ilce] = line.split(',');
          if (il && ilce) {
            const city = il.trim();
            if (!dataMap[city]) dataMap[city] = [];
            dataMap[city].push(ilce.trim());
          }
        });
        setCityData(dataMap);
        if (!form.district && dataMap[form.city]?.[0]) {
          setForm((prev) => ({ ...prev, district: dataMap[prev.city][0] }));
        }
      })
      .catch(() => setCityData({}));
  }, []);

  const availableDistricts = useMemo(() => cityData[form.city] || [], [cityData, form.city]);

  useEffect(() => {
    if (availableDistricts.length > 0 && !availableDistricts.includes(form.district)) {
      setForm((prev) => ({ ...prev, district: availableDistricts[0] }));
    }
  }, [availableDistricts, form.district]);

  const toggleServiceType = (id: string) => {
    const option = SERVICE_OPTIONS.find((s) => s.id === id);
    if (!option) return;
    const isSelected = form.serviceTypes.includes(id);

    if (!isSelected) {
      setForm((prev) => ({
        ...prev,
        serviceTypes: Array.from(new Set([...(prev.serviceTypes || []), id])),
      }));
      if (option.subs.length > 0) setActiveFolder(id);
      return;
    }

    const subIds = option.subs.map((sub) => sub.id);
    setForm((prev) => ({
      ...prev,
      serviceTypes: (prev.serviceTypes || []).filter((t) => t !== id),
      filterTags: (prev.filterTags || []).filter((t) => !subIds.includes(t)),
    }));
    if (activeFolder === id) setActiveFolder(null);
  };

  const toggleSubOption = (subId: string) => {
    setForm((prev) => ({
      ...prev,
      filterTags: prev.filterTags.includes(subId)
        ? prev.filterTags.filter((t) => t !== subId)
        : [...prev.filterTags, subId],
    }));
  };

  const getCoordinatesFromAddress = async (addr: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=tr&q=${encodeURIComponent(addr)}`,
      );
      if (!res.ok) return null;
      const data = await res.json();
      const first = Array.isArray(data) ? data[0] : null;
      const lat = Number(first?.lat);
      const lng = Number(first?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    } catch {
      return null;
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=tr`,
      );
      if (!res.ok) return null;
      const data = await res.json();
      const addr = data?.address || {};
      return {
        city: String(addr.city || addr.town || addr.province || addr.state || '').trim(),
        district: String(addr.town || addr.suburb || addr.county || addr.city_district || '').trim(),
        address:
          [addr.road, addr.house_number].filter(Boolean).join(' ').trim() ||
          String(data?.display_name || '')
            .split(',')
            .slice(0, 2)
            .join(',')
            .trim(),
      };
    } catch {
      return null;
    }
  };

  const useCurrentLocationForAddress = async () => {
    if (!navigator?.geolocation) {
      alert(tx.alerts.locationUnsupported);
      return;
    }

    setAddressLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });
      });

      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setSelectedCoords(coords);

      const parsed = await reverseGeocode(coords.lat, coords.lng);
      if (parsed) {
        setForm((prev) => ({
          ...prev,
          city: parsed.city || prev.city,
          district: parsed.district || prev.district,
          address: parsed.address || prev.address,
        }));
      }
    } catch {
      alert(tx.alerts.locationFailed);
    } finally {
      setAddressLocating(false);
    }
  };

  const handlePhotoUpload = async (vehicleIndex: number, file: File) => {
    setUploadingPhoto(vehicleIndex);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch(`${API_URL}/upload/vehicle-photo`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Fotograf yuklenemedi.');
      const data = await res.json();
      const url = String(data?.url || '');
      if (!url) throw new Error('Fotograf URL olusmadi.');

      setForm((prev) => ({
        ...prev,
        vehicleItems: prev.vehicleItems.map((v, i) =>
          i === vehicleIndex ? { ...v, photoUrls: [...(v.photoUrls || []), url] } : v,
        ),
      }));
    } catch (e: any) {
      alert(e?.message || tx.alerts.uploadFailed);
    } finally {
      setUploadingPhoto(null);
    }
  };

  const addVehicleRow = () => {
    setForm((prev) => ({
      ...prev,
      vehicleItems: [...prev.vehicleItems, { name: '', photoUrls: [] }],
    }));
  };

  const removeVehicleRow = (index: number) => {
    setForm((prev) => {
      const next = prev.vehicleItems.filter((_, i) => i !== index);
      return { ...prev, vehicleItems: next.length ? next : [{ name: '', photoUrls: [] }] };
    });
  };

  const validate = () => {
    if (!form.businessName.trim()) return tx.alerts.businessRequired;
    if (!/^0\d{10}$/.test(form.phoneNumber)) return tx.alerts.phoneInvalid;
    if (!form.email.trim() || !form.email.includes('@')) return tx.alerts.emailInvalid;
    if (form.serviceTypes.length === 0) return tx.alerts.serviceRequired;
    if (!form.city || !form.district || !form.address.trim()) return tx.alerts.addressRequired;
    if (!String(form.taxNumber || '').trim()) return tx.alerts.taxRequired;
    if (!kvkkAccepted) return tx.alerts.kvkkRequired;
    if (!contractAccepted) return tx.alerts.contractRequired;
    return '';
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      alert(validationError);
      return;
    }

    setLoading(true);
    try {
      const normalizedServiceTypes = (form.serviceTypes || []).map(normalizeProviderServiceType).filter(Boolean);
      const selectedPrimary = normalizedServiceTypes[0];
      const mappedMain = mapProviderMainType(selectedPrimary);

      const combined = `${form.address}, ${form.district}, ${form.city}, Turkiye`;
      const coords =
        selectedCoords ||
        (await getCoordinatesFromAddress(combined)) ||
        (await getCoordinatesFromAddress(`${form.district}, ${form.city}, Turkiye`));

      if (!coords) {
        alert(tx.alerts.addressNotFound);
        return;
      }

      const cleanVehicleItems = form.vehicleItems
        .map((v) => ({
          name: String(v.name || '').trim(),
          photoUrls: Array.isArray(v.photoUrls) ? v.photoUrls.filter(Boolean) : [],
        }))
        .filter((v) => v.name || v.photoUrls.length > 0);

      const flatPhotos = cleanVehicleItems.flatMap((v) => v.photoUrls);

      const payload = {
        firstName: form.businessName,
        businessName: form.businessName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        mainType: mappedMain,
        serviceType: selectedPrimary,
        service: {
          mainType: mappedMain,
          subType: selectedPrimary,
          tags: Array.from(new Set(['source:manual', 'self_register', ...(form.filterTags || []), ...normalizedServiceTypes.map((t) => `type:${t}`)])),
        },
        address: `${form.address}, ${form.district}, ${form.city}`,
        city: form.city,
        district: form.district,
        role: 'provider',
        website: form.website,
        pricing: { pricePerUnit: Number(form.pricePerUnit || 40) },
        taxNumber: form.taxNumber,
        vehicleItems: cleanVehicleItems,
        vehicleInfo: cleanVehicleItems.map((v) => v.name).filter(Boolean).join(', '),
        vehiclePhotos: flatPhotos,
        photoUrl: flatPhotos[0] || '',
        isVerified: false,
        location: { type: 'Point', coordinates: [coords.lng, coords.lat] },
        lat: coords.lat,
        lng: coords.lng,
      };

      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || tx.alerts.submitFailed);
      }

      setSuccessMessage(tx.sent);
      setForm({
        businessName: '',
        email: '',
        phoneNumber: '',
        city: 'Istanbul',
        district: cityData['Istanbul']?.[0] || '',
        address: '',
        website: '',
        taxNumber: '',
        serviceTypes: [],
        filterTags: [],
        pricePerUnit: '40',
        vehicleItems: [{ name: '', photoUrls: [] }],
      });
      setSelectedCoords(null);
      setKvkkAccepted(false);
      setContractAccepted(false);
      setActiveFolder(null);
    } catch (e: any) {
      alert(e?.message || tx.alerts.networkFailed);
    } finally {
      setLoading(false);
    }
  };

  const currentFolderConfig = SERVICE_OPTIONS.find((s) => s.id === activeFolder);

  return (
    <main className="min-h-screen bg-[#8ccde6] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-[2.2rem] border border-white/60 bg-white/65 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/app')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Transport 245</p>
                <h1 className="text-2xl font-black uppercase tracking-tight">{tx.pageTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/companyregister=TR')}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${lang === 'tr' ? 'bg-slate-900 text-white' : 'border border-white/70 bg-white/80 text-slate-700'}`}
                >
                  {tx.useTr}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/companyregister=EN')}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${lang === 'en' ? 'bg-slate-900 text-white' : 'border border-white/70 bg-white/80 text-slate-700'}`}
                >
                  {tx.useEn}
                </button>
              </div>
              <img src="/apple-icon.png" alt="Transport 245 Logo" className="h-12 w-12 rounded-2xl object-cover shadow-md" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-white/60 bg-white/65 p-5 shadow-xl backdrop-blur-xl">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-700">{tx.companyInfo}</h2>
            <div className="space-y-3">
              <input
                value={form.businessName}
                onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                placeholder={tx.businessName}
                className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold outline-none"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder={tx.email}
                  className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold outline-none"
                />
                <input
                  value={form.phoneNumber}
                  onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                  placeholder={tx.phone}
                  className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-black outline-none"
                >
                  {Object.keys(cityData).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <select
                  value={form.district}
                  onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                  className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-black outline-none"
                >
                  {availableDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder={tx.address}
                className="h-28 w-full resize-none rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-medium outline-none"
              />
              <button
                type="button"
                onClick={useCurrentLocationForAddress}
                disabled={addressLocating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-60"
              >
                {addressLocating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                {tx.currentLocation}
              </button>
              <input
                value={form.website}
                onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                placeholder={tx.website}
                className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold outline-none"
              />
              <input
                value={form.taxNumber}
                onChange={(e) => setForm((p) => ({ ...p, taxNumber: e.target.value }))}
                placeholder={tx.taxNumber}
                className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold outline-none"
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/60 bg-white/65 p-5 shadow-xl backdrop-blur-xl">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-700">{tx.serviceInfo}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SERVICE_OPTIONS.map((opt) => {
                  const selected = form.serviceTypes.includes(opt.id);
                  const Icon = opt.icon;
                  return (
                    <div key={opt.id} className="relative">
                      <button
                        type="button"
                        onClick={() => toggleServiceType(opt.id)}
                        className={`w-full rounded-2xl border px-2 py-3 text-center transition-all ${
                          selected ? `${opt.color} border-transparent text-white shadow-lg` : 'border-white/70 bg-white/85 text-slate-700'
                        }`}
                      >
                        <Icon size={16} className="mx-auto mb-1" />
                        <span className="text-[10px] font-black uppercase leading-tight">{getLabel(opt.id, opt.label)}</span>
                      </button>
                      {selected && opt.subs.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFolder(opt.id);
                          }}
                          className="absolute -bottom-2 right-2 rounded-xl bg-slate-900 px-2 py-1 text-[9px] font-black uppercase text-white shadow-lg hover:bg-black"
                        >
                          {tx.edit}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/85 p-3">
                <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">{tx.servicePrice}</label>
                <input
                  type="number"
                  value={form.pricePerUnit}
                  onChange={(e) => setForm((p) => ({ ...p, pricePerUnit: e.target.value }))}
                  className="w-full bg-transparent text-lg font-black outline-none"
                />
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/85 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-slate-500">{tx.vehicleSection}</p>
                  <button type="button" onClick={addVehicleRow} className="rounded-xl bg-slate-900 px-3 py-1 text-[10px] font-black uppercase text-white">
                    {tx.addVehicle}
                  </button>
                </div>
                <div className="space-y-3">
                  {form.vehicleItems.map((vehicle, idx) => (
                    <div key={idx} className="rounded-xl border border-white/70 bg-white p-3">
                      <div className="mb-2 flex gap-2">
                        <input
                          value={vehicle.name}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              vehicleItems: prev.vehicleItems.map((v, i) => (i === idx ? { ...v, name: e.target.value } : v)),
                            }))
                          }
                          placeholder={`${tx.vehicleSection} ${idx + 1}`}
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold outline-none"
                        />
                        <button type="button" onClick={() => removeVehicleRow(idx)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase text-slate-600">
                        <Upload size={12} /> {tx.uploadPhoto}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handlePhotoUpload(idx, file);
                          }}
                        />
                      </label>
                      {uploadingPhoto === idx && (
                        <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-slate-500">
                          <Loader2 size={12} className="animate-spin" /> {tx.uploading}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] border border-white/60 bg-white/65 p-5 shadow-xl backdrop-blur-xl">
          <div className="space-y-3">
            <button type="button" onClick={() => setShowKvkk(true)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase text-emerald-700">
              <ShieldCheck size={14} /> {tx.kvkkView}
            </button>

            <label className="flex items-start gap-2 text-xs font-bold text-slate-700">
              <input type="checkbox" checked={kvkkAccepted} onChange={(e) => setKvkkAccepted(e.target.checked)} className="mt-0.5" />
              {tx.kvkkAccept}
            </label>

            <label className="flex items-start gap-2 text-xs font-bold text-slate-700">
              <input type="checkbox" checked={contractAccepted} onChange={(e) => setContractAccepted(e.target.checked)} className="mt-0.5" />
              {tx.contractAccept}
            </label>
          </div>

          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-slate-900 px-5 py-4 text-sm font-black uppercase text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {tx.submit}
            {!loading && <ArrowRight size={16} />}
          </button>

          {successMessage && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">{successMessage}</p>}
        </section>
      </div>

      {activeFolder && currentFolderConfig && (
        <div className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white/90 border border-white/60 w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative flex flex-col max-h-[80vh] text-gray-900">
            <button
              onClick={() => setActiveFolder(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/80 border border-white/70 text-gray-700 hover:bg-red-500 hover:text-white transition-colors"
            >
              <X size={14} className="mx-auto" />
            </button>
            <div className="mb-6 flex items-center gap-3">
              <img src="/apple-icon.png" alt="Transport 245 Uygulama Ikonu" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
              <h2 className="text-2xl font-black uppercase italic text-slate-900">{getLabel(currentFolderConfig.id, currentFolderConfig.label)} {tx.subTypeSelect}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 mb-6 pr-2 custom-scrollbar">
              {currentFolderConfig.subs.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => toggleSubOption(sub.id)}
                  className={`p-6 rounded-3xl border border-white/40 transition-all flex flex-col items-center gap-2 shadow-sm ${
                    form.filterTags.includes(sub.id)
                      ? `${currentFolderConfig.color} text-white shadow-lg border-transparent scale-[1.02]`
                      : 'bg-white/70 text-[#49b5c2] hover:bg-white'
                  }`}
                >
                  <sub.icon size={24} strokeWidth={1.6} />
                  <span className="text-[10px] font-black uppercase">{getLabel(sub.id, sub.label)}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setActiveFolder(null)} className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl">
              {tx.complete}
            </button>
          </div>
        </div>
      )}

      <KVKKModal isOpen={showKvkk} onClose={() => setShowKvkk(false)} />
    </main>
  );
}

export default function KurumKayitPage() {
  return <CompanyRegisterPage />;
}
