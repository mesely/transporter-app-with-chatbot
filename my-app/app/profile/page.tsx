'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, User, Phone, MapPin, Truck, 
  Loader2, ShieldCheck, X, Anchor, CarFront, 
  Zap, Navigation, Plus, Mail, Map, Globe, Home
} from 'lucide-react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

const TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "İçel (Mersin)", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

const SERVICE_OPTIONS = [
  { id: 'oto_kurtarma', label: 'OTO KURTARMA', icon: CarFront, color: 'bg-red-600' },
  { id: 'vinc', label: 'VİNÇ HİZMETİ', icon: Anchor, color: 'bg-red-900' },
  { id: 'yurt_disi_nakliye', label: 'ULUSLARARASI', icon: Globe, color: 'bg-indigo-600' },
  { id: 'tir', label: 'TİCARİ TIR', icon: Truck, color: 'bg-purple-900' },
  { id: 'kamyon', label: 'TİCARİ KAMYON', icon: Truck, color: 'bg-purple-700' },
  { id: 'kamyonet', label: 'TİCARİ KAMYONET', icon: Truck, color: 'bg-purple-500' },
  { id: 'nakliye', label: 'EVDEN EVE NAKLİYE', icon: Home, color: 'bg-purple-600' },
  { id: 'sarj_istasyonu', label: 'ŞARJ İSTASYONU', icon: Navigation, color: 'bg-blue-600' },
  { id: 'seyyar_sarj', label: 'MOBİL ŞARJ', icon: Zap, color: 'bg-cyan-500' },
];

export default function ProfilePage() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: 'Hizmetleri', email: '', phoneNumber: '',
    serviceType: 'oto_kurtarma', city: 'İzmir', address: '', routes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('transporter_provider_id');
    if (saved) setIsRegistered(true);
  }, []);

  const handleRegister = async () => {
    if (!agreed) return alert("Lütfen hizmet sözleşmesini onaylayın.");
    if (!formData.firstName || !formData.phoneNumber || !formData.email) return alert("Eksik bilgi!");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/data/save-provider`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        localStorage.setItem('transporter_provider_id', 'true');
        setIsRegistered(true);
      }
    } catch (err) { alert("Bağlantı hatası!"); }
    finally { setLoading(false); }
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/70 backdrop-blur-3xl border border-white p-10 rounded-[3rem] shadow-2xl text-center">
          <ShieldCheck size={64} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black uppercase italic">Kayıt Onaylandı</h1>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Tebrikler! Sisteme başarıyla dahil oldunuz.</p>
          <button onClick={() => { localStorage.removeItem('transporter_provider_id'); setIsRegistered(false); }} className="mt-8 text-[10px] font-black text-gray-300 uppercase hover:text-red-500 transition-all">Yeni Kayıt</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#f8fafc] overflow-y-auto custom-scrollbar selection:bg-blue-100">
      <div className="w-full max-w-4xl mx-auto p-6 md:p-12">
        
        {/* SOL ÜST KÜÇÜK BAŞLIK */}
        <header className="mb-10 flex flex-col items-start">
          <div className="bg-gray-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] mb-3">
            Transporter 2026
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Kurumsal Kayıt</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Hizmet vermeye başlamak için bilgileri eksiksiz doldurun.</p>
        </header>

        <div className="space-y-12">
          {/* 1. BÖLÜM: TEMEL BİLGİLER */}
          <section className="space-y-4">
             <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-6 h-0.5 bg-blue-600"></div> İletişim Bilgileri
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="FİRMA ADI / ÜNVAN" onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl p-5 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 shadow-sm"/>
                <input placeholder="E-POSTA ADRESİ" type="email" onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl p-5 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 shadow-sm"/>
                <input placeholder="TELEFON (05XX...)" type="tel" onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl p-5 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 shadow-sm md:col-span-2"/>
             </div>
          </section>

          {/* 2. BÖLÜM: HİZMET TİPİ (RENKLİ GRID) */}
          <section className="space-y-4">
             <h3 className="text-[11px] font-black text-red-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-6 h-0.5 bg-red-600"></div> Hizmet Türü Seçin
             </h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {SERVICE_OPTIONS.map((opt) => (
                   <button
                      key={opt.id}
                      onClick={() => setFormData({...formData, serviceType: opt.id})}
                      className={`flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all gap-3 ${formData.serviceType === opt.id ? 'border-gray-900 bg-gray-900 text-white shadow-2xl -translate-y-1' : 'border-white bg-white/60 text-gray-400 hover:border-gray-200 shadow-sm'}`}
                   >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${opt.color}`}>
                         <opt.icon size={24} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-none">{opt.label}</span>
                   </button>
                ))}
             </div>
          </section>

          {/* 3. BÖLÜM: BÖLGE VE ADRES */}
          <section className="space-y-4">
             <h3 className="text-[11px] font-black text-purple-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-6 h-0.5 bg-purple-600"></div> Bölge ve Rota
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-1 flex items-center shadow-sm">
                   <Map className="ml-4 text-gray-300" size={18} />
                   <select value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-transparent p-4 font-black text-[10px] uppercase outline-none cursor-pointer">
                      {TURKEY_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                   </select>
                </div>
                <input placeholder="HİZMET VERDİĞİNİZ ROTALAR (ÖRN: TÜM TÜRKİYE)" onChange={e => setFormData({...formData, routes: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl p-5 font-bold text-[10px] outline-none shadow-sm"/>
                <textarea placeholder="TAM ADRES (HARİTADA GÖZÜKECEK)" onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl p-5 font-bold text-xs outline-none shadow-sm md:col-span-2 h-24 resize-none"/>
             </div>
          </section>

          {/* 4. BÖLÜM: ONAY VE KAYIT */}
          <section className="flex flex-col items-center pt-6 pb-20 space-y-6">
             <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setAgreed(!agreed)}>
                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${agreed ? 'bg-blue-600 border-blue-600 shadow-xl scale-110' : 'border-gray-200 bg-white'}`}>
                   {agreed && <CheckCircle2 size={20} className="text-white" />}
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Hizmet Sözleşmesini Kabul Ediyorum</span>
                   <button onClick={(e) => { e.stopPropagation(); setShowTerms(true); }} className="text-[9px] font-bold text-blue-500 uppercase text-left hover:underline">Sözleşmeyi Oku</button>
                </div>
             </div>

             <button 
                onClick={handleRegister} 
                disabled={loading || !agreed} 
                className={`w-full max-w-md py-7 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${agreed ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
             >
                {loading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20} />} 
                SİSTEME KAYDI GÖNDER
             </button>
          </section>
        </div>
      </div>

      {/* SÖZLEŞME MODAL */}
      {showTerms && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative">
            <button onClick={() => setShowTerms(false)} className="absolute top-8 right-8 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all"><X size={20}/></button>
            <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase italic italic">Transporter Sözleşmesi</h2>
            <div className="font-bold text-gray-500 text-[10px] uppercase tracking-widest leading-relaxed h-48 overflow-y-auto pr-2 custom-scrollbar">
              <p>1. Verilen bilgilerin doğruluğu sağlayıcının sorumluluğundadır.</p>
              <p className="mt-4">2. Hatalı konum bildiren profiller sistemden kalıcı olarak uzaklaştırılır.</p>
              <p className="mt-4">3. Müşterilerle yapılan görüşmelerde profesyonel etik kuralları geçerlidir.</p>
            </div>
            <button onClick={() => { setAgreed(true); setShowTerms(false); }} className="w-full mt-10 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Onaylıyorum</button>
          </div>
        </div>
      )}
    </div>
  );
}