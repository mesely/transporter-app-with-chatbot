'use client';

import { useState } from 'react';
import { User, Briefcase, ChevronRight, AlertCircle, Loader2, MapPin, CheckCircle2, ShieldCheck, Mail, UserCircle, Phone, ArrowLeft, ChevronDown } from 'lucide-react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

interface AuthModalProps {
  onRoleSelect: (role: 'customer' | 'provider', userData?: any) => void;
}

const COUNTRIES = [
  { code: '+90', flag: '🇹🇷', label: 'TR' },
  { code: '+1',  flag: '🇺🇸', label: 'US' },
  { code: '+49', flag: '🇩🇪', label: 'DE' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
];

const CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

export default function AuthModal({ onRoleSelect }: AuthModalProps) {
  const [step, setStep] = useState<'select' | 'customer-info' | 'provider-login' | 'agreement'>('select');
  const [role, setRole] = useState<'customer' | 'provider' | null>(null);
  
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+90');
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', city: '' });
  const [providerData, setProviderData] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, ''));
    setError('');
  };

  const verifyProvider = async () => {
    if (phone.length < 10) { setError('Geçerli bir numara giriniz.'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/users/provider-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/^0/, '') })
      });

      if (!res.ok) throw new Error('Bulunamadı');
      
      const data = await res.json();
      setProviderData(data);
      setRole('provider');
      setStep('agreement');
    } catch (err) {
      setError('Kayıtlı sürücü hesabı bulunamadı.');
    } finally {
      setLoading(false);
    }
  };

  const registerCustomer = async () => {
    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phone.replace(/^0/, '')}`;
      const payload = {
        role: 'customer',
        firstName: customerInfo.name || 'Misafir',
        phoneNumber: fullPhone,
        email: customerInfo.email,
        city: customerInfo.city,
        termsAccepted: true
      };

      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const newCustomer = await res.json();
      localStorage.setItem('transporter_user_role', 'customer');
      localStorage.setItem('transporter_customer_id', newCustomer._id);
      localStorage.setItem('transporter_terms_agreed', 'true');
      onRoleSelect('customer', newCustomer);
    } catch (err) {
      setError('İşlem başarısız, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const finalizeLogin = () => {
    if (role === 'customer') {
      registerCustomer();
    } else if (role === 'provider' && providerData) {
      localStorage.setItem('transporter_user_role', 'provider');
      localStorage.setItem('transporter_provider_id', providerData._id);
      localStorage.setItem('transporter_terms_agreed', 'true');
      onRoleSelect('provider', providerData);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-100 flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* --- STEP 1: SELECT --- */}
        {step === 'select' && (
          <div className="p-8 pt-12 relative text-center bg-white">
            <div className="inline-flex p-5 bg-blue-600 text-white rounded-[2rem] shadow-xl mb-6">
               <MapPin className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-1 tracking-tight uppercase">Transporter</h2>
            <p className="text-gray-400 text-[10px] font-black mb-10 tracking-[0.3em] uppercase">Lojistik Operasyon Merkezi</p>
            
            <div className="space-y-4">
              <button onClick={() => { setRole('customer'); setStep('customer-info'); }} className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 p-5 rounded-[1.5rem] flex items-center justify-between group transition-all active:scale-95 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-md"><User className="w-6 h-6" /></div>
                  <div className="text-left"><div className="font-black text-gray-900 text-sm uppercase">Müşteriyim</div><div className="text-[9px] text-gray-500 font-bold uppercase">Hizmet Al</div></div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-blue-600" />
              </button>

              <button onClick={() => { setRole('provider'); setStep('provider-login'); }} className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 p-5 rounded-[1.5rem] flex items-center justify-between group transition-all active:scale-95 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-md"><Briefcase className="w-6 h-6" /></div>
                  <div className="text-left"><div className="font-black text-gray-900 text-sm uppercase">Kurumsal</div><div className="text-[9px] text-gray-500 font-bold uppercase">Sürücü Girişi</div></div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-black" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2A: CUSTOMER INFO --- */}
        {step === 'customer-info' && (
          <div className="p-8 pt-8 relative bg-white animate-in slide-in-from-right-10 overflow-y-auto">
            <button onClick={() => setStep('select')} className="text-[10px] font-black text-gray-400 hover:text-black mb-6 flex items-center gap-2 tracking-widest uppercase"><ArrowLeft size={14}/> Geri</button>
            <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Profil Oluştur</h2>
            
            <div className="space-y-4">
                <div>
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Telefon (Zorunlu)</label>
                    <div className="flex bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 transition-all">
                        <div className="bg-gray-100 border-r border-gray-200 px-4 flex items-center"><span className="font-black text-gray-700 text-xs">{countryCode}</span></div>
                        <input type="tel" value={phone} onChange={handlePhoneChange} placeholder="5XX XXX XX XX" className="w-full bg-transparent p-4 font-black text-sm text-gray-900 outline-none" />
                    </div>
                </div>
                <input name="name" placeholder="AD SOYAD (OPSİYONEL)" onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs font-bold text-gray-900 outline-none focus:bg-white" />
                
                <div className="relative group">
                    <select 
                      name="city" 
                      value={customerInfo.city}
                      onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs font-bold text-gray-900 outline-none focus:bg-white appearance-none cursor-pointer"
                    >
                      <option value="">ŞEHİR SEÇİNİZ (OPSİYONEL)</option>
                      {CITIES.map(city => <option key={city} value={city}>{city.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>

                {error && <div className="text-red-600 text-[10px] font-black uppercase text-center">{error}</div>}
                <button onClick={() => setStep('agreement')} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-blue-700 shadow-xl mt-2">Devam Et</button>
            </div>
          </div>
        )}

        {/* --- STEP 2B: PROVIDER LOGIN --- */}
        {step === 'provider-login' && (
          <div className="p-8 pt-8 relative bg-white animate-in slide-in-from-right-10">
            <button onClick={() => setStep('select')} className="text-[10px] font-black text-gray-400 hover:text-black mb-6 flex items-center gap-2 tracking-widest uppercase"><ArrowLeft size={14}/> Geri</button>
            <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tighter">Sürücü Girişi</h2>
            <div className="space-y-6">
              <div className="flex bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-black transition-all">
                  <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="bg-gray-100 border-r border-gray-200 px-2 text-xs font-black outline-none">{COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
                  <input type="tel" value={phone} onChange={handlePhoneChange} placeholder="Numaranız..." className="w-full bg-transparent p-4 font-black text-sm text-gray-900 outline-none" />
              </div>
              {error && <div className="text-red-600 text-[10px] font-black uppercase">{error}</div>}
              <button onClick={verifyProvider} disabled={loading} className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18}/> : 'Giriş Yap'}
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3: AGREEMENT (SUMMARY) --- */}
        {step === 'agreement' && (
            <div className="p-8 pt-8 relative bg-white flex flex-col h-full animate-in slide-in-from-bottom-10">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-green-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"><ShieldCheck size={28} /></div>
                    <h2 className="text-xl font-black text-gray-900 uppercase">Onay Gerekli</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Son Adım: Kullanım Şartları</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-2xl p-4 overflow-y-auto text-[10px] text-gray-600 font-bold leading-relaxed mb-6 border border-gray-100">
                    <p className="mb-3">1. Transporter bir aracı platformdur; hizmet kusurlarından sürücü sorumludur.</p>
                    <p className="mb-3">2. Verileriniz sadece hizmet esnasında ilgili taraflarla paylaşılır.</p>
                    <p>3. Ücretler tahmini olup nihai bedel sürücü ile belirlenir.</p>
                </div>
                <button onClick={finalizeLogin} disabled={loading} className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-green-700 shadow-xl flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={18}/> : <><CheckCircle2 size={18} /> Onaylıyorum ve Başlat</>}
                </button>
            </div>
        )}

      </div>
    </div>
  );
}