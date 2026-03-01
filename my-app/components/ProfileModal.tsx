'use client';

import { X, UserCircle2, Save, MapPin, Mail, Phone } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { TURKEY_CITIES } from '../utils/turkey-cities';
import { buildGroupedCityOptions } from '../utils/grouped-city-options';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const COUNTRY_CODES = [
    { code: '+90', flag: '🇹🇷' },
    { code: '+33', flag: '🇫🇷' },
    { code: '+44', flag: '🇬🇧' },
    { code: '+49', flag: '🇩🇪' },
    { code: '+1', flag: '🇺🇸' },
  ];
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    countryCode: '+90'
  });
  const groupedCityOptions = useMemo(() => buildGroupedCityOptions(TURKEY_CITIES), []);

  useEffect(() => {
    if (isOpen) {
      const storedPhone = localStorage.getItem('Transport_user_phone') || '';
      const detectedCode = COUNTRY_CODES.find((c) => storedPhone.startsWith(c.code))?.code || (localStorage.getItem('Transport_user_country_code') || '+90');
      const phoneWithoutCode = storedPhone.startsWith(detectedCode) ? storedPhone.slice(detectedCode.length) : storedPhone;
      // LocalStorage'dan verileri çek
      setFormData({
        name: localStorage.getItem('Transport_user_name') || '',
        phone: phoneWithoutCode || '',
        email: localStorage.getItem('Transport_user_email') || '',
        city: localStorage.getItem('Transport_user_city') || '',
        countryCode: detectedCode
      });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    localStorage.setItem('Transport_user_name', formData.name);
    const normalizedPhone = String(formData.phone || '').replace(/\D/g, '');
    const fullPhone = normalizedPhone ? `${formData.countryCode}${normalizedPhone}` : '';
    localStorage.setItem('Transport_user_phone', fullPhone);
    localStorage.setItem('Transport_user_country_code', formData.countryCode);
    localStorage.setItem('Transport_user_email', formData.email);
    localStorage.setItem('Transport_user_city', formData.city);
    onClose();
    window.location.assign('/settings');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-black/35 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-[2.2rem] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur-xl relative">
        
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-all">
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white shadow-lg">
            <UserCircle2 size={34} className="text-cyan-700" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-wide">Profilim</h3>
          <p className="text-[11px] text-slate-600 font-semibold mt-1">Giriş yapıldı, bilgilerini güncelleyebilirsin.</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 flex items-center gap-3">
            <UserCircle2 size={16} className="text-cyan-700" />
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Ad Soyad</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none" placeholder="Ad Soyad" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 flex items-center gap-2">
            <span className="text-sm font-black text-slate-600">🌐</span>
            <select
              name="countryCode"
              value={formData.countryCode}
              onChange={handleChange}
              className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-black text-slate-700 outline-none"
            >
              {COUNTRY_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.flag} {item.code}
                </option>
              ))}
            </select>
            <div className="h-5 w-px bg-slate-200" />
            <Phone size={16} className="text-cyan-700" />
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none" placeholder="Telefon" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 flex items-center gap-3">
            <Mail size={16} className="text-cyan-700" />
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">E-Posta</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none" placeholder="ornek@mail.com" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 flex items-center gap-3">
            <MapPin size={16} className="text-cyan-700" />
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Şehir</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
              >
                <option value="">Şehir Seçin</option>
                <optgroup label="Türkiye Şehirleri">
                  {groupedCityOptions.turkey.map((city) => (
                    <option key={`tr-${city}`} value={city}>{city}</option>
                  ))}
                </optgroup>
                <optgroup label="Avrupa Şehirleri">
                  {groupedCityOptions.europe.map((city) => (
                    <option key={`eu-${city}`} value={city}>{city}</option>
                  ))}
                </optgroup>
                <optgroup label="Amerika Şehirleri">
                  {groupedCityOptions.america.map((city) => (
                    <option key={`us-${city}`} value={city}>{city}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-500 font-semibold mt-4 px-1">
          Telefon dışındaki alanlar opsiyoneldir, profil görünümü için güncel tutabilirsin.
        </p>

        <button onClick={handleSave} className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 py-4 mt-6 flex items-center justify-center gap-2 text-white shadow-lg active:scale-95 transition-all text-xs font-black uppercase tracking-widest">
          <Save size={16} /> Güncelle
        </button>

      </div>
    </div>
  );
}
