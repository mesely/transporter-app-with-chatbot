'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Send, ShieldAlert, MessageCircle } from 'lucide-react';

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

  // --- HAZIR ŞİKAYET ETİKETLERİ ---
  const reportTags = [
    "Sürücü Gelmedi 🚫",
    "Fazla Ücret İstedi 💸",
    "Kaba Davranış 😠",
    "Güvenli Değil ⚠️",
    "Araç Yanlış/Bozuk 🛠️",
    "Konum Hatalı 📍",
    "Çok Geç Geldi ⏳"
  ];

  useEffect(() => {
    if (isOpen) {
      const storedPhone = localStorage.getItem('transporter_user_phone');
      const storedCC = localStorage.getItem('transporter_user_cc');
      if (storedPhone) setPhone(storedPhone);
      if (storedCC) setCountryCode(storedCC);
      setSelectedTags([]); setDetails('');
    }
  }, [isOpen]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (selectedTags.length === 0 && !details) {
      alert("Lütfen bir sebep seçin veya detay yazın.");
      return;
    }

    setLoading(true);
    const fullPhone = `${countryCode} ${phone}`;
    const finalReason = selectedTags.join(', ');
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId, 
          contact: fullPhone, 
          reason: finalReason, 
          details: details 
        })
      });
      alert("Şikayetiniz merkezimize iletildi. İncelenip size dönülecektir.");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Gönderilemedi, lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[20000] bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      <div className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-[2.5rem] p-8 relative shadow-[0_30px_100px_rgba(220,38,38,0.2)] border border-red-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Kapatma Butonu */}
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full text-gray-400 transition-all">
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-red-50 p-4 rounded-full mb-4 border border-red-100">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">Sorun Bildir</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">İşlem No: #{orderId?.substring(orderId.length - 6)}</p>
        </div>

        <div className="space-y-6">
          
          {/* İletişim Bilgisi */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">İletişim Numaranız</label>
            <div className="flex gap-2">
              <select 
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-4 text-xs font-black text-gray-800 outline-none focus:bg-white transition-all shadow-sm"
              >
                <option value="+90">TR</option>
                <option value="+49">DE</option>
                <option value="+1">US</option>
              </select>

              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="5XX XXX XX XX"
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-black text-gray-900 outline-none focus:bg-white placeholder:text-gray-300 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Hazır Şikayet Etiketleri */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-3 block">Sorun Nedir? (Hızlı Seçim)</label>
            <div className="flex flex-wrap gap-2">
              {reportTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${
                    selectedTags.includes(tag)
                      ? 'bg-red-600 text-white border-red-600 shadow-lg scale-105'
                      : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Detay Alanı */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Ek Notlar (Opsiyonel)</label>
            <div className="relative group">
              <div className="absolute top-4 left-4 text-gray-300 group-focus-within:text-red-500 transition-colors">
                <MessageCircle size={16} />
              </div>
              <textarea 
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="OLAYI KISACA ANLATIN..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-bold uppercase focus:outline-none focus:ring-2 focus:ring-red-100 focus:bg-white transition-all resize-none shadow-sm"
              />
            </div>
          </div>

        </div>

        {/* Gönder Butonu */}
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full bg-red-600 text-white font-black py-5 rounded-2xl mt-8 flex items-center justify-center gap-2 shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all text-xs tracking-widest uppercase ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? 'GÖNDERİLİYOR...' : <><Send size={16} /> ŞİKAYETİ İLET</>}
        </button>

        <p className="text-[9px] text-gray-400 font-bold text-center mt-6 uppercase leading-relaxed px-4">
          Şikayetiniz ekibimiz tarafından incelenecek ve gerekirse sürücü sistemden uzaklaştırılacaktır.
        </p>

      </div>
    </div>
  );
}