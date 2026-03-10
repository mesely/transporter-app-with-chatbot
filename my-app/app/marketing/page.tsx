'use client';

import { ReactNode, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Compass, Layers3, ShieldCheck, Sparkles, Truck, Users, Zap } from 'lucide-react';

type Lang = 'tr' | 'en' | 'fr';

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || '#';

const COPY = {
  tr: {
    nav: {
      brand: 'Transport 245',
      slogan: 'Acil yol yardiminda yeni nesil lojistik agi',
      appStore: 'App Store\'dan indir',
      support: 'Destek',
    },
    hero: {
      title: 'Yolda guven veren hizli koordinasyon',
      desc: 'Transport 245; kullanici, kurum ve saha ekiplerini tek akista birlestirir. Konum tabanli kesif, detayli filtreleme ve hizli eslestirme ile operasyonu sadeleştirir.',
    },
    blocks: [
      { title: 'Kesif', text: 'Konum odakli servis bulma ve gercek ihtiyaca gore filtreleme.' },
      { title: 'Eslesme', text: 'Dogru kurumla hizli baglanti, daha az bekleme, daha net surec.' },
      { title: 'Operasyon', text: 'Kurum yonetimi, kayit akisi ve surdurulebilir hizmet kalitesi.' },
    ],
    sectionA: {
      title: 'Baslangictan itibaren akici deneyim',
      desc: 'Ilk iki ekran tek hikaye gibi yanyana ilerler: kullanici ilk andan itibaren sade ve net bir deneyime girer.',
    },
    sectionB: {
      title: 'Saha odakli urun hikayesi',
      desc: 'Asagidaki ekranlar; kesif, secim ve islem adimlarinin tumunu gosteren urun akisini temsil eder.',
    },
    cta: {
      title: 'Dakikalar icinde aktif ol',
      text: 'Transport 245 ile ihtiyac aninda dogru kurumlara hizli eris, operasyonu guvenle yonet.',
      button: 'Uygulamayi indir',
    },
    langButton: 'EN / FR',
  },
  en: {
    nav: {
      brand: 'Transport 245',
      slogan: 'New-generation logistics network for urgent roadside needs',
      appStore: 'Download on App Store',
      support: 'Support',
    },
    hero: {
      title: 'Fast coordination you can trust on the road',
      desc: 'Transport 245 connects end users, institutions, and field teams in one workflow. Location-aware discovery, precise filtering, and quick matching simplify operations.',
    },
    blocks: [
      { title: 'Discovery', text: 'Location-first provider discovery with practical service filtering.' },
      { title: 'Matching', text: 'Faster connection with the right provider and clearer process flow.' },
      { title: 'Operations', text: 'Provider onboarding, admin control, and consistent service quality.' },
    ],
    sectionA: {
      title: 'A smooth first-touch product flow',
      desc: 'The first two visuals are presented as a connected sequence to show immediate user clarity and confidence.',
    },
    sectionB: {
      title: 'Field-ready product storytelling',
      desc: 'The following visuals represent the complete product loop from discovery to action.',
    },
    cta: {
      title: 'Go live in minutes',
      text: 'Access trusted providers faster and run roadside operations with confidence.',
      button: 'Get the app',
    },
    langButton: 'FR / TR',
  },
  fr: {
    nav: {
      brand: 'Transport 245',
      slogan: 'Reseau logistique nouvelle generation pour les urgences routieres',
      appStore: 'Telecharger sur App Store',
      support: 'Support',
    },
    hero: {
      title: 'Une coordination rapide et fiable sur la route',
      desc: 'Transport 245 relie utilisateurs, institutions et equipes terrain dans un seul flux. Decouverte par localisation, filtrage precis et mise en relation rapide.',
    },
    blocks: [
      { title: 'Decouverte', text: 'Recherche geolocalisee avec filtrage pratique des services.' },
      { title: 'Mise en relation', text: 'Connexion plus rapide avec le bon prestataire et un flux plus clair.' },
      { title: 'Operations', text: 'Onboarding des prestataires, controle admin et qualite durable.' },
    ],
    sectionA: {
      title: 'Une premiere experience fluide',
      desc: 'Les deux premiers visuels sont presentes cote a cote comme une sequence continue.',
    },
    sectionB: {
      title: 'Narration produit orientee terrain',
      desc: 'Les visuels suivants montrent le parcours complet: decouverte, selection et action.',
    },
    cta: {
      title: 'Activez votre flux en quelques minutes',
      text: 'Accedez rapidement aux bons prestataires et pilotez les operations en confiance.',
      button: 'Telecharger l\'application',
    },
    langButton: 'TR / EN',
  },
} as const;

function nextLang(current: Lang): Lang {
  if (current === 'tr') return 'en';
  if (current === 'en') return 'fr';
  return 'tr';
}

const SHOTS = [
  '/ios_1_1.png',
  '/ios_1_2.png',
  '/ios_1_3.png',
  '/ios_1_4.png',
  '/ios_1_5.png',
  '/ios_1_6.png',
  '/ios_1_7.png',
];

export default function MarketingPage() {
  const [lang, setLang] = useState<Lang>('tr');
  const t = useMemo(() => COPY[lang], [lang]);

  const Card = ({ icon, title, text }: { icon: ReactNode; title: string; text: string }) => (
    <div className="rounded-2xl border border-white/65 bg-white/75 p-4 shadow-sm backdrop-blur-md">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-cyan-700 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
        {icon}
        {title}
      </div>
      <p className="text-sm font-semibold leading-relaxed text-slate-700">{text}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#8ccde6] px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="sticky top-3 z-20 mb-6 rounded-2xl border border-white/60 bg-white/75 p-3 shadow-lg backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-3">
              <img src="/favicon.png" alt="Transport 245" className="h-9 w-9 rounded-xl object-cover" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{t.nav.brand}</p>
                <p className="text-xs font-semibold text-slate-700">{t.nav.slogan}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/support" className="rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-700">
                {t.nav.support}
              </a>
              <a href={APP_STORE_URL} className="rounded-xl bg-cyan-700 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white shadow-sm">
                {t.nav.appStore}
              </a>
              <button
                onClick={() => setLang((prev) => nextLang(prev))}
                className="rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-700"
              >
                {t.langButton}
              </button>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[2.2rem] border border-white/60 bg-white/72 p-6 shadow-xl backdrop-blur-xl md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-200/45 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-20 h-56 w-56 rounded-full bg-blue-300/35 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-700 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
              <Sparkles size={13} />
              Transport 245
            </div>
            <h1 className="max-w-3xl text-3xl font-black uppercase tracking-tight md:text-5xl">{t.hero.title}</h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-slate-700 md:text-base">{t.hero.desc}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={APP_STORE_URL} className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-md">
                {t.nav.appStore}
                <ArrowRight size={14} />
              </a>
              <a href="/support" className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-slate-700">
                {t.nav.support}
              </a>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          <Card icon={<Compass size={13} />} title={t.blocks[0].title} text={t.blocks[0].text} />
          <Card icon={<Zap size={13} />} title={t.blocks[1].title} text={t.blocks[1].text} />
          <Card icon={<ShieldCheck size={13} />} title={t.blocks[2].title} text={t.blocks[2].text} />
        </section>

        <section className="mt-7 rounded-[2rem] border border-white/60 bg-white/72 p-5 shadow-xl backdrop-blur-xl">
          <h2 className="text-xl font-black uppercase">{t.sectionA.title}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-700">{t.sectionA.desc}</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/70 bg-white">
            <div className="grid gap-0 md:grid-cols-2">
              <img src={SHOTS[0]} alt="Transport 245 iOS 1" className="h-full w-full object-cover" />
              <img src={SHOTS[1]} alt="Transport 245 iOS 2" className="h-full w-full object-cover" />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/60 bg-white/72 p-5 shadow-xl backdrop-blur-xl">
          <h2 className="text-xl font-black uppercase">{t.sectionB.title}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-700">{t.sectionB.desc}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <img src={SHOTS[2]} alt="Transport 245 iOS 3" className="rounded-2xl border border-white/70 bg-white object-cover" />
            <img src={SHOTS[3]} alt="Transport 245 iOS 4" className="rounded-2xl border border-white/70 bg-white object-cover" />
            <img src={SHOTS[4]} alt="Transport 245 iOS 5" className="rounded-2xl border border-white/70 bg-white object-cover" />
            <img src={SHOTS[5]} alt="Transport 245 iOS 6" className="rounded-2xl border border-white/70 bg-white object-cover" />
            <img src={SHOTS[6]} alt="Transport 245 iOS 7" className="rounded-2xl border border-white/70 bg-white object-cover sm:col-span-2 lg:col-span-1" />
            <div className="rounded-2xl border border-white/70 bg-white/90 p-4 sm:col-span-2 lg:col-span-2">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-cyan-700 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                <Layers3 size={12} />
                Transport 245
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {lang === 'tr' && 'Servis kesfinden operasyon yonetimine kadar tum adimlarda hizli, net ve guvenilir bir urun akisi.'}
                {lang === 'en' && 'A fast, clear, and reliable product journey from service discovery to operational response.'}
                {lang === 'fr' && 'Un parcours produit rapide, clair et fiable, de la decouverte du service a la reponse operationnelle.'}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <p className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700">
                  {lang === 'tr' && 'Konum tabanli hizli kesif'}
                  {lang === 'en' && 'Location-based fast discovery'}
                  {lang === 'fr' && 'Decouverte rapide basee sur la localisation'}
                </p>
                <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
                  {lang === 'tr' && 'Yuksek donusum odakli sade tasarim'}
                  {lang === 'en' && 'Clean design focused on conversion'}
                  {lang === 'fr' && 'Design epure axe sur la conversion'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/60 bg-white/72 p-6 shadow-xl backdrop-blur-xl">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-cyan-700 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                <BadgeCheck size={12} />
                Transport 245
              </div>
              <h3 className="text-2xl font-black uppercase">{t.cta.title}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-700">{t.cta.text}</p>
            </div>
            <a href={APP_STORE_URL} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-xs font-black uppercase tracking-wide text-white shadow-md">
              <Truck size={14} />
              {t.cta.button}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
