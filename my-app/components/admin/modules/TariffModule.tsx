'use client';

import { useState, useEffect } from 'react';
import { Save, Truck, Zap, BatteryCharging, Wrench, User } from 'lucide-react';

// API URL SABİTİ (process.env yerine garanti olması için)
const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

export default function TariffModule() {
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/tariffs`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setTariffs(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (t: string) => {
    switch(t) {
      case 'kurtarici': return <Wrench className="w-5 h-5 text-red-500" />;
      case 'nakliye': return <Truck className="w-5 h-5 text-purple-500" />;
      case 'sarj_istasyonu': return <Zap className="w-5 h-5 text-yellow-500" />;
      default: return <User className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">TARİFE YÖNETİMİ</h2>
        <button className="bg-black text-white px-5 py-3 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-gray-800 shadow-lg active:scale-95 transition-all">
          <Save className="w-4 h-4" /> KAYDET
        </button>
      </div>
      
      {loading ? <div className="text-center py-10 text-gray-400 font-bold">Yükleniyor...</div> : tariffs.map((t) => (
        <div key={t._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 rounded-2xl shadow-sm border border-gray-100">{getIcon(t.serviceType)}</div>
            <div>
              <h3 className="font-black text-gray-900 uppercase text-sm tracking-wide">{t.serviceType?.replace('_',' ')}</h3>
              <span className="text-[10px] text-gray-400 font-bold tracking-widest">ID: #{t._id.substr(-4)}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Açılış (TL)</label>
              <input type="number" defaultValue={t.openingFee} className="w-28 bg-white border border-gray-200 rounded-xl p-3 text-sm font-black text-gray-900 text-center outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Birim (TL)</label>
              <input type="number" defaultValue={t.pricePerUnit} className="w-28 bg-white border border-gray-200 rounded-xl p-3 text-sm font-black text-gray-900 text-center outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}