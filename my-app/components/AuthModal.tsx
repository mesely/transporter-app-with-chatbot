'use client';

import { useState, useEffect } from 'react';
import { User, Briefcase, ChevronRight, AlertCircle, Loader2, MapPin } from 'lucide-react';

/**
 * 🌐 AKILLI API_URL
 * Localhost'ta 3005'e, Render'da ise canlı linke otomatik bağlanır.
 */
const API_URL = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3005'
  : 'https://transporter-app-with-chatbot.onrender.com';

interface AuthModalProps {
  onRoleSelect: (role: 'customer' | 'provider', providerData?: any) => void;
}

const COUNTRIES = [
  { code: '+90', flag: '🇹🇷', label: 'TR' },
  { code: '+1',  flag: '🇺🇸', label: 'USA' },
  { code: '+49', flag: '🇩🇪', label: 'DE' }
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

  /**
   * 🚛 KURUMSAL GİRİŞ MANTIĞI
   * nearby sorgusunu 2000km çapında (Tüm Türkiye) yaparak kurumu bulur.
   */
  const handleProviderLogin = async () => {
    if (phone.length < 10) { 
      setError('Lütfen 10 haneli numaranızı girin (5XX...).'); 
      return; 
    }
    
    setLoading(true);
    setError('');

    try {
      // Türkiye geneli arama için radius=2000 ekledik
      const res = await fetch(`${API_URL}/users/nearby?lat=38.42&lng=27.14&radius=2000`); 
      const users = await res.json();
      
      const cleanInput = phone.replace(/^0/, ''); // Başındaki 0'ı at
      
      // Telefon numarasının son 10 hanesini eşleştirir (daha güvenli)
      const foundProvider = users.find((u: any) => 
        u.role === 'provider' && u.phoneNumber?.replace(/\D/g, '').endsWith(cleanInput)
      );

      if (foundProvider) {
        console.log("✅ Kurum Girişi Başarılı:", foundProvider.firstName);
        onRoleSelect('provider', foundProvider);
      } else {
        setError('Bu numara ile kayıtlı bir kurumsal hesap bulunamadı.');
      }
    } catch (err) {
      console.error("Giriş Hatası:", err);
      setError('Sunucuya bağlanılamadı. Lütfen internetinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-gray-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
        
        {/* Dekoratif Gradient Üst Şerit */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-gray-50/50 to-transparent pointer-events-none"></div>

        {/* --- ADIM 1: ROL SEÇİMİ --- */}
        {step === 'select' && (
          <div className="p-8 pt-12 relative text-center">
            <div className="inline-flex p-4 bg-black text-white rounded-3xl shadow-xl mb-6">
               <MapPin className="w-10 h-10" />
            </div>
            
            <h2 className="text-3xl font-black text-gray-900 mb-1 tracking-tight uppercase">Transporter</h2>
            <p className="text-gray-400 text-[10px] font-black mb-10 tracking-[0.2em] uppercase">Lojistik Operasyon Merkezi</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => {
                  console.log("⚡ Müşteri Modu Seçildi");
                  onRoleSelect('customer');
                }}
                className="w-full bg-white hover:bg-gray-50 border border-gray-100 p-5 rounded-3xl flex items-center justify-between group transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-lg shadow-blue-100">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-gray-900 text-base uppercase">Müşteriyim</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Hemen Hizmet Al</div>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-black transition-colors" />
              </button>

              <button 
                onClick={() => setStep('provider-login')}
                className="w-full bg-white hover:bg-gray-50 border border-gray-100 p-5 rounded-3xl flex items-center justify-between group transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gray-900 text-white p-3.5 rounded-2xl shadow-lg shadow-gray-400">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-gray-900 text-base uppercase">Kurumum</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Hizmet Sağla</div>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-black transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* --- ADIM 2: KURUM GİRİŞİ --- */}
        {step === 'provider-login' && (
          <div className="p-8 pt-10 relative animate-in slide-in-from-right-5">
            <button onClick={() => setStep('select')} className="text-[10px] font-black text-gray-400 hover:text-black mb-8 flex items-center gap-1 transition-colors tracking-widest uppercase">
              ← Geri Dön
            </button>
            
            <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Kurum Girişi</h2>
            <p className="text-[11px] text-gray-500 font-bold mb-8 uppercase">Kayıtlı numaranız ile sisteme bağlanın.</p>

            <div className="space-y-6">
              <div className="group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 block ml-1">Telefon Numarası</label>
                <div className="flex bg-gray-50 border-2 border-transparent rounded-2xl overflow-hidden focus-within:bg-white focus-within:border-black transition-all">
                  <div className="relative bg-gray-100/50 border-r border-gray-200 w-24 flex items-center justify-center">
                    <select 
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label} {c.code}</option>)}
                    </select>
                    <div className="flex items-center gap-1">
                      <span className="text-lg">{COUNTRIES.find(c => c.code === countryCode)?.flag}</span>
                      <span className="font-black text-gray-600 text-sm">{countryCode}</span>
                    </div>
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={handlePhoneChange}
                    autoFocus
                    placeholder="5XX XXX XX XX"
                    className="w-full bg-transparent p-4 font-black text-lg text-gray-900 outline-none placeholder:text-gray-300"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 border border-red-100 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                </div>
              )}

              <button 
                onClick={handleProviderLogin}
                disabled={loading}
                className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sisteme Bağlan'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}