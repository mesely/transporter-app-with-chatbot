'use client';

import { Phone, X, MessageSquare, ShieldCheck, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ActiveOrderPanelProps {
  activeOrder: any;
  onComplete: () => void;
  onCancel: () => void;
}

export default function ActiveOrderPanel({ activeOrder, onComplete, onCancel }: ActiveOrderPanelProps) {
  const pollTimer = useRef<NodeJS.Timeout | null>(null);
  const [providerStatus, setProviderStatus] = useState(activeOrder?.status || 'PENDING');

  // --- SÜRÜCÜ DURUMUNU TAKİP ET ---
  const checkOrderStatus = async () => {
    if (!activeOrder?._id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${activeOrder._id}`);
      const data = await res.json();
      
      if (data) {
        setProviderStatus(data.status); // Durumu güncelle

        // 1. SÜRÜCÜ REDDETTİ VEYA İPTAL ETTİ
        if (data.status === 'CANCELLED') {
          alert("Sürücü görevi iptal etti.");
          onCancel(); // Paneli kapat
        }
        // 2. SÜRÜCÜ TAMAMLADI
        else if (data.status === 'COMPLETED') {
          onComplete(); // Puanlamaya geç
        }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeOrder) {
      pollTimer.current = setInterval(checkOrderStatus, 3000); // 3 saniyede bir kontrol
    }
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [activeOrder]);

  if (!activeOrder) return null;

  // --- ONAY BEKLİYOR MODU ---
  if (providerStatus === 'PENDING') {
    return (
      <div className="fixed inset-x-4 bottom-8 z-[500]">
        <div className="bg-white rounded-[2rem] p-6 shadow-2xl border border-gray-100 relative overflow-hidden">
          {/* Yükleniyor Çizgisi */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
            <div className="h-full bg-yellow-400 animate-[loading_2s_ease-in-out_infinite] w-1/3"></div>
          </div>
          
          <div className="text-center py-4">
            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mx-auto mb-3" />
            <h3 className="text-lg font-black text-gray-900">SÜRÜCÜ ONAYI BEKLENİYOR</h3>
            <p className="text-xs text-gray-500 font-bold mt-1">Sürücü {activeOrder.driverName} talebini inceliyor...</p>
          </div>

          <button onClick={onCancel} className="w-full mt-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors uppercase">
            İsteği İptal Et
          </button>
        </div>
      </div>
    );
  }

  // --- İŞLEM KABUL EDİLDİ MODU (Mevcut Görünüm) ---
  return (
    <div className="fixed inset-x-0 bottom-0 z-[500] p-4 pb-8 bg-gradient-to-t from-black/20 to-transparent">
      <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-white/50 backdrop-blur-xl">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Sürücü Geliyor</span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{activeOrder.driverName}</h3>
            <div className="flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] text-gray-400 font-bold uppercase">Onaylı Uzman</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl shadow-inner">
              🚚
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => window.open(`tel:${activeOrder.phoneNumber}`)} 
            className="flex flex-col items-center justify-center gap-1 bg-green-50 text-green-700 py-3 rounded-2xl hover:bg-green-100 transition-colors border border-green-100"
          >
            <Phone className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">Ara</span>
          </button>
          
          <button 
            onClick={() => window.open(`https://wa.me/${activeOrder.phoneNumber?.replace(/\D/g,'')}`)} 
            className="flex flex-col items-center justify-center gap-1 bg-blue-50 text-blue-700 py-3 rounded-2xl hover:bg-blue-100 transition-colors border border-blue-100"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">Mesaj</span>
          </button>

          <button 
            onClick={onCancel} 
            className="flex flex-col items-center justify-center gap-1 bg-red-50 text-red-600 py-3 rounded-2xl hover:bg-red-100 transition-colors border border-red-100"
          >
            <X className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">İptal</span>
          </button>
        </div>

      </div>
    </div>
  );
}