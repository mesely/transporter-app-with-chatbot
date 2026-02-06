'use client';

import { Phone, X, MessageSquare, ShieldCheck, Loader2, CheckCircle2, Home } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ActiveOrderPanelProps {
  activeOrder: any;
  onComplete: () => void;
  onCancel: () => void;
}

export default function ActiveOrderPanel({ activeOrder, onComplete, onCancel }: ActiveOrderPanelProps) {
  const pollTimer = useRef<NodeJS.Timeout | null>(null);
  const [providerStatus, setProviderStatus] = useState(activeOrder?.status || 'PENDING');
  const [showAgreementBox, setShowAgreementBox] = useState(false);

  const checkOrderStatus = async () => {
    if (!activeOrder?._id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${activeOrder._id}`);
      const data = await res.json();
      if (data) {
        setProviderStatus(data.status);
        if (data.status === 'CANCELLED') { onCancel(); }
        else if (data.status === 'COMPLETED') { onComplete(); }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeOrder) { pollTimer.current = setInterval(checkOrderStatus, 3000); }
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [activeOrder]);

  if (!activeOrder) return null;

  // --- SÜRÜCÜ ONAYI BEKLENİYOR ---
  if (providerStatus === 'PENDING') {
    return (
      <div className="fixed inset-x-4 bottom-8 z-[500] animate-in slide-in-from-bottom-10">
        <div className="bg-white rounded-[2rem] p-6 shadow-2xl border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
            <div className="h-full bg-yellow-400 animate-[loading_2s_ease-in-out_infinite] w-1/3"></div>
          </div>
          <div className="text-center py-4">
            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mx-auto mb-3" />
            <h3 className="text-lg font-black text-gray-900 uppercase">Onay Bekleniyor</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Sürücü {activeOrder.driverName} talebinizi inceliyor...</p>
          </div>
          <button onClick={onCancel} className="w-full mt-4 py-3 rounded-xl bg-red-50 text-red-600 font-black text-[10px] uppercase">İptal Et</button>
        </div>
      </div>
    );
  }

  // --- ANLAŞMA ONAY KUTUSU ---
  if (showAgreementBox) {
    return (
      <div className="fixed inset-x-4 bottom-8 z-[600] animate-in zoom-in-95">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-2 border-green-500">
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase leading-none">Anlaştınız mı?</h3>
            <p className="text-[11px] text-gray-500 font-bold mt-3 uppercase">Sürücü ile fiyatta ve zamanda anlaştıysanız onaylayın.</p>
          </div>
          <div className="flex flex-col gap-2 mt-6">
            <button onClick={onComplete} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Evet, Anlaştık</button>
            <button onClick={onCancel} className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2"> <Home size={14}/> Anlaşamadık / Kapat </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[500] p-4 pb-8">
      <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl border border-white/50 backdrop-blur-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Bağlantı Kuruldu</span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{activeOrder.driverName}</h3>
            <div className="flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Sistem Onaylı Uzman</span>
            </div>
          </div>
          <button onClick={onCancel} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { window.open(`tel:${activeOrder.phoneNumber}`); setShowAgreementBox(true); }} className="flex items-center justify-center gap-3 bg-black text-white py-5 rounded-2xl shadow-xl active:scale-95 transition-all">
            <Phone size={20} /> <span className="text-xs font-black uppercase">Sürücüyü Ara</span>
          </button>
          <button onClick={() => { window.open(`https://wa.me/${activeOrder.phoneNumber?.replace(/\D/g,'')}`); setShowAgreementBox(true); }} className="flex items-center justify-center gap-3 bg-green-600 text-white py-5 rounded-2xl shadow-xl active:scale-95 transition-all">
            <MessageSquare size={20} /> <span className="text-xs font-black uppercase">Mesaj At</span>
          </button>
        </div>
      </div>
    </div>
  );
}