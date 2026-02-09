'use client';

import { Phone, X, MessageSquare, ShieldCheck, Handshake, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ActiveOrderPanelProps {
  activeOrder: any;
  onComplete: () => void;
  onCancel: () => void;
}

export default function ActiveOrderPanel({ activeOrder, onComplete, onCancel }: ActiveOrderPanelProps) {
  const pollTimer = useRef<NodeJS.Timeout | null>(null);
  const [showAgreementBox, setShowAgreementBox] = useState(false);

  // Arka planda durumu kontrol et (Sürücü iptal ederse veya tamamlarsa haberdar olalım)
  const checkOrderStatus = async () => {
    if (!activeOrder?._id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://transporter-app-with-chatbot.onrender.com'}/orders/${activeOrder._id}`);
      const data = await res.json();
      if (data) {
        if (data.status === 'CANCELLED') { 
            onCancel(); 
        }
        else if (data.status === 'COMPLETED') { 
            onComplete(); 
        }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeOrder) { pollTimer.current = setInterval(checkOrderStatus, 3000); }
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [activeOrder]);

  // 🔥 TEK TARAFLI ONAY (MÜŞTERİ BİTİRİR) 🔥
  const handleCustomerConfirm = async () => {
    // 1. Backend'e "Bu iş bitti" bilgisini gönder
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://transporter-app-with-chatbot.onrender.com'}/orders/${activeOrder._id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'COMPLETED' })
        });
    } catch (e) { console.error("Statü güncellenemedi", e); }

    // 2. UI'ı direkt Puanlama ekranına yönlendir
    onComplete();
  };

  if (!activeOrder) return null;

  // --- ANLAŞMA ONAY KUTUSU (Görüşme Sonrası Çıkar) ---
  if (showAgreementBox) {
    return (
      <div className="fixed inset-x-4 bottom-8 z-[600] animate-in zoom-in-95 duration-300">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-2 border-green-500 relative overflow-hidden">
          
          <div className="text-center relative z-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Handshake className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 uppercase leading-none tracking-tighter">Anlaştınız mı?</h3>
            <p className="text-[11px] text-gray-500 font-bold mt-3 uppercase leading-relaxed px-4">
              Sürücü ile fiyatta anlaştıysanız onaylayın. <br/>
              <span className="text-red-500">Onayladığınızda işlem geçmişe düşer.</span>
            </p>
          </div>
          
          <div className="flex flex-col gap-3 mt-8 relative z-10">
            <button 
                onClick={handleCustomerConfirm} 
                className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-green-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
                <CheckCircle2 size={18}/> Evet, Hizmeti Aldım
            </button>
            
            <button 
                onClick={() => setShowAgreementBox(false)} 
                className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase hover:bg-gray-100"
            >
                 Henüz Değil / Karar Vermedim
            </button>
          </div>

          <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        </div>
      </div>
    );
  }

  // --- STANDART BEKLEME EKRANI ---
  return (
    <div className="fixed inset-x-0 bottom-0 z-[500] p-4 pb-8 animate-in slide-in-from-bottom-10">
      <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-white/50">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Sürücü Hattı Açık</span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">{activeOrder.driverName}</h3>
            <div className="flex items-center gap-1.5 mt-2 bg-blue-50 px-2 py-1 rounded-lg w-fit">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              <span className="text-[9px] text-blue-600 font-black uppercase tracking-tight">Onaylı Profil</span>
            </div>
          </div>
          <button onClick={onCancel} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => { window.location.href = `tel:${activeOrder.phoneNumber}`; setShowAgreementBox(true); }} 
            className="flex items-center justify-center gap-3 bg-black text-white py-5 rounded-[1.2rem] shadow-xl active:scale-95 transition-all group"
          >
            <Phone size={20} className="group-active:rotate-12 transition-transform"/> 
            <span className="text-xs font-black uppercase tracking-wide">Ara</span>
          </button>
          
          <button 
            onClick={() => { window.open(`https://wa.me/${activeOrder.phoneNumber?.replace(/\D/g,'')}`, '_blank'); setShowAgreementBox(true); }} 
            className="flex items-center justify-center gap-3 bg-[#25D366] text-white py-5 rounded-[1.2rem] shadow-xl shadow-green-100 active:scale-95 transition-all"
          >
            <MessageSquare size={20} /> 
            <span className="text-xs font-black uppercase tracking-wide">WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}