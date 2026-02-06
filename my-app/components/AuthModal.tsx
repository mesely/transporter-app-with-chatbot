'use client';

import { useState } from 'react';
import { User, Briefcase, ChevronRight, AlertCircle, Loader2, MapPin, Globe } from 'lucide-react';

interface AuthModalProps {
  onRoleSelect: (role: 'customer' | 'provider', providerData?: any) => void;
}

const COUNTRIES = [
  { code: '+90', flag: '🇹🇷', label: 'TR' },
  { code: '+1',  flag: '🇺🇸', label: 'USA' },
  { code: '+49', flag: '🇩🇪', label: 'DE' },
  // ...
];

export default function AuthModal({ onRoleSelect }: AuthModalProps) {
  const [step, setStep] = useState<'select' | 'provider-login'>('select');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+90');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setPhone(val);
    setError('');
  };

  const handleProviderLogin = async () => {
    if (phone.length < 4) { setError('Geçersiz numara.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/nearby?lat=38.42&lng=27.14`); 
      const users = await res.json();
      const cleanInput = phone.replace(/^0/, ''); 
      const foundProvider = users.find((u: any) => u.phoneNumber.includes(cleanInput) && u.role === 'provider');

      if (foundProvider) onRoleSelect('provider', foundProvider);
      else setError('Kurumsal kayıt bulunamadı.');
    } catch { setError('Bağlantı hatası.'); } 
    finally { setLoading(false); }
  };

  return (
    // Overlay: Hafif Beyaz Blur
    <div className="fixed inset-0 z-[9999] bg-white/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      
      {/* KART: Beyaz & Gölge (No Green Background) */}
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200 border border-white/50 animate-in zoom-in-95 duration-300 relative overflow-hidden">
        
        {/* Dekoratif Dalga */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none"></div>

        {/* ADIM 1 */}
        {step === 'select' && (
          <div className="p-8 pt-12 relative text-center">
            <div className="inline-flex p-4 bg-white rounded-3xl shadow-lg shadow-gray-100 mb-6 border border-gray-50">
               <MapPin className="w-10 h-10 text-black" />
            </div>
            
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Transporter</h2>
            <p className="text-gray-400 text-xs font-bold mb-10 tracking-wide uppercase">Yeni Nesil Lojistik</p>
            
            <div className="space-y-4">
              {/* MÜŞTERİ: Beyaz Kart + Siyah Vurgu */}
              <button 
                onClick={() => onRoleSelect('customer')}
                className="w-full bg-white hover:bg-gray-50 border border-gray-100 p-5 rounded-3xl flex items-center justify-between group transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-black text-white p-3.5 rounded-2xl shadow-lg shadow-gray-300">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-gray-900 text-lg">MÜŞTERİYİM</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Hizmet Al</div>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-black transition-colors" />
              </button>

              {/* KURUM: Gri Kart */}
              <button 
                onClick={() => setStep('provider-login')}
                className="w-full bg-white hover:bg-gray-50 border border-gray-100 p-5 rounded-3xl flex items-center justify-between group transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 text-gray-600 p-3.5 rounded-2xl">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-gray-900 text-lg">KURUMUM</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Hizmet Ver</div>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-black transition-colors" />
              </button>
            </div>
            
            <p className="text-[10px] text-gray-300 mt-10 font-bold tracking-widest">v2.1 • 2026</p>
          </div>
        )}

        {/* ADIM 2 */}
        {step === 'provider-login' && (
          <div className="p-8 pt-10 relative">
            <button onClick={() => setStep('select')} className="text-[10px] font-black text-gray-400 hover:text-black mb-8 flex items-center gap-1 transition-colors tracking-widest uppercase">
              ← Geri Dön
            </button>
            
            <h2 className="text-2xl font-black text-gray-900 mb-2">KURUM GİRİŞİ</h2>
            <p className="text-xs text-gray-500 font-bold mb-8">Kayıtlı numaranızla devam edin.</p>

            <div className="space-y-6">
              
              <div className="group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 block ml-1 group-focus-within:text-black transition-colors">Telefon Numarası</label>
                <div className="flex bg-gray-50 border-2 border-transparent rounded-2xl overflow-hidden focus-within:bg-white focus-within:border-black focus-within:ring-4 focus-within:ring-gray-100 transition-all">
                  <div className="relative bg-gray-100/50 border-r border-gray-200 w-24 flex items-center justify-center">
                    <select 
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label} {c.code}</option>)}
                    </select>
                    <div className="flex items-center gap-1 pointer-events-none">
                      <span className="text-xl">{COUNTRIES.find(c => c.code === countryCode)?.flag}</span>
                      <span className="font-black text-gray-600 text-sm">{countryCode}</span>
                    </div>
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="5XX XXX XX XX"
                    className="w-full bg-transparent p-4 font-black text-lg text-gray-900 outline-none placeholder:text-gray-300 tracking-wide"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-pulse border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                </div>
              )}

              <button 
                onClick={handleProviderLogin}
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'GİRİŞ YAP'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}