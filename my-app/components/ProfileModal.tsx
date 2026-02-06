'use client';

import { useState, useEffect } from 'react';
import { X, ShieldCheck, Save } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+90');

  useEffect(() => {
    if (isOpen) {
      const storedPhone = localStorage.getItem('transporter_user_phone');
      const storedCC = localStorage.getItem('transporter_user_cc');
      if (storedPhone) setPhone(storedPhone);
      if (storedCC) setCountryCode(storedCC);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (phone.length < 10) { alert("Lütfen geçerli bir numara girin."); return; }
    localStorage.setItem('transporter_user_phone', phone);
    localStorage.setItem('transporter_user_cc', countryCode);
    const deviceId = localStorage.getItem('transporter_device_id');

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/guest-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, phone, countryCode })
      });
    } catch (error) { console.error(error); }

    alert("Numaranız güvenle kaydedildi.");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[20000] backdrop-blur-sm bg-transparent flex items-center justify-center p-4 animate-in fade-in">
      
      {/* KART: Light Glass */}
      <div className="bg-white/70 backdrop-blur-xl w-full max-w-sm rounded-[2rem] p-6 relative shadow-2xl animate-in zoom-in-95 border border-white/40">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/40 hover:bg-white/60 rounded-full text-gray-800 transition-all shadow-sm">
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center mb-4 shadow-sm border border-white/50">
            <ShieldCheck className="w-8 h-8 text-black" />
          </div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Güvenli Profil</h3>
          <p className="text-sm text-gray-600 mt-2 font-bold">
            Numaranızı ekleyin, sürücüler size daha hızlı ulaşsın.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-black text-gray-500 uppercase ml-1 tracking-widest">Telefon Numaranız</label>
          <div className="flex gap-2">
            <select 
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="bg-white/50 border border-white/60 rounded-xl px-2 py-3.5 text-sm font-black text-gray-900 outline-none focus:bg-white transition-all text-center min-w-[80px]"
            >
              <option value="+90">🇹🇷 +90</option>
              <option value="+49">🇩🇪 +49</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+44">🇬🇧 +44</option>
            </select>

            <input 
              type="tel" 
              placeholder="555 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              className="flex-1 bg-white/50 border border-white/60 rounded-xl px-4 py-3.5 text-sm font-black text-gray-900 outline-none focus:bg-white placeholder:text-gray-400 transition-all tracking-wider"
            />
          </div>
        </div>

        {/* BUTON DÜZELTİLDİ: OPAK BEYAZ (Solid White) */}
        <button 
          onClick={handleSave}
          className="w-full bg-white text-black font-black py-4 rounded-2xl mt-8 flex items-center justify-center gap-2 shadow-xl hover:bg-gray-50 active:scale-95 transition-all border border-gray-100"
        >
          <Save size={18} />
          KAYDET
        </button>
      </div>
    </div>
  );
}