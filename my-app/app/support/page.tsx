'use client';

import { FormEvent, useMemo, useState } from 'react';
import { CircleCheckBig, LifeBuoy, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { createSupportTicket } from '../../lib/supportTickets';
const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || '#';

type Lang = 'tr' | 'en';

const COPY = {
  tr: {
    badge: 'TRANSPORT 245 DESTEK',
    title: 'Destek Talebi Olustur',
    desc: 'Sorun, oneriler ve teknik destek taleplerinizi form ile iletin. Talebiniz support paneline dusup e-posta ile yanitlanir.',
    formTitle: 'Hizli Destek Formu',
    name: 'Ad Soyad',
    email: 'E-posta',
    subject: 'Konu',
    message: 'Mesaj',
    platform: 'Platform',
    appVersion: 'Uygulama Surumu',
    submit: 'Talep Gonder',
    success: 'Talebiniz alindi. En kisa surede e-posta ile donus yapacagiz.',
    contactTitle: 'Dogrudan Iletisim',
    contactText: 'Acil durumlarda bize dogrudan yazabilirsiniz:',
    emailLabel: 'Mail Ac',
    langButton: 'EN',
    marketing: 'Marketing Sayfasi',
    appStore: 'App Store',
  },
  en: {
    badge: 'TRANSPORT 245 SUPPORT',
    title: 'Create a Support Request',
    desc: 'Send issues, suggestions, and support requests through this form. Your request appears in support admin and can be answered by email.',
    formTitle: 'Quick Support Form',
    name: 'Full Name',
    email: 'Email',
    subject: 'Subject',
    message: 'Message',
    platform: 'Platform',
    appVersion: 'App Version',
    submit: 'Send Request',
    success: 'Your request has been received. We will reply by email soon.',
    contactTitle: 'Direct Contact',
    contactText: 'For urgent cases, contact us directly:',
    emailLabel: 'Open Mail',
    langButton: 'TR',
    marketing: 'Marketing Page',
    appStore: 'App Store',
  },
} as const;

export default function SupportPage() {
  const [lang, setLang] = useState<Lang>('tr');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [platform, setPlatform] = useState('iOS');
  const [appVersion, setAppVersion] = useState('1.0.21');
  const [success, setSuccess] = useState('');
  const t = useMemo(() => COPY[lang], [lang]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.includes('@') || !subject.trim() || message.trim().length < 8) {
      alert(lang === 'tr' ? 'Lutfen tum alanlari dogru doldurun.' : 'Please complete all fields correctly.');
      return;
    }

    createSupportTicket({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      platform: platform.trim(),
      appVersion: appVersion.trim(),
    });

    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setSuccess(t.success);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#8ccde6] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(15,23,42,0.12),transparent_42%),radial-gradient(circle_at_85%_25%,rgba(2,132,199,0.2),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.2),transparent_45%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <img src="/apple-icon.png" alt="Transport 245 Logo" className="h-11 w-11 rounded-2xl object-cover shadow-md" />
          <button
            onClick={() => setLang((prev) => (prev === 'tr' ? 'en' : 'tr'))}
            className="rounded-xl border border-white/60 bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-700 shadow-md backdrop-blur-md"
          >
            {t.langButton}
          </button>
        </div>

        <section className="rounded-[2rem] border border-white/60 bg-white/65 p-6 shadow-xl backdrop-blur-xl sm:p-8">
          <span className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">
            {t.badge}
          </span>

          <h1 className="mt-5 text-2xl font-black leading-tight sm:text-3xl">{t.title}</h1>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-700 sm:text-[15px]">{t.desc}</p>

          <div className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <form onSubmit={submit} className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare size={16} className="text-cyan-700" />
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">{t.formTitle}</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.name} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none" />
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t.subject} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none sm:col-span-2" />
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.message} className="h-28 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none sm:col-span-2" />
                <div className="relative">
                  <Smartphone size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-500" />
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-8 py-2 text-xs font-black outline-none">
                    <option>iOS</option>
                    <option>Android</option>
                    <option>Web</option>
                  </select>
                </div>
                <input value={appVersion} onChange={(e) => setAppVersion(e.target.value)} placeholder={t.appVersion} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none" />
              </div>

              <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-md">
                <LifeBuoy size={14} />
                {t.submit}
              </button>
              {success && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                  <CircleCheckBig size={14} />
                  {success}
                </p>
              )}
            </form>

            <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <LifeBuoy size={16} className="text-blue-700" />
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">{t.contactTitle}</h2>
              </div>
              <p className="text-sm font-semibold text-slate-600">{t.contactText}</p>

              <a
                href="mailto:iletisimtransporter@gmail.com"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-md"
              >
                <Mail size={15} />
                {t.emailLabel}
              </a>

              <p className="mt-3 break-all text-sm font-bold text-slate-700">iletisimtransporter@gmail.com</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">+90 537 408 10 74</p>

              <div className="mt-5 grid gap-2">
                <a href="/marketing" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-slate-700">
                  {t.marketing}
                </a>
                <a href={APP_STORE_URL} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-slate-700">
                  {t.appStore}
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
