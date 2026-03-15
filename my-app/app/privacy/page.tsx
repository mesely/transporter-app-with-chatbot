'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Globe, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppLang, getPreferredLang, setPreferredLang } from '../../utils/language';

const CONTENT = {
  tr: {
    title: 'Yasal Merkez',
    subtitle: 'Transport 245 • Guncel Yasal Metinler',
    intro:
      'Bu sayfa, uygulamanin guncel gizlilik politikasi ile kullanici sozlesmesini tek yerde sunar.',
    kvkkTitle: 'Kisisel Verilerin Korunmasi ve Aydinlatma Metni',
    kvkkSections: [
      {
        h: '1. Veri Sorumlusu',
        p: 'Kisisel verileriniz, mobil uygulamanin isletmecisi olan Platform tarafindan veri sorumlusu sifatoyla islenmektedir.',
      },
      {
        h: '2. Islenen Veriler',
        p: 'Kimlik, iletisim, profil, kullanim kayitlari, cihaz verileri, konum bilgisi ile firma ve hizmet saglayici bilgileri islenebilir.',
      },
      {
        h: '3. Veri Kaynaklari',
        p: 'Veriler; kullanici beyanlari, kullanici tarafindan eklenen veya guncellenen bilgiler ve herkese acik kaynaklardan elde edilir.',
      },
      {
        h: '4. Islenme Amaclari',
        p: 'Hizmet sunumu, hesap guvenligi, eslestirme, destek, performans iyilestirme, teknik sorun tespiti ve hukuki yukumluluklerin yerine getirilmesi amaclariyla islenir.',
      },
      {
        h: '5. Aktarim ve Saklama',
        p: 'Veriler sadece mevzuata uygun hallerde yetkili kurumlara ve teknik hizmet saglayicilara aktarilir; gerekli sure boyunca saklanir, sonra silinir veya anonim hale getirilir.',
      },
      {
        h: '6. Haklariniz',
        p: 'Kullanicilar, verilerinin islenip islenmedigini ogrenme, bilgi talep etme, duzeltme, silme ve zararin giderilmesini isteme haklarina sahiptir.',
      },
    ],
    agreementTitle: 'Kullanici Sozlesmesi',
    agreementSections: [
      {
        h: '1. Platformun Niteligi',
        p: 'Transport 245, kullanicilar ile hizmet saglayicilari bir araya getiren araci bir teknoloji platformudur ve dogrudan hizmet saglayicisi degildir.',
      },
      {
        h: '2. Kullanici Yukumlulukleri',
        p: 'Kullanici, uygulamayi hukuka uygun sekilde kullanmayi, dogru bilgi vermeyi ve hesap guvenliginden sorumlu oldugunu kabul eder.',
      },
      {
        h: '3. Icerik ve Sorumluluk Sinirlari',
        p: 'Platform, ucuncu taraf veya kullanici kaynakli iceriklerin dogrulugunu garanti etmez; hizmet kesintileri ve ucuncu kisi uyusmazliklarindan sorumlu tutulamaz.',
      },
      {
        h: '4. Veri Kaynaklari ve Bilgi Kullanimi',
        p: 'Firma ve hizmet bilgileri herkese acik kaynaklardan veya kullanici girislerinden elde edilebilir; Platform bu verileri bilgilendirme ve eslestirme amaciyla kullanir.',
      },
      {
        h: '5. Degisiklik Hakki',
        p: 'Platform, gerekli gordugu degisiklikleri yapma hakkini sakli tutar. Esasli degisiklikler gerekli oldugunda kullanicinin onayina yeniden sunulabilir.',
      },
      {
        h: '6. Uygulanacak Hukuk',
        p: 'Bu metinlerden dogan uyusmazliklarda Turkiye Cumhuriyeti hukuku uygulanir ve yetkili mahkemeler Turkiye’de bulunan mahkemelerdir.',
      },
    ],
    back: 'Ana Sayfaya Don',
  },
  en: {
    title: 'Legal Center',
    subtitle: 'Transport 245 • Current Legal Texts',
    intro: 'This page provides the current privacy policy and user agreement in one place.',
    kvkkTitle: 'Privacy Notice',
    kvkkSections: [
      {
        h: '1. Data Controller',
        p: 'Your personal data is processed by the platform operator acting as the data controller.',
      },
      {
        h: '2. Processed Data',
        p: 'Identity, contact, profile, usage logs, device data, location data, and provider information may be processed.',
      },
      {
        h: '3. Data Sources',
        p: 'Data may come from user submissions, user updates, and publicly available sources.',
      },
      {
        h: '4. Processing Purposes',
        p: 'Data is processed to provide services, keep accounts secure, match users with providers, answer support requests, improve performance, and fulfill legal obligations.',
      },
      {
        h: '5. Transfer and Retention',
        p: 'Data is transferred only where legally required or to technical service providers and is retained only for the necessary period.',
      },
      {
        h: '6. Your Rights',
        p: 'Users may request information, correction, deletion, and compensation for damage caused by unlawful processing.',
      },
    ],
    agreementTitle: 'User Agreement',
    agreementSections: [
      {
        h: '1. Nature of the Platform',
        p: 'Transport 245 is an intermediary technology platform and is not the direct provider of listed services.',
      },
      {
        h: '2. User Responsibilities',
        p: 'Users must provide accurate information, use the app lawfully, and protect their own account credentials.',
      },
      {
        h: '3. Content and Liability Limits',
        p: 'The platform does not guarantee the accuracy of third-party or user-submitted content and is not liable for service interruptions or third-party disputes.',
      },
      {
        h: '4. Data Sources and Use',
        p: 'Provider and service information may come from public sources or user submissions and is used for information and matching purposes.',
      },
      {
        h: '5. Right to Amend',
        p: 'The platform may revise these terms when necessary. Material changes may be presented again for user approval where required.',
      },
      {
        h: '6. Governing Law',
        p: 'These texts are governed by the laws of the Republic of Turkiye and disputes are subject to Turkish courts.',
      },
    ],
    back: 'Back to Home',
  },
} as const;

export default function PrivacyPage() {
  const router = useRouter();
  const [lang, setLang] = useState<AppLang>('tr');
  const content = CONTENT[lang === 'tr' ? 'tr' : 'en'];

  useEffect(() => {
    const preferred = getPreferredLang();
    setLang(preferred);
    document.documentElement.lang = preferred;
  }, []);

  const handleToggleLang = () => {
    const next = setPreferredLang(lang === 'tr' ? 'en' : 'tr');
    setLang(next);
    document.documentElement.lang = next;
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[linear-gradient(180deg,#f8fcff_0%,#eef6fb_100%)] text-slate-900">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/85 px-6 py-4 backdrop-blur-xl">
        <button onClick={() => router.push('/app')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 transition-colors hover:text-cyan-700">
          <ArrowLeft size={16} /> {content.back}
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-cyan-700" />
          <span className="text-xs font-black uppercase tracking-tight">Transport 245</span>
        </div>
        <button onClick={handleToggleLang} className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-colors hover:bg-cyan-700">
          <Globe size={14} /> {lang === 'tr' ? 'EN' : 'TR'}
        </button>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-12 space-y-4 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">{content.title}</h1>
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">{content.subtitle}</p>
          <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-slate-600">{content.intro}</p>
        </div>

        <div className="space-y-8">
          <section className="rounded-[2.25rem] border border-white/80 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">{content.kvkkTitle}</h2>
            </div>
            <div className="space-y-6">
              {content.kvkkSections.map((section) => (
                <section key={section.h} className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">{section.h}</h3>
                  <p className="border-l border-slate-200 pl-4 text-sm font-medium leading-relaxed text-slate-600">{section.p}</p>
                </section>
              ))}
            </div>
          </section>

          <section className="rounded-[2.25rem] border border-white/80 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
                <FileText size={28} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">{content.agreementTitle}</h2>
            </div>
            <div className="space-y-6">
              {content.agreementSections.map((section) => (
                <section key={section.h} className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">{section.h}</h3>
                  <p className="border-l border-slate-200 pl-4 text-sm font-medium leading-relaxed text-slate-600">{section.p}</p>
                </section>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
