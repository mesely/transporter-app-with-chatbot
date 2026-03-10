'use client';

import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';

type Lang = 'tr' | 'en' | 'fr';

type Copy = {
  navSupport: string;
  navHome: string;
  title: string;
  subtitle: string;
  slogan: string;
  intro: string;
  listTitle: string;
  services: string[];
  featuresTitle: string;
  features: string[];
  note: string;
  sectionA: string;
  sectionB: string;
  details: {
    title: string;
    desc: string;
    points: string[];
  }[];
};

const COPY: Record<Lang, Copy> = {
  tr: {
    navSupport: 'Destek',
    navHome: 'Ana Sayfa',
    title: 'Yolda kaldığınız anda doğru hizmete hızlı erişim',
    subtitle: 'Transport 245',
    slogan: 'Yeni Nesil Lojistik Ağı',
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
    sectionB: 'Detaylı ürün deneyimi',
    details: [
      {
        title: 'Dünya çapında ağ',
        desc: 'Avrupa, Amerika ve Türkiye genelinde yüzlerce kurumla çalışan bu yapı sayesinde kullanıcılar bulunduğu bölgeye göre doğru sağlayıcılara çok hızlı ulaşır. Kurum ağı büyüdükçe sistem daha iyi eşleşme, daha kısa bekleme süresi ve daha yüksek hizmet sürekliliği sunar.',
        points: [
          'Oto kurtarma ve çekici hizmetlerine geniş kurum ağı ile erişim.',
          'Vinç hizmetlerine şehir ve bölgeye göre hızlı ulaşım.',
          'Nakliye, evden eve taşıma, şarj istasyonu ve gezici şarj çözümleri tek ağda.',
          'Yolcu taşıma dahil tüm ana hizmetlerde dünya çapında erişim yaklaşımı.',
        ],
      },
      {
        title: 'Nakliye akışı',
        desc: 'Nakliye ve yük taşımacılığı senaryolarında kurum seçimi, hizmet karşılaştırması ve iletişim adımları tek ekranda sade bir akışa indirgenir. Bu yapı hem bireysel hem kurumsal kullanımda karar süresini azaltır.',
        points: [
          'Konumunuza en yakın nakliye kurumlarını listeleyin.',
          'En uygun ve güvenilir kurumları puan/mesafe/hizmet kriterine göre karşılaştırın.',
          'Tek ekranda iletişime geçip süreci hızla başlatın.',
        ],
      },
      {
        title: 'Kişiselleştirme',
        desc: 'Favori kurumlar, değerlendirme ve şikayet mekanizmaları ile kullanıcı deneyimi kişiye özel hale gelir. Zamanla sistem kullanım alışkanlıklarına göre daha hızlı seçim yapılmasına yardımcı olur.',
        points: [
          'Sık kullanılan kurumları favorilere ekleyip tekrar hızlı erişim sağlayın.',
          'Değerlendirme ile hizmet kalitesini görünür hale getirin.',
          'Şikayet akışı ile platform güvenini koruyan geri bildirim sürecini yönetin.',
        ],
      },
      {
        title: 'Şarj çözümleri',
        desc: 'İstasyon şarj ve gezici şarj hizmetleri birlikte sunulur. Kullanıcı ihtiyaca göre sabit istasyon veya mobil ekip tercih ederek uygun çözüme hızlıca yönlenebilir.',
        points: [
          'İstasyon şarj noktalarını konum bazlı hızlıca keşfedin.',
          'Gezici şarj seçeneğiyle bulunduğunuz noktaya destek çağırın.',
          'Acil ve planlı ihtiyaçlar için iki modeli birlikte değerlendirin.',
        ],
      },
      {
        title: 'Yolcu taşıma',
        desc: 'Etkinlik, organizasyon ve parti gibi toplu planlarda minibüs/otobüs kiralama süreçleri daha düzenli yönetilir. Uygun araç tipini belirleyip sağlayıcı ile doğrudan iletişime geçmek kolaylaşır.',
        points: [
          'Etkinlik ve parti organizasyonları için araç planlamasını kolaylaştırın.',
          'Minibüs/otobüs seçeneklerini ihtiyaca göre filtreleyin.',
          'Uygun sağlayıcılarla doğrudan iletişime geçip rezervasyonu hızlandırın.',
        ],
      },
    ],
  },
  en: {
    navSupport: 'Support',
    navHome: 'Home',
    title: 'Fast access to the right service when you are on the road',
    subtitle: 'Transport 245',
    slogan: 'New-Generation Logistics Network',
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
    sectionB: 'Detailed product experience',
    details: [
      {
        title: 'Global network',
        desc: 'With a broad network across Europe, the US, and Türkiye, users quickly reach relevant providers based on location. As the network grows, matching quality and service continuity improve.',
        points: [
          'Access towing, crane, logistics, charging, and passenger services in one network.',
          'Reach the nearest providers based on your current location.',
          'Benefit from improved matching and shorter waiting times as the network grows.',
        ],
      },
      {
        title: 'Logistics flow',
        desc: 'For logistics and cargo use-cases, provider selection, comparison, and communication are simplified into a single clear flow for both individual and business users.',
        points: [
          'Find reliable providers near your location.',
          'Compare options by distance, quality, and service fit.',
          'Start communication quickly from a single workflow.',
        ],
      },
      {
        title: 'Personalization',
        desc: 'Favorites, ratings, and complaint workflows create a personalized experience and improve provider quality over time.',
        points: [
          'Save frequently used providers as favorites.',
          'Rate providers and contribute to quality visibility.',
          'Use complaint channels to maintain trust and platform reliability.',
        ],
      },
      {
        title: 'Charging solutions',
        desc: 'Both station charging and mobile charging are supported, helping users choose the right option based on urgency and location.',
        points: [
          'Discover station charging points by location.',
          'Request mobile charging support where you are.',
          'Choose the best option for urgent or planned charging needs.',
        ],
      },
      {
        title: 'Passenger transport',
        desc: 'For events and parties, bus/minibus planning becomes easier with direct provider contact and practical service comparison.',
        points: [
          'Plan group transport for events and parties.',
          'Filter bus/minibus options by need.',
          'Contact providers directly and speed up booking.',
        ],
      },
    ],
  },
  fr: {
    navSupport: 'Support',
    navHome: 'Accueil',
    title: 'Accès rapide au bon service lorsque vous êtes sur la route',
    subtitle: 'Transport 245',
    slogan: 'Réseau Logistique Nouvelle Génération',
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
    sectionB: 'Expérience produit détaillée',
    details: [
      {
        title: 'Réseau international',
        desc: 'Avec un réseau étendu en Europe, aux États-Unis et en Turquie, les utilisateurs accèdent rapidement aux bons prestataires selon leur position.',
        points: [
          'Accédez aux services de remorquage, grue, logistique, recharge et transport passagers.',
          'Trouvez rapidement les prestataires proches de votre position.',
          'Amélioration continue de la mise en relation avec la croissance du réseau.',
        ],
      },
      {
        title: 'Flux logistique',
        desc: 'La sélection, la comparaison et le contact prestataire sont réunis dans un flux unique plus lisible pour les besoins logistiques.',
        points: [
          'Trouvez des prestataires fiables proches de vous.',
          'Comparez distance, qualité et adéquation de service.',
          'Lancez rapidement le contact depuis une interface unique.',
        ],
      },
      {
        title: 'Personnalisation',
        desc: 'Favoris, évaluations et réclamations permettent une expérience personnalisée et une amélioration continue de la qualité.',
        points: [
          'Ajoutez vos prestataires favoris.',
          'Évaluez les services pour améliorer la qualité visible.',
          'Utilisez les réclamations pour renforcer la confiance.',
        ],
      },
      {
        title: 'Solutions de recharge',
        desc: 'Recharge en station et recharge mobile sont proposées ensemble pour couvrir différents scénarios terrain.',
        points: [
          'Découvrez les stations de recharge proches.',
          'Demandez une recharge mobile sur place.',
          'Choisissez la solution adaptée à l’urgence.',
        ],
      },
      {
        title: 'Transport passagers',
        desc: 'Pour événements et groupes, l’organisation minibus/autobus est plus simple grâce au contact direct et au comparatif rapide.',
        points: [
          'Organisez le transport pour événements et groupes.',
          'Filtrez les options minibus/autobus selon le besoin.',
          'Contact direct pour accélérer la réservation.',
        ],
      },
    ],
  },
};

const SHOTS = ['/ios_1_1.png', '/ios_1_2.png', '/ios_1_3.png', '/ios_1_4.png', '/ios_1_5.png', '/ios_1_6.png', '/ios_1_7.png'];

export default function MarketingPage() {
  const [lang, setLang] = useState<Lang>('tr');
  const t = useMemo(() => COPY[lang], [lang]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-[1400px] px-5 py-6 md:px-10 md:py-8">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="inline-flex items-center gap-3">
            <img src="/favicon.png" alt="Transport 245" className="h-11 w-11 rounded-xl object-cover" />
            <div>
              <p className="text-2xl font-black leading-none text-cyan-700">{t.subtitle}</p>
              <p className="text-sm font-semibold text-slate-600">{t.slogan}</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2">
            <a href="/" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              {t.navHome}
            </a>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="aspect-[9/19] overflow-hidden rounded-3xl border border-slate-200">
              <img src={SHOTS[0]} alt="ios 1" className="h-full w-full object-cover" />
            </div>
            <div className="aspect-[9/19] overflow-hidden rounded-3xl border border-slate-200">
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

        <section className="mt-14">
          <h2 className="text-2xl font-black">{t.sectionB}</h2>
          <div className="mt-6 space-y-10">
            {t.details.map((detail, idx) => {
              const shotIndex = idx + 2;
              const reverse = idx % 2 === 1;
              return (
                <article key={detail.title} className="grid gap-6 md:grid-cols-2 md:items-center">
                  {reverse ? (
                    <>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">{t.sectionA}</p>
                        <h3 className="mt-2 text-2xl font-black leading-tight">{detail.title}</h3>
                        <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600 md:text-base">{detail.desc}</p>
                        <ul className="mt-4 space-y-2">
                          {detail.points.map((point) => (
                            <li key={point} className="inline-flex items-start gap-2 text-sm font-medium text-slate-700">
                              <ChevronRight size={16} className="mt-0.5 text-cyan-700" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mx-auto w-full max-w-[320px] aspect-[9/19] overflow-hidden rounded-2xl border border-slate-200">
                        <img src={SHOTS[shotIndex]} alt={`ios ${shotIndex + 1}`} className="h-full w-full object-cover" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto w-full max-w-[320px] aspect-[9/19] overflow-hidden rounded-2xl border border-slate-200">
                        <img src={SHOTS[shotIndex]} alt={`ios ${shotIndex + 1}`} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">{t.sectionA}</p>
                        <h3 className="mt-2 text-2xl font-black leading-tight">{detail.title}</h3>
                        <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600 md:text-base">{detail.desc}</p>
                        <ul className="mt-4 space-y-2">
                          {detail.points.map((point) => (
                            <li key={point} className="inline-flex items-start gap-2 text-sm font-medium text-slate-700">
                              <ChevronRight size={16} className="mt-0.5 text-cyan-700" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
