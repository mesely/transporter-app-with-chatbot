'use client';

import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';

type Lang = 'tr' | 'en' | 'fr';

type Copy = {
  navSupport: string;
  title: string;
  subtitle: string;
  intro: string;
  listTitle: string;
  services: string[];
  featuresTitle: string;
  features: string[];
  note: string;
  sectionA: string;
  sectionB: string;
  sectionC: string;
};

const COPY: Record<Lang, Copy> = {
  tr: {
    navSupport: 'Destek',
    title: 'Yolda kaldığınız anda doğru hizmete hızlı erişim',
    subtitle: 'Transport 245',
    intro:
      'Türkiye genelinde oto kurtarma, vinç, nakliye, şarj ve yolcu taşıma gibi ihtiyaçlar için konumunuza en yakın sağlayıcıları tek platformda bulabilirsiniz.',
    listTitle: 'Uygulama kapsamında',
    services: [
      'Oto kurtarma ve çekici',
      'Vinç hizmetleri',
      'Nakliye ve yük taşımacılığı',
      'Evden eve taşıma',
      'Şarj istasyonu',
      'Gezici şarj',
      'Yolcu taşıma hizmetleri',
    ],
    featuresTitle: 'Transport 245 ile',
    features: [
      'Konumunuza yakın firmaları harita üzerinde görüntüleyin.',
      'Hizmet türüne göre filtreleyip en uygun seçeneklere ulaşın.',
      'Firma kartlarından hızlı arama veya mesaj başlatın.',
      'Puan, mesafe ve hizmet bilgilerini karşılaştırın.',
      'Sık kullandığınız işletmeleri favorilere ekleyin.',
    ],
    note:
      'Not: En doğru sonuçlar için konum izni gerekir. Konum kapalıysa bazı özellikler sınırlı çalışabilir.',
    sectionA: 'İlk deneyim akışı',
    sectionB: 'Keşif ve seçim deneyimi',
    sectionC: 'Operasyon akışı ve hız',
  },
  en: {
    navSupport: 'Support',
    title: 'Fast access to the right service when you are on the road',
    subtitle: 'Transport 245',
    intro:
      'Across Türkiye, find nearby providers for towing, crane, logistics, charging, and passenger transport in one platform.',
    listTitle: 'Service coverage',
    services: [
      'Roadside towing',
      'Crane services',
      'Logistics and cargo transport',
      'House moving',
      'Charging stations',
      'Mobile charging',
      'Passenger transport',
    ],
    featuresTitle: 'With Transport 245',
    features: [
      'View nearby providers on map.',
      'Filter by service type and narrow down options.',
      'Call or message directly from provider cards.',
      'Compare rating, distance, and service details.',
      'Save frequently used providers to favorites.',
    ],
    note:
      'Note: Location permission is needed for best results. Some features are limited without location.',
    sectionA: 'First-touch journey',
    sectionB: 'Discovery and selection',
    sectionC: 'Operational speed and flow',
  },
  fr: {
    navSupport: 'Support',
    title: 'Accès rapide au bon service lorsque vous êtes sur la route',
    subtitle: 'Transport 245',
    intro:
      'Dans toute la Turquie, trouvez les prestataires proches pour remorquage, grue, logistique, recharge et transport de passagers sur une seule plateforme.',
    listTitle: 'Couverture des services',
    services: [
      'Remorquage',
      'Services de grue',
      'Logistique et transport de charge',
      'Déménagement',
      'Stations de recharge',
      'Recharge mobile',
      'Transport de passagers',
    ],
    featuresTitle: 'Avec Transport 245',
    features: [
      'Affichez les prestataires proches sur la carte.',
      'Filtrez par type de service.',
      'Lancez un appel ou message depuis la carte prestataire.',
      'Comparez note, distance et informations de service.',
      'Ajoutez vos prestataires favoris.',
    ],
    note:
      'Remarque : l’autorisation de localisation est requise pour les meilleurs résultats.',
    sectionA: 'Première expérience',
    sectionB: 'Découverte et choix',
    sectionC: 'Vitesse opérationnelle',
  },
};

const SHOTS = ['/ios_1_1.png', '/ios_1_2.png', '/ios_1_3.png', '/ios_1_4.png', '/ios_1_5.png', '/ios_1_6.png', '/ios_1_7.png'];

export default function MarketingPage() {
  const [lang, setLang] = useState<Lang>('tr');
  const t = useMemo(() => COPY[lang], [lang]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8 md:py-8">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="inline-flex items-center gap-3">
            <img src="/favicon.png" alt="Transport 245" className="h-11 w-11 rounded-xl object-cover" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-700">Transport 245</p>
              <p className="text-sm font-semibold text-slate-600">{t.subtitle}</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2">
            <a href="/support" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              {t.navSupport}
            </a>
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </header>

        <section className="grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-700">{t.subtitle}</p>
            <h1 className="text-3xl font-black leading-tight md:text-5xl">{t.title}</h1>
            <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600 md:text-base">{t.intro}</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <div className="grid grid-cols-2 gap-0">
              <img src={SHOTS[0]} alt="ios 1" className="h-full w-full object-cover" />
              <img src={SHOTS[1]} alt="ios 2" className="h-full w-full object-cover" />
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          <article>
            <h2 className="text-xl font-black">{t.listTitle}</h2>
            <ul className="mt-4 space-y-2">
              {t.services.map((item) => (
                <li key={item} className="inline-flex items-start gap-2 text-sm font-medium text-slate-700">
                  <ChevronRight size={16} className="mt-0.5 text-cyan-700" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article>
            <h2 className="text-xl font-black">{t.featuresTitle}</h2>
            <ul className="mt-4 space-y-2">
              {t.features.map((item) => (
                <li key={item} className="inline-flex items-start gap-2 text-sm font-medium text-slate-700">
                  <ChevronRight size={16} className="mt-0.5 text-cyan-700" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl bg-cyan-50 px-4 py-3 text-xs font-semibold text-cyan-900">{t.note}</p>
          </article>
        </section>

        <section className="mt-14 space-y-10">
          <div className="grid gap-5 md:grid-cols-[0.95fr_1.05fr] md:items-center">
            <img src={SHOTS[2]} alt="ios 3" className="w-full rounded-2xl border border-slate-200 object-cover" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">{t.sectionA}</p>
              <img src={SHOTS[3]} alt="ios 4" className="mt-3 w-full rounded-2xl border border-slate-200 object-cover" />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <img src={SHOTS[4]} alt="ios 5" className="w-full rounded-2xl border border-slate-200 object-cover" />
            <img src={SHOTS[5]} alt="ios 6" className="w-full rounded-2xl border border-slate-200 object-cover" />
            <div className="flex flex-col gap-3">
              <img src={SHOTS[6]} alt="ios 7" className="w-full rounded-2xl border border-slate-200 object-cover" />
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">{t.sectionC}</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8">
            <p className="text-sm font-semibold text-slate-600">
              {lang === 'tr' && 'Mobil kullanımda akıcı performans için optimize edildi. Harita etkileşimi, listeleme ve veri yükleme süreçleri hızlı ve stabil çalışacak şekilde geliştirilmeye devam ediyor.'}
              {lang === 'en' && 'Optimized for smooth mobile performance. Map interaction, listing and data loading are continuously improved for speed and stability.'}
              {lang === 'fr' && 'Optimisé pour une performance mobile fluide. Les interactions cartographiques et le chargement des données sont continuellement améliorés.'}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
