/**
 * @file gizlilik/page.tsx
 * @description Transporter 2026 Statik Gizlilik ve Kullanım Şartları.
 * Özellikler: Çift Dil Desteği (TR/EN), Detaylı Hukuki Metin, Resmi Tipografi.
 */

'use client';

import { useState } from 'react';
import { ArrowLeft, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const CONTENT: any = {
  tr: {
    title: "Kullanım Şartları ve Gizlilik Politikası",
    subtitle: "Resmi Belge No: TR-2026-V1 • Yayım: 11 Şubat 2026",
    intro: "İşbu metin, Transporter platformunun kullanımına dair yasal hak ve yükümlülüklerinizi, 6563 sayılı Kanun ve KVKK mevzuatı uyarınca kelimesi kelimesine içermektedir.",
    contactTitle: "Resmi İletişim",
    sections: [
      {
        h: "1. Platformun Hukuki Niteliği",
        p: "Transporter, kullanıcıların lojistik ihtiyaçları (oto kurtarma, nakliye, mobil şarj vb.) için bağımsız hizmet sağlayıcılarla bağlantı kurmasını sağlayan bir teknoloji pazar yeridir. Platform, 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında 'Aracı Hizmet Sağlayıcı' sıfatına sahiptir. Transporter, sunulan hizmetlerin icracısı veya tarafı olmayıp, bağımsız taraflar arasında kurulan ticari ve hukuki ilişkiden doğabilecek uyuşmazlıklardan doğrudan sorumlu tutulamaz."
      },
      {
        h: "2. Veri İşleme ve Kişisel Verilerin Korunması",
        p: "6698 sayılı KVKK kapsamında Transporter, hizmetin sunulabilmesi için şu verileri işlemektedir: (i) Konum Verisi: En yakın hizmet biriminin tespiti için anlık GPS verileriniz kullanılır. (ii) İletişim Verileri: Sürücülerin tarafınıza ulaşabilmesi için telefon numaranız paylaşılır. (iii) Cihaz Tanımlayıcılar: Bildirim ve sistem güvenliği için Push Token verileri kaydedilir. Bu veriler, rızanız dışında üçüncü şahıslara reklam veya pazarlama amacıyla asla satılmaz."
      },
      {
        h: "3. Ücretlendirme ve Mali Sorumluluk",
        p: "Platformda görüntülenen ücretler, hizmet sağlayıcılar tarafından beyan edilen baz/taban tarifelerdir. Yol durumu, mesafe ve ek talepler doğrultusunda oluşabilecek nihai ücret, hizmet anında kullanıcı ve sürücü arasında netleşir. Transporter, ödeme işlemlerinde doğrudan bir taraf değildir; tüm mali süreçler ve faturalandırma hizmeti sunan tüzel/gerçek kişi ile kullanıcı arasındadır."
      },
      {
        h: "4. Hizmet Kusurları ve Garanti Sınırları",
        p: "Transporter, üçüncü kişilerin sunduğu hizmetin kesintisizliği, kalitesi veya güvenliği konusunda mutlak bir garanti vermez. Hizmet sırasında meydana gelebilecek kaza, hasar, gecikme veya emtia kaybı durumlarında hukuki sorumluluk münhasıran hizmeti sunan firmaya/kişiye aittir. Kullanıcı, bu risklerin bilincinde olarak platformu kullanmayı kabul eder."
      },
      {
        h: "5. Sosyal Sorumluluk Politikası",
        p: "Platform, sürdürülebilirlik ilkeleri gereği elde edilen net hizmet komisyon gelirlerinin %10'unu çevre koruma, sokak hayvanları ve eğitim projelerine bağışlamayı taahhüt eder. Bağış miktarları ve ilgili kuruluşlar periyodik olarak kurumsal raporlarda ilan edilmektedir."
      },
      {
        h: "6. Hesap Feshi ve Veri İmhası",
        p: "Apple ve Google Store politikaları uyarınca; kullanıcılar diledikleri zaman 'Profil > Ayarlar' sekmesi altından hesaplarını kalıcı olarak silme hakkına sahiptir. Silme işlemi onaylandığında, yasal saklama zorunluluğu olan veriler haricindeki tüm kişisel veriler 24 saat içerisinde sistemlerden geri döndürülemez şekilde silinmektedir."
      },
      {
        h: "7. Kullanıcı Yükümlülükleri",
        p: "Kullanıcı, platformu kötüye kullanmayacağını, yanıltıcı konum bilgisi göndermeyeceğini ve hizmet sağlayıcılara karşı nezaket kuralları çerçevesinde hareket edeceğini kabul eder. Aksi durumlarda Transporter, kullanıcının erişimini tek taraflı olarak kısıtlama hakkını saklı tutar."
      },
      {
        h: "8. Yürürlük ve Değişiklikler",
        p: "Bu sözleşme, dijital onay ile yürürlüğe girer. Transporter, değişen mevzuat veya sistem güncellemeleri doğrultusunda bu maddeleri güncelleme hakkına sahiptir. Güncel metin her zaman bu sayfa üzerinden erişilebilir olacaktır."
      }
    ]
  },
  en: {
    title: "Terms of Use and Privacy Policy",
    subtitle: "Official Document No: TR-2026-V1 • Published: Feb 11, 2026",
    intro: "This text contains your legal rights and obligations regarding the use of the Transporter platform, verbatim in accordance with Law No. 6563 and GDPR/KVKK regulations.",
    contactTitle: "Official Contact",
    sections: [
      {
        h: "1. Legal Nature of the Platform",
        p: "Transporter is a technology marketplace that enables users to connect with independent service providers for logistics needs (towing, shipping, mobile charging, etc.). The platform acts as an 'Intermediary Service Provider' within the scope of relevant e-commerce laws. Transporter is not the executor of the services provided and cannot be held directly responsible for disputes arising from the commercial and legal relationship established between independent parties."
      },
      {
        h: "2. Data Processing and Protection",
        p: "Transporter processes the following data to provide services: (i) Location Data: Your real-time GPS data is used to identify the nearest service unit. (ii) Contact Data: Your phone number is shared so that drivers can reach you. (iii) Device Identifiers: Push Token data is recorded for notifications and system security. This data is never sold to third parties for advertising or marketing purposes without your consent."
      },
      {
        h: "3. Pricing and Financial Liability",
        p: "The fees displayed on the platform are base/floor tariffs declared by service providers. The final fee, which may occur based on road conditions, distance, and additional requests, is clarified between the user and the driver at the time of service. Transporter is not a direct party to payment transactions; all financial processes and billing are between the user and the entity providing the service."
      },
      {
        h: "4. Service Defects and Warranty Limits",
        p: "Transporter does not provide an absolute guarantee regarding the continuity, quality, or safety of the services provided by third parties. In case of accidents, damages, delays, or loss of goods that may occur during the service, the legal liability belongs exclusively to the company/individual providing the service. The user agrees to use the platform being aware of these risks."
      },
      {
        h: "5. Social Responsibility Policy",
        p: "According to sustainability principles, the platform commits to donating 10% of its net service commission income to environmental protection, animal rights, and education projects. Donation amounts and related organizations are periodically announced in corporate reports."
      },
      {
        h: "6. Account Termination and Data Deletion",
        p: "In accordance with Apple and Google Store policies; users have the right to permanently delete their accounts at any time under the 'Profile > Settings' tab. Once the deletion is confirmed, all personal data except for those with legal retention requirements are irrevocably deleted from systems within 24 hours."
      },
      {
        h: "7. User Obligations",
        p: "The user agrees not to misuse the platform, not to send misleading location information, and to act within the rules of courtesy towards service providers. In contrary cases, Transporter reserves the right to unilaterally restrict the user's access."
      },
      {
        h: "8. Enforcement and Amendments",
        p: "This agreement enters into force with digital confirmation. Transporter reserves the right to update these articles in line with changing legislation or system updates. The current text will always be accessible through this page."
      }
    ]
  }
};

export default function PrivacyPolicy() {
  const router = useRouter();
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const t = CONTENT[lang];

  return (
    <div className="w-full min-h-screen bg-[#fdfdfd] text-slate-900 overflow-y-auto">
      
      {/* HEADER - SABİT */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => router.push('/')}
          className="text-slate-900 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-60 transition-opacity"
        >
          <ArrowLeft size={16} /> {lang === 'tr' ? 'Geri' : 'Back'}
        </button>
        
        <div className="flex items-center gap-3">
          <Image src="/favicon.ico" width={24} height={24} alt="Transporter" />
          <span className="font-black text-xs uppercase tracking-tighter italic">Transporter 2026</span>
        </div>

        {/* DİL DEĞİŞTİRİCİ */}
        <button 
          onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
          className="flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-cyan-600 transition-colors shadow-lg"
        >
          <Globe size={14} /> {lang === 'tr' ? 'EN' : 'TR'}
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        
        {/* ANA BAŞLIK ALANI */}
        <div className="mb-20 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">

             <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
               {t.title}
             </h1>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">
            {t.subtitle}
          </p>
        </div>

        {/* METİN İÇERİĞİ */}
        <div className="space-y-16">
          
          <div className="border-l-4 border-cyan-500 pl-8 py-2">
            <p className="font-bold text-slate-800 text-[15px] leading-relaxed italic">
              "{t.intro}"
            </p>
          </div>

          {t.sections.map((section: any, idx: number) => (
            <section key={idx} className="space-y-4">
              <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">
                {section.h}
              </h3>
              <p className="text-slate-600 text-[14px] leading-[1.8] text-justify font-medium">
                {section.p}
              </p>
            </section>
          ))}
        </div>

        {/* ALT İLETİŞİM BÖLÜMÜ */}
        <div className="border-t border-slate-100 mt-24 pt-20 pb-32">
           <div className="text-center space-y-4">
              <h3 className="font-black text-slate-900 uppercase text-lg italic tracking-tighter">
                {t.contactTitle}
              </h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                {lang === 'tr' ? 'Yasal Talepleriniz İçin' : 'For Legal Inquiries'}
              </p>
              <a 
                href="mailto:privacy@transporter.com" 
                className="text-slate-900 font-black text-xl hover:text-cyan-600 transition-colors block"
              >
                privacy@transporter.com
              </a>
           </div>
        </div>

        {/* FOOTER NOTU */}
        <div className="text-center opacity-20 pb-10">
           <p className="text-[8px] font-black uppercase tracking-[0.5em]">
             Transporter Sovereign Platform • Intellectual Property 2026
           </p>
        </div>

      </main>
    </div>
  );
}