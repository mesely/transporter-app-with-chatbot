'use client';

import { useState, useEffect } from 'react';
import { X, Send, ShieldAlert, MessageCircle, Phone, ChevronDown, Loader2 } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  driverId?: string | null; // Şikayet edilen sürücü ID'si
}

export default function ReportModal({ isOpen, onClose, orderId, driverId }: ReportModalProps) {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+90');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const reportTags = [
    "Sürücü Gelmedi 🚫", "Fazla Ücret İstedi 💸", "Kaba Davranış 😠",
    "Güvenli Değil ⚠️", "Araç Yanlış/Bozuk 🛠️", "Konum Hatalı 📍", "Çok Geç Geldi ⏳"
  ];

  useEffect(() => {
    if (isOpen) {
      // LocalStorage'dan mevcut kullanıcı bilgilerini çek
      const storedPhone = localStorage.getItem('transporter_user_phone');
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
    if (selectedTags.length === 0) {
      alert("Lütfen en az bir sorun türü seçiniz.");
      return;
    }

    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://transporter-app-with-chatbot.onrender.com';
    
    // DB Şemasına uygun payload
    const payload = {
      orderId: orderId,
      reportedDriverId: driverId,
      reporterPhone: `${countryCode}${phone.replace(/\s/g, '')}`,
      reasons: selectedTags,
      description: details,
      timestamp: new Date().toISOString(),
      status: 'pending' // Admin panelinde 'inceleniyor' durumuna düşmesi için
    };

    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Şikayetiniz başarıyla alındı. Denetim merkezimiz inceleme başlatacaktır.");
        onClose();
      } else {
        throw new Error("Sunucu yanıt vermedi");
      }
    } catch (error) {
      console.error("Report Error:", error);
      alert("Şikayet gönderilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[20000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Modal Container: Solid White with Soft Shadows */}
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.3)] border border-slate-100 p-8 relative max-h-[92vh] overflow-y-auto custom-scrollbar animate-in zoom-in duration-300">
        
        {/* Kapat Butonu */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 w-12 h-12 bg-slate-50 border border-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center text-slate-400 transition-all active:scale-90 shadow-sm"
        >
          <X size={20} strokeWidth={3} />
        </button>
        
        {/* Header */}
        <div className="text-center mb-10 mt-2">
          <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Sorun Bildir</h3>
          <div className="mt-3 flex flex-col gap-1 items-center">
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
               İşlem: #{orderId?.substring(orderId.length - 6).toUpperCase()}
             </span>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* İletişim */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> İletişim Numaranız
            </label>
            <div className="flex gap-3">
              <div className="relative">
                <select 
                  value={countryCode} 
                  onChange={(e) => setCountryCode(e.target.value)} 
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-10 py-5 text-sm font-black text-slate-800 outline-none focus:border-blue-500 transition-all shadow-inner"
                >
                  <option value="+90">TR</option>
                  <option value="+44">UK</option>
                  <option value="+49">DE</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              </div>
              
              <div className="flex-1 relative group">
                <Phone className="absolute top-1/2 -translate-y-1/2 left-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="5XX XXX XX XX" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-5 py-5 text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner" 
                />
              </div>
            </div>
          </div>

          {/* Etiketler */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Sorun Türü
            </label>
            <div className="flex flex-wrap gap-2">
              {reportTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button 
                    key={tag} 
                    onClick={() => toggleTag(tag)} 
                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${
                      isSelected 
                        ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/30 scale-105' 
                        : 'bg-white text-slate-500 border-slate-100 hover:border-red-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detay Alanı */}
          <div className="space-y-3">
             <label className="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Olay Özeti
             </label>
             <div className="relative group">
                <MessageCircle size={20} className="absolute top-5 left-5 text-slate-300 group-focus-within:text-purple-600 transition-colors" />
                <textarea 
                  value={details} 
                  onChange={(e) => setDetails(e.target.value)} 
                  placeholder="Yaşadığınız mağduriyeti kısaca özetleyiniz..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 pl-14 pr-5 text-xs font-bold uppercase focus:outline-none focus:bg-white focus:border-purple-500 transition-all resize-none shadow-inner h-32 text-slate-700" 
                />
             </div>
          </div>
        </div>

        {/* Submit Butonu */}
        <button 
          onClick={handleSubmit} 
          disabled={loading} 
          className={`w-full py-6 rounded-[2rem] mt-10 flex items-center justify-center gap-3 shadow-2xl transition-all uppercase text-xs tracking-[0.3em] font-black ${
            loading 
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
              : 'bg-slate-900 text-white hover:bg-red-600 active:scale-95 shadow-slate-900/30'
          }`}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <><Send size={18} /> ŞİKAYETİ GÖNDER</>
          )}
        </button>

        <p className="text-center mt-8 text-[9px] text-slate-300 font-black uppercase tracking-[0.2em]">
            Transporter Güvenlik ve Denetim Birimi
        </p>

      </div>
    </div>
  );
}