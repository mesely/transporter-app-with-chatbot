'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Phone, Edit, Trash2, MapPin, X, 
  Loader2, Truck, Zap, Anchor, CarFront, Globe, 
  Navigation, Filter, CheckCircle2, Home, Mail, Map
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
  { id: 'nakliye', label: 'EVDEN EVE', icon: Home, color: 'bg-purple-600' },
  { id: 'sarj_istasyonu', label: 'ŞARJ İSTASYONU', icon: Navigation, color: 'bg-blue-600' },
  { id: 'seyyar_sarj', label: 'MOBİL ŞARJ', icon: Zap, color: 'bg-cyan-500' },
];

export default function ProviderModule() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [filterCity, setFilterCity] = useState('İzmir');
  const [filterType, setFilterType] = useState('Tümü');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<any>({
    firstName: '', lastName: 'Hizmetleri', email: '', phoneNumber: '',
    serviceType: 'oto_kurtarma', city: 'İzmir', address: '', routes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterCity !== 'Tümü') query.append('city', filterCity);
      if (filterType !== 'Tümü') query.append('type', filterType);
      const res = await fetch(`${API_URL}/users/all?${query.toString()}`);
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : []);
    } catch (err) { setProviders([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [filterCity, filterType]);

  const getServiceUI = (type: string) => {
    const opt = SERVICE_OPTIONS.find(o => o.id === type) || SERVICE_OPTIONS[0];
    return opt;
  };

  const handleSave = async () => {
    setLoading(true);
    const endpoint = isEditing ? `${API_URL}/users/${formData._id}` : `${API_URL}/data/save-provider`;
    try {
      const res = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'provider' })
      });
      if (res.ok) { setShowModal(false); loadData(); }
    } catch (err) { alert("İşlem hatası!"); }
    finally { setLoading(false); }
  };

  const openEdit = (provider: any) => {
    setFormData(provider);
    setIsEditing(true);
    setShowModal(true);
  };

  return (
    <div className="w-full h-full space-y-10 animate-in fade-in duration-700">
      
      {/* SOL ÜST BAŞLIK DÜZENİ */}
      <header className="flex flex-col items-start gap-2">
        <div className="bg-gray-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">
          Transporter 2026
        </div>
        <div className="flex justify-between items-end w-full">
           <div>
              <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Yönetim Merkezi</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Sistemdeki tüm kurumsal ağın merkezi kontrolü</p>
           </div>
           <button 
              onClick={() => { setIsEditing(false); setFormData({firstName:'', lastName:'Hizmetleri', email:'', phoneNumber:'', city:'İzmir', serviceType:'oto_kurtarma', address:'', routes:''}); setShowModal(true); }}
              className="bg-black hover:bg-blue-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 shadow-2xl transition-all active:scale-95"
           >
              <Plus size={18} /> Yeni Kurum Ekle
           </button>
        </div>
      </header>

      {/* FİLTRELEME ALANI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-sm p-1 flex items-center">
          <Search className="ml-4 text-gray-400" size={18} />
          <input 
            placeholder="İSİM VEYA TEL İLE ARA..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent p-4 font-black text-[10px] uppercase outline-none"
          />
        </div>
        
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-sm p-1 flex items-center">
          <MapPin className="ml-4 text-gray-400" size={18} />
          <select value={filterCity} onChange={e=>setFilterCity(e.target.value)} className="w-full bg-transparent p-4 font-black text-[10px] uppercase outline-none cursor-pointer">
            <option value="Tümü">Tüm Türkiye</option>
            {TURKEY_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-sm p-1 flex items-center">
          <Truck className="ml-4 text-gray-400" size={18} />
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="w-full bg-transparent p-4 font-black text-[10px] uppercase outline-none cursor-pointer">
            <option value="Tümü">Tüm Hizmetler</option>
            {SERVICE_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* LİSTELEME - SCROLLABLE AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        {loading ? (
           <div className="col-span-full text-center py-20 font-black text-gray-400 animate-pulse text-sm uppercase">Veriler Yükleniyor...</div>
        ) : (
          providers.filter(p => p.firstName?.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => {
            const ui = getServiceUI(p.serviceType);
            return (
              <div key={p._id} className="group bg-white/70 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 ${ui.color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-3 transition-transform`}>
                        <ui.icon size={28} />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 text-sm uppercase leading-tight truncate max-w-[150px]">{p.firstName}</h3>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">{ui.label}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => openEdit(p)} className="p-3 bg-white text-gray-400 hover:text-blue-600 rounded-xl shadow-sm border border-gray-100 transition-all"><Edit size={16}/></button>
                       <button onClick={() => { if(confirm("Kalıcı olarak silinecek?")) fetch(`${API_URL}/users/${p._id}`, {method:'DELETE'}).then(()=>loadData()) }} className="p-3 bg-white text-red-300 hover:text-red-600 rounded-xl shadow-sm border border-gray-100 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                     <div className="flex items-center gap-3 text-[10px] font-black text-blue-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                        <Phone size={14}/> {p.phoneNumber}
                     </div>
                     <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                        <MapPin size={14} className="text-green-500"/> {p.city}
                     </div>
                     <div className="text-[9px] font-bold text-gray-400 px-1 uppercase tracking-tight italic line-clamp-1">
                        🌍 Rota: {p.routes || 'Belirtilmedi'}
                     </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL - TAM EKRAN SCROLLABLE FORM */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[3.5rem] p-10 md:p-16 shadow-2xl relative overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 p-3 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all"><X size={24}/></button>
            
            <header className="mb-12">
               <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">{isEditing ? 'Kaydı Güncelle' : 'Yeni Kurum Tanımla'}</h2>
               <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic">Tüm alanlar Google Maps entegrasyonu ile doğrulanacaktır.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               {/* SOL KOLON: İLETİŞİM */}
               <div className="space-y-6">
                  <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                     <div className="w-6 h-0.5 bg-blue-600"></div> Firma & İletişim
                  </h3>
                  <div className="space-y-4">
                     <input placeholder="FİRMA ADI" value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-5 font-bold text-sm outline-none shadow-inner"/>
                     <input placeholder="E-POSTA ADRESİ" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-5 font-bold text-sm outline-none shadow-inner"/>
                     <input placeholder="TELEFON NUMARASI" value={formData.phoneNumber} onChange={e=>setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-5 font-bold text-sm outline-none shadow-inner"/>
                  </div>
                  
                  <h3 className="text-[11px] font-black text-purple-600 uppercase tracking-[0.2em] flex items-center gap-2 pt-4">
                     <div className="w-6 h-0.5 bg-purple-600"></div> Bölge & Rota
                  </h3>
                  <div className="space-y-4">
                     <select value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-5 font-black text-[10px] uppercase outline-none shadow-inner">
                        {TURKEY_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                     </select>
                     <input placeholder="HİZMET ROTALARI (ÖRN: TÜM TÜRKİYE)" value={formData.routes} onChange={e=>setFormData({...formData, routes: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-5 font-bold text-[10px] outline-none shadow-inner"/>
                     <textarea placeholder="TAM ADRES BİLGİSİ" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-5 font-bold text-xs outline-none shadow-inner h-28 resize-none"/>
                  </div>
               </div>

               {/* SAĞ KOLON: HİZMET TÜRÜ */}
               <div className="space-y-6">
                  <h3 className="text-[11px] font-black text-red-600 uppercase tracking-[0.2em] flex items-center gap-2">
                     <div className="w-6 h-0.5 bg-red-600"></div> Hizmet Türü
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                     {SERVICE_OPTIONS.map((opt) => (
                        <button
                           key={opt.id}
                           onClick={() => setFormData({...formData, serviceType: opt.id})}
                           className={`flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all gap-3 ${formData.serviceType === opt.id ? 'border-gray-900 bg-gray-900 text-white shadow-xl scale-95' : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-200'}`}
                        >
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${opt.color}`}>
                              <opt.icon size={20} />
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-tight text-center leading-none">{opt.label}</span>
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="mt-12 flex justify-end">
               <button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex justify-center items-center gap-3"
               >
                  {loading ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={20} />} 
                  {isEditing ? 'DEĞİŞİKLİKLERİ KAYDET' : 'SİSTEME KAYDI TAMAMLA'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}