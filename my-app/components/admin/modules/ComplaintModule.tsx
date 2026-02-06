'use client';

import { useState, useEffect } from 'react';
import { Search, Phone, MessageCircle, CheckCircle, XCircle, FileWarning, Calendar } from 'lucide-react';

// API URL SABİTİ
const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

export default function ComplaintModule() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/reports`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => { if(Array.isArray(data)) setReports(data.reverse()); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleWhatsapp = (phone: string, type: 'accept' | 'reject' | 'manual', reportId?: string) => {
    let message = "";
    if (type === 'accept') message = `Merhaba, #${reportId?.substr(-4)} nolu şikayetiniz incelendi ve haklı bulundunuz. -Transporter`;
    if (type === 'reject') message = `Merhaba, #${reportId?.substr(-4)} nolu şikayetiniz incelendi. İhlal tespit edilemedi. -Transporter`;
    if (type === 'manual') message = "Merhaba, Transporter destek hattından ulaşıyorum.";
    
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    if(!cleanPhone) return alert("Numara yok");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">ŞİKAYETLER</h2>
      
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Ara..." className="w-full bg-white pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 outline-none focus:border-gray-900 transition-all" />
      </div>

      {loading ? <div className="text-center py-10 text-gray-400 font-bold">Yükleniyor...</div> : reports.length===0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
           <FileWarning className="w-12 h-12 text-gray-300 mx-auto mb-3" />
           <p className="text-gray-400 font-bold text-sm">Temiz! Şikayet yok.</p>
        </div>
      ) : (
        reports.map((r) => (
          <div key={r._id} className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col gap-5 hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  Rapor #{r._id.substr(-6)}
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${r.status==='OPEN'?'bg-red-50 text-red-700 border-red-200':'bg-green-50 text-green-700 border-green-200'}`}>
                    {r.status==='OPEN'?'AÇIK':'ÇÖZÜLDÜ'}
                  </span>
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold mt-1.5">
                  <Calendar className="w-3.5 h-3.5"/> 
                  {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <span className="text-[10px] text-gray-400 font-black uppercase block mb-1 tracking-widest">SEBEP</span>
              <p className="text-sm text-gray-900 font-bold leading-relaxed">"{r.reason}"</p>
              {r.details && <p className="text-xs text-gray-600 mt-2 font-medium border-t border-gray-200 pt-2">{r.details}</p>}
            </div>
            <div className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg">
                <div className="text-xs">
                    <span className="text-gray-400 block font-bold uppercase tracking-wider mb-0.5">Müşteri</span>
                    <span className="font-bold text-gray-900 text-sm">{r.userPhone || 'Numara Yok'}</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={()=>r.userPhone && window.open(`tel:${r.userPhone}`)} className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-50 transition-colors shadow-sm"><Phone className="w-3.5 h-3.5"/> ARA</button>
              <button onClick={()=>handleWhatsapp(r.userPhone, 'manual')} className="flex items-center justify-center gap-2 bg-white border border-green-200 text-green-700 py-3 rounded-lg text-[10px] font-bold uppercase hover:bg-green-50 transition-colors shadow-sm"><MessageCircle className="w-3.5 h-3.5"/> WHATSAPP</button>
              <button onClick={()=>handleWhatsapp(r.userPhone, 'accept', r._id)} className="flex items-center justify-center gap-2 bg-gray-900 border border-gray-900 text-white py-3 rounded-lg text-[10px] font-bold uppercase hover:bg-black shadow-md active:scale-95 transition-all"><CheckCircle className="w-3.5 h-3.5"/> ONAYLA</button>
              <button onClick={()=>handleWhatsapp(r.userPhone, 'reject', r._id)} className="flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 py-3 rounded-lg text-[10px] font-bold uppercase hover:bg-red-50 transition-all shadow-sm"><XCircle className="w-3.5 h-3.5"/> REDDET</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}