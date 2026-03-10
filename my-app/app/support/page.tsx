'use client';

import { FormEvent, useMemo, useState } from 'react';
import { CircleCheckBig, Mail } from 'lucide-react';
import { createSupportTicket } from '../../lib/supportTickets';

type Lang = 'tr' | 'en' | 'fr';

type Copy = {
  badge: string;
  title: string;
  desc: string;
  placeholders: {
    name: string;
    email: string;
    subject: string;
    message: string;
    appVersion: string;
  };
  submit: string;
  success: string;
  contact: string;
  invalid: string;
};

const COPY: Record<Lang, Copy> = {
  tr: {
    badge: 'DESTEK MERKEZİ',
    title: 'Size nasıl yardımcı olabiliriz?',
    desc: 'Talebinizi gönderin, supportadmin panelimize düşsün. Yanıtı doğrudan e-posta adresinize iletelim.',
    placeholders: {
      name: 'Ad Soyad',
      email: 'E-posta',
      subject: 'Konu',
      message: 'Mesajınızı yazın...',
      appVersion: 'Uygulama Sürümü',
    },
    submit: 'Talebi Gönder',
    success: 'Talebiniz alındı. En kısa sürede e-posta ile dönüş yapacağız.',
    contact: 'Doğrudan iletişim: iletisimtransporter@gmail.com',
    invalid: 'Lütfen tüm alanları doğru doldurun.',
  },
  en: {
    badge: 'SUPPORT CENTER',
    title: 'How can we help you?',
    desc: 'Send your request and it will appear in support admin. We will respond directly to your email.',
    placeholders: {
      name: 'Full Name',
      email: 'Email',
      subject: 'Subject',
      message: 'Write your message...',
      appVersion: 'App Version',
    },
    submit: 'Send Request',
    success: 'Your request has been received. We will reply by email shortly.',
    contact: 'Direct contact: iletisimtransporter@gmail.com',
    invalid: 'Please complete all fields correctly.',
  },
  fr: {
    badge: 'CENTRE DE SUPPORT',
    title: 'Comment pouvons-nous vous aider?',
    desc: 'Envoyez votre demande, elle apparaitra dans support admin. Nous vous repondrons directement par e-mail.',
    placeholders: {
      name: 'Nom Complet',
      email: 'E-mail',
      subject: 'Sujet',
      message: 'Ecrivez votre message...',
      appVersion: 'Version de l\'app',
    },
    submit: 'Envoyer la Demande',
    success: 'Votre demande a ete recue. Nous vous repondrons rapidement par e-mail.',
    contact: 'Contact direct : iletisimtransporter@gmail.com',
    invalid: 'Veuillez remplir correctement tous les champs.',
  },
};

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
      alert(t.invalid);
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
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-5 py-6 md:px-8 md:py-8">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="inline-flex items-center gap-3">
            <img src="/favicon.png" alt="Transport 245" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-700">Transport 245</p>
              <p className="text-sm font-semibold text-slate-600">{t.badge}</p>
            </div>
          </div>

          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </header>

        <section>
          <h1 className="text-3xl font-black leading-tight md:text-4xl">{t.title}</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600 md:text-base">{t.desc}</p>

          <form onSubmit={submit} className="mt-8 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.placeholders.name} className="w-full border-b border-slate-300 px-1 py-2 text-sm font-semibold outline-none" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.placeholders.email} className="w-full border-b border-slate-300 px-1 py-2 text-sm font-semibold outline-none" />
            </div>

            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t.placeholders.subject} className="w-full border-b border-slate-300 px-1 py-2 text-sm font-semibold outline-none" />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.placeholders.message} className="h-36 w-full resize-none border-b border-slate-300 px-1 py-2 text-sm font-medium outline-none" />

            <div className="grid gap-4 sm:grid-cols-2">
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full border-b border-slate-300 bg-white px-1 py-2 text-sm font-semibold outline-none">
                <option>iOS</option>
                <option>Android</option>
                <option>Web</option>
              </select>
              <input value={appVersion} onChange={(e) => setAppVersion(e.target.value)} placeholder={t.placeholders.appVersion} className="w-full border-b border-slate-300 px-1 py-2 text-sm font-semibold outline-none" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white">
                <Mail size={15} />
                {t.submit}
              </button>
              <p className="text-xs font-semibold text-slate-600">{t.contact}</p>
            </div>

            {success && (
              <p className="mt-2 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                <CircleCheckBig size={14} />
                {success}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
