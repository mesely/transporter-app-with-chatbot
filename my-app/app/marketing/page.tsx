'use client';

import { ReactNode, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, MapPinned, ShieldCheck, Sparkles, Truck, Users, Zap } from 'lucide-react';

const SCREENSHOT_SLOTS = [
  ['/marketing/screen-1.png', '/marketing/1.png', '/marketing/ss1.png'],
  ['/marketing/screen-2.png', '/marketing/2.png', '/marketing/ss2.png'],
  ['/marketing/screen-3.png', '/marketing/3.png', '/marketing/ss3.png'],
  ['/marketing/screen-4.png', '/marketing/4.png', '/marketing/ss4.png'],
  ['/marketing/screen-5.png', '/marketing/5.png', '/marketing/ss5.png'],
  ['/marketing/screen-6.png', '/marketing/6.png', '/marketing/ss6.png'],
];
const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || '#';

type SlotState = Record<number, number>;

export default function MarketingPage() {
  const [slotCursor, setSlotCursor] = useState<SlotState>({});

  const srcForSlot = (idx: number) => {
    const cursor = slotCursor[idx] || 0;
    return SCREENSHOT_SLOTS[idx][cursor] || SCREENSHOT_SLOTS[idx][0];
  };

  const onImgError = (idx: number) => {
    setSlotCursor((prev) => {
      const current = prev[idx] || 0;
      const next = current + 1;
      if (next >= SCREENSHOT_SLOTS[idx].length) return prev;
      return { ...prev, [idx]: next };
    });
  };

  const exhausted = useMemo(() => {
    const map: Record<number, boolean> = {};
    SCREENSHOT_SLOTS.forEach((list, idx) => {
      const cursor = slotCursor[idx] || 0;
      map[idx] = cursor >= list.length - 1;
    });
    return map;
  }, [slotCursor]);

  const Feature = ({ icon, title, text }: { icon: ReactNode; title: string; text: string }) => (
    <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-md">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
        {icon}
        {title}
      </div>
      <p className="text-sm font-semibold text-slate-700">{text}</p>
    </div>
  );

  const ScreenshotCard = ({ idx, minHeight }: { idx: number; minHeight?: string }) => (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-slate-100">
      <img
        src={srcForSlot(idx)}
        onError={(e) => {
          if (exhausted[idx]) {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            return;
          }
          onImgError(idx);
        }}
        alt={`Transport 245 screenshot ${idx + 1}`}
        className="h-full w-full object-cover"
      />
      {exhausted[idx] && (
        <div className={`flex ${minHeight || 'min-h-[200px]'} items-center justify-center bg-white px-4 text-center text-xs font-bold text-slate-500`}>
          Add screenshot {idx + 1} into `public/marketing/`
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#8ccde6] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-[2.2rem] border border-white/60 bg-white/70 p-6 shadow-xl backdrop-blur-xl md:p-8">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-200/50 blur-3xl" />
          <div className="absolute -left-10 -bottom-20 h-56 w-56 rounded-full bg-blue-300/40 blur-3xl" />

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                <img src="/apple-icon.png" alt="Transport 245" className="h-4 w-4 rounded-md object-cover" />
                Transport 245
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">New-Generation Logistics Network</h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-slate-700 md:text-base">
                Find nearby providers in seconds, dispatch smarter with map-aware workflows, and scale operational response with verified
                provider onboarding. Built for high-speed logistics and roadside operations.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={APP_STORE_URL}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-md"
                >
                  Download on the App Store
                  <ArrowRight size={14} />
                </a>
                <a
                  href="/support"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-slate-700"
                >
                  Support
                </a>
              </div>
            </div>

            <div className="min-w-[220px] rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Value Snapshot</p>
              <div className="mt-2 space-y-2 text-sm font-semibold text-slate-700">
                <p className="inline-flex items-center gap-2"><BadgeCheck size={14} className="text-emerald-600" /> Verified provider workflows</p>
                <p className="inline-flex items-center gap-2"><MapPinned size={14} className="text-cyan-700" /> Location-first service discovery</p>
                <p className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-blue-700" /> In-app subscription readiness</p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          <Feature icon={<Truck size={13} />} title="Provider Network" text="Broad service taxonomy with transport, rescue, tire, and charging coverage." />
          <Feature icon={<Zap size={13} />} title="Fast Dispatch" text="Map-integrated demand matching helps users act fast in high-urgency moments." />
          <Feature icon={<Users size={13} />} title="Operations Ready" text="Admin modules, provider onboarding, and controlled moderation improve trust." />
        </section>

        <section className="mt-7 rounded-[2rem] border border-white/60 bg-white/70 p-5 shadow-xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-black uppercase">App Store Screens</h2>
            <p className="text-xs font-semibold text-slate-600">Slots 1-2 are designed as a connected visual flow.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1].map((idx) => (
              <ScreenshotCard key={idx} idx={idx} minHeight="min-h-[260px]" />
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[2, 3, 4, 5].map((idx) => (
              <ScreenshotCard key={idx} idx={idx} />
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-xl backdrop-blur-xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            <Sparkles size={13} />
            Why teams choose Transport 245
          </div>
          <p className="text-sm font-semibold leading-relaxed text-slate-700">
            Strong field discoverability, practical filtering depth, and an operations-first UX convert first-time users into repeat usage.
            The platform is engineered for real service outcomes, not just directory listing.
          </p>
        </section>
      </div>
    </main>
  );
}
