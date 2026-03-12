'use client';

import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BookText,
  ExternalLink,
  Globe2,
  Heart,
  Phone,
  Shield,
  Star,
  UserCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser, signOut } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { auth } from '../../lib/firebase';
import KVKKModal from '../../components/KVKKModal';
import UserAgreementModal from '../../components/UserAgreementModal';
import RatingModal from '../../components/RatingModal';
import ReportModal from '../../components/ReportModal';
import { AppLang, LANG_CHANGED_EVENT, getPreferredLang, setPreferredLang } from '../../utils/language';
import { useMembershipIap } from '../../lib/useMembershipIap';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';
const FAVORITES_KEY = 'Transport_favorites_v1';
const SKIP_SPLASH_ONCE_KEY = 'Transport_skip_splash_once';
const APPLE_STANDARD_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

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

function isMockLikeText(value?: string): boolean {
  const normalized = String(value || '').toLocaleLowerCase('tr').trim();
  if (!normalized) return false;
  return (
    normalized.includes('mock') ||
    normalized.includes('dummy') ||
    normalized.includes('test') ||
    normalized.includes('örnek') ||
    normalized.includes('ornek') ||
    normalized.includes('transport 245 oto kurtarma')
  );
}

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

function getMembershipText(lang: AppLang) {
  if (lang === 'tr') {
    return {
      title: 'Üyelik Bilgisi',
      productLabel: 'Ürün',
      priceLabel: 'Fiyat',
      storeInfoPending: 'Apple fiyatı yükleniyor.',
      storeInfoUnavailable: 'App Store bilgisi henüz alınamadı.',
      paymentOnlyApple: 'Ödeme yalnızca App Store aboneliği ile yapılır.',
      status: 'Durum',
      active: 'Aktif',
      passive: 'Pasif',
      expiry: 'Bitiş',
      iosOnlyInfo: 'Abonelik satın alma iOS uygulamasında App Store üzerinden yapılır.',
      start: 'Aboneliği Başlat',
      restore: 'Satın Alımları Geri Yükle',
      manage: 'Aboneliği Yönet',
      processing: 'İşleniyor...',
    };
  }
  if (lang === 'fr') {
    return {
      title: 'Adhésion',
      productLabel: 'Produit',
      priceLabel: 'Prix',
      storeInfoPending: 'Prix Apple en cours de chargement.',
      storeInfoUnavailable: 'Les informations App Store ne sont pas encore disponibles.',
      paymentOnlyApple: 'Paiement uniquement via abonnement App Store.',
      status: 'Statut',
      active: 'Actif',
      passive: 'Inactif',
      expiry: 'Expiration',
      iosOnlyInfo: "L'achat d'abonnement est disponible sur iOS via App Store.",
      start: "Démarrer l'abonnement",
      restore: 'Restaurer les achats',
      manage: "Gérer l'abonnement",
      processing: 'Traitement...',
    };
  }
  if (lang === 'en') {
    return {
      title: 'Membership',
      productLabel: 'Product',
      priceLabel: 'Price',
      storeInfoPending: 'Apple price is loading.',
      storeInfoUnavailable: 'App Store information is not available yet.',
      paymentOnlyApple: 'Payment is available only via App Store subscription.',
      status: 'Status',
      active: 'Active',
      passive: 'Inactive',
      expiry: 'Expiry',
      iosOnlyInfo: 'Subscription purchase is available on iOS via App Store.',
      start: 'Start Subscription',
      restore: 'Restore Purchases',
      manage: 'Manage Subscription',
      processing: 'Processing...',
    };
  }
  return {
    title: 'Membership',
    productLabel: 'Product',
    priceLabel: 'Price',
    storeInfoPending: 'Apple price is loading.',
    storeInfoUnavailable: 'App Store information is not available yet.',
    paymentOnlyApple: 'Payment is available only via App Store subscription.',
    status: 'Status',
    active: 'Active',
    passive: 'Inactive',
    expiry: 'Expiry',
    iosOnlyInfo: 'Subscription purchase is available on iOS via App Store.',
    start: 'Start Subscription',
    restore: 'Restore Purchases',
    manage: 'Manage Subscription',
    processing: 'Processing...',
  };
}

function toLocaleTag(lang: AppLang): string {
  if (lang === 'tr') return 'tr-TR';
  if (lang === 'fr') return 'fr-FR';
  if (lang === 'en') return 'en-US';
  if (lang === 'de') return 'de-DE';
  if (lang === 'it') return 'it-IT';
  if (lang === 'es') return 'es-ES';
  if (lang === 'pt') return 'pt-PT';
  if (lang === 'ru') return 'ru-RU';
  if (lang === 'zh') return 'zh-CN';
  if (lang === 'ja') return 'ja-JP';
  if (lang === 'ko') return 'ko-KR';
  if (lang === 'ar') return 'ar-SA';
  return 'en-US';
}

function getSettingsText(lang: AppLang) {
  if (lang === 'tr') {
    return {
      defaultUser: 'Kullanıcı',
      settingsTitle: 'Ayarlar',
      tabGeneral: 'Genel',
      tabOrders: 'Siparişler',
      accountInfo: 'Hesap Bilgileri',
      guestMode: 'Misafir Modu',
      guestHint: 'Profil, değerlendirme ve şikayet işlemleri için giriş yapmanız gerekir.',
      login: 'Giriş Yap',
      fullName: 'Ad Soyad',
      email: 'E-posta',
      logout: 'Çıkış Yap',
      deleteAccount: 'Hesabı Sil',
      contractsAndContact: 'Sözleşme ve İletişim',
      language: 'Dil',
      userAgreement: 'Kullanıcı Sözleşmesi',
      kvkk: 'KVKK Aydınlatma',
      contact: 'İletişim',
      orders: 'Siparişler',
      loading: 'Yükleniyor...',
      noOrderHistory: 'Henüz geçmiş sipariş yok.',
      service: 'Hizmet',
      date: 'Tarih',
      rating: 'Değerlendirme',
      complaint: 'Şikayet',
      favorites: 'Favori Firmalar',
      noFavorites: 'Henüz favori firma yok.',
      myRatings: 'Yaptığım Değerlendirmeler',
      noRatings: 'Henüz değerlendirme yok.',
      score: 'Puan',
      myComplaints: 'Yaptığım Şikayetler',
      noComplaints: 'Henüz şikayet yok.',
      donationNote: "Net gelirin %10'una kadar yardım kuruluşlarına bağışlanır.",
      statusCompleted: 'Tamamlandı',
      statusClosed: 'Kapandı',
      statusPending: 'Bekliyor',
      statusInProgress: 'İşlemde',
      accountDeleteConfirm: 'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      accountDeleteReauth: 'Güvenlik nedeniyle hesap silme için yeniden doğrulama gerekiyor. Lütfen tekrar giriş yapıp yeniden deneyin.',
      accountDeleteFailed: 'Hesap silinemedi. Lütfen tekrar deneyin. Sorun sürerse tekrar giriş yapıp yeniden silin.',
      accountDeletedWithSub: 'Hesap silindi. Not: App Store aboneliği Apple Kimliğinize bağlıdır. Gerekirse App Store abonelikler ekranından iptal edebilirsiniz.',
      accountDeleted: 'Hesap silindi.',
      noProviderInfo: 'Bu sipariş için firma bilgisi bulunamadı.',
      phoneRequired: 'Değerlendirme için profil telefon bilgisi gerekli.',
      ratingSent: 'Değerlendirme admin onayına gönderildi.',
      ratingFailed: 'Değerlendirme gönderilemedi. Lütfen tekrar deneyin.',
      subscriptionName: 'Transport 245 Yillik Uyelik',
      subscriptionPeriodLabel: 'Sure',
      subscriptionPeriodValue: '1 yil, otomatik yenilenir',
      subscriptionIncludesLabel: 'Abonelik kapsaminda',
      subscriptionBenefits: [
        'Harita ve liste ekranlarinda hizmet saglayici kesfi',
        'Hizmet turune gore filtreleme ve yakin saglayici goruntuleme',
        'Favoriler, degerlendirme ve sikayet ozelliklerine devam eden erisim',
      ],
      subscriptionLegalLabel: 'Yasal baglantilar',
      privacyLink: 'Gizlilik Politikasi',
      termsLink: 'Kullanim Kosullari',
    };
  }
  if (lang === 'fr') {
    return {
      defaultUser: 'Utilisateur',
      settingsTitle: 'Paramètres',
      tabGeneral: 'Général',
      tabOrders: 'Commandes',
      accountInfo: 'Informations du compte',
      guestMode: 'Mode Invité',
      guestHint: 'Vous devez vous connecter pour le profil, les avis et les réclamations.',
      login: 'Se connecter',
      fullName: 'Nom complet',
      email: 'E-mail',
      logout: 'Déconnexion',
      deleteAccount: 'Supprimer le compte',
      contractsAndContact: 'Contrats et Contact',
      language: 'Langue',
      userAgreement: "Contrat d'utilisation",
      kvkk: 'Informations KVKK',
      contact: 'Contact',
      orders: 'Commandes',
      loading: 'Chargement...',
      noOrderHistory: 'Aucune commande passée.',
      service: 'Service',
      date: 'Date',
      rating: 'Évaluer',
      complaint: 'Réclamation',
      favorites: 'Prestataires favoris',
      noFavorites: 'Aucun favori.',
      myRatings: 'Mes évaluations',
      noRatings: 'Aucune évaluation.',
      score: 'Note',
      myComplaints: 'Mes réclamations',
      noComplaints: 'Aucune réclamation.',
      donationNote: "Jusqu'à 10 % du revenu net est reversé à des associations.",
      statusCompleted: 'Terminé',
      statusClosed: 'Fermé',
      statusPending: 'En attente',
      statusInProgress: 'En cours',
      accountDeleteConfirm: 'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
      accountDeleteReauth: 'Pour des raisons de sécurité, une nouvelle authentification est requise. Veuillez vous reconnecter puis réessayer.',
      accountDeleteFailed: "Échec de suppression du compte. Veuillez réessayer. Si le problème persiste, reconnectez-vous et réessayez.",
      accountDeletedWithSub: "Compte supprimé. Remarque : l'abonnement App Store est lié à votre identifiant Apple. Si nécessaire, annulez-le dans l'écran Abonnements de l'App Store.",
      accountDeleted: 'Compte supprimé.',
      noProviderInfo: 'Aucune information prestataire pour cette commande.',
      phoneRequired: 'Le numéro de téléphone du profil est requis pour évaluer.',
      ratingSent: "L'évaluation a été envoyée pour validation admin.",
      ratingFailed: "Échec de l'envoi de l'évaluation. Veuillez réessayer.",
      subscriptionName: 'Adhesion annuelle Transport 245',
      subscriptionPeriodLabel: 'Duree',
      subscriptionPeriodValue: '1 an, renouvellement automatique',
      subscriptionIncludesLabel: "L'abonnement inclut",
      subscriptionBenefits: [
        'Decouverte de prestataires sur carte et liste',
        'Filtrage par type de service et affichage des prestataires proches',
        'Acces continu aux favoris, evaluations et reclamations',
      ],
      subscriptionLegalLabel: 'Liens juridiques',
      privacyLink: 'Politique de confidentialite',
      termsLink: "Conditions d'utilisation",
    };
  }
  return {
    defaultUser: 'User',
    settingsTitle: 'Settings',
    tabGeneral: 'General',
    tabOrders: 'Orders',
    accountInfo: 'Account Information',
    guestMode: 'Guest Mode',
    guestHint: 'You need to sign in for profile, ratings, and complaints.',
    login: 'Sign In',
    fullName: 'Full Name',
    email: 'Email',
    logout: 'Log Out',
    deleteAccount: 'Delete Account',
    contractsAndContact: 'Agreements & Contact',
    language: 'Language',
    userAgreement: 'User Agreement',
    kvkk: 'KVKK Disclosure',
    contact: 'Contact',
    orders: 'Orders',
    loading: 'Loading...',
    noOrderHistory: 'No order history yet.',
    service: 'Service',
    date: 'Date',
    rating: 'Rate',
    complaint: 'Complaint',
    favorites: 'Favorite Providers',
    noFavorites: 'No favorite providers yet.',
    myRatings: 'My Ratings',
    noRatings: 'No ratings yet.',
    score: 'Score',
    myComplaints: 'My Complaints',
    noComplaints: 'No complaints yet.',
    donationNote: 'Up to 10% of net revenue is donated to charities.',
    statusCompleted: 'Completed',
    statusClosed: 'Closed',
    statusPending: 'Pending',
    statusInProgress: 'In Progress',
    accountDeleteConfirm: 'Are you sure you want to delete your account? This action cannot be undone.',
    accountDeleteReauth: 'For security reasons, re-authentication is required. Please sign in again and retry.',
    accountDeleteFailed: 'Account could not be deleted. Please try again. If the issue persists, sign in again and retry.',
    accountDeletedWithSub: 'Account deleted. Note: App Store subscription is tied to your Apple ID. If needed, cancel it from App Store Subscriptions.',
    accountDeleted: 'Account deleted.',
    noProviderInfo: 'No provider information found for this order.',
    phoneRequired: 'Profile phone number is required for rating.',
    ratingSent: 'Rating sent for admin approval.',
    ratingFailed: 'Rating could not be sent. Please try again.',
    subscriptionName: 'Transport 245 Yearly Membership',
    subscriptionPeriodLabel: 'Length',
    subscriptionPeriodValue: '1 year, auto-renewable',
    subscriptionIncludesLabel: 'Subscription includes',
    subscriptionBenefits: [
      'Provider discovery on map and list screens',
      'Service-type filtering and nearby provider access',
      'Continued access to favorites, ratings, and complaint flows',
    ],
    subscriptionLegalLabel: 'Legal links',
    privacyLink: 'Privacy Policy',
    termsLink: 'Terms of Use',
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState('User');
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
  const [appLang, setAppLang] = useState<AppLang>('tr');
  const membershipIap = useMembershipIap();
  const uiText = useMemo(() => getSettingsText(appLang), [appLang]);

  const normalizedPhone = useMemo(() => String(phone || '').replace(/\D/g, ''), [phone]);

  const clearLocalSession = () => {
    localStorage.removeItem('Transport_auth_logged_in');
    localStorage.removeItem('Transport_guest_mode');
    localStorage.removeItem('Transport_user_email');
    localStorage.removeItem('Transport_user_phone');
    localStorage.removeItem('Transport_user_name');
    localStorage.removeItem('Transport_user_city');
    localStorage.removeItem('Transport_user_country_code');
  };

  const deleteProviderRecordIfExists = async () => {
    if (!normalizedPhone) return;
    try {
      const byPhoneRes = await fetch(`${API_URL}/users/by-phone?phone=${encodeURIComponent(normalizedPhone)}`);
      if (!byPhoneRes.ok) return;
      const provider = await byPhoneRes.json();
      const providerId = String(provider?._id || '').trim();
      if (!providerId) return;
      await fetch(`${API_URL}/users/self/${providerId}`, { method: 'DELETE' });
    } catch {}
  };

  const handleLogout = async () => {
    await membershipIap.resetSession();
    try {
      await FirebaseAuthentication.signOut();
    } catch {}
    try {
      await signOut(auth);
    } catch {}
    clearLocalSession();
    router.replace('/auth');
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(uiText.accountDeleteConfirm);
    if (!confirmed) return;
    const isAuthenticatedLocal = localStorage.getItem('Transport_auth_logged_in') === '1';

    await deleteProviderRecordIfExists();

    let lastDeleteError: any = null;
    let deleteOk = false;
    let hadFirebaseSession = false;
    try {
      if (Capacitor.isNativePlatform()) {
        const nativeCurrent = await FirebaseAuthentication.getCurrentUser();
        const nativeUser = (nativeCurrent as any)?.user;
        hadFirebaseSession = hadFirebaseSession || Boolean(nativeUser?.uid || nativeUser?.email || nativeUser);
        if (hadFirebaseSession) {
          await FirebaseAuthentication.deleteUser();
          deleteOk = true;
        }
      }
    } catch (e) {
      lastDeleteError = e;
    }

    try {
      if (auth.currentUser) {
        hadFirebaseSession = true;
        await deleteUser(auth.currentUser);
        deleteOk = true;
      }
    } catch (e) {
      lastDeleteError = e;
    }

    if (!deleteOk && (hadFirebaseSession || isAuthenticatedLocal)) {
      const rawError = String(lastDeleteError?.message || lastDeleteError || '').toLowerCase();
      if (
        rawError.includes('requires-recent-login') ||
        rawError.includes('recent login') ||
        rawError.includes('credential') ||
        rawError.includes('auth/requires-recent-login')
      ) {
        alert(uiText.accountDeleteReauth);
        return;
      }
      alert(uiText.accountDeleteFailed);
      return;
    }

    await membershipIap.resetSession();
    try {
      await FirebaseAuthentication.signOut();
    } catch {}
    try {
      await signOut(auth);
    } catch {}
    clearLocalSession();
    if (membershipIap.isActive) {
      alert(uiText.accountDeletedWithSub);
    } else {
      alert(uiText.accountDeleted);
    }
    router.replace('/auth');
  };

  useEffect(() => {
    const storedName = localStorage.getItem('Transport_user_name') || uiText.defaultUser;
    const storedEmail = localStorage.getItem('Transport_user_email') || '';
    const storedPhone = localStorage.getItem('Transport_user_phone') || '';
    const guestMode = localStorage.getItem('Transport_guest_mode') === '1';

    setName(storedName);
    setEmail(storedEmail);
    setPhone(storedPhone);
    setIsGuest(guestMode);
    setAppLang(getPreferredLang());

    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setFavorites(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFavorites([]);
    }

  }, [uiText.defaultUser]);

  useEffect(() => {
    const syncLang = () => setAppLang(getPreferredLang());
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'Transport_lang') syncLang();
    };
    const onLangChanged = () => syncLang();
    window.addEventListener('storage', onStorage);
    window.addEventListener(LANG_CHANGED_EVENT, onLangChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LANG_CHANGED_EVENT, onLangChanged);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SKIP_SPLASH_ONCE_KEY, '1');
      }
    };
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
        const safeRatings = Array.isArray(ratingsData)
          ? ratingsData.filter((item: any) => !isMockLikeText(item?.providerName))
          : [];
        const safeReports = Array.isArray(reportsData)
          ? reportsData.filter((item: any) => !isMockLikeText(item?.reason) && !isMockLikeText(item?.details))
          : [];
        setMyRatings(safeRatings);
        setMyReports(safeReports);
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
        const safeOrders = Array.isArray(data)
          ? data.filter((order: any) => !isMockLikeText(order?.driver?.businessName))
          : [];
        setOrderHistory(safeOrders);
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
      return { label: uiText.statusCompleted, className: 'bg-emerald-100 text-emerald-700' };
    }
    if (status === 'REJECTED' || status === 'CLOSED' || status === 'CANCELLED') {
      return { label: uiText.statusClosed, className: 'bg-slate-200 text-slate-600' };
    }
    if (status === 'PENDING') {
      return { label: uiText.statusPending, className: 'bg-amber-100 text-amber-700' };
    }
    return { label: uiText.statusInProgress, className: 'bg-blue-100 text-blue-700' };
  };

  const handleOpenRating = (order: OrderItem) => {
    setSelectedOrder(order);
    setShowRatingModal(true);
  };

  const handleOpenReport = (order: OrderItem) => {
    setSelectedOrder(order);
    setShowReportModal(true);
  };

  const handleLanguageChange = (value: string) => {
    const next = setPreferredLang(value) as AppLang;
    setAppLang(next);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }
  };

  const iapExpiresText = useMemo(() => {
    if (!membershipIap.expiresDate) return '-';
    const dt = new Date(membershipIap.expiresDate);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString(toLocaleTag(appLang));
  }, [appLang, membershipIap.expiresDate]);
  const membershipText = useMemo(() => getMembershipText(appLang), [appLang]);
  const membershipProductName = useMemo(() => {
    const title = String(membershipIap.productTitle || '').trim();
    const description = String(membershipIap.productDescription || '').trim();
    return title || description || '';
  }, [membershipIap.productDescription, membershipIap.productTitle]);
  const membershipPrice = useMemo(() => String(membershipIap.priceText || '').trim(), [membershipIap.priceText]);

  const handleRateOrder = async (data: { rating: number; comment: string; tags: string[] }) => {
    const providerId = selectedOrder?.driver?._id;
    if (!providerId) {
      alert(uiText.noProviderInfo);
      return;
    }

    const reporterPhone = normalizedPhone;
    if (!reporterPhone) {
      alert(uiText.phoneRequired);
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
      alert(uiText.ratingSent);
    } catch {
      alert(uiText.ratingFailed);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_14%,rgba(59,130,246,0.16),transparent_36%),radial-gradient(circle_at_85%_88%,rgba(15,23,42,0.10),transparent_38%),linear-gradient(145deg,#e7edf8,#f3f6fb)] px-5 pb-10 pt-10 md:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-[2rem] border border-white/60 bg-white/45 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem(SKIP_SPLASH_ONCE_KEY, '1');
                }
                router.push('/app');
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">{uiText.settingsTitle}</h1>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/55 p-1.5 backdrop-blur-md border border-white/70">
            <button
              onClick={() => setActiveTab('general')}
              className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide ${
                activeTab === 'general' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
              }`}
            >
              {uiText.tabGeneral}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide ${
                activeTab === 'history' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
              }`}
            >
              {uiText.tabOrders}
            </button>
          </div>
        </header>

        {activeTab === 'general' && (
        <>
        <section className="rounded-[2rem] border border-white/60 bg-white/45 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <UserCircle2 className="text-cyan-700" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{uiText.accountInfo}</p>
          </div>
          {isGuest && (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase text-blue-700">{uiText.guestMode}</p>
              <p className="mt-1 text-xs font-semibold text-blue-700">
                {uiText.guestHint}
              </p>
              <button
                onClick={() => router.push('/auth')}
                className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white"
              >
                {uiText.login}
              </button>
            </div>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase text-slate-400">{uiText.fullName}</p>
              <p className="mt-1 text-sm font-black text-slate-900">{name || '-'}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase text-slate-400">{uiText.email}</p>
              <p className="mt-1 text-sm font-black text-slate-900 break-all">{email || '-'}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider text-white"
            >
              {uiText.logout}
            </button>
            <button
              onClick={handleDeleteAccount}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white"
            >
              {uiText.deleteAccount}
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/60 bg-white/45 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <BookText className="text-indigo-600" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{uiText.contractsAndContact}</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Globe2 className="text-sky-600" size={16} />
                <p className="text-[10px] font-black uppercase text-slate-400">{uiText.language}</p>
              </div>
              <select
                value={appLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="it">Italiano</option>
                <option value="es">Español</option>
                <option value="pt">Português</option>
                <option value="ru">Русский</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <BadgeCheck className="text-cyan-700" size={16} />
                <p className="text-[10px] font-black uppercase text-slate-400">{membershipText.title}</p>
              </div>
              <p className="mt-2 text-sm font-black text-slate-900">{uiText.subscriptionName}</p>
              <p className="mt-2 text-[11px] font-semibold text-slate-700">
                {uiText.subscriptionPeriodLabel}: {uiText.subscriptionPeriodValue}
              </p>
              {membershipProductName ? (
                <p className="mt-2 text-[11px] font-semibold text-slate-700">
                  {membershipText.productLabel}: {membershipProductName}
                </p>
              ) : null}
              {membershipPrice ? (
                <p className="mt-1 text-[11px] font-semibold text-slate-700">
                  {membershipText.priceLabel}: {membershipPrice}
                </p>
              ) : (
                <p className="mt-1 text-[11px] font-semibold text-slate-600">
                  {membershipProductName ? membershipText.storeInfoPending : membershipText.storeInfoUnavailable}
                </p>
              )}
              <p className="mt-1 text-[11px] font-semibold text-slate-600">{membershipText.paymentOnlyApple}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-600">{membershipText.status}: {membershipIap.isActive ? membershipText.active : membershipText.passive}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-600">{membershipText.expiry}: {iapExpiresText}</p>
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{uiText.subscriptionIncludesLabel}</p>
                <ul className="mt-2 space-y-1">
                  {uiText.subscriptionBenefits.map((item: string) => (
                    <li key={item} className="text-[11px] font-medium leading-relaxed text-slate-700">
                      - {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{uiText.subscriptionLegalLabel}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href="/privacy"
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-700"
                  >
                    <ExternalLink size={12} /> {uiText.privacyLink}
                  </a>
                  <a
                    href={APPLE_STANDARD_EULA_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-700"
                  >
                    <ExternalLink size={12} /> {uiText.termsLink}
                  </a>
                </div>
              </div>
              {!membershipIap.isNativeIOS && (
                <p className="mt-2 text-[11px] font-semibold text-slate-500">
                  {membershipText.iosOnlyInfo}
                </p>
              )}
              {membershipIap.isNativeIOS && !membershipIap.hasPurchasesPlugin && (
                <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-700">
                  Abonelik eklentisi bu iOS buildinde aktif değil. Xcode paketlerini yenileyip tekrar build alın.
                </p>
              )}
              {membershipIap.errorText && membershipIap.isNativeIOS && membershipIap.hasPurchasesPlugin && (
                <p className="mt-2 text-[11px] font-semibold text-red-600">{membershipIap.errorText}</p>
              )}
              {membershipIap.isNativeIOS && membershipIap.hasPurchasesPlugin ? (
                <div className="mt-3 grid gap-2">
                  {!membershipIap.isActive && (
                    <button
                      onClick={membershipIap.purchase}
                      disabled={membershipIap.isLoading}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-white disabled:opacity-60"
                    >
                      {membershipIap.isLoading ? membershipText.processing : membershipText.start}
                    </button>
                  )}
                  <button
                    onClick={membershipIap.restore}
                    disabled={membershipIap.isLoading}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-700 disabled:opacity-60"
                  >
                    {membershipText.restore}
                  </button>
                  <button
                    onClick={membershipIap.openManageSubscriptions}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-700"
                  >
                    {membershipText.manage}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button
              onClick={() => setShowAgreementModal(true)}
              className="rounded-2xl border border-white/70 bg-white/70 p-4 text-left backdrop-blur-md"
            >
              <p className="text-[10px] font-black uppercase text-slate-400">{uiText.userAgreement}</p>
            </button>

            <button
              onClick={() => setShowKvkkModal(true)}
              className="rounded-2xl border border-white/70 bg-white/70 p-4 text-left backdrop-blur-md"
            >
              <p className="text-[10px] font-black uppercase text-slate-400">{uiText.kvkk}</p>
            </button>
          </div>
          <div className="mt-3 rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase text-slate-400">{uiText.contact}</p>
            <a href="mailto:iletisimtransporter@gmail.com" className="mt-1 block text-sm font-black text-slate-900 break-all">
              iletisimtransporter@gmail.com
            </a>
          </div>
        </section>
        </>
        )}

        {activeTab === 'history' && (
        <>
        <section className="rounded-[2rem] border border-white/60 bg-white/45 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <Phone className="text-blue-600" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{uiText.orders}</p>
          </div>
          <div className="mt-4 space-y-2">
            {ordersLoading ? (
              <p className="text-xs font-bold text-slate-500">{uiText.loading}</p>
            ) : orderHistory.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">{uiText.noOrderHistory}</p>
            ) : (
              orderHistory.map((order) => {
                const chip = getStatusChip(String(order.status || ''));
                const createdAtText = order.createdAt
                  ? new Date(order.createdAt).toLocaleString(toLocaleTag(appLang))
                  : '-';

                return (
                  <div key={order._id} className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase text-slate-800">
                        {order.driver?.businessName || '-'}
                      </p>
                      <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${chip.className}`}>
                        {chip.label}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-slate-600">
                      {uiText.service}: {order.serviceType || '-'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-600">{uiText.date}: {createdAtText}</p>

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleOpenRating(order)}
                        className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-[10px] font-black uppercase text-white"
                      >
                        {uiText.rating}
                      </button>
                      <button
                        onClick={() => handleOpenReport(order)}
                        className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-[10px] font-black uppercase text-white"
                      >
                        {uiText.complaint}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/60 bg-white/45 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <Heart className="text-rose-600" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{uiText.favorites}</p>
          </div>
          <div className="mt-4 space-y-2">
            {favorites.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">{uiText.noFavorites}</p>
            ) : (
              favorites.map((fav) => (
                <div key={fav._id} className="rounded-xl border border-rose-100 bg-rose-50/70 p-3">
                  <p className="text-xs font-black uppercase text-slate-800">{fav.businessName || '-'}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-600">
                    {(fav.address?.district || '-') + ' / ' + (fav.address?.city || '-')}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/60 bg-white/45 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <Star className="text-amber-500" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{uiText.myRatings}</p>
          </div>
          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="text-xs font-bold text-slate-500">{uiText.loading}</p>
            ) : myRatings.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">{uiText.noRatings}</p>
            ) : (
              myRatings.map((item) => {
                const chip = getStatusChip(item.status);
                return (
                  <div key={`${item.providerId}-${item.entryId}`} className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase text-slate-800">{item.providerName || '-'}</p>
                      <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${chip.className}`}>{chip.label}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-bold text-slate-600">{uiText.score}: {item.rating}/5</p>
                    {item.comment && <p className="mt-1 text-[11px] font-medium text-slate-600">{item.comment}</p>}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/60 bg-white/45 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{uiText.myComplaints}</p>
          </div>
          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="text-xs font-bold text-slate-500">{uiText.loading}</p>
            ) : myReports.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">{uiText.noComplaints}</p>
            ) : (
              myReports.map((item: any) => {
                const chip = getStatusChip(item.status);
                return (
                  <div key={item._id} className="rounded-xl border border-red-100 bg-red-50/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase text-slate-800">{item.reason || uiText.complaint}</p>
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

        <footer className="rounded-[2rem] border border-white/60 bg-white/45 p-4 text-center shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            {uiText.donationNote}
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
