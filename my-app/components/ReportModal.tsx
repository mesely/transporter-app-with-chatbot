/**
 * @file ReportModal.tsx
 * @description Transport Güvenlik ve Denetim Birimi Raporlama Sistemi.
 * Geliştirme: Kurumsal veri toplama, dinamik başlıklar ve mağduriyet detaylandırma.
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Send, ShieldAlert, MessageCircle, Phone, ChevronDown, Loader2, Building2, AlertCircle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  driverId?: string | null;
}

export default function ReportModal({ isOpen, onClose, orderId, driverId }: ReportModalProps) {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+90');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [incidentType, setIncidentType] = useState('driver'); // 'driver' veya 'app'

  const reportTags = [
    "Sürücü Gelmedi 🚫", "Fazla Ücret İstedi 💸", "Kaba Davranış 😠",
    "Güvenli Değil ⚠️", "Araç Yanlış/Bozuk 🛠️", "Konum Hatalı 📍", "Çok Geç Geldi ⏳"
  ];

  useEffect(() => {
    if (isOpen) {
      const storedPhone = localStorage.getItem('Transport_user_phone');
      if (storedPhone) setPhone(storedPhone);
      setSelectedTags([]); 
      setDetails('');
    }
  }, [isOpen]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (selectedTags.length === 0 && details.length < 10) {
      alert("Lütfen bir sorun türü seçin veya mağduriyetinizi detaylandırın.");
      return;
    }

    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://Transport-app-with-chatbot.onrender.com';
    
    const payload = {
      orderId: orderId,
      reportedDriverId: driverId,
      reporterPhone: `${countryCode}${phone.replace(/\s/g, '')}`,
      reportCategory: incidentType, // Uygulama hatası mı Sürücü hatası mı?
      reasons: selectedTags,
      description: details,
      meta: {
        platform: "Web/iOS/Android",
        reportType: "Professional_Safety_Audit"
      },
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Raporunuz başarıyla Transport Denetim Birimi'ne iletildi. Kayıt No: #" + Math.floor(Math.random()*100000));
        onClose();
      } else {
        throw new Error("Sunucu yanıt vermedi");
      }
    } catch (error) {
      alert("Şikayet gönderilemedi. Lütfen internet bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-slate-950/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-[0_40px_150px_rgba(0,0,0,0.4)] border border-slate-100 p-8 relative max-h-[92vh] overflow-y-auto custom-scrollbar animate-in zoom-in duration-300">
        
        {/* Kapat Butonu */}
        <button onClick={onClose} className="absolute top-8 right-8 w-10 h-10 bg-slate-50 border border-slate-100 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center text-slate-400 transition-all active:scale-90 shadow-sm">
          <X size={18} strokeWidth={3} />
        </button>
        
        {/* Kurumsal Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-red-50 border-2 border-red-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldAlert className="w-10 h-10 text-red-600 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Denetim Birimi</h3>
          <div className="mt-3 flex flex-col gap-2 items-center">
             <span className="text-[9px] text-red-600 font-black uppercase tracking-[0.2em] px-4 py-1.5 bg-red-50 rounded-full border border-red-100">
               ACİL MÜDAHALE VE ŞİKAYET FORMU
             </span>
             <p className="text-[10px] text-slate-400 font-bold uppercase italic">İşlem ID: {orderId ? `#${orderId.slice(-8).toUpperCase()}` : "Genel Destek"}</p>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* Rapor Kategorisi Seçimi */}
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
             <button onClick={() => setIncidentType('driver')} className={`flex-1 py-3 text-[9px] font-black rounded-xl transition-all uppercase ${incidentType === 'driver' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Sürücü/Firma</button>
             <button onClick={() => setIncidentType('app')} className={`flex-1 py-3 text-[9px] font-black rounded-xl transition-all uppercase ${incidentType === 'app' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Uygulama Hatası</button>
          </div>

          {/* İletişim Detaylı */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
               <Phone size={12} className="text-blue-500"/> Kayıtlı Telefon Numaranız
            </label>
            <div className="flex gap-2">
              <div className="relative">
                <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="appearance-none bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-8 py-4 text-xs font-black text-slate-800 outline-none shadow-inner">
                  <option value="+90">TR</option>
                  <option value="+44">UK</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              </div>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5XX XXX XX XX" className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 outline-none focus:bg-white shadow-inner" />
            </div>
          </div>

          {/* Hazır Sorun Seçenekleri (Aynı Tasarım) */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
               <AlertCircle size={12} className="text-red-500"/> Sorun Türü (Hızlı Seçim)
            </label>
            <div className="flex flex-wrap gap-2">
              {reportTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button key={tag} onClick={() => toggleTag(tag)} className={`px-4 py-2.5 rounded-[1.2rem] text-[9px] font-black uppercase transition-all border-2 ${isSelected ? 'bg-red-600 text-white border-red-600 shadow-lg scale-105' : 'bg-white text-slate-500 border-slate-100 hover:border-red-200'}`}>{tag}</button>
                );
              })}
            </div>
          </div>

          {/* Profesyonel Detaylandırma */}
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
                <Building2 size={12} className="text-purple-500"/> Mağduriyet Ve Olay Özeti
             </label>
             <div className="relative">
                <textarea 
                  value={details} 
                  onChange={(e) => setDetails(e.target.value)} 
                  placeholder="Lütfen olayı, saatini ve varsa firma ismini belirterek detaylandırın. Denetim ekibimiz bu bilgileri kullanarak yaptırım uygulayacaktır." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-6 text-xs font-bold uppercase focus:outline-none focus:bg-white transition-all resize-none shadow-inner h-40 text-slate-700 leading-relaxed" 
                />
             </div>
          </div>
        </div>

        {/* Gönderim Butonu */}
        <button 
          onClick={handleSubmit} 
          disabled={loading} 
          className={`w-full py-6 rounded-[2.2rem] mt-10 flex items-center justify-center gap-3 shadow-2xl transition-all uppercase text-xs tracking-[0.2em] font-black ${
            loading ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white hover:bg-red-600 active:scale-95'
          }`}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> İNCELEMEYİ BAŞLAT</>}
        </button>

        <p className="text-center mt-8 text-[8px] text-slate-300 font-black uppercase tracking-[0.3em] px-10 leading-loose">
            Transport 6563 Sayılı Kanun Uyarınca Denetim Mekanizmalarını İşletmektedir.
        </p>

      </div>
    </div>
  );
}