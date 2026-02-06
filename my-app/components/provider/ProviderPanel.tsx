'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Phone, XCircle, CheckCircle, Navigation, MapPin, Building2 
} from 'lucide-react';

interface ProviderPanelProps {
  providerId: string | null;
  onComplete: (orderId: string) => void | Promise<void>;
  onCancel: (orderId: string) => void | Promise<void>;
  providerData?: any;
}

export default function ProviderPanel({ 
  providerId, onComplete, onCancel, providerData 
}: ProviderPanelProps) {
  
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'IN_PROGRESS'>('IDLE');
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  // --- SÜREKLİ KONTROL (POLLING) ---
  const checkActiveOrder = async () => {
    if (!providerId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/provider/${providerId}/active`);
      const data = await res.json();

      if (data && data._id) {
        if (data.status === 'CANCELLED') {
          alert("Müşteri işlemi iptal etti.");
          setOrder(null);
          setStatus('IDLE');
          return;
        }
        
        setOrder(data);
        if (data.status === 'PENDING') setStatus('PENDING'); 
        else if (data.status === 'IN_PROGRESS') setStatus('IN_PROGRESS'); 
      } else {
        setOrder(null);
        setStatus('IDLE');
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    checkActiveOrder();
    pollTimer.current = setInterval(checkActiveOrder, 3000); 
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [providerId]);

  // --- AKSİYONLAR ---
  const handleAccept = async () => {
    if (!order) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }) 
      });
      setStatus('IN_PROGRESS');
    } catch (e) { alert("Hata oluştu"); }
  };

  const handleReject = async () => {
    if (!order) return;
    if(!confirm("İşi reddetmek istediğinize emin misiniz?")) return;
    await onCancel(order._id);
    setOrder(null);
    setStatus('IDLE');
  };

  const handleFinishJob = async () => {
    if(!confirm("Hizmetin tamamlandığını onaylıyor musunuz?")) return;
    await onComplete(order._id);
    setOrder(null);
    setStatus('IDLE');
  };

  const displayAddress = (providerData && typeof providerData.address === 'string') ? providerData.address : 'Konum alınıyor...';
  
  // 🟢 YENİ: Kurum İsmini Gösteren Mantık
  const providerName = providerData 
    ? `${providerData.firstName} ${providerData.lastName}`.toUpperCase() 
    : 'YÜKLENİYOR...';

  // --- 1. DURUM: BEKLEME MODU (IDLE) ---
  if (status === 'IDLE' || !order) {
    return (
      <div className="absolute bottom-0 left-0 right-0 z-[600] animate-in slide-in-from-bottom-10 fade-in duration-500">
        <div className="bg-white/90 backdrop-blur-2xl rounded-t-[2.5rem] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white/60 text-center">
          
          {/* İSİM ALANI BURAYA EKLENDİ */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-gray-100 p-3 rounded-full mb-2">
              <Building2 className="w-6 h-6 text-gray-700" />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">{providerName}</h2>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider mt-1">Aktif</span>
          </div>

          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Navigation className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-black text-gray-900">İŞ BEKLENİYOR</h3>
          <p className="text-xs text-gray-500 font-bold mt-2 uppercase tracking-wide">Bölgeniz taranıyor...</p>
          <div className="mt-6 flex items-center justify-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
             <MapPin className="w-4 h-4 text-gray-400" />
             <span className="text-xs font-bold text-gray-600">{displayAddress}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. DURUM: YENİ İŞ GELDİ (PENDING) ---
  if (status === 'PENDING') {
    return (
      <div className="absolute inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border-4 border-green-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-green-500 animate-pulse"></div>

          <div className="text-center mb-8 mt-4">
            <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">Yeni İş Fırsatı</span>
            <h2 className="text-3xl font-black text-gray-900 mt-4 uppercase leading-none">{order.serviceType?.replace('_', ' ')}</h2>
            <p className="text-sm text-gray-500 font-bold mt-2">Müşteri seni bekliyor!</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-200">
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
              <span className="text-xs text-gray-400 font-bold uppercase">Kazanç</span>
              <span className="text-2xl font-black text-green-600">₺{order.price || '---'}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100">👤</div>
              <div className="text-left">
                <div className="text-sm font-black text-gray-900">{order.customerName || 'Müşteri'}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Mesaj yazabilir</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleReject} className="py-4 rounded-2xl bg-white border-2 border-red-100 text-red-600 font-black text-xs hover:bg-red-50 transition-all uppercase">
              Reddet
            </button>
            <button onClick={handleAccept} className="py-4 rounded-2xl bg-green-600 text-white font-black text-xs hover:bg-green-700 shadow-lg shadow-green-200 transition-all uppercase active:scale-95 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> İşlemi Onayla
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. DURUM: İŞLEM SÜRÜYOR (IN_PROGRESS) ---
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[600] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-white/95 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white/60 overflow-hidden p-8">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Aktif Görev</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{order.serviceType?.replace('_', ' ')}</h2>
          </div>
          <div className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="font-mono font-bold text-gray-900">₺{order.price || '---'}</span>
          </div>
        </div>

        <div className="bg-white/60 rounded-2xl p-4 mb-6 border border-white/50 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-bold">
              {order.customerName?.charAt(0) || 'M'}
            </div>
            <div>
              <div className="font-bold text-gray-800 text-sm">{order.customerName || 'Müşteri'}</div>
              <div className="text-[11px] text-gray-500 font-medium tracking-wide">{order.customerPhone}</div>
            </div>
          </div>
          <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="p-3 bg-green-500 text-white rounded-xl shadow-lg shadow-green-200 active:scale-95 transition-all">
            <Phone className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={handleFinishJob} className="flex-[2] bg-black text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 shadow-xl transition-all text-xs uppercase tracking-wide">
            <CheckCircle className="w-4 h-4" /> Görevi Tamamla
          </button>
          <button onClick={handleReject} className="flex-1 bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 border border-red-100 transition-all flex items-center justify-center gap-1 text-xs uppercase">
            <XCircle className="w-4 h-4" /> İptal
          </button>
        </div>
      </div>
    </div>
  );
}