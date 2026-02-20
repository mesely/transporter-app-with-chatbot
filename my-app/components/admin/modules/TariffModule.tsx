/**
 * @file TariffModule.tsx
 * @description Transport 245 Yönetici Paneli - Tarife Yönetimi.
 * GÜNCELLEME: Yolcu Taşıma (Minibüs, Otobüs, VIP) eklendi.
 * GÜNCELLEME: Mobil Şarj ve İstasyon isimlendirmeleri frontend ile eşitlendi.
 * UPDATE: Tasarıma Glassmorphism eklendi, ikonlar inceltildi (strokeWidth={1.5}), turkuaz (#49b5c2) tema eklendi ve Mobil Şarj ikonu güncellendi.
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Save, Truck, Zap, Anchor, CarFront, Globe, 
  Navigation, Loader2, Info, Users, Bus, Crown 
} from 'lucide-react';

const API_URL = process.env.BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';

// Frontend ile %100 uyumlu ID ve Konfigürasyon
const SERVICE_TYPES = [
  // KURTARMA GRUBU
  { id: 'vinc', label: 'Vinç Hizmetleri', icon: Anchor, color: 'bg-rose-700', shadow: 'shadow-rose-900/20' },
  { id: 'oto_kurtarma', label: 'Oto Kurtarma / Çekici', icon: CarFront, color: 'bg-red-600', shadow: 'shadow-red-600/20' },
  
  // NAKLİYE GRUBU
  { id: 'nakliye', label: 'Yurt İçi Nakliye', icon: Truck, color: 'bg-purple-600', shadow: 'shadow-purple-600/20' },
  { id: 'yurt_disi_nakliye', label: 'Yurt Dışı Lojistik', icon: Globe, color: 'bg-indigo-600', shadow: 'shadow-indigo-600/20' },
  
  // ENERJİ GRUBU
  { id: 'istasyon', label: 'Şarj İstasyonu', icon: Navigation, color: 'bg-blue-700', shadow: 'shadow-blue-600/20' },
  { id: 'seyyar_sarj', label: 'Mobil Şarj', icon: Zap, color: 'bg-cyan-500', shadow: 'shadow-cyan-500/20' },

  // YOLCU TAŞIMA GRUBU (YENİ)
  { id: 'minibus', label: 'Yolcu - Minibüs', icon: Users, color: 'bg-teal-600', shadow: 'shadow-teal-600/20' },
  { id: 'otobus', label: 'Yolcu - Otobüs', icon: Bus, color: 'bg-teal-800', shadow: 'shadow-teal-800/20' },
  { id: 'midibus', label: 'Yolcu - Midibüs', icon: Bus, color: 'bg-emerald-600', shadow: 'shadow-emerald-600/20' },
  { id: 'vip_tasima', label: 'Yolcu - VIP Transfer', icon: Crown, color: 'bg-emerald-800', shadow: 'shadow-emerald-800/20' },
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
      if(res.ok) alert(`${type.toUpperCase()} tarifesi başarıyla güncellendi.`);
    } catch (e) {
      alert("Bağlantı hatası!");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in bg-[8ccde6] duration-700">
      {/* Üst Bilgi Kartı */}
      <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] border border-white/50 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none drop-shadow-sm">Global Tarifeler</h2>
          <p className="text-[11px] text-[#49b5c2] font-bold uppercase tracking-[0.3em] mt-3">Transport 245 Birim Maliyet Yönetimi</p>
        </div>
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/40 shadow-sm">
          <Info size={18} strokeWidth={1.5} className="text-[#49b5c2]" />
          <span className="text-[10px] font-black text-gray-700 uppercase">Fiyatlar anlık senkronize edilir</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 pb-20">
        {SERVICE_TYPES.map((service) => {
          const dbTariff = tariffs.find(t => t.serviceType === service.id);
          return (
            <div key={service.id} className="group relative bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col lg:flex-row items-center justify-between gap-8">
              
              <div className="flex items-center gap-6 w-full lg:w-auto">
                <div className={`w-20 h-20 ${service.color} ${service.shadow} text-white rounded-3xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-500`}>
                  {service.id === 'seyyar_sarj' ? (
                     <img src="/icons/GeziciIcon.png" className="w-10 h-10 invert brightness-200" alt="Mobil Şarj" />
                  ) : (
                     <service.icon size={36} strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 uppercase tracking-tighter text-xl sm:text-2xl">{service.label}</h3>
                  <span className="text-[10px] font-bold text-[#49b5c2] uppercase tracking-widest">Sistem ID: {service.id}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 w-full lg:w-auto justify-center md:justify-end">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Açılış (TL)</label>
                  <input 
                    id={`open-${service.id}`}
                    type="number" 
                    defaultValue={dbTariff?.openingFee || 250} 
                    className="w-32 sm:w-36 bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-5 text-lg font-black text-gray-900 text-center focus:bg-white/80 outline-none transition-colors shadow-sm" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Birim (TL)</label>
                  <input 
                    id={`unit-${service.id}`}
                    type="number" 
                    defaultValue={dbTariff?.pricePerUnit || 30} 
                    className="w-32 sm:w-36 bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-5 text-lg font-black text-gray-900 text-center focus:bg-white/80 outline-none transition-colors shadow-sm" 
                  />
                </div>
                <button 
                  disabled={savingId === service.id}
                  onClick={() => {
                    const o = (document.getElementById(`open-${service.id}`) as HTMLInputElement).value;
                    const u = (document.getElementById(`unit-${service.id}`) as HTMLInputElement).value;
                    handleUpdate(service.id, Number(o), Number(u));
                  }}
                  className="self-end bg-slate-900 text-white p-6 rounded-3xl shadow-lg hover:bg-black active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingId === service.id ? <Loader2 className="animate-spin" /> : <Save size={24} strokeWidth={1.5} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}