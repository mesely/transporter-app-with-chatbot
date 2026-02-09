'use client';

import { X, UserCircle2, Save, MapPin, Mail, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: ''
  });

  useEffect(() => {
    if (isOpen) {
      // LocalStorage'dan verileri çek
      setFormData({
        name: localStorage.getItem('transporter_user_name') || '',
        phone: localStorage.getItem('transporter_user_phone') || '',
        email: localStorage.getItem('transporter_user_email') || '',
        city: localStorage.getItem('transporter_user_city') || ''
      });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    localStorage.setItem('transporter_user_name', formData.name);
    localStorage.setItem('transporter_user_phone', formData.phone);
    localStorage.setItem('transporter_user_email', formData.email);
    localStorage.setItem('transporter_user_city', formData.city);
    onClose();
    // Opsiyonel: Bir toast mesajı gösterilebilir
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border border-gray-100">
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-all">
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
            <UserCircle2 size={40} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Profilim</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Bilgilerini güncel tut</p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-gray-100 focus-within:border-black/20 focus-within:bg-white transition-all">
            <UserCircle2 size={18} className="text-gray-400" />
            <div className="flex-1">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Ad Soyad</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-transparent text-xs font-bold text-gray-900 outline-none placeholder:text-gray-300" placeholder="İSİM GİRİNİZ" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-gray-100 focus-within:border-black/20 focus-within:bg-white transition-all">
            <Phone size={18} className="text-gray-400" />
            <div className="flex-1">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Telefon</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-transparent text-xs font-bold text-gray-900 outline-none placeholder:text-gray-300" placeholder="5XX XXX XX XX" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-gray-100 focus-within:border-black/20 focus-within:bg-white transition-all">
            <Mail size={18} className="text-gray-400" />
            <div className="flex-1">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">E-Posta</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-transparent text-xs font-bold text-gray-900 outline-none placeholder:text-gray-300" placeholder="ORNEK@MAIL.COM" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-gray-100 focus-within:border-black/20 focus-within:bg-white transition-all">
            <MapPin size={18} className="text-gray-400" />
            <div className="flex-1">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Şehir</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-transparent text-xs font-bold text-gray-900 outline-none placeholder:text-gray-300" placeholder="İSTANBUL" />
            </div>
          </div>
        </div>
        
        <p className="text-[9px] text-gray-400 font-bold mt-4 px-2">
          * Telefon numarası dışındaki bilgiler opsiyoneldir ancak güvenliğiniz için doldurmanız önerilir.
        </p>

        <button onClick={handleSave} className="w-full bg-black text-white font-black py-5 rounded-2xl mt-6 flex items-center justify-center gap-2 shadow-xl hover:bg-gray-800 active:scale-95 transition-all uppercase text-xs tracking-widest">
          <Save size={16} /> Kaydet ve Çık
        </button>

      </div>
    </div>
  );
}