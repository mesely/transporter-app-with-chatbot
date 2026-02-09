'use client';

import { 
  Zap, X, Truck, History, Clock, 
  ChevronDown, ChevronUp, Wrench, Construction, 
  Settings, HelpCircle, Bell, Globe, UserCircle2, 
  MapPin, Shield, ToggleLeft, ToggleRight,
  ShieldCheck, AlertCircle
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import SettingsModal from '../SettingsModal';
import ProfileModal from '../ProfileModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: string) => void;
  onReportClick: (orderId: string | null) => void; 
}

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

// HİZMET VERİLERİ (Görsel Gruplandırma İçin)
const BASE_DATA: any = {
  kurtarici: { open: 2000, unit: 45, label: 'Oto Kurtarma', icon: <Wrench size={18}/>, color: 'text-red-600 bg-red-50/40', group: 'KURTARMA' },
  vinc: { open: 5500, unit: 250, label: 'Ağır Vinç', icon: <Construction size={18}/>, color: 'text-red-800 bg-red-100/40', group: 'KURTARMA' },
  nakliye: { open: 2500, unit: 50, label: 'Ticari Nakliyat', icon: <Truck size={18}/>, color: 'text-purple-600 bg-purple-50/40', group: 'NAKLİYE' },
  yurt_disi: { open: 15000, unit: 150, label: 'Yurt Dışı Lojistik', icon: <Globe size={18}/>, color: 'text-indigo-600 bg-indigo-50/40', group: 'NAKLİYE' },
  sarj: { open: 800, unit: 30, label: 'Mobil Şarj', icon: <Zap size={18}/>, color: 'text-blue-600 bg-blue-50/40', group: 'ŞARJ' }
};

export default function Sidebar({ isOpen, onClose, onSelectAction, onReportClick }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'menu' | 'history'>('menu');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [userName, setUserName] = useState('Misafir');
  
  // HIZLI AYARLAR STATE
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [privacyEnabled, setPrivacyEnabled] = useState(true);

  // MODALLAR
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedName = localStorage.getItem('transporter_user_name');
      if (storedName) setUserName(storedName);
      
      const myDeviceId = localStorage.getItem('transporter_device_id') || "";
      if (activeTab === 'history') {
        setLoading(true);
        fetch(`${API_URL}/orders?customerId=${myDeviceId}`)
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setOrders(data); })
          .catch(() => setOrders([]))
          .finally(() => setLoading(false));
      }
    }
  }, [isOpen, activeTab]);

  return (
    <>
      {/* ARKA PLAN OVERLAY (Hafif ve Bulanık) */}
      <div 
        className={`fixed inset-0 bg-black/5 backdrop-blur-[1px] z-[2000] transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* SIDEBAR ANA GÖVDE (Maksimum Şeffaflık - bg-white/40) */}
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-[340px] z-[2001] shadow-[20px_0_80px_rgba(0,0,0,0.05)] border-r border-white/40 bg-white/40 backdrop-blur-3xl transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* --- HEADER (Tamamen Saydam) --- */}
        <div className="p-6 pb-2 shrink-0 bg-transparent relative z-20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter drop-shadow-sm">Menü</h2>
            <button 
              onClick={onClose} 
              className="w-10 h-10 bg-white/20 border border-white/40 hover:bg-white/60 hover:text-red-500 rounded-full flex items-center justify-center text-gray-600 transition-all active:scale-90 shadow-sm"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* PROFİL KARTI (Kristal Görünüm - bg-white/10) */}
          <div 
            onClick={() => setShowProfile(true)} 
            className="rounded-[2.2rem] p-5 relative overflow-hidden mb-6 cursor-pointer border border-white/60 bg-white/10 backdrop-blur-xl shadow-sm hover:bg-white/30 hover:border-white transition-all group active:scale-95"
          >
             <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 bg-white/40 border border-white/60 rounded-full flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-all shadow-inner">
                   <UserCircle2 size={32} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-base text-gray-800 tracking-tight">{userName}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="text-blue-500" /> İzmir
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/40 border border-white/50 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                    Profili Görüntüle
                  </div>
                </div>
             </div>
             {/* Kart İçi Dekoratif Işık */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-400/20 transition-all"></div>
          </div>

          {/* TAB SEÇİCİ (Buzlu Cam) */}
          <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/30 backdrop-blur-md shadow-inner">
            <button 
              onClick={() => setActiveTab('menu')} 
              className={`flex-1 py-3.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === 'menu' ? 'bg-white/70 text-gray-900 shadow-sm border border-white/40' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Hizmetler
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`flex-1 py-3.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === 'history' ? 'bg-white/70 text-gray-900 shadow-sm border border-white/40' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Geçmiş
            </button>
          </div>
        </div>

        {/* --- KAYDIRILABİLİR İÇERİK --- */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar relative z-10">
          
          {activeTab === 'menu' && (
            <>
              {/* Hizmet Grupları */}
              {['KURTARMA', 'NAKLİYE', 'ŞARJ'].map(groupName => (
                <div key={groupName} className="space-y-4 animate-in slide-in-from-left-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className={`w-2 h-2 rounded-full ${groupName === 'KURTARMA' ? 'bg-red-500' : groupName === 'NAKLİYE' ? 'bg-purple-500' : 'bg-blue-500'} shadow-[0_0_8px_rgba(0,0,0,0.1)]`}></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{groupName}</span>
                  </div>
                  
                  {Object.entries(BASE_DATA).filter(([_, v]:any) => v.group === groupName).map(([key, val]: [string, any]) => (
                    <div 
                      key={key} 
                      onClick={() => { onSelectAction(key); onClose(); }}
                      className="group bg-white/20 border border-white/40 rounded-[2rem] p-5 cursor-pointer hover:bg-white/50 hover:border-blue-200 transition-all active:scale-[0.97] backdrop-blur-md"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className={`p-3.5 rounded-2xl ${val.color} border border-white/40 shadow-sm group-hover:scale-110 transition-transform`}>
                            {val.icon}
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 text-xs uppercase leading-tight group-hover:text-blue-600 transition-colors">{val.label}</h4>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Tarife Tier 1</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-gray-900">₺{val.open}</div>
                          <div className="text-[9px] font-black text-gray-400 uppercase">Açılış</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <div className="my-2 border-t border-white/20"></div>

              {/* HIZLI AYARLAR & DESTEK */}
              <div className="space-y-3 pt-4 pb-10 animate-in slide-in-from-bottom-4">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hızlı Erişim</div>
                
                {/* Bildirim Toggle */}
                <div onClick={() => setNotifEnabled(!notifEnabled)} className="flex items-center justify-between p-4 rounded-2xl bg-white/20 border border-white/40 backdrop-blur-md cursor-pointer active:scale-95 transition-all hover:bg-white/40 shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${notifEnabled ? 'bg-blue-50 text-blue-600 shadow-sm border border-white' : 'bg-white/10 text-gray-400'}`}><Bell size={18}/></div>
                      <span className="text-xs font-black text-gray-700 uppercase tracking-tight">Bildirimler</span>
                   </div>
                   {notifEnabled ? <ToggleRight size={32} className="text-blue-600 fill-current"/> : <ToggleLeft size={32} className="text-gray-300"/>}
                </div>

                {/* Gizlilik Toggle */}
                <div onClick={() => setPrivacyEnabled(!privacyEnabled)} className="flex items-center justify-between p-4 rounded-2xl bg-white/20 border border-white/40 backdrop-blur-md cursor-pointer active:scale-95 transition-all hover:bg-white/40 shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${privacyEnabled ? 'bg-green-50 text-green-600 shadow-sm border border-white' : 'bg-white/10 text-gray-400'}`}><Shield size={18}/></div>
                      <span className="text-xs font-black text-gray-700 uppercase tracking-tight">Gizli Mod</span>
                   </div>
                   {privacyEnabled ? <ToggleRight size={32} className="text-green-600 fill-current"/> : <ToggleLeft size={32} className="text-gray-300"/>}
                </div>

                {/* 🔥 DESTEK & ŞİKAYET BUTONU (Cam Tasarımda Geri Geldi) 🔥 */}
                <button onClick={() => { onReportClick(null); onClose(); }} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/20 border border-white/40 backdrop-blur-md cursor-pointer active:scale-95 transition-all hover:bg-white/40 shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-red-50/50 text-red-600 flex items-center justify-center shadow-sm border border-white"><AlertCircle size={18}/></div>
                      <span className="text-xs font-black text-gray-700 uppercase tracking-tight">Destek & Şikayet</span>
                   </div>
                   <HelpCircle size={20} className="text-gray-400" />
                </button>

                <button onClick={() => setShowSettings(true)} className="w-full flex items-center justify-center p-4 rounded-2xl border-2 border-dashed border-white/40 text-gray-500 hover:text-gray-900 hover:border-white transition-all text-[11px] font-black uppercase tracking-widest mt-4 bg-white/5 active:scale-95">
                   <Settings size={16} className="mr-3"/> Gelişmiş Ayarlar
                </button>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
               {loading ? (
                  <div className="flex flex-col items-center py-24 text-gray-400 font-black text-[11px] uppercase tracking-widest animate-pulse">
                    Geçmiş Yükleniyor...
                  </div>
               ) : orders.length === 0 ? (
                  <div className="text-center py-24">
                    <div className="w-20 h-20 bg-white/20 border border-white/40 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-inner">
                        <History size={32} className="text-gray-300"/>
                    </div>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">İşlem Bulunmuyor</p>
                  </div>
               ) : (
                  orders.map((order) => {
                    const isExpanded = expandedOrderId === order._id;
                    return (
                      <div 
                        key={order._id} 
                        onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                        className={`rounded-[2rem] border backdrop-blur-md p-5 cursor-pointer transition-all duration-300 ${isExpanded ? 'bg-white/90 border-blue-200 shadow-xl scale-[1.02]' : 'bg-white/20 border-white/40 hover:bg-white/50 shadow-sm'}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-100 uppercase tracking-tighter">{order.serviceType?.replace('_', ' ')}</span>
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase ${order.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-white/20 text-gray-400 border border-white/30'}`}>
                            {order.status === 'COMPLETED' ? 'Bitti' : 'Aktif'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-black text-gray-900 text-xs uppercase tracking-tight">{order.driverName || 'Sürücü'}</h4>
                            <div className="flex items-center gap-2 mt-1.5">
                               <Clock size={12} className="text-gray-400" />
                               <span className="text-[10px] text-gray-500 font-bold uppercase">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-300"/>}
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-5 pt-5 border-t border-white/20 animate-in fade-in zoom-in-95">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onReportClick(order._id); onClose(); }}
                              className="w-full py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[11px] font-black uppercase hover:bg-red-100 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
                            >
                              <AlertCircle size={16} /> Bir Sorun mu Var?
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
               )}
            </div>
          )}
        </div>

        {/* --- FOOTER (Glass) --- */}
        <div className="p-6 bg-white/10 backdrop-blur-md border-t border-white/20 text-center shrink-0">
          <div className="flex items-center gap-3 justify-center opacity-60">
            <ShieldCheck size={14} className="text-blue-600" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Transporter 2026</span>
          </div>
        </div>
      </div>

      {/* MODALLAR */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
}