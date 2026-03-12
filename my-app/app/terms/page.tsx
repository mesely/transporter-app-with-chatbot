'use client';

import { ArrowLeft, FileText, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLang, getPreferredLang, setPreferredLang } from '../../utils/language';

const COPY: Record<string, any> = {
  tr: {
    title: 'Kullanim Kosullari',
    subtitle: 'Transport 245 Terms of Use / EULA',
    intro: 'Bu sayfa, Transport 245 uygulamasinin abonelikli kullanimina ve platform kosullarina iliskin temel sartlari aciklar.',
    sections: [
      {
        h: '1. Hizmet',
        p: 'Transport 245; kullanicilarin harita ve liste ekranlari uzerinden hizmet saglayicilari bulmasini, filtrelemesini, favorilere eklemesini ve iletisime gecmesini saglayan dijital lojistik agidir.',
      },
      {
        h: '2. Abonelik Donemi',
        p: 'Otomatik yenilenen abonelik suresi 1 yildir. Her abonelik donemi boyunca uygulamanin abonelige bagli hizmetlerine erisim saglanir.',
      },
      {
        h: '3. Abonelik Kapsami',
        p: 'Abonelik; yakin hizmet saglayicilarini goruntuleme, hizmet turune gore filtreleme, favoriler, degerlendirme ve sikayet akislari ile platform icindeki erisim ozelliklerinin devamini kapsar.',
      },
      {
        h: '4. Ucretlendirme',
        p: 'Abonelik ucreti App Store tarafinda yerel para biriminiz ile gosterilir ve App Store hesabiniz uzerinden tahsil edilir. Abonelik iptal edilmezse her donem sonunda otomatik yenilenir.',
      },
      {
        h: '5. Iptal ve Yonetim',
        p: 'Abonelik, App Store abonelik ayarlarindan yonetilir veya iptal edilir. Hesabin silinmesi, Apple ID uzerindeki aktif aboneligi otomatik olarak iptal etmez.',
      },
      {
        h: '6. Gizlilik',
        p: 'Kisisel verilerin islenmesi ve saklanmasi ile ilgili detaylar Gizlilik Politikasi sayfasinda yer alir.',
      },
    ],
    privacy: 'Gizlilik Politikasi',
    back: 'Ana Sayfaya Don',
  },
  en: {
    title: 'Terms of Use',
    subtitle: 'Transport 245 Terms of Use / EULA',
    intro: 'This page explains the key terms for subscription-based use of Transport 245 and the platform rules.',
    sections: [
      {
        h: '1. Service',
        p: 'Transport 245 is a digital logistics network that helps users discover providers on map and list screens, filter services, save favorites, and contact providers directly.',
      },
      {
        h: '2. Subscription Period',
        p: 'The auto-renewable subscription period is 1 year. During each subscription period, access to subscription-based app services continues.',
      },
      {
        h: '3. What the Subscription Includes',
        p: 'The subscription includes continued access to nearby provider discovery, service-type filtering, favorites, ratings, complaints, and related in-app access features.',
      },
      {
        h: '4. Pricing',
        p: 'The subscription price is shown by the App Store in your local currency and charged through your App Store account. It renews automatically unless cancelled.',
      },
      {
        h: '5. Cancellation and Management',
        p: 'The subscription is managed or cancelled from App Store subscription settings. Deleting the app account does not automatically cancel an active Apple ID subscription.',
      },
      {
        h: '6. Privacy',
        p: 'Details about personal data processing and storage are available on the Privacy Policy page.',
      },
    ],
    privacy: 'Privacy Policy',
    back: 'Back to Home',
  },
  fr: {
    title: "Conditions d'utilisation",
    subtitle: 'Transport 245 Terms of Use / EULA',
    intro: "Cette page explique les conditions principales d'utilisation par abonnement de Transport 245.",
    sections: [
      {
        h: '1. Service',
        p: 'Transport 245 est un reseau logistique numerique permettant de trouver des prestataires, filtrer les services, enregistrer des favoris et contacter les prestataires.',
      },
      {
        h: "2. Duree d'abonnement",
        p: "La duree de l'abonnement auto-renouvelable est de 1 an. Pendant chaque periode, l'acces aux services lies a l'abonnement continue.",
      },
      {
        h: "3. Contenu de l'abonnement",
        p: "L'abonnement comprend l'acces continu a la decouverte de prestataires proches, au filtrage, aux favoris, aux evaluations et aux reclamations.",
      },
      {
        h: '4. Tarification',
        p: "Le prix est affiche par l'App Store dans votre devise locale et facture via votre compte App Store. L'abonnement se renouvelle automatiquement sauf annulation.",
      },
      {
        h: '5. Gestion et annulation',
        p: "L'abonnement est gere ou annule depuis les reglages d'abonnement App Store. La suppression du compte dans l'application n'annule pas automatiquement l'abonnement Apple ID.",
      },
      {
        h: '6. Confidentialite',
        p: 'Les details du traitement des donnees personnelles sont disponibles sur la page de politique de confidentialite.',
      },
    ],
    privacy: 'Politique de confidentialite',
    back: "Retour a l'accueil",
  },
};

export default function TermsPage() {
  const router = useRouter();
  const [lang, setLang] = useState<AppLang>('tr');
  const t = COPY[lang === 'tr' ? 'tr' : lang === 'fr' ? 'fr' : 'en'];

  useEffect(() => {
    const preferred = getPreferredLang();
    setLang(preferred);
    document.documentElement.lang = preferred;
  }, []);

  const toggleLang = () => {
    const next = setPreferredLang(lang === 'tr' ? 'en' : 'tr');
    setLang(next);
    document.documentElement.lang = next;
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_14%,rgba(59,130,246,0.16),transparent_36%),radial-gradient(circle_at_85%_88%,rgba(15,23,42,0.10),transparent_38%),linear-gradient(145deg,#e7edf8,#f3f6fb)] px-5 pb-10 pt-10 md:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-[2rem] border border-white/60 bg-white/45 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.push('/app')}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-700"
            >
              <ArrowLeft size={16} /> {t.back}
            </button>
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white"
            >
              <Globe size={14} /> {lang === 'tr' ? 'EN' : 'TR'}
            </button>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">{t.subtitle}</p>
              <h1 className="text-3xl font-black text-slate-900">{t.title}</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">{t.intro}</p>
        </header>

        <section className="rounded-[2rem] border border-white/60 bg-white/55 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="space-y-5">
            {t.sections.map((section: any) => (
              <article key={section.h} className="rounded-2xl border border-white/70 bg-white/70 p-5">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">{section.h}</h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{section.p}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/privacy"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-700"
            >
              {t.privacy}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
