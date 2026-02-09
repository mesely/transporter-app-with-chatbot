'use client';

import { useState, useEffect } from 'react';
import { Save, Truck, Zap, Anchor, CarFront, Globe, Navigation, Loader2, Info } from 'lucide-react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

// Tüm yasal ve operasyonel tipler
const SERVICE_TYPES = [
  { id: 'vinc', label: 'Vinç Hizmetleri', icon: Anchor, color: 'bg-red-900', shadow: 'shadow-red-900/20' },
  { id: 'oto_kurtarma', label: 'Oto Kurtarma / Çekici', icon: CarFront, color: 'bg-red-600', shadow: 'shadow-red-600/20' },
  { id: 'nakliye', label: 'Yurt İçi Nakliye', icon: Truck, color: 'bg-purple-600', shadow: 'shadow-purple-600/20' },
  { id: 'yurt_disi_nakliye', label: 'Yurt Dışı Lojistik', icon: Globe, color: 'bg-indigo-600', shadow: 'shadow-indigo-600/20' },
  { id: 'sarj_istasyonu', label: 'Elektrikli Şarj İstasyonu', icon: Navigation, color: 'bg-blue-600', shadow: 'shadow-blue-600/20' },
  { id: 'seyyar_sarj', label: 'Seyyar / Mobil Şarj', icon: Zap, color: 'bg-cyan-500', shadow: 'shadow-cyan-500/20' },
];

export default function TariffModule() {
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/tariffs`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTariffs(data);
      })
      .catch(err => console.error("Tarife yükleme hatası:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (type: string, opening: number, unit: number) => {
    setSavingId(type);
    try {
      const res = await fetch(`${API_URL}/tariffs`, {
        method: 'POST', // Backend'deki findOneAndUpdate (upsert) mantığını kullanır
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType: type, openingFee: opening, pricePerUnit: unit })
      });
      if(res.ok) alert(`${type.toUpperCase()} başarıyla güncellendi.`);
    } catch (e) {
      alert("Bağlantı hatası!");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Üst Bilgi Kartı */}
      <div className="bg-white/20 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/40 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Global Tarifeler</h2>
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-3">Sistem genelindeki birim maliyetleri yönetin</p>
        </div>
        <div className="flex items-center gap-3 bg-blue-500/10 px-6 py-3 rounded-2xl border border-blue-500/20">
          <Info size={18} className="text-blue-600" />
          <span className="text-[10px] font-black text-blue-700 uppercase">Katsayılar anlık senkronize edilir</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 pb-20">
        {SERVICE_TYPES.map((service) => {
          const dbTariff = tariffs.find(t => t.serviceType === service.id);
          return (
            <div key={service.id} className="group relative bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:bg-white/60 transition-all duration-500 flex flex-col lg:flex-row items-center justify-between gap-8">
              
              <div className="flex items-center gap-6 w-full lg:w-auto">
                <div className={`w-20 h-20 ${service.color} ${service.shadow} text-white rounded-3xl flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform duration-500`}>
                  <service.icon size={36} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 uppercase tracking-tighter text-2xl">{service.label}</h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sistem Anahtarı: {service.id}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 w-full lg:w-auto justify-center md:justify-end">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Açılış (TL)</label>
                  <input 
                    id={`open-${service.id}`}
                    type="number" 
                    defaultValue={dbTariff?.openingFee || 250} 
                    className="w-36 bg-white/50 border border-white rounded-2xl p-5 text-lg font-black text-gray-900 text-center focus:ring-4 focus:ring-blue-500/20 outline-none transition-all shadow-inner" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">KM / Birim (TL)</label>
                  <input 
                    id={`unit-${service.id}`}
                    type="number" 
                    defaultValue={dbTariff?.pricePerUnit || 30} 
                    className="w-36 bg-white/50 border border-white rounded-2xl p-5 text-lg font-black text-gray-900 text-center focus:ring-4 focus:ring-blue-500/20 outline-none transition-all shadow-inner" 
                  />
                </div>
                <button 
                  disabled={savingId === service.id}
                  onClick={() => {
                    const o = (document.getElementById(`open-${service.id}`) as HTMLInputElement).value;
                    const u = (document.getElementById(`unit-${service.id}`) as HTMLInputElement).value;
                    handleUpdate(service.id, Number(o), Number(u));
                  }}
                  className="self-end bg-gray-900 text-white p-6 rounded-3xl shadow-2xl hover:bg-black active:scale-90 transition-all disabled:opacity-50"
                >
                  {savingId === service.id ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}