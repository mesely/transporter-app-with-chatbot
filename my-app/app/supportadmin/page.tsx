'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, RefreshCw, Trash2 } from 'lucide-react';
import { deleteSupportTicket, listSupportTickets, SupportTicket, updateSupportTicketStatus } from '../../lib/supportTickets';

type Lang = 'tr' | 'en' | 'fr';

const ADMIN_PIN = process.env.NEXT_PUBLIC_SUPPORT_ADMIN_PIN || 'harun245';

const COPY = {
  tr: {
    title: 'Support Admin',
    enterPin: 'Admin PIN girin',
    login: 'Panele Gir',
    wrongPin: 'PIN hatalı.',
    refresh: 'Yenile',
    hideResolved: 'Çözülenleri Gizle',
    showResolved: 'Çözülenleri Göster',
    noTickets: 'Gösterilecek destek talebi yok.',
    reply: 'Mail ile Cevapla',
    approve: 'Onayla',
    reject: 'Reddet',
    resolve: 'Çözüldü',
    reopen: 'Tekrar Aç',
    del: 'Sil',
    confirmDelete: 'Bu talep silinsin mi?',
    open: 'Açık',
    resolved: 'Çözüldü',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
  },
  en: {
    title: 'Support Admin',
    enterPin: 'Enter admin PIN',
    login: 'Open Panel',
    wrongPin: 'Wrong PIN.',
    refresh: 'Refresh',
    hideResolved: 'Hide Resolved',
    showResolved: 'Show Resolved',
    noTickets: 'No support ticket to display.',
    reply: 'Reply by Email',
    approve: 'Approve',
    reject: 'Reject',
    resolve: 'Mark Resolved',
    reopen: 'Reopen',
    del: 'Delete',
    confirmDelete: 'Delete this ticket?',
    open: 'Open',
    resolved: 'Resolved',
    approved: 'Approved',
    rejected: 'Rejected',
  },
  fr: {
    title: 'Support Admin',
    enterPin: 'Entrez le PIN admin',
    login: 'Ouvrir le Panneau',
    wrongPin: 'PIN incorrect.',
    refresh: 'Actualiser',
    hideResolved: 'Masquer Résolus',
    showResolved: 'Afficher Résolus',
    noTickets: 'Aucune demande à afficher.',
    reply: 'Répondre par E-mail',
    approve: 'Approuver',
    reject: 'Rejeter',
    resolve: 'Marquer Résolu',
    reopen: 'Rouvrir',
    del: 'Supprimer',
    confirmDelete: 'Supprimer cette demande ?',
    open: 'Ouvert',
    resolved: 'Résolu',
    approved: 'Approuvé',
    rejected: 'Rejeté',
  },
} as const;

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('tr-TR');
}

export default function SupportAdminPage() {
  const [lang, setLang] = useState<Lang>('tr');
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showResolved, setShowResolved] = useState(true);

  const t = COPY[lang];

  const reload = () => setTickets(listSupportTickets());

  useEffect(() => {
    if (!unlocked) return;
    reload();
  }, [unlocked]);

  const visibleTickets = useMemo(() => tickets.filter((item) => (showResolved ? true : item.status !== 'resolved')), [showResolved, tickets]);

  const tryUnlock = () => {
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
      return;
    }
    alert(t.wrongPin);
  };

  const buildReplyHref = (ticket: SupportTicket) => {
    const subject = encodeURIComponent(`Transport 245 Support - ${ticket.subject}`);
    const body = encodeURIComponent(
      [
        `Merhaba ${ticket.name},`,
        '',
        'Destek talebiniz incelendi.',
        `Talep ID: ${ticket.id}`,
        '',
        '[Yanıt]',
        '',
        'Transport 245 Support Team',
      ].join('\n'),
    );
    return `mailto:${ticket.email}?subject=${subject}&body=${body}`;
  };

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-lg px-5 py-8">
          <header className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="inline-flex items-center gap-3">
              <img src="/favicon.png" alt="Transport 245" className="h-10 w-10 rounded-xl object-cover" />
              <p className="text-sm font-black uppercase tracking-[0.15em] text-cyan-700">{t.title}</p>
            </div>
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none">
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </header>

          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            type="password"
            placeholder={t.enterPin}
            className="w-full border-b border-slate-300 px-1 py-2 text-sm font-semibold outline-none"
          />
          <button onClick={tryUnlock} className="mt-4 rounded-xl bg-cyan-700 px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white">
            {t.login}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="inline-flex items-center gap-3">
            <img src="/favicon.png" alt="Transport 245" className="h-10 w-10 rounded-xl object-cover" />
            <p className="text-sm font-black uppercase tracking-[0.15em] text-cyan-700">{t.title}</p>
          </div>

          <div className="inline-flex items-center gap-2">
            <button onClick={reload} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
              <span className="inline-flex items-center gap-1"><RefreshCw size={13} /> {t.refresh}</span>
            </button>
            <button onClick={() => setShowResolved((v) => !v)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
              {showResolved ? t.hideResolved : t.showResolved}
            </button>
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none">
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </header>

        <div className="space-y-4">
          {visibleTickets.length === 0 ? (
            <p className="text-sm font-semibold text-slate-500">{t.noTickets}</p>
          ) : (
            visibleTickets.map((ticket) => (
              <article key={ticket.id} className="border-b border-slate-200 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-900">{ticket.subject}</p>
                    <p className="text-xs font-semibold text-slate-600">{ticket.name} - {ticket.email}</p>
                    <p className="text-xs font-medium text-slate-500">{ticket.platform} / v{ticket.appVersion} - {formatDate(ticket.createdAt)}</p>
                  </div>
                  {(() => {
                    const statusClass =
                      ticket.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : ticket.status === 'rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : ticket.status === 'resolved'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700';
                    const statusLabel =
                      ticket.status === 'approved'
                        ? t.approved
                        : ticket.status === 'rejected'
                          ? t.rejected
                          : ticket.status === 'resolved'
                            ? t.resolved
                            : t.open;
                    return <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${statusClass}`}>{statusLabel}</span>;
                  })()}
                </div>

                <p className="mt-2 text-sm font-medium text-slate-700">{ticket.message}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={buildReplyHref(ticket)} className="inline-flex items-center gap-1 rounded-xl bg-cyan-700 px-3 py-2 text-[11px] font-black uppercase text-white">
                    <Mail size={13} /> {t.reply}
                  </a>

                  <button
                    onClick={() => {
                      updateSupportTicketStatus(ticket.id, 'approved');
                      reload();
                    }}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase text-emerald-700"
                  >
                    {t.approve}
                  </button>

                  <button
                    onClick={() => {
                      updateSupportTicketStatus(ticket.id, 'rejected');
                      reload();
                    }}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-black uppercase text-rose-700"
                  >
                    {t.reject}
                  </button>

                  {ticket.status === 'open' ? (
                    <button onClick={() => { updateSupportTicketStatus(ticket.id, 'resolved'); reload(); }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase text-emerald-700">
                      {t.resolve}
                    </button>
                  ) : (
                    <button onClick={() => { updateSupportTicketStatus(ticket.id, 'open'); reload(); }} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-black uppercase text-amber-700">
                      {t.reopen}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (!confirm(t.confirmDelete)) return;
                      deleteSupportTicket(ticket.id);
                      reload();
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-black uppercase text-red-700"
                  >
                    <Trash2 size={13} /> {t.del}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
