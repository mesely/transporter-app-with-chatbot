'use client';

import {
  AlertTriangle,
  ArrowLeft,
  BookText,
  Heart,
  Phone,
  Shield,
  Star,
  UserCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import KVKKModal from '../../components/KVKKModal';
import UserAgreementModal from '../../components/UserAgreementModal';
import RatingModal from '../../components/RatingModal';
import ReportModal from '../../components/ReportModal';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';
const FAVORITES_KEY = 'Transport_favorites_v1';

type FavoriteItem = {
  _id: string;
  businessName?: string;
  phoneNumber?: string;
  address?: { city?: string; district?: string };
  rating?: number;
};

type OrderItem = {
  _id: string;
  serviceType?: string;
  status?: string;
  createdAt?: string;
  driver?: {
    _id?: string;
    businessName?: string;
    phoneNumber?: string;
  };
};

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('Transport_device_id');
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('Transport_device_id', id);
  }
  return id;
}

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState('Kullanıcı');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [myRatings, setMyRatings] = useState<any[]>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [showKvkkModal, setShowKvkkModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'history'>('general');

  const normalizedPhone = useMemo(() => String(phone || '').replace(/\D/g, ''), [phone]);

  useEffect(() => {
    const storedName = localStorage.getItem('Transport_user_name') || 'Kullanıcı';
    const storedEmail = localStorage.getItem('Transport_user_email') || '';
    const storedPhone = localStorage.getItem('Transport_user_phone') || '';
    const guestMode = localStorage.getItem('Transport_guest_mode') === '1';

    setName(storedName);
    setEmail(storedEmail);
    setPhone(storedPhone);
    setIsGuest(guestMode);

    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setFavorites(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    const loadActivity = async () => {
      if (!normalizedPhone) {
        setMyRatings([]);
        setMyReports([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [ratingsRes, reportsRes] = await Promise.all([
          fetch(`${API_URL}/users/ratings/by-reporter?phone=${encodeURIComponent(normalizedPhone)}`),
          fetch(`${API_URL}/reports?reporterPhone=${encodeURIComponent(normalizedPhone)}`),
        ]);
        const ratingsData = await ratingsRes.json();
        const reportsData = await reportsRes.json();
        setMyRatings(Array.isArray(ratingsData) ? ratingsData : []);
        setMyReports(Array.isArray(reportsData) ? reportsData : []);
      } catch {
        setMyRatings([]);
        setMyReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [normalizedPhone]);

  useEffect(() => {
    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const customerId = getOrCreateDeviceId();
        if (!customerId) {
          setOrderHistory([]);
          return;
        }
        const response = await fetch(`${API_URL}/orders?customerId=${encodeURIComponent(customerId)}`);
        const data = await response.json();
        setOrderHistory(Array.isArray(data) ? data : []);
      } catch {
        setOrderHistory([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, []);

  const getStatusChip = (statusRaw: string) => {
    const status = String(statusRaw || '').toUpperCase();
    if (status === 'APPROVED' || status === 'RESOLVED' || status === 'COMPLETED') {
      return { label: 'Tamamlandı', className: 'bg-emerald-100 text-emerald-700' };
    }
    if (status === 'REJECTED' || status === 'CLOSED' || status === 'CANCELLED') {
      return { label: 'Kapandı', className: 'bg-slate-200 text-slate-600' };
    }
    if (status === 'PENDING') {
      return { label: 'Bekliyor', className: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'İşlemde', className: 'bg-blue-100 text-blue-700' };
  };

  const handleOpenRating = (order: OrderItem) => {
    setSelectedOrder(order);
    setShowRatingModal(true);
  };

  const handleOpenReport = (order: OrderItem) => {
    setSelectedOrder(order);
    setShowReportModal(true);
  };

  const handleRateOrder = async (data: { rating: number; comment: string; tags: string[] }) => {
    const providerId = selectedOrder?.driver?._id;
    if (!providerId) {
      alert('Bu sipariş için firma bilgisi bulunamadı.');
      return;
    }

    const reporterPhone = normalizedPhone;
    if (!reporterPhone) {
      alert('Değerlendirme için profil telefon bilgisi gerekli.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${providerId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: data.rating,
          comment: data.comment,
          tags: data.tags,
          orderId: selectedOrder?._id,
          reporterPhone,
          reporterName: name,
          reporterEmail: email,
        }),
      });

      if (!response.ok) throw new Error('rating_failed');
      alert('Değerlendirme admin onayına gönderildi.');
    } catch {
      alert('Değerlendirme gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-[#f1f5f9] to-[#e2e8f0] px-5 pb-10 pt-10 md:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Ayarlar</h1>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide ${
                activeTab === 'general' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
              }`}
            >
              Genel
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide ${
                activeTab === 'history' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
              }`}
            >
              Geçmiş Siparişler
            </button>
          </div>
        </header>

        {activeTab === 'general' && (
        <>
        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <UserCircle2 className="text-cyan-700" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Hesap Bilgileri</p>
          </div>
          {isGuest && (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase text-blue-700">Misafir Modu</p>
              <p className="mt-1 text-xs font-semibold text-blue-700">
                Profil, değerlendirme ve şikayet işlemleri için giriş yapmanız gerekir.
              </p>
              <button
                onClick={() => router.push('/auth')}
                className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white"
              >
                Giriş Yap
              </button>
            </div>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase text-slate-400">Ad Soyad</p>
              <p className="mt-1 text-sm font-black text-slate-900">{name || '-'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase text-slate-400">E-posta</p>
              <p className="mt-1 text-sm font-black text-slate-900 break-all">{email || '-'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <BookText className="text-indigo-600" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Sözleşme ve İletişim</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button
              onClick={() => setShowAgreementModal(true)}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left"
            >
              <p className="text-[10px] font-black uppercase text-slate-400">Kullanıcı Sözleşmesi</p>
            </button>

            <button
              onClick={() => setShowKvkkModal(true)}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left"
            >
              <p className="text-[10px] font-black uppercase text-slate-400">KVKK Aydınlatma</p>
            </button>
          </div>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase text-slate-400">İletişim</p>
            <a href="mailto:iletisimtransporter@gmail.com" className="mt-1 block text-sm font-black text-slate-900 break-all">
              iletisimtransporter@gmail.com
            </a>
          </div>
        </section>
        </>
        )}

        {activeTab === 'history' && (
        <>
        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Phone className="text-blue-600" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Geçmiş Siparişler</p>
          </div>
          <div className="mt-4 space-y-2">
            {ordersLoading ? (
              <p className="text-xs font-bold text-slate-500">Yükleniyor...</p>
            ) : orderHistory.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">Henüz geçmiş sipariş yok.</p>
            ) : (
              orderHistory.map((order) => {
                const chip = getStatusChip(String(order.status || ''));
                const createdAtText = order.createdAt
                  ? new Date(order.createdAt).toLocaleString('tr-TR')
                  : '-';

                return (
                  <div key={order._id} className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase text-slate-800">
                        {order.driver?.businessName || 'Firma'}
                      </p>
                      <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${chip.className}`}>
                        {chip.label}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-slate-600">
                      Hizmet: {order.serviceType || '-'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-600">Tarih: {createdAtText}</p>

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleOpenRating(order)}
                        className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-[10px] font-black uppercase text-white"
                      >
                        Değerlendirme
                      </button>
                      <button
                        onClick={() => handleOpenReport(order)}
                        className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-[10px] font-black uppercase text-white"
                      >
                        Şikayet
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Heart className="text-rose-600" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Favori Firmalar</p>
          </div>
          <div className="mt-4 space-y-2">
            {favorites.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">Henüz favori firma yok.</p>
            ) : (
              favorites.map((fav) => (
                <div key={fav._id} className="rounded-xl border border-rose-100 bg-rose-50/70 p-3">
                  <p className="text-xs font-black uppercase text-slate-800">{fav.businessName || 'Firma'}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-600">
                    {(fav.address?.district || '-') + ' / ' + (fav.address?.city || '-')}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Star className="text-amber-500" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Yaptığım Değerlendirmeler</p>
          </div>
          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="text-xs font-bold text-slate-500">Yükleniyor...</p>
            ) : myRatings.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">Henüz değerlendirme yok.</p>
            ) : (
              myRatings.map((item) => {
                const chip = getStatusChip(item.status);
                return (
                  <div key={`${item.providerId}-${item.entryId}`} className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase text-slate-800">{item.providerName || 'Firma'}</p>
                      <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${chip.className}`}>{chip.label}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-bold text-slate-600">Puan: {item.rating}/5</p>
                    {item.comment && <p className="mt-1 text-[11px] font-medium text-slate-600">{item.comment}</p>}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Yaptığım Şikayetler</p>
          </div>
          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="text-xs font-bold text-slate-500">Yükleniyor...</p>
            ) : myReports.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">Henüz şikayet yok.</p>
            ) : (
              myReports.map((item: any) => {
                const chip = getStatusChip(item.status);
                return (
                  <div key={item._id} className="rounded-xl border border-red-100 bg-red-50/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase text-slate-800">{item.reason || 'Şikayet'}</p>
                      <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${chip.className}`}>{chip.label}</span>
                    </div>
                    {item.details && <p className="mt-1 text-[11px] font-medium text-slate-600">{item.details}</p>}
                  </div>
                );
              })
            )}
          </div>
        </section>
        </>
        )}

        <footer className="rounded-[2rem] border border-white/70 bg-white/70 p-4 text-center shadow-lg backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            Net gelirin %10&apos;una kadar yardım kuruluşlarına bağışlanır.
          </p>
        </footer>
      </div>

      <KVKKModal isOpen={showKvkkModal} onClose={() => setShowKvkkModal(false)} readOnly />
      <UserAgreementModal isOpen={showAgreementModal} onClose={() => setShowAgreementModal(false)} readOnly />
      <RatingModal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} onRate={handleRateOrder} />
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        orderId={selectedOrder?._id || null}
        driverId={selectedOrder?.driver?._id || null}
      />
    </main>
  );
}
