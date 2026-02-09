'use client';

import { Phone, Navigation, MapPin, Handshake, CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ProviderPanelProps {
    providerId: string;
    onComplete: (orderId?: string) => void;
    onCancel: (orderId?: string) => void;
    providerData?: any;
}

export default function ProviderPanel({ providerId, onComplete, onCancel, providerData }: ProviderPanelProps) {
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'IN_PROGRESS'>('IDLE');
  const [hasAgreed, setHasAgreed] = useState(false);
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  const checkActiveOrder = async () => {
    if (!providerId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://transporter-app-with-chatbot.onrender.com'}/orders/provider/${providerId}/active`);
      const data = await res.json();
      
      if (data && data._id) {
        // Eğer iş bitmişse (Müşteri onayladıysa) ekranı temizle
        if (data.status === 'CANCELLED' || data.status === 'COMPLETED') { 
            setOrder(null); 
            setStatus('IDLE'); 
            setHasAgreed(false);
            return; 
        }

        setOrder(data);
        setStatus(data.status === 'PENDING' ? 'PENDING' : 'IN_PROGRESS');
      } else { 
          setOrder(null); 
          setStatus('IDLE'); 
          setHasAgreed(false);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    checkActiveOrder();
    pollTimer.current = setInterval(checkActiveOrder, 3000); 
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [providerId]);

  const handleAccept = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://transporter-app-with-chatbot.onrender.com'}/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' })
      });
      setStatus('IN_PROGRESS');
    } catch (e) { alert("Hata oluştu"); }
  };

  // 1. BOŞTA
  if (status === 'IDLE' || !order) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[600] animate-in slide-in-from-bottom-10">
        <div className="bg-white rounded-t-[3rem] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100 text-center pb-12">
          <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-[pulse_3s_infinite]">
            <Navigation className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase">Sistem Aktif</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            {providerData?.firstName ? `Hoş geldin, ${providerData.firstName}` : 'İş bekleniyor...'}
          </p>
        </div>
      </div>
    );
  }

  // 2. YENİ İŞ
  if (status === 'PENDING') {
    return (
      <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border-t-8 border-green-500 animate-in zoom-in-95">
          <div className="text-center mb-6">
            <span className="text-[10px] font-black bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase">Yeni Çağrı</span>
            <h3 className="text-3xl font-black text-gray-900 mt-2 uppercase">{order.serviceType?.replace('_', ' ')}</h3>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-center border border-gray-100">
            <div className="flex items-center justify-center gap-2 mb-1">
                 <MapPin size={16} className="text-gray-400"/>
                 <p className="text-[10px] text-gray-400 font-black uppercase">Konum</p>
            </div>
            <p className="text-xl font-black text-gray-800">Yakın Mesafe</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onCancel(order._id)} className="py-5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase">Reddet</button>
            <button onClick={handleAccept} className="py-5 bg-green-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl">Kabul Et</button>
          </div>
        </div>
      </div>
    );
  }

  // 3. İŞLEM SÜRÜYOR
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[600] animate-in slide-in-from-bottom-10">
      <div className="bg-white rounded-t-[3rem] p-8 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
              {order.customerName?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div>
              <h4 className="font-black text-gray-900 text-sm uppercase">{order.customerName || 'Müşteri'}</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase">İletişim Kuruluyor</p>
            </div>
          </div>
          <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="w-14 h-14 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90">
            <Phone size={24}/>
          </button>
        </div>

        {!hasAgreed ? (
          <button onClick={() => setHasAgreed(true)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 uppercase">
            <Handshake size={20} /> Müşteri ile Anlaştık
          </button>
        ) : (
          <div className="space-y-3">
            <button onClick={() => onComplete(order._id)} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 uppercase">
              <CheckCircle size={18} /> İşi Tamamladım
            </button>
            <button onClick={() => onCancel(order._id)} className="w-full py-4 text-red-500 text-[10px] font-black uppercase hover:bg-red-50 rounded-xl">
                İptal Et / Anlaşamadık
            </button>
          </div>
        )}
      </div>
    </div>
  );
}