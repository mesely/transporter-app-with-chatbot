'use client';

import { useState, useEffect } from 'react';
import { Search, Phone, MessageCircle, CheckCircle, XCircle, FileWarning, Calendar, ShieldAlert, Clock, ArrowRight } from 'lucide-react';

const API_URL = 'https://Transport-app-with-chatbot.onrender.com';

export default function ComplaintModule() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/reports`)
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setReports(data.reverse()); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/30 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/50 shadow-2xl">
         <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Vaka Merkezi</h2>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-3">Müşteri güvenliği ve kalite kontrol</p>
         </div>
         <div className="bg-red-500 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-red-400 flex items-center gap-3 shadow-2xl shadow-red-200">
            <ShieldAlert size={20} className="animate-pulse" /> {reports.filter(r=>r.status==='OPEN').length} Acil Çözüm Bekliyor
         </div>
      </div>

      <div className="grid grid-cols-1 gap-8 pb-20">
        {reports.length === 0 ? (
          <div className="text-center py-40 bg-white/20 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-white/40">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6 opacity-50" />
            <h3 className="text-gray-400 font-black text-2xl uppercase tracking-widest">Sistem Güvende</h3>
            <p className="text-gray-400 font-bold text-xs mt-2 uppercase">Şu an incelenecek rapor bulunmuyor.</p>
          </div>
        ) : reports.map((r) => (
          <div key={r._id} className="group bg-white/50 backdrop-blur-xl rounded-[3rem] border border-white p-10 shadow-2xl hover:shadow-[0_32px_64px_rgba(0,0,0,0.1)] transition-all duration-500 relative overflow-hidden">
            
            {/* Durum Badge */}
            <div className="absolute top-0 right-0 px-8 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-3xl">
              İnceleme Altında
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center gap-3 text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">
                    <Clock size={14}/> {new Date(r.createdAt).toLocaleString('tr-TR')}
                    <span className="text-gray-300">•</span>
                    ID: #{r._id.substr(-6)}
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Bildirilen Sorun: {r.reason}</h3>
                </div>

                <div className="bg-gray-900 text-white p-8 rounded-[2rem] shadow-inner relative">
                   <p className="text-sm font-medium leading-relaxed italic opacity-90">"{r.details || 'Müşteri ek detay belirtmedi.'}"</p>
                   <ArrowRight size={40} className="absolute -bottom-4 -right-4 text-white/10" />
                </div>
              </div>

              <div className="w-full lg:w-72 space-y-4 shrink-0">
                <div className="bg-white/80 p-6 rounded-3xl border border-white shadow-sm">
                   <span className="text-[10px] font-black text-gray-400 uppercase block mb-3">Müşteri Hattı</span>
                   <div className="flex items-center gap-3 font-black text-gray-900"><Phone size={16} className="text-blue-500"/> {r.userPhone}</div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                   <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><MessageCircle size={16}/> WP Mesajı Gönder</button>
                   <button className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-green-100 hover:bg-green-700 transition-all">Çözüldü Olarak İşaretle</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}