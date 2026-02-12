/**
 * @file Sidebar.tsx
 * @description Transporter 2026 Sovereign Sidebar. 
 * Fix: Hydration Hatası giderildi, Birim Fiyatlar (km/kw) düzeltildi.
 */

'use client';

import { 
  Zap, X, Truck, History, Clock, 
  Wrench, Construction, Settings, Globe, UserCircle2, 
  MapPin, Shield, ToggleLeft, ToggleRight,
  ShieldCheck, Heart, FileText, Locate, 
  Loader2, Trash2, Navigation,
  Bell
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Modallar
import SettingsModal from '../SettingsModal';
import ProfileModal from '../ProfileModal';
import UserAgreementModal from '../UserAgreementModal';
import DeleteAccountModal from '../DeleteAccountModal';
import KVKKModal from '../KVKKModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: string) => void;
  onReportClick: (orderId: string | null) => void; 
}

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

// BİRİM FİYATLARI VE ETİKETLERİ DÜZENLENDİ
const BASE_DATA: any = {
  kurtarici: { open: 2000, unit: 45, unitLabel: 'km', label: 'Oto Kurtarma', icon: <Wrench size={18}/>, color: 'text-red-600 bg-red-100/80', group: 'KURTARMA' },
  vinc: { open: 5500, unit: 250, unitLabel: 'km', label: 'Ağır Vinç', icon: <Construction size={18}/>, color: 'text-red-800 bg-red-200/80', group: 'KURTARMA' },
  nakliye: { open: 2500, unit: 50, unitLabel: 'km', label: 'Ticari Nakliyat', icon: <Truck size={18}/>, color: 'text-purple-600 bg-purple-100/80', group: 'NAKLİYE' },
  evden_eve: { open: 3500, unit: 60, unitLabel: 'km', label: 'Evden Eve', icon: <Navigation size={18}/>, color: 'text-purple-700 bg-purple-200/80', group: 'NAKLİYE' },
  yurt_disi: { open: 15000, unit: 150, unitLabel: 'km', label: 'Yurt Dışı Lojistik', icon: <Globe size={18}/>, color: 'text-indigo-600 bg-indigo-100/80', group: 'NAKLİYE' },
  sarj: { open: 800, unit: 30, unitLabel: 'kw', label: 'Mobil Şarj', icon: <Zap size={18}/>, color: 'text-blue-600 bg-blue-100/80', group: 'ENERJİ' }
};

export default function Sidebar({ isOpen, onClose, onSelectAction, onReportClick }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'tariff' | 'history'>('tariff');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('Misafir Kullanıcı');
  const [isMounted, setIsMounted] = useState(false); // Hydration fix için

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Modallar
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [showKVKK, setShowKVKK] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (isOpen) {
      const storedName = localStorage.getItem('transporter_user_name');
      setUserName(storedName || 'Misafir Kullanıcı');
      
      if (activeTab === 'history') {
        const myDeviceId = localStorage.getItem('transporter_device_id') || "";
        setLoading(true);
        fetch(`${API_URL}/orders?customerId=${myDeviceId}`)
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setOrders(data); })
          .catch(() => setOrders([]))
          .finally(() => setLoading(false));
      }
    }
  }, [isOpen, activeTab]);

  const handleDeleteAccount = async () => {
    const customerId = localStorage.getItem('transporter_device_id');
    if (!customerId) { localStorage.clear(); window.location.reload(); return; }
    try {
      const res = await fetch(`${API_URL}/customers/${customerId}`, { method: 'DELETE' });
      if (res.ok) { localStorage.clear(); window.location.reload(); }
    } catch (error) { console.error(error); }
  };

  // Hydration hatasını önlemek için mounted kontrolü
  if (!isMounted) return null;

  return (
    <>
      {/* OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/15 backdrop-blur-[3px] z-[2000] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* SIDEBAR GÖVDESİ */}
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-[360px] z-[2001] shadow-2xl border-r border-white/50 bg-white/25 backdrop-blur-[45px] transform transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* HEADER */}
        <div className="p-6 shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter drop-shadow-sm italic">Menü</h2>
            <button onClick={onClose} className="w-10 h-10 bg-white/70 border border-white/80 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm"><X size={20}/></button>
          </div>

          <div onClick={() => setShowProfile(true)} className="rounded-[2.2rem] p-5 border-2 border-white/90 bg-white/60 backdrop-blur-2xl shadow-xl cursor-pointer hover:bg-white/80 transition-all mb-6">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white border border-white/60 rounded-full flex items-center justify-center text-gray-400 shadow-inner"><UserCircle2 size={32} /></div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black uppercase text-sm text-gray-800 truncate">{userName}</h3>
                  <p className="text-[9px] text-gray-500 font-black uppercase mt-0.5 flex items-center gap-1"><MapPin size={10} className="text-blue-500" /> İzmir Aktif</p>
                </div>
             </div>
          </div>

          <div className="flex bg-black/10 p-1.5 rounded-2xl border border-white/40 backdrop-blur-md">
            <button onClick={() => setActiveTab('tariff')} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase ${activeTab === 'tariff' ? 'bg-white text-indigo-900 shadow-lg' : 'text-gray-600'}`}>Tarifeler</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase ${activeTab === 'history' ? 'bg-white text-indigo-900 shadow-lg' : 'text-gray-600'}`}>Geçmiş</button>
          </div>
        </div>

        {/* İÇERİK ALANI */}
        <div className="flex-1 overflow-y-auto px-6 space-y-8 custom-scrollbar pb-10">
          {activeTab === 'tariff' && (
            <>
              <div className="p-4 rounded-3xl bg-red-50/80 border border-red-200 flex items-start gap-3 shadow-sm">
                <Heart size={18} className="text-red-500 shrink-0 fill-red-500" />
                <p className="text-[9px] font-black text-red-700 leading-tight uppercase">Tüm kazancımızın %10'una kadarı yardım kuruluşlarına aktarılmaktadır.</p>
              </div>

              {['KURTARMA', 'NAKLİYE', 'ENERJİ'].map(group => (
                <div key={group} className="space-y-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{group}</span>
                  {Object.entries(BASE_DATA).filter(([_, v]:any) => v.group === group).map(([key, val]: [string, any]) => (
                    <div key={key} onClick={() => { onSelectAction(key); onClose(); }} className="bg-white/60 border-2 border-white/80 rounded-[2rem] p-5 cursor-pointer shadow-md active:scale-95 transition-all">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className={`p-3.5 rounded-2xl ${val.color} border border-white/50 shadow-sm`}>{val.icon}</div>
                          <div>
                            <h4 className="font-black text-gray-900 text-xs uppercase leading-none">{val.label}</h4>
                            {/* BİRİM FİYAT DÜZELTİLDİ: ₺/km veya ₺/kw */}
                            <p className="text-[9px] font-black text-indigo-600 mt-1 uppercase">Birim: ₺{val.unit}/{val.unitLabel}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-gray-900 tracking-tighter">₺{val.open}</div>
                          <div className="text-[8px] font-black text-gray-400 uppercase tracking-tighter italic">Açılış</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <div className="space-y-3 pt-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tercihler</span>
                <div onClick={() => setNotifEnabled(!notifEnabled)} className="flex items-center justify-between p-4 rounded-[1.8rem] bg-white/60 border border-white/80 shadow-sm transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <Bell size={18} className={notifEnabled ? 'text-indigo-600' : 'text-gray-400'} />
                    <span className="text-xs font-black text-gray-700 uppercase">Bildirimler</span>
                  </div>
                  {notifEnabled ? <ToggleRight size={32} className="text-indigo-600 fill-current"/> : <ToggleLeft size={32} className="text-gray-300"/>}
                </div>
                <div onClick={() => setLocationEnabled(!locationEnabled)} className="flex items-center justify-between p-4 rounded-[1.8rem] bg-white/60 border border-white/80 shadow-sm transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <Locate size={18} className={locationEnabled ? 'text-blue-600' : 'text-gray-400'} />
                    <span className="text-xs font-black text-gray-700 uppercase">Konum Takibi</span>
                  </div>
                  {locationEnabled ? <ToggleRight size={32} className="text-blue-600 fill-current"/> : <ToggleLeft size={32} className="text-gray-300"/>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowAgreement(true)} className="flex flex-col items-center gap-2 p-5 rounded-[2rem] bg-white/60 border border-white/80 text-gray-500 hover:text-indigo-600 transition-all shadow-sm active:scale-95">
                  <FileText size={20} /><span className="text-[8px] font-black uppercase tracking-tighter">Sözleşme</span>
                </button>
                <button onClick={() => setShowKVKK(true)} className="flex flex-col items-center gap-2 p-5 rounded-[2rem] bg-white/60 border border-white/80 text-gray-500 hover:text-green-600 transition-all shadow-sm active:scale-95">
                  <Shield size={20} /><span className="text-[8px] font-black uppercase tracking-tighter">KVKK / Gizlilik</span>
                </button>
              </div>

              <div className="pt-4 pb-6 px-1">
                <button onClick={() => setShowDeleteModal(true)} className="w-full py-4 bg-red-50/60 border border-red-100 rounded-2xl text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-95 shadow-sm">
                  <Trash2 size={14} /> Hesabımı Kalıcı Olarak Sil
                </button>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
               {loading ? (
                  <div className="flex flex-col items-center py-24 gap-2 text-gray-400">
                    <Loader2 className="animate-spin text-indigo-600" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Yükleniyor...</span>
                  </div>
               ) : orders.length === 0 ? (
                  <div className="text-center py-24 text-gray-400">
                    <History size={40} className="mx-auto mb-4 opacity-30" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Henüz işlem bulunmuyor</p>
                  </div>
               ) : (
                  orders.map((order) => (
                    <div key={order._id} className="rounded-[2rem] border-2 border-white/80 bg-white/60 backdrop-blur-md p-5 shadow-sm transition-all hover:bg-white active:scale-[0.98]">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase border border-indigo-100">{order.serviceType}</span>
                        <span className="text-[8px] font-black text-green-600 px-3 py-1 rounded-lg bg-green-50 uppercase tracking-tighter italic">Bitti</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <h4 className="font-black text-gray-900 text-xs uppercase">{order.driverName || 'Lisanslı Sürücü'}</h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase italic">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[14px] font-black text-indigo-900">₺{order.totalPrice || '---'}</p>
                        </div>
                      </div>
                    </div>
                  ))
               )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-white/40 border-t border-white/20 text-center shrink-0">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center justify-center gap-2 py-4 rounded-[1.8rem] border-2 border-dashed border-indigo-200 text-indigo-600 text-[10px] font-black uppercase shadow-sm active:scale-95 transition-all">
             <Settings size={16} /> Gelişmiş Ayarlar
          </button>
          <div className="flex items-center gap-2 justify-center opacity-40 mt-4">
            <ShieldCheck size={14} />
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">Transporter AI 2026</span>
          </div>
        </div>
      </div>

      {/* MODALLAR */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <UserAgreementModal isOpen={showAgreement} onClose={() => setShowAgreement(false)} />
      <KVKKModal isOpen={showKVKK} onClose={() => setShowKVKK(false)} />
      <DeleteAccountModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleDeleteAccount} 
      />
    </>
  );
}