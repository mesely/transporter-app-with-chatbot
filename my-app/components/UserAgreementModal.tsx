'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, ScrollText, CheckCircle2, Scale, 
  User, CreditCard, Heart, Lock, Trash2, Edit3, Clock, X 
} from 'lucide-react';

interface ModalProps {
  isOpen?: boolean; // Sidebar'dan açmak için
  onClose?: () => void; // Kapatmak için
}

export default function UserAgreementModal({ isOpen: propsIsOpen, onClose }: ModalProps)  {
  // İlk giriş kontrolü için dahili state
  const [internalOpen, setInternalOpen] = useState(false);

  useEffect(() => {
    // 1. Kullanıcı daha önce onaylamadıysa modalı OTOMATİK aç
    const hasAgreed = localStorage.getItem('transporter_terms_agreed');
    if (!hasAgreed) {
      setInternalOpen(true);
    }
  }, []);

  const handleAgree = () => {
    // 2. Onay zaman damgasını kaydet
    const timestamp = new Date().toISOString();
    localStorage.setItem('transporter_terms_agreed', timestamp);
    
    // 3. Kapatma mantığı
    setInternalOpen(false); // Otomatik açıldıysa kapat
    if (onClose) onClose(); // Sidebar üzerinden açıldıysa üst bileşene "kapat" de
  };

  // EĞER (Sidebar'dan açık gelirse) VEYA (İlk girişse ve dahili olarak açıksa) GÖSTER
  const isVisible = propsIsOpen || internalOpen;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-gray-900/40 backdrop-blur-[8px] flex items-center justify-center p-4 animate-in fade-in duration-500">
      
      <div className="w-full max-w-lg h-[85vh] rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden border border-white/40 bg-white/80 backdrop-blur-3xl relative">
        
        {/* HEADER */}
        <div className="p-6 border-b border-white/30 text-center shrink-0 bg-white/30 relative z-10">
          <div className="w-16 h-16 bg-blue-50/80 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Kullanıcı Sözleşmesi</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Lojistik ağımıza hoş geldiniz</p>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar text-xs text-gray-600 leading-relaxed font-medium relative z-10">
          
          <div className="bg-blue-50/60 border border-blue-100/50 p-5 rounded-3xl mb-4 shadow-inner">
            <p className="text-[11px] text-blue-800 font-bold text-center italic">
              "İşbu sözleşme, yasal haklarınızı ve Platform ile aranızdaki sorumluluk sınırlarını belirleyen hukuki bir belgedir."
            </p>
          </div>

          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] border-l-4 border-blue-600 pl-3">
              <Scale size={16} className="text-blue-600"/> 1. Platformun Niteliği
            </h3>
            <p className="text-justify">
              Platform, kullanıcıların belirli hizmetlere erişimini kolaylaştıran bir aracı teknoloji platformudur. 6563 sayılı Kanun uyarınca hizmetin doğrudan sağlayıcısı değildir.
            </p>
          </section>

          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] border-l-4 border-blue-600 pl-3">
              <User size={16} className="text-blue-600"/> 2. Kullanıcı Hesabı
            </h3>
            <p className="text-justify">
              Uygulamadan faydalanabilmek için bilgilerin doğru beyan edilmesi esastır. Hesap güvenliğinden kullanıcı şahsen sorumludur.
            </p>
          </section>

          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] border-l-4 border-blue-600 pl-3">
              <ShieldCheck size={16} className="text-blue-600"/> 3. Sorumluluk Sınırları
            </h3>
            <p className="text-justify">
              Platform, üçüncü kişiler tarafından sunulan hizmetlerin niteliği konusunda garanti vermez. Doğabilecek uyuşmazlıklardan doğrudan sorumlu tutulamaz.
            </p>
          </section>

          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] border-l-4 border-blue-600 pl-3">
              <Heart size={16} className="text-blue-600"/> 4. Bağış Politikası
            </h3>
            <p className="text-justify">
              Platform, elde edilen net gelirlerin %10’unu sosyal sorumluluk kapsamında belirlenen yardım kuruluşlarına bağışlamayı hedefler.
            </p>
          </section>

          <div className="pt-8 pb-4 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] bg-white/40 py-2 rounded-full border border-white/50">
              Sürüm: Şubat 2026
            </p>
          </div>
        </div>

        {/* FOOTER BUTTON */}
        <div className="p-6 border-t border-white/40 bg-white/60 backdrop-blur-md shrink-0 relative z-20">
          <button 
            onClick={handleAgree}
            className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl group"
          >
            <CheckCircle2 size={18} className="group-hover:text-green-400 transition-colors" /> 
            Anladım ve Onaylıyorum
          </button>
        </div>

      </div>
    </div>
  );
}