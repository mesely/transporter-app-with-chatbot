/**
 * @file KVKKModal.tsx
 * @description Transporter 2026 KVKK Aydınlatma Metni Modalı.
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Globe } from 'lucide-react';
import Image from 'next/image';

interface KVKKModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONTENT: any = {
  tr: {
    title: "KVKK Aydınlatma Metni",
    subtitle: "6698 Sayılı Kanun Uyarınca Bilgilendirme",
    intro: "Transporter AI Platformu olarak, kişisel verilerinizin güvenliği hususuna azami hassasiyet göstermekteyiz.",
    sections: [
      { h: "1. Veri Sorumlusu", p: "Veri Sorumlusu sıfatıyla Transporter AI, verilerinizi kanuna uygun işlemektedir." },
      { h: "2. İşlenen Veriler", p: "Kimlik, iletişim, GPS lokasyon ve teknik cihaz bilgileriniz işlenmektedir." },
      { h: "3. İşleme Amacı", p: "En yakın hizmet sağlayıcının yönlendirilmesi ve yasal yükümlülükler için işlenir." },
      { h: "4. Veri Aktarımı", p: "Yalnızca lojistik talebin ifası amacıyla sürücülerle paylaşılır." },
      { h: "5. Haklarınız", p: "Verilerinizin silinmesini veya düzeltilmesini her zaman talep edebilirsiniz." }
    ]
  },
  en: {
    title: "KVKK Clarification",
    subtitle: "Under Law No. 6698",
    intro: "As Transporter AI, we care deeply about your personal data security.",
    sections: [
      { h: "1. Data Controller", p: "Transporter AI processes your data as the primary controller." },
      { h: "2. Processed Data", p: "Identity, contact, GPS location, and device information are processed." },
      { h: "3. Purpose", p: "Data is used for logistics routing and legal compliance." },
      { h: "4. Transfer", p: "Shared only with drivers for the duration of the service." },
      { h: "5. Your Rights", p: "You can request deletion or correction of your data at any time." }
    ]
  }
};

export default function KVKKModal({ isOpen, onClose }: KVKKModalProps) {
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const t = CONTENT[lang];

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110000] bg-slate-900/10 backdrop-blur-xl flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
      <div className="w-full max-w-xl h-[85vh] bg-white rounded-[3rem] shadow-2xl border border-white flex flex-col overflow-hidden relative">
        
        {/* HEADER */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white/50 relative z-10">
          <div className="flex items-center gap-3 text-slate-900">
            <Image src="/favicon.ico" width={24} height={24} alt="Logo" />
            <span className="font-black text-xs uppercase tracking-tighter italic">Transporter</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')} className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md active:scale-90 transition-all">
              <Globe size={12} className="inline mr-1" /> {lang === 'tr' ? 'EN' : 'TR'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">{t.title}</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">{t.subtitle}</p>
          </div>

          <div className="border-l-4 border-slate-900 pl-6 py-2 italic font-bold text-slate-700 text-sm">
            "{t.intro}"
          </div>

          {t.sections.map((s: any, i: number) => (
            <div key={i} className="space-y-3 px-2">
              <h3 className="font-black text-slate-900 uppercase text-[11px] tracking-widest">{s.h}</h3>
              <p className="text-slate-500 text-[13px] leading-relaxed font-medium text-justify">{s.p}</p>
            </div>
          ))}

          <div className="pt-10 pb-6 text-center">
             <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Transporter Sovereign Legal 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}