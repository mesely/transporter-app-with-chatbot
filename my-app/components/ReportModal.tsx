'use client';

import { useState, useEffect } from 'react';
import { X, Send, ShieldAlert, MessageCircle, Phone, Globe, ChevronDown } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

export default function ReportModal({ isOpen, onClose, orderId }: ReportModalProps) {
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
      const storedPhone = localStorage.getItem('transporter_user_phone');
      if (storedPhone) setPhone(storedPhone);
      setSelectedTags([]); setDetails('');
    }
  }, [isOpen]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    const fullPhone = `${countryCode} ${phone}`;
    const finalReason = selectedTags.join(', ');
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://transporter-app-with-chatbot.onrender.com'}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, contact: fullPhone, reason: finalReason, details })
      });
      alert("Şikayetiniz başarıyla alındı. İnceleme başlatılacaktır.");
      onClose();
    } catch (error) { alert("Bir hata oluştu, lütfen tekrar deneyin."); } 
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    // Overlay: Odaklanma için arka planı biraz daha kararttık
    <div className="fixed inset-0 z-[20000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Modal Container: ŞEFFAFLIK İPTAL - KATI BEYAZ */}
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] border border-gray-100 p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Kapat Butonu */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 w-10 h-10 bg-gray-50 border border-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full flex items-center justify-center text-gray-500 transition-all active:scale-95 shadow-sm"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        
        {/* Header */}
        <div className="text-center mb-8 mt-2">
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Sorun Bildir</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest bg-gray-50 inline-block px-3 py-1 rounded-full border border-gray-100">
            İşlem No: #{orderId?.substring(orderId.length - 6)}
          </p>
        </div>

        <div className="space-y-6">
          
          {/* İletişim */}
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-2 block tracking-wider">İletişim Numaranız</label>
            <div className="flex gap-2">
              <div className="relative">
                <select 
                  value={countryCode} 
                  onChange={(e) => setCountryCode(e.target.value)} 
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-2xl pl-4 pr-10 py-4 text-xs font-black text-gray-800 outline-none focus:bg-white focus:border-black transition-all shadow-sm"
                >
                  <option value="+90">TR</option>
                  <option value="+1">US</option>
                  <option value="+49">DE</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              </div>
              
              <div className="flex-1 relative group">
                <div className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400 group-focus-within:text-black transition-colors">
                    <Phone size={14} />
                </div>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="5XX XXX XX XX" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-4 text-xs font-black text-gray-900 outline-none focus:bg-white focus:border-black transition-all shadow-sm" 
                />
              </div>
            </div>
          </div>

          {/* Etiketler */}
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-3 block tracking-wider">Sorun Nedir?</label>
            <div className="flex flex-wrap gap-2">
              {reportTags.map(tag => (
                <button 
                  key={tag} 
                  onClick={() => toggleTag(tag)} 
                  className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${
                    selectedTags.includes(tag) 
                      ? 'bg-red-600 text-white border-red-600 shadow-md scale-105' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Detay Alanı */}
          <div>
             <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-2 block tracking-wider">Detaylar</label>
             <div className="relative group">
                <div className="absolute top-4 left-4 text-gray-400 group-focus-within:text-black transition-colors">
                    <MessageCircle size={16} />
                </div>
                <textarea 
                  value={details} 
                  onChange={(e) => setDetails(e.target.value)} 
                  rows={4} 
                  placeholder="Hizmet alırken yaşadığınız sorunu lütfen detaylıca açıklayınız..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold uppercase focus:outline-none focus:bg-white focus:border-black transition-all resize-none shadow-sm text-gray-800" 
                />
             </div>
          </div>
        </div>

        {/* Submit Butonu */}
        <button 
          onClick={handleSubmit} 
          disabled={loading} 
          className={`w-full py-5 rounded-2xl mt-8 flex items-center justify-center gap-2 shadow-xl transition-all uppercase text-xs tracking-[0.2em] font-black ${
            loading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-black text-white hover:bg-gray-900 active:scale-95 shadow-black/20'
          }`}
        >
          {loading ? 'İletiliyor...' : <><Send size={16} /> ŞİKAYETİ GÖNDER</>}
        </button>

        <p className="text-center mt-6 text-[9px] text-gray-400 font-black uppercase tracking-widest">
            Transporter Güvenlik ve Denetim Merkezi
        </p>

      </div>
    </div>
  );
} 