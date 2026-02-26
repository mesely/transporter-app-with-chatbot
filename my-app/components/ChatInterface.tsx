'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Loader2, MapPin, Phone, Send, Shield, Trash2, UserCog, X, Zap } from 'lucide-react';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  dataPacket?: { type?: string; data?: any } | null;
}

const STORAGE_KEY = 'Transport_chat_history_v1';
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';

function uid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function splitPacket(text: string): { cleanText: string; dataPacket: any | null } {
  const match = text.match(/\|\|DATA\|\|([\s\S]*?)\|\|DATA\|\|/);
  if (!match) return { cleanText: text, dataPacket: null };
  try {
    return { cleanText: text.replace(match[0], '').trim(), dataPacket: JSON.parse(match[1]) };
  } catch {
    return { cleanText: text.replace(match[0], '').trim(), dataPacket: null };
  }
}

function greetingMessage(): ChatMessage {
  return {
    id: uid(),
    role: 'assistant',
    content: 'Merhaba, ben Transport AI. Arac cagirma, fiyat hesaplama, KVKK ve profil islemlerinde yardimci olurum.',
    createdAt: new Date().toISOString(),
    dataPacket: null,
  };
}

function badgeTheme(mainType?: string) {
  const t = (mainType || '').toUpperCase();
  if (t === 'KURTARICI') return 'bg-red-50 text-red-700 border-red-200';
  if (t === 'NAKLIYE') return 'bg-purple-50 text-purple-700 border-purple-200';
  if (t === 'SARJ') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (t === 'YOLCU') return 'bg-green-50 text-green-700 border-green-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

function quickStyle(label: string) {
  if (label.includes('Arac')) return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
  if (label.includes('Fiyat')) return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
  if (label.includes('KVKK')) return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
  return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
}

function vehicleOptionStyle(id: string) {
  if (id === 'oto_kurtarma' || id === 'vinc') return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
  if (id === 'nakliye' || id === 'tir' || id === 'kamyon' || id === 'kamyonet') return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
  if (id === 'evden_eve') return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
  return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
}

export default function ChatInterface({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {}
    setMessages([greetingMessage()]);
  }, []);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 120000, timeout: 8000 }
      );
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)));
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const historyForApi = useMemo(() => messages.map((m) => ({ role: m.role, content: m.content })), [messages]);

  async function submit(e?: FormEvent, forcedText?: string) {
    e?.preventDefault();
    const question = (forcedText || input).trim();
    if (!question || sending) return;

    const userMessage: ChatMessage = {
      id: uid(),
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
      dataPacket: null,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          history: [...historyForApi, { role: 'user', content: question }].slice(-12),
          location: userLocation || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Chat error ${res.status}`);

      const data = await res.json();
      const raw = String(data?.response || 'Bir sorun olustu, lutfen tekrar deneyin.');
      const { cleanText, dataPacket } = splitPacket(raw);

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: cleanText || 'Hazirim.',
          createdAt: new Date().toISOString(),
          dataPacket,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: 'Chat servisine baglanamadim. Birazdan tekrar deneyin.',
          createdAt: new Date().toISOString(),
          dataPacket: null,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function clearHistory() {
    const greet = greetingMessage();
    setMessages([greet]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([greet]));
  }

  const quickButtons = [
    { label: 'Arac Cagir', icon: MapPin, text: 'Arac Cagir' },
    { label: 'Fiyat Hesapla', icon: Zap, text: 'Fiyat hesapla: oto kurtarma 15 km' },
    { label: 'KVKK', icon: Shield, text: 'KVKK ve gizlilik metnini ozetle.' },
    { label: 'Profil Duzenle', icon: UserCog, text: 'Profil bilgilerimi nasil duzenleyebilirim?' },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-cyan-200/50 blur-[100px]" />
        <div className="absolute -bottom-16 -left-12 h-72 w-72 rounded-full bg-blue-100/70 blur-[110px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-50 p-2 ring-1 ring-cyan-200">
            <Bot className="h-5 w-5 text-cyan-700" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-slate-900">Transport AI</h1>
            <p className="text-xs text-slate-500">Arac cagir, fiyat hesapla, KVKK ve profil yardimi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
            aria-label="Gecmisi temizle"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {onClose ? (
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
              aria-label="Ana sayfaya don"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
        </div>
      </header>

      <div className="relative z-10 border-b border-slate-100 bg-white/80 px-3 py-2 backdrop-blur">
        <div className="custom-scrollbar mx-auto flex max-w-4xl gap-2 overflow-x-auto">
          {quickButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={() => void submit(undefined, btn.text)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${quickStyle(btn.label)}`}
            >
              <btn.icon className="h-3.5 w-3.5" />
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={listRef} className="relative z-10 h-[calc(100%-196px)] overflow-y-auto px-3 py-4 custom-scrollbar md:px-5">
        <div className="flex w-full flex-col gap-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[95%] rounded-2xl px-4 py-3 text-sm shadow-sm md:max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                {msg.dataPacket?.type === 'quick_actions' && Array.isArray(msg.dataPacket?.data) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.dataPacket.data.map((item: any) => (
                      <button
                        key={String(item?.id || item?.label)}
                        onClick={() => void submit(undefined, String(item?.prompt || item?.label || ''))}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${quickStyle(String(item?.label || ''))}`}
                      >
                        {item?.label || 'Secenek'}
                      </button>
                    ))}
                  </div>
                )}

                {msg.dataPacket?.type === 'vehicle_options' && Array.isArray(msg.dataPacket?.data) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.dataPacket.data.map((item: any) => (
                      <button
                        key={String(item?.id || item?.label)}
                        onClick={() => void submit(undefined, String(item?.prompt || item?.label || ''))}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${vehicleOptionStyle(String(item?.id || ''))}`}
                      >
                        {item?.label || 'Arac Secenegi'}
                      </button>
                    ))}
                  </div>
                )}

                {msg.dataPacket?.type === 'drivers_map' && Array.isArray(msg.dataPacket?.data) && (
                  <div className="mt-3 space-y-2">
                    {msg.dataPacket.data.slice(0, 5).map((driver: any, index: number) => {
                      const phone = (driver?.phoneNumber || '').toString().replace(/\D/g, '');
                      const lat = driver?.location?.coordinates?.[1];
                      const lng = driver?.location?.coordinates?.[0];
                      const mapUrl = Number.isFinite(lat) && Number.isFinite(lng)
                        ? `https://www.google.com/maps?q=${lat},${lng}`
                        : null;
                      const distanceText = driver?.distance ? `${Math.round(Number(driver.distance) / 1000)} km` : 'Mesafe yok';
                      const badgeClass = badgeTheme(driver?.service?.mainType);

                      return (
                        <div key={`${driver?._id || index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                              <p className="line-clamp-1 text-sm font-semibold text-slate-800">{driver?.businessName || 'Isletme'}</p>
                              <p className="text-xs text-slate-500">{distanceText}</p>
                            </div>
                            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${badgeClass}`}>
                              {driver?.service?.mainType || 'SERVIS'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {phone && (
                              <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
                                <Phone className="h-3.5 w-3.5" />
                                Ara
                              </a>
                            )}
                            {phone && (
                              <a href={`https://wa.me/90${phone.replace(/^0/, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-purple-700">
                                Mesaj At
                              </a>
                            )}
                            {mapUrl && (
                              <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                                Google Maps
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {msg.dataPacket?.type === 'calculation_result' && msg.dataPacket?.data && (
                  <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 p-3">
                    <p className="text-xs text-purple-700">Ortalama Fiyat</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {msg.dataPacket.data.total} {msg.dataPacket.data.currency || 'TL'}
                    </p>
                    <p className="text-xs text-purple-700">
                      {msg.dataPacket.data.amount} {msg.dataPacket.data.unit} x {msg.dataPacket.data.pricePerUnit}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Dusunuyorum...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={submit} className="relative z-10 border-t border-slate-200 bg-white/90 px-3 py-3 backdrop-blur-xl md:px-5">
        <div className="mx-auto flex w-full max-w-4xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ornek: Tuzla Oray oto cekici var mi, kac km?"
            rows={2}
            className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-2xl bg-cyan-600 p-3 text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
