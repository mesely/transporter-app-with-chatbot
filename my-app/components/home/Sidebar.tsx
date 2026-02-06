'use client';

import { 
  Zap, Phone, X, Truck, History, FileText, Clock, 
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: string) => void;
  onReportClick: (orderId: string) => void; 
}

interface BackendTariff {
  _id: string;
  serviceType: string;
  openingFee: number;
  pricePerUnit: number;
  unit: string;
}

interface OrderHistory {
  _id: string;
  driverName?: string;
  serviceType: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  driverId?: string;
}

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

export default function Sidebar({ isOpen, onClose, onSelectAction, onReportClick }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'tariffs' | 'history'>('tariffs');
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const myDeviceId = localStorage.getItem('transporter_device_id') || "";
      setLoading(true);

      Promise.all([
        fetch(`${API_URL}/tariffs`).then(res => res.json()),
        fetch(`${API_URL}/orders?customerId=${myDeviceId}`).then(res => res.json())
      ])
      .then(([tariffData, orderData]) => {
        setTariffs(processTariffData(tariffData));
        if (Array.isArray(orderData) && orderData.length > 0) setOrders(orderData);
        else {
           setOrders([{ _id: 'test1', driverName: 'Ahmet Y.', serviceType: 'kurtarici', createdAt: new Date().toISOString(), status: 'COMPLETED' }]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleTariffClick = (type: string) => { onSelectAction(type); onClose(); };
  const toggleOrderExpand = (id: string) => { setExpandedOrderId(expandedOrderId === id ? null : id); };

  const formatDate = (dateString: string) => {
    try { return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString)); } 
    catch (e) { return dateString; }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return { text: 'Bekliyor', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Clock className="w-3 h-3"/> };
      case 'COMPLETED': return { text: 'Tamamlandı', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="w-3 h-3"/> };
      case 'CANCELLED': return { text: 'İptal', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="w-3 h-3"/> };
      default: return { text: 'İşlemde', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Clock className="w-3 h-3"/> };
    }
  };

  const processTariffData = (data: BackendTariff[]) => {
    if (!Array.isArray(data)) return [];
    const kurtarici = data.find(t => t.serviceType === 'kurtarici');
    const nakliye = data.find(t => t.serviceType === 'nakliye');
    const sarjIstasyon = data.find(t => t.serviceType === 'sarj_istasyonu');
    const seyyarSarj = data.find(t => t.serviceType === 'seyyar_sarj');

    return [
      { id: 'kurtarici', title: 'KURTARICI', icon: <Phone className="w-4 h-4 text-white" />, color: 'bg-gradient-to-br from-red-500 to-red-600', rates: kurtarici ? [{ label: 'Açılış', value: `${kurtarici.openingFee} ₺` }, { label: `${kurtarici.unit.toUpperCase()} Başı`, value: `+ ${kurtarici.pricePerUnit} ₺` }] : [] },
      { id: 'nakliye', title: 'NAKLİYAT', icon: <Truck className="w-4 h-4 text-white" />, color: 'bg-gradient-to-br from-purple-500 to-purple-600', rates: nakliye ? [{ label: 'Başlangıç', value: `${nakliye.openingFee} ₺` }, { label: `${nakliye.unit.toUpperCase()} Başı`, value: `+ ${nakliye.pricePerUnit} ₺` }] : [] },
      { id: 'sarj', title: 'ŞARJ HİZMETİ', icon: <Zap className="w-4 h-4 text-white" />, color: 'bg-gradient-to-br from-blue-500 to-blue-600', subSections: [
          { header: 'Mobil Şarj', items: seyyarSarj ? [{ label: 'Hizmet', value: `${seyyarSarj.openingFee} ₺` }, { label: `Birim`, value: `+ ${seyyarSarj.pricePerUnit} ₺` }] : [] },
          { header: 'İstasyon', items: sarjIstasyon ? [{ label: 'Açılış', value: sarjIstasyon.openingFee > 0 ? `${sarjIstasyon.openingFee} ₺` : '0 ₺' }, { label: `Dolum`, value: `${sarjIstasyon.pricePerUnit} ₺` }] : [] }
        ]
      },
    ];
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 z-[1999] backdrop-blur-[2px] bg-transparent transition-all" onClick={onClose} />}

      {/* SIDEBAR */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white/10 backdrop-blur-2xl z-[2000] shadow-[10px_0_40px_rgba(0,0,0,0.1)] border-r border-white/20 transform transition-transform duration-500 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* HEADER */}
        {/* 🛠️ DÜZELTME 1: Başlık rengi SİYAH yapıldı */}
        <div className="p-6 flex-shrink-0 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight drop-shadow-sm">Panelim</h2>
            
            {/* 🛠️ DÜZELTME 2: X Butonu görünür hale getirildi (Koyu Gri) */}
            <button onClick={onClose} className="p-2 bg-black/5 hover:bg-black/10 rounded-full transition-all text-gray-700 shadow-sm">
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* TABLAR */}
          <div className="flex bg-white/30 p-1 rounded-xl border border-white/20 backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('tariffs')} 
              className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'tariffs' 
                  ? 'bg-white text-black shadow-lg' // Aktif: Beyaz
                  : 'text-gray-600 hover:text-black hover:bg-white/20' // 🛠️ DÜZELTME 3: Pasif metin KOYU GRİ yapıldı
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> TARİFELER
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'history' 
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-gray-600 hover:text-black hover:bg-white/20' // 🛠️ DÜZELTME 3: Pasif metin KOYU GRİ yapıldı
              }`}
            >
              <History className="w-3.5 h-3.5" /> GEÇMİŞ
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
              <span className="text-gray-500 text-[10px] font-black tracking-widest uppercase">Yükleniyor...</span>
            </div>
          ) : activeTab === 'tariffs' ? (
            
            tariffs.map((tariff) => (
              <div 
                key={tariff.id} 
                onClick={() => handleTariffClick(tariff.id)} 
                className="group bg-white/80 backdrop-blur-md border border-white/40 rounded-[1.5rem] p-4 space-y-3 cursor-pointer hover:bg-white/90 transition-all shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                  <div className={`p-2 rounded-xl shadow-lg ${tariff.color} text-white`}>{tariff.icon}</div>
                  <h3 className="text-gray-900 font-black text-sm tracking-wide">{tariff.title}</h3>
                </div>
                {tariff.subSections ? (
                   <div className="space-y-2 pt-1">
                     {tariff.subSections.map((sub:any, i:number) => (
                       <div key={i} className="space-y-1">
                         <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest pl-1">{sub.header}</p>
                         {sub.items.map((it:any,k:number)=>(
                           <div key={k} className="flex justify-between text-xs text-gray-700 pl-1">
                             <span className="font-medium">{it.label}</span>
                             <span className="font-black text-gray-900">{it.value}</span>
                           </div>
                         ))}
                       </div>
                     ))}
                   </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    {tariff.rates?.map((rate:any, i:number) => (
                      <div key={i} className="flex justify-between items-center text-xs text-gray-700 pl-1">
                        <span className="font-medium">{rate.label}</span>
                        <span className="font-black text-gray-900">{rate.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            
            orders.length > 0 ? (
              orders.map((order) => {
                const statusInfo = getStatusBadge(order.status);
                const isExpanded = expandedOrderId === order._id;

                return (
                  <div 
                    key={order._id} 
                    onClick={() => toggleOrderExpand(order._id)} 
                    className={`bg-white/80 backdrop-blur-md rounded-2xl border border-white/40 overflow-hidden transition-all duration-300 cursor-pointer mb-3 shadow-md ${
                      isExpanded ? 'ring-2 ring-gray-200' : 'hover:bg-white/90'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2.5 rounded-xl text-gray-700">
                            <History className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 text-xs truncate w-32">
                              {order.driverName || 'Hizmet Kaydı'}
                            </h4>
                            <p className="text-[10px] text-gray-500 font-bold mt-0.5">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${statusInfo.color}`}>
                          {statusInfo.icon} {statusInfo.text}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-gray-50 p-3 border-t border-gray-200 animate-in slide-in-from-top-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onReportClick(order._id); onClose(); }} 
                          className="w-full bg-red-600 text-white py-2.5 rounded-xl text-[10px] font-bold uppercase hover:bg-red-700 shadow-lg transition-all"
                        >
                          ŞİKAYET ET
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-bold text-xs">İşlem Bulunmuyor</p>
              </div>
            )
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 bg-white/5 backdrop-blur-md text-center flex-shrink-0 border-t border-white/10">
          <p className="text-[9px] text-gray-400 tracking-[0.2em] uppercase font-bold">Transporter v2.1 • 2026</p>
        </div>
      </div>
    </>
  );
}