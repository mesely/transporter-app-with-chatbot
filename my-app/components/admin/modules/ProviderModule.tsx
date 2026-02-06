'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Phone, Edit, Trash2, MapPin, X, Truck, Zap, Wrench, User, Star } from 'lucide-react';

// API URL SABİTİ
const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

export default function ProviderModule() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  
  const [formData, setFormData] = useState({ 
    firstName: '', lastName: '', phoneNumber: '', email: '', 
    serviceType: 'kurtarici', address: '' 
  });

  useEffect(() => {
    // İzmir merkezli yakındaki araçları çek
    fetch(`${API_URL}/users/nearby?lat=38.4237&lng=27.1428`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => { if(Array.isArray(data)) setProviders(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (t: string) => {
    if(t==='kurtarici') return <Wrench className="w-5 h-5 text-gray-600"/>;
    if(t==='nakliye' || t==='tir' || t==='kamyon' || t==='kamyonet') return <Truck className="w-5 h-5 text-gray-600"/>;
    if(t?.includes('sarj')) return <Zap className="w-5 h-5 text-gray-600"/>;
    return <User className="w-5 h-5 text-gray-600"/>;
  };

  const handleOpenModal = (p: any = null) => {
    const safeAddress = (p && typeof p.address === 'string') ? p.address : '';
    if(p) { 
      setEditingProvider(p); 
      setFormData({ 
        firstName: p.firstName||'', lastName: p.lastName||'', 
        phoneNumber: p.phoneNumber?.replace('+90','')||'', email: p.email||'', 
        serviceType: p.serviceType||'kurtarici', address: safeAddress
      }); 
    } else { 
      setEditingProvider(null); 
      setFormData({ firstName: '', lastName: '', phoneNumber: '', email: '', serviceType: 'kurtarici', address: '' }); 
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const url = editingProvider 
      ? `${API_URL}/users/${editingProvider._id}` 
      : `${API_URL}/users/register`;
    
    const method = editingProvider ? 'PATCH' : 'POST';
    const formattedPhone = formData.phoneNumber.startsWith('+90') ? formData.phoneNumber : `+90${formData.phoneNumber.replace(/^0+/, '')}`;

    const body = {
      ...formData,
      phoneNumber: formattedPhone,
      role: 'provider',
      ...(editingProvider ? {} : { password: '123', location: { type: 'Point', coordinates: [27.14, 38.42] } })
    };

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if(res.ok) { 
        alert("İşlem Başarılı"); 
        setShowModal(false); 
        window.location.reload(); 
      } else {
        alert("Hata oluştu");
      }
    } catch(e) { alert("Sunucu hatası"); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Silmek istiyor musunuz?")) return;
    try {
      await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
      setProviders(providers.filter(p => p._id !== id));
    } catch(e) { alert("Silinemedi"); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Üst Kısım */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">KURUMLAR ({providers.length})</h2>
        <button onClick={() => handleOpenModal(null)} className="bg-gray-900 text-white px-5 py-3 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-black transition-all shadow-sm active:scale-95">
          <Plus className="w-4 h-4" /> YENİ EKLE
        </button>
      </div>

      {/* Arama Barı */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="İsim, telefon veya hizmet ara..." className="w-full bg-white pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all" />
      </div>

      {/* Liste */}
      {loading ? <div className="text-center py-10 text-gray-400 font-bold">Yükleniyor...</div> : providers.map((p) => (
        <div key={p._id} className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col gap-4 hover:border-gray-400 transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="p-3 bg-gray-100 rounded-lg h-fit border border-gray-200">{getIcon(p.serviceType)} </div> 
              <div className="flex items-center gap-1">
  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
  <span className="text-xs font-bold text-gray-600">
    {p.rating > 0 ? p.rating.toFixed(1) : "Puan Yok"}
  </span>
</div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{p.firstName} {p.lastName}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">{p.serviceType?.replace('_',' ')}</span>
                  <span className="text-[10px] text-gray-600 font-bold flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-200"><Phone className="w-3 h-3" /> {p.phoneNumber}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal(p)} className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p._id)} className="p-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2 border border-gray-200">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-700 truncate">
              {typeof p.address === 'string' && p.address.length > 0 ? p.address : 'Adres girilmemiş'}
            </span>
          </div>
        </div>
      ))}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[2001] bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600"><X className="w-5 h-5"/></button>
            <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">{editingProvider ? 'DÜZENLE' : 'YENİ EKLE'}</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Ad" value={formData.firstName} onChange={e=>setFormData({...formData,firstName:e.target.value})} className="bg-white border border-gray-300 rounded-lg p-3 text-sm font-bold w-full outline-none focus:border-black transition-all" />
                <input placeholder="Soyad" value={formData.lastName} onChange={e=>setFormData({...formData,lastName:e.target.value})} className="bg-white border border-gray-300 rounded-lg p-3 text-sm font-bold w-full outline-none focus:border-black transition-all" />
              </div>
              <select value={formData.serviceType} onChange={e=>setFormData({...formData,serviceType:e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm font-bold outline-none focus:border-black">
                <option value="kurtarici">Oto Kurtarıcı</option>
                <option value="nakliye">Evden Eve Nakliye</option>
                <option value="tir">Ticari Tır</option>
                <option value="kamyon">Ticari Kamyon</option>
                <option value="kamyonet">Ticari Kamyonet</option>
                <option value="vinc">Kiralık Vinç</option>
                <option value="sarj_istasyonu">Şarj İstasyonu</option>
                <option value="seyyar_sarj">Mobil Şarj</option>
              </select>
              <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:border-black">
                  <div className="bg-gray-100 px-3 py-3 flex items-center gap-1 border-r border-gray-300"><span className="text-sm font-bold text-gray-600">+90</span></div>
                  <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '')})} className="w-full bg-transparent p-3 text-sm font-bold outline-none" placeholder="555..." maxLength={10}/>
              </div>
              <input type="email" placeholder="E-posta" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm font-bold outline-none focus:border-black transition-all" />
              <input type="text" placeholder="Adres" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm font-bold outline-none focus:border-black transition-all" />
              
              <button onClick={handleSave} className="w-full mt-6 bg-gray-900 text-white py-4 rounded-lg font-bold text-sm hover:bg-black transition-all shadow-lg active:scale-95">
                KAYDET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}