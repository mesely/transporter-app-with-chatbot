'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

export default function ReportModal({ isOpen, onClose, orderId }: ReportModalProps) {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+90');
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (isOpen) {
      const storedPhone = localStorage.getItem('transporter_user_phone');
      const storedCC = localStorage.getItem('transporter_user_cc');
      if (storedPhone) setPhone(storedPhone);
      if (storedCC) setCountryCode(storedCC);
      setReason(''); setOtherReason(''); setDetails('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!reason) { alert("Lütfen bir sebep seçin."); return; }
    const finalReason = reason === 'other' ? otherReason : reason;
    const fullPhone = `${countryCode} ${phone}`;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, contact: fullPhone, reason: finalReason, details })
      });
      alert("Şikayetiniz işleme alındı.");
    } catch (error) { console.error(error); alert("Hata oluştu."); }
    onClose();
  };

  if (!isOpen) return null;

  return (
    // Overlay: Hafif Koyu Gri
    <div className="fixed inset-0 z-[20000] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      
      {/* KART: Light Glass */}
      <div className="bg-white/80 backdrop-blur-xl w-full max-w-sm rounded-[2rem] p-6 relative shadow-2xl animate-in zoom-in-95 border border-white/60">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-gray-600 transition-all shadow-sm">
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100/80 p-3 rounded-full border border-red-200">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Sorun Bildir</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Ref: #{orderId?.substring(0,6)}</p>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* İletişim */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-1 ml-1 tracking-widest">İletişim</label>
            <div className="flex gap-2">
              <select 
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-white/50 border border-white/60 rounded-xl px-2 py-3 text-sm font-bold text-gray-800 outline-none focus:bg-white transition-all shadow-sm"
              >
                <option value="+90">🇹🇷 +90</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+1">🇺🇸 +1</option>
              </select>

              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="555 123 45 67"
                className="flex-1 bg-white/50 border border-white/60 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white placeholder:text-gray-400 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Sebep */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-1 ml-1 tracking-widest">Sebep</label>
            <div className="relative">
              <select 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-800 outline-none focus:bg-white appearance-none shadow-sm transition-all"
              >
                <option value="">Bir sebep seçin...</option>
                <option value="Sürücü gelmedi">Sürücü gelmedi</option>
                <option value="Fazla ücret talep edildi">Fazla ücret talep edildi</option>
                <option value="Kaba davranış">Kaba davranış / Hakaret</option>
                <option value="Araç uygun değildi">Araç uygun değildi</option>
                <option value="other">Diğer</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
            </div>
          </div>

          {/* Diğer */}
          {reason === 'other' && (
            <div className="animate-in slide-in-from-top-2">
              <input 
                type="text" 
                placeholder="Kısaca sebebi yazın..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                className="w-full bg-white border border-red-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 ring-red-100 outline-none shadow-sm"
              />
            </div>
          )}

          {/* Detay */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-1 ml-1 tracking-widest">Detaylar</label>
            <textarea 
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Eklemek istedikleriniz..."
              className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 resize-none outline-none focus:bg-white shadow-sm transition-all"
            />
          </div>

        </div>

        {/* BUTON: Katı Kırmızı */}
        <button 
          onClick={handleSubmit}
          className="w-full bg-red-600 text-white font-black py-4 rounded-xl mt-6 flex items-center justify-center gap-2 shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all"
        >
          <Send size={18} />
          GÖNDER
        </button>

      </div>
    </div>
  );
}