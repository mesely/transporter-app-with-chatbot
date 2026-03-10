'use client';

export type SupportTicketStatus = 'open' | 'approved' | 'rejected' | 'resolved';

export type SupportTicket = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  platform: string;
  appVersion?: string;
  status: SupportTicketStatus;
};

const STORAGE_KEY = 'transport245_support_tickets_v1';

function safeParse(raw: string | null): SupportTicket[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readTickets(): SupportTicket[] {
  if (typeof window === 'undefined') return [];
  const tickets = safeParse(localStorage.getItem(STORAGE_KEY));
  return tickets
    .filter((t) => t && typeof t.id === 'string')
    .sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
}

function writeTickets(tickets: SupportTicket[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function genId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function listSupportTickets() {
  return readTickets();
}

export function createSupportTicket(input: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) {
  const next: SupportTicket = {
    ...input,
    appVersion: String(input.appVersion || '').trim() || '-',
    id: genId(),
    createdAt: new Date().toISOString(),
    status: 'open',
  };
  const tickets = readTickets();
  tickets.unshift(next);
  writeTickets(tickets);
  return next;
}

export function updateSupportTicketStatus(id: string, status: SupportTicketStatus) {
  const tickets = readTickets().map((t) => (t.id === id ? { ...t, status } : t));
  writeTickets(tickets);
}

export function deleteSupportTicket(id: string) {
  const tickets = readTickets().filter((t) => t.id !== id);
  writeTickets(tickets);
}
