/**
 * @file page.tsx (Settings / Menu Page)
 * @description Transport 245 - Tam Ekran Menü ve Ayarlar Sayfası
 * FIX: Hesabı Sil butonunun üstüne "Şikayet / Talep Oluştur" eklendi.
 * FIX: Geçmişteki ve menüdeki Şikayet/Değerlendir butonları için gerçek modallar bağlandı.
 * FIX: Glassmorphism tasarımı tam ekrana uygun halde korundu.
 */

'use client';

import {
  Zap, X, Truck, History, ArrowLeft,
  Wrench, Construction, Settings, Globe, UserCircle2,
  MapPin, Shield, ToggleLeft, ToggleRight,
  ShieldCheck, Heart, FileText, Locate,
  Loader2, Trash2, Navigation, Mail,
  Bell, Users, Bus, Crown, Star, AlertTriangle, ChevronDown, ChevronUp, Package, CarFront
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Modallar (Dosya yollarını projenin yapısına göre ayarlayabilirsin)
import SettingsModal from '../../components/SettingsModal';
import ProfileModal from '../../components/ProfileModal';
import UserAgreementModal from '../../components/UserAgreementModal';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import KVKKModal from '../../components/KVKKModal';
import ReportModal from '../../components/ReportModal';
import RatingModal from '../../components/RatingModal';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';
const LANG_STORAGE_KEY = 'Transport_lang';
const LANG_OPTIONS = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'ar', label: 'العربية' }
];

const BASE_DATA: any = {
  kurtarici: { unit: 45, unitLabel: 'km', label: 'Oto Kurtarma', icon: <Wrench size={24}/>, color: 'text-red-600 bg-red-100', group: 'KURTARMA' },
  vinc: { unit: 250, unitLabel: 'km', label: 'Ağır Vinç', icon: <Construction size={24}/>, color: 'text-red-800 bg-red-200', group: 'KURTARMA' },
  nakliye: { unit: 50, unitLabel: 'km', label: 'Nakliye (Yurt İçi)', icon: <Truck size={24}/>, color: 'text-purple-600 bg-purple-100', group: 'NAKLİYE' },
  yurt_disi_nakliye: { unit: 150, unitLabel: 'km', label: 'Yurt Dışı Lojistik', icon: <Globe size={24}/>, color: 'text-indigo-600 bg-indigo-100', group: 'NAKLİYE' },
  seyyar_sarj: { unit: 30, unitLabel: 'kw', label: 'Gezici Şarj', icon: <Zap size={24}/>, color: 'text-blue-600 bg-blue-100', group: 'ENERJİ' },
  istasyon: { unit: 15, unitLabel: 'kw', label: 'Şarj İstasyonu', icon: <Navigation size={24}/>, color: 'text-blue-800 bg-blue-200', group: 'ENERJİ' },
  minibus: { unit: 35, unitLabel: 'km', label: 'Minibüs', icon: <Users size={24}/>, color: 'text-teal-600 bg-teal-100', group: 'YOLCU' },
  otobus: { unit: 80, unitLabel: 'km', label: 'Otobüs', icon: <Bus size={24}/>, color: 'text-teal-800 bg-teal-200', group: 'YOLCU' },
  vip_tasima: { unit: 60, unitLabel: 'km', label: 'VIP Transfer', icon: <Crown size={24}/>, color: 'text-emerald-700 bg-emerald-100', group: 'YOLCU' }
};

const getOrderIcon = (type: string) => {
  const t = type?.toLowerCase();
  if (t?.includes('kurtarici') || t?.includes('vinc')) return <CarFront size={20} className="text-red-600"/>;
  if (t?.includes('sarj') || t?.includes('istasyon')) return <Zap size={20} className="text-blue-600"/>;
  if (t?.includes('yolcu') || t?.includes('vip') || t?.includes('bus')) return <Users size={20} className="text-emerald-600"/>;
  return <Truck size={20} className="text-purple-600"/>;
};

const getOrderColor = (type: string) => {
  const t = type?.toLowerCase();
  if (t?.includes('kurtarici') || t?.includes('vinc')) return 'bg-red-50 border-red-100';
  if (t?.includes('sarj') || t?.includes('istasyon')) return 'bg-blue-50 border-blue-100';
  if (t?.includes('yolcu') || t?.includes('vip') || t?.includes('bus')) return 'bg-emerald-50 border-emerald-100';
  return 'bg-purple-50 border-purple-100';
};

export default function SettingsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'tariff' | 'history'>('tariff');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('Misafir Kullanıcı');

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [appLang, setAppLang] = useState('tr');

  const toggleNotif = () => {
    setNotifEnabled(prev => {
      localStorage.setItem('Transport_notif', String(!prev));
      return !prev;
    });
  };
  const toggleLocation = () => {
    setLocationEnabled(prev => {
      localStorage.setItem('Transport_location', String(!prev));
      return !prev;
    });
  };

  // Accordion (Geçmiş Sipariş Detayları)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Genel Modallar
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [showKVKK, setShowKVKK] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Şikayet ve Değerlendirme Modalları
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportDriverId, setReportDriverId] = useState<string | null>(null);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTargetId, setRatingTargetId] = useState<string | null>(null);
  const [ratingDriverId, setRatingDriverId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const storedName = localStorage.getItem('Transport_user_name');
    setUserName(storedName || 'Misafir Kullanıcı');
    const storedNotif = localStorage.getItem('Transport_notif');
    const storedLocation = localStorage.getItem('Transport_location');
    const storedLang = localStorage.getItem(LANG_STORAGE_KEY);
    const deviceLang = (navigator.language || 'tr').split('-')[0].toLowerCase();
    const resolvedLang = LANG_OPTIONS.some(l => l.code === storedLang)
      ? String(storedLang)
      : (LANG_OPTIONS.some(l => l.code === deviceLang) ? deviceLang : 'tr');
    if (storedNotif !== null) setNotifEnabled(storedNotif === 'true');
    if (storedLocation !== null) setLocationEnabled(storedLocation === 'true');
    setAppLang(resolvedLang);
    localStorage.setItem(LANG_STORAGE_KEY, resolvedLang);
    document.documentElement.lang = resolvedLang;
  }, []);

  const handleLanguageChange = (nextLang: string) => {
    setAppLang(nextLang);
    localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    document.documentElement.lang = nextLang;
  };

  useEffect(() => {
    if (activeTab === 'history') {
      const myDeviceId = localStorage.getItem('Transport_device_id') || "";
      setLoading(true);
      fetch(`${API_URL}/orders?customerId=${myDeviceId}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setOrders(data); })
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const handleDeleteAccount = async () => {
    const customerId = localStorage.getItem('Transport_device_id');
    if (!customerId) { localStorage.clear(); window.location.href = '/'; return; }
    try {
      const res = await fetch(`${API_URL}/customers/${customerId}`, { method: 'DELETE' });
      if (res.ok) { localStorage.clear(); window.location.href = '/'; }
    } catch (error) { console.error(error); }
  };

  const toggleOrderDetails = (id: string) => {
    setExpandedOrder(prev => prev === id ? null : id);
  };

  // Gerçek Rating API İsteği (İsteğe bağlı)
  const handleRateSubmit = async (data: { rating: number; comment: string; tags: string[] }) => {
    if (!ratingDriverId) return;
    await fetch(`${API_URL}/users/${ratingDriverId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: data.rating,
        comment: data.comment,
        tags: data.tags,
        orderId: ratingTargetId
      })
    });
  };

  const handleNotAgreed = async (orderId: string) => {
    await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerOutcome: 'NOT_AGREED' })
    });
    await fetch(`${API_URL}/orders/${orderId}`, { method: 'DELETE' });
    setOrders(prev => prev.filter(o => o._id !== orderId));
  };

  if (!isMounted) return null;

  return (
    <main className="relative w-full min-h-screen flex flex-col font-sans text-gray-900 bg-gradient-to-br from-[#e0e7ff] via-[#f1f5f9] to-[#e2e8f0] overflow-hidden">
      
      {/* HEADER - Glassmorphism */}
      <div className="px-6 md:px-12 pt-14 pb-8 z-10 shrink-0 bg-white/60 border-b border-white/50 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6 mb-8">
            <button 
              onClick={() => router.push('/')} 
              className="w-12 h-12 bg-white/70 border border-white rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md hover:bg-white text-gray-700 hover:text-blue-600"
            >
              <ArrowLeft size={24} strokeWidth={2.5}/>
            </button>
            <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter italic">Menü</h1>
          </div>

          <div onClick={() => setShowProfile(true)} className="rounded-[2.5rem] p-6 border-2 border-white bg-white/40 backdrop-blur-md shadow-xl cursor-pointer hover:bg-white/60 active:scale-[0.98] transition-all mb-8">
             <div className="flex items-center gap-6 text-gray-900">
                <div className="w-16 h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-inner">
                  <UserCircle2 size={36} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black uppercase text-xl text-slate-800 truncate">{userName}</h3>
                  <p className="text-[11px] text-blue-600 font-black uppercase mt-1 flex items-center gap-1.5 bg-blue-50/50 w-fit px-3 py-1 rounded-lg">
                    <MapPin size={12} /> Şehir Aktif
                  </p>
                </div>
             </div>
          </div>

          <div className="flex bg-slate-200/50 p-2 rounded-3xl border border-white/40 backdrop-blur-sm shadow-inner">
            <button onClick={() => setActiveTab('tariff')} className={`flex-1 py-4 text-xs font-black rounded-2xl transition-all uppercase tracking-widest ${activeTab === 'tariff' ? 'bg-white text-slate-800 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Tarifeler</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 text-xs font-black rounded-2xl transition-all uppercase tracking-widest ${activeTab === 'history' ? 'bg-white text-slate-800 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Geçmiş</button>
          </div>
        </div>
      </div>

      {/* İÇERİK ALANI */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'tariff' && (
            <div className="space-y-10">
              <div className="p-5 rounded-[2rem] bg-white/70 backdrop-blur-sm border-2 border-white shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600"><Globe size={20} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ayarlar</p>
                      <p className="text-sm font-black text-slate-700 uppercase">Dil Seçimi</p>
                    </div>
                  </div>
                  <select
                    value={appLang}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-black text-slate-700 uppercase outline-none"
                  >
                    {LANG_OPTIONS.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-5 rounded-[2rem] bg-red-50/80 backdrop-blur-sm border border-red-100 flex items-center gap-4 shadow-sm">
                <div className="bg-red-100 p-3 rounded-full shrink-0"><Heart size={20} className="text-red-500 fill-red-500" /></div>
                <p className="text-xs font-black text-red-800 leading-tight uppercase tracking-tight">Kazancın %10'una kadarı yardım kuruluşlarına aktarılmaktadır.</p>
              </div>

              {['KURTARMA', 'NAKLİYE', 'ENERJİ', 'YOLCU'].map(group => (
                <div key={group} className="space-y-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {group}
                  </span>
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(BASE_DATA).filter(([_, v]:any) => v.group === group).map(([key, val]: [string, any]) => (
                      <div key={key} className="bg-white/60 backdrop-blur-xl border-2 border-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-[1.5rem] ${val.color} shadow-sm border border-white/50`}>{val.icon}</div>
                            <div>
                              <h4 className="font-black text-slate-800 text-sm md:text-base uppercase leading-none">{val.label}</h4>
                              <p className="text-[11px] font-black text-blue-600 mt-1.5 uppercase tracking-wide">Birim: ₺{val.unit} / {val.unitLabel}</p>
                            </div>
                          </div>
                          <div className="text-right bg-slate-50/50 px-5 py-3 rounded-2xl border border-white">
                            <div className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter leading-none">₺{val.unit}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">/{val.unitLabel}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-4 pt-6">
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Tercihler</span>
                <div onClick={toggleNotif} className="flex items-center justify-between p-6 rounded-[2rem] bg-white/60 border-2 border-white shadow-sm active:scale-[0.98] cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${notifEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><Bell size={20} /></div>
                    <span className="text-sm font-black text-slate-700 uppercase">Bildirimler</span>
                  </div>
                  {notifEnabled ? <ToggleRight size={40} className="text-blue-600 fill-current"/> : <ToggleLeft size={40} className="text-slate-300"/>}
                </div>
                <div onClick={toggleLocation} className="flex items-center justify-between p-6 rounded-[2rem] bg-white/60 border-2 border-white shadow-sm active:scale-[0.98] cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${locationEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><Locate size={20} /></div>
                    <span className="text-sm font-black text-slate-700 uppercase">Konum Takibi</span>
                  </div>
                  {locationEnabled ? <ToggleRight size={40} className="text-blue-600 fill-current"/> : <ToggleLeft size={40} className="text-slate-300"/>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowAgreement(true)} className="flex flex-col items-center justify-center gap-3 p-8 rounded-[2rem] bg-white/60 backdrop-blur-xl border-2 border-white text-slate-500 hover:text-blue-600 transition-all shadow-sm active:scale-95">
                  <div className="bg-slate-100 p-4 rounded-2xl text-inherit"><FileText size={28} /></div>
                  <span className="text-[11px] font-black uppercase tracking-widest">Sözleşme</span>
                </button>
                <button onClick={() => setShowKVKK(true)} className="flex flex-col items-center justify-center gap-3 p-8 rounded-[2rem] bg-white/60 backdrop-blur-xl border-2 border-white text-slate-500 hover:text-green-600 transition-all shadow-sm active:scale-95">
                  <div className="bg-slate-100 p-4 rounded-2xl text-inherit"><Shield size={28} /></div>
                  <span className="text-[11px] font-black uppercase tracking-widest">KVKK Metni</span>
                </button>
              </div>

              <div className="pt-8 pb-10 space-y-4">
                <div className="w-full p-6 bg-slate-50/80 backdrop-blur-sm border-2 border-slate-200 rounded-[2rem] flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-xl shrink-0 mt-0.5"><Mail size={16} className="text-blue-600" /></div>
                  <p className="text-xs font-black text-slate-700 leading-relaxed">
                    Görüş ve şikayetleriniz için{' '}
                    <a href="mailto:iletisimtransporter@gmail.com" className="text-blue-600 underline break-all">
                      iletisimtransporter@gmail.com
                    </a>{' '}
                    adresinden iletişim kurabilirsiniz.
                  </p>
                </div>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-6 bg-red-50/80 backdrop-blur-sm border-2 border-red-200 rounded-[2rem] text-xs font-black text-red-600 uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-red-100 transition-all active:scale-95 shadow-md"
                >
                  <Trash2 size={18} /> Hesabımı Sil
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
               {loading ? (
                  <div className="flex flex-col items-center py-40 gap-6 text-slate-400">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <span className="text-xs font-black uppercase tracking-widest bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm">Geçmiş Taranıyor...</span>
                  </div>
               ) : orders.length === 0 ? (
                  <div className="text-center py-40 text-slate-400">
                    <div className="bg-white/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white">
                      <History size={48} className="opacity-40" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest">Henüz İşlem Bulunmuyor</p>
                  </div>
               ) : (
                  orders.map((order) => {
                    const isExpanded = expandedOrder === order._id;
                    return (
                      <div key={order._id} className="bg-white/70 backdrop-blur-xl border-2 border-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-all">
                        
                        {/* Sipariş Özeti (Tıklanabilir Başlık) */}
                        <div 
                          onClick={() => toggleOrderDetails(order._id)}
                          className="p-6 cursor-pointer hover:bg-white/40 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-5">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getOrderColor(order.serviceType)}`}>
                              {getOrderIcon(order.serviceType)}
                              <span className="text-[10px] font-black uppercase tracking-wider">{order.serviceType?.replace('_', ' ')}</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-600 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 uppercase tracking-widest italic">Tamamlandı</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-black text-slate-800 text-sm md:text-base uppercase">{order?.driver?.businessName || 'Lisanslı Sürücü'}</h4>
                              <p className="text-[11px] text-slate-500 font-bold mt-1.5 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <div className="flex items-center gap-4 text-right">
                               <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">₺{order?.driver?.pricing?.pricePerUnit || '---'}</p>
                               {isExpanded ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                            </div>
                          </div>
                        </div>

                        {/* 🔥 Açılır (Accordion) Değerlendirme & Şikayet Alanı */}
                        <div className={`bg-slate-50/80 border-t border-slate-100 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 hidden'}`}>
                          <div className="p-4 grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => {
                                setRatingTargetId(order._id);
                                setRatingDriverId(order?.driver?._id || null);
                                setShowRatingModal(true);
                              }}
                              className="flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:text-yellow-600 hover:border-yellow-200 transition-all active:scale-95 shadow-sm"
                            >
                              <Star size={16} /> Değerlendir
                            </button>
                            <button 
                              onClick={() => { 
                                setReportTargetId(order._id); 
                                setReportDriverId(order?.driver?._id || null); 
                                setShowReportModal(true); 
                              }} 
                              className="flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:text-red-600 hover:border-red-200 transition-all active:scale-95 shadow-sm"
                            >
                              <AlertTriangle size={16} /> Şikayet Et
                            </button>
                            <button
                              onClick={() => handleNotAgreed(order._id)}
                              className="col-span-2 flex items-center justify-center gap-2 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:text-slate-800 transition-all active:scale-95 shadow-sm"
                            >
                              Aradım Ama Anlaşamadım
                            </button>
                          </div>
                        </div>

                      </div>
                    )
                  })
               )}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER (Sabit Alt Kısım) */}
      <div className="p-6 md:p-8 bg-white/90 border-t border-white/60 text-center shrink-0 rounded-t-[2.5rem] shadow-[0_-4px_12px_rgba(0,0,0,0.04)] z-10">
        <div className="max-w-md mx-auto">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] border-2 border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all bg-white hover:bg-slate-50">
             <Settings size={20} /> Gelişmiş Ayarlar
          </button>
          <div className="flex items-center justify-center gap-2 opacity-30 mt-6">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Transport 245</span>
          </div>
        </div>
      </div>

      {/* KLASİK MODALLAR */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <UserAgreementModal isOpen={showAgreement} onClose={() => setShowAgreement(false)} readOnly={true} />
      <KVKKModal isOpen={showKVKK} onClose={() => setShowKVKK(false)} readOnly={true} />
      <DeleteAccountModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleDeleteAccount} 
      />

      {/* YENİ MODALLAR (ŞİKAYET VE DEĞERLENDİRME) */}
      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        orderId={reportTargetId}
        driverId={reportDriverId}
      />
      <RatingModal 
        isOpen={showRatingModal} 
        onClose={() => setShowRatingModal(false)} 
        onRate={handleRateSubmit}
      />
    </main>
  );
}
