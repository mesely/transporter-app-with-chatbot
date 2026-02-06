'use client';

import { 
  Zap, Phone, X, Truck, History, FileText, Clock, 
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  Wrench, Construction, Home, Box, ShieldCheck, Loader2, MapPin
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

// --- 🛠️ 1. TYPES ---
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: string) => void;
  onReportClick: (orderId: string) => void; 
}

// --- 📈 2. 2026 RASYONEL ŞEHİR ALGORİTMASI ---
const CITY_TIERS: any = {
  tier1: ['İstanbul', 'Ankara', 'İzmir'], // 1.25x
  tier2: ['Bursa', 'Antalya', 'Kocaeli', 'Adana', 'Gaziantep', 'Konya', 'Mersin'], // 1.0x
  tier3: 'default' // 0.85x
};

const getTierFactor = (city: string) => {
  if (CITY_TIERS.tier1.includes(city)) return 1.25;
  if (CITY_TIERS.tier2.includes(city)) return 1.0;
  return 0.85;
};

// 2026 Taban Fiyat Projeksiyonu (Tier 2 bazlı)
const BASE_DATA: any = {
  kurtarici: { open: 2000, unit: 45, label: 'Oto Kurtarma', icon: <Wrench size={18}/>, color: 'from-red-500 to-red-700', group: 'KURTARMA' },
  vinc: { open: 5500, unit: 250, label: 'Ağır Hizmet Vinç', icon: <Construction size={18}/>, color: 'from-red-600 to-red-800', group: 'KURTARMA' },
  evden_eve: { open: 15000, unit: 2000, label: 'Evden Eve Nakliye', icon: <Home size={18}/>, color: 'from-purple-500 to-purple-700', group: 'NAKLİYE' },
  nakliye: { open: 2500, unit: 50, label: 'Ticari Nakliyat', icon: <Truck size={18}/>, color: 'from-purple-600 to-purple-800', group: 'NAKLİYE' },
  kamyonet: { open: 1500, unit: 35, label: 'Hafif Kamyonet', icon: <Box size={18}/>, color: 'from-purple-400 to-purple-600', group: 'NAKLİYE' },
  tir: { open: 9000, unit: 130, label: 'Tır (Komple Lojistik)', icon: <Truck size={18}/>, color: 'from-purple-700 to-purple-900', group: 'NAKLİYE' },
  seyyar_sarj: { open: 800, unit: 30, label: 'Mobil Şarj Destek', icon: <Zap size={18}/>, color: 'from-blue-500 to-blue-700', group: 'ŞARJ' },
  sarj_istasyonu: { open: 0, unit: 18, label: 'Hızlı Şarj İstasyonu', icon: <Zap size={18}/>, color: 'from-blue-600 to-blue-800', group: 'ŞARJ' }
};

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

export default function Sidebar({ isOpen, onClose, onSelectAction, onReportClick }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'tariffs' | 'history'>('tariffs');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [userCity] = useState('İzmir');

  const tierFactor = useMemo(() => getTierFactor(userCity), [userCity]);

  useEffect(() => {
    if (isOpen) {
      const myDeviceId = localStorage.getItem('transporter_device_id') || "";
      setLoading(true);
      fetch(`${API_URL}/orders?customerId=${myDeviceId}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setOrders(data); })
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const processedTariffs = useMemo(() => {
    return Object.entries(BASE_DATA).map(([key, val]: [string, any]) => ({
      id: key,
      title: val.label,
      group: val.group,
      color: val.color,
      icon: val.icon,
      opening: Math.round(val.open * tierFactor),
      pricePer: Math.round(val.unit * tierFactor),
      unit: key.includes('sarj') ? 'kWh' : (key === 'vinc' ? 'Saat' : 'KM')
    }));
  }, [tierFactor]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-[1999] backdrop-blur-md bg-black/10 transition-all" onClick={onClose} />}

      <div className={`fixed top-0 left-0 h-full w-80 bg-white z-[2000] shadow-2xl transform transition-transform duration-500 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* HEADER */}
        <div className="p-6 flex-shrink-0 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Panelim</h2>
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={10} className="text-blue-600" />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{userCity} • Tier 1</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-all">
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-2xl">
            {['tariffs', 'history'].map((tab) => (
              <button 
                key={tab} onClick={() => setActiveTab(tab as any)} 
                className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
              >
                {tab === 'tariffs' ? 'Tarifeler' : 'Geçmiş'}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 custom-scrollbar">
          {loading ? (
             <div className="flex flex-col items-center py-20 text-gray-300 font-bold text-[10px] uppercase tracking-widest"><Loader2 className="animate-spin mb-2" /> Veriler Alınıyor...</div>
          ) : activeTab === 'tariffs' ? (
            
            // GRUPLANDIRILMIŞ RENKLİ KARTLAR
            ['KURTARMA', 'NAKLİYE', 'ŞARJ'].map(groupName => (
              <div key={groupName} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className={`w-1 h-3 rounded-full ${groupName === 'KURTARMA' ? 'bg-red-500' : groupName === 'NAKLİYE' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{groupName} HİZMETLERİ</span>
                </div>
                
                {processedTariffs.filter(t => t.group === groupName).map(tariff => (
                  <div 
                    key={tariff.id} 
                    onClick={() => { onSelectAction(tariff.id); onClose(); }}
                    className="group bg-white border border-gray-100 rounded-[1.8rem] p-4 space-y-3 cursor-pointer hover:border-gray-200 hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${tariff.color} text-white shadow-lg`}>
                          {tariff.icon}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 text-xs uppercase leading-tight">{tariff.title}</h4>
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Birim: {tariff.unit}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-black text-gray-900">₺{tariff.opening}</div>
                        <div className="text-[9px] font-black text-gray-400 uppercase">Açılış</div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-50 flex justify-between items-center text-[10px]">
                      <span className="font-bold text-gray-400 uppercase tracking-tighter">Yol / Kullanım Ücreti</span>
                      <span className="font-black text-blue-600">+ ₺{tariff.pricePer} / {tariff.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            
            // GEÇMİŞ LİSTESİ (ŞİKAYET BUTONLU)
            orders.map((order) => {
              const isExpanded = expandedOrderId === order._id;
              return (
                <div 
                  key={order._id} 
                  onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-all"
                >
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">{order.serviceType}</span>
                     <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${order.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>{order.status}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <div>
                       <h4 className="font-black text-gray-900 text-sm uppercase">{order.driverName || 'Hizmet Kaydı'}</h4>
                       <p className="text-[10px] text-gray-400 font-bold">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                     </div>
                     {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300"/> : <ChevronDown className="w-4 h-4 text-gray-300"/>}
                   </div>
                   
                   {isExpanded && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); onReportClick(order._id); onClose(); }}
                       className="w-full mt-4 py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-100 transition-all border border-red-100"
                     >
                       BU İŞLEMİ ŞİKAYET ET
                     </button>
                   )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
          <div className="flex items-center gap-2 justify-center opacity-50">
            <ShieldCheck size={12} className="text-green-600" />
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Transporter 2026</span>
          </div>
        </div>
      </div>
    </>
  );
}