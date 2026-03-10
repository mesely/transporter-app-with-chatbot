'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Mail, RefreshCw, Shield, Trash2 } from 'lucide-react';
import {
  deleteSupportTicket,
  listSupportTickets,
  SupportTicket,
  updateSupportTicketStatus,
} from '../../lib/supportTickets';

const ADMIN_PIN = process.env.NEXT_PUBLIC_SUPPORT_ADMIN_PIN || '245245';

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('tr-TR');
}

export default function SupportAdminPage() {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showResolved, setShowResolved] = useState(true);

  const reload = () => {
    setTickets(listSupportTickets());
  };

  useEffect(() => {
    if (!unlocked) return;
    reload();
  }, [unlocked]);

  const visibleTickets = useMemo(() => {
    return tickets.filter((t) => (showResolved ? true : t.status === 'open'));
  }, [showResolved, tickets]);

  const tryUnlock = () => {
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
      return;
    }
    alert('PIN hatali.');
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
        '[Buraya yanitinizi yazin]',
        '',
        'Transport 245 Support Team',
      ].join('\n'),
    );
    return `mailto:${ticket.email}?subject=${subject}&body=${body}`;
  };

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-[#8ccde6] px-4 py-8 text-slate-900 md:px-8">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-white/60 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={18} className="text-cyan-700" />
            <h1 className="text-lg font-black uppercase tracking-wide">Support Admin</h1>
          </div>
          <p className="text-sm font-semibold text-slate-600">Paneli acmak icin admin PIN girin.</p>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            type="password"
            placeholder="Admin PIN"
            className="mt-4 w-full rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-sm font-bold outline-none"
          />
          <button
            onClick={tryUnlock}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase text-white"
          >
            <Shield size={14} />
            Panele Gir
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#8ccde6] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-[2rem] border border-white/60 bg-white/65 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="/apple-icon.png" alt="Transport 245" className="h-10 w-10 rounded-xl object-cover shadow-md" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Transport 245</p>
                <h1 className="text-xl font-black uppercase">Support Admin Panel</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={reload} className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-[11px] font-black uppercase">
                <span className="inline-flex items-center gap-1"><RefreshCw size={13} /> Yenile</span>
              </button>
              <button
                onClick={() => setShowResolved((v) => !v)}
                className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-[11px] font-black uppercase"
              >
                {showResolved ? 'Resolved Gizle' : 'Resolved Goster'}
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-4">
          {visibleTickets.length === 0 ? (
            <div className="rounded-2xl border border-white/70 bg-white/80 p-6 text-sm font-bold text-slate-600">
              Gosterilecek destek talebi yok.
            </div>
          ) : (
            visibleTickets.map((ticket) => (
              <article key={ticket.id} className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-500">Ticket</p>
                    <h2 className="text-sm font-black uppercase text-slate-900">{ticket.subject}</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      {ticket.name} - {ticket.email}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-600">
                      {ticket.platform} / v{ticket.appVersion} - {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                      ticket.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>

                <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  {ticket.message}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={buildReplyHref(ticket)}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-black uppercase text-white"
                  >
                    <Mail size={13} />
                    Mail ile Cevapla
                  </a>
                  {ticket.status === 'open' ? (
                    <button
                      onClick={() => {
                        updateSupportTicketStatus(ticket.id, 'resolved');
                        reload();
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase text-emerald-700"
                    >
                      <CheckCircle2 size={13} />
                      Cozuldu Isaretle
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        updateSupportTicketStatus(ticket.id, 'open');
                        reload();
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-black uppercase text-amber-700"
                    >
                      <RefreshCw size={13} />
                      Tekrar Ac
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!confirm('Bu talep silinsin mi?')) return;
                      deleteSupportTicket(ticket.id);
                      reload();
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-black uppercase text-red-700"
                  >
                    <Trash2 size={13} />
                    Sil
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
