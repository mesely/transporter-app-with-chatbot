/**
 * @file page.tsx (Settings / Menu Page)
 * @description Transport 245 - Tam Ekran Menü ve Ayarlar Sayfası
 * FIX: Hesabı Sil butonunun üstüne "Şikayet / Talep Oluştur" eklendi.
 * FIX: Geçmişteki ve menüdeki Şikayet/Değerlendir butonları için gerçek modallar bağlandı.
 * FIX: Glassmorphism tasarımı tam ekrana uygun halde korundu.
 */

'use client';

import {
  Zap, X, Truck, History, ArrowLeft,
  Wrench, Construction, Settings, Globe, UserCircle2,
  MapPin, Shield, ToggleLeft, ToggleRight,
  ShieldCheck, Heart, FileText, Locate,
  Loader2, Trash2, Navigation, Mail,
  Bell, Users, Bus, Crown, Star, AlertTriangle, ChevronDown, ChevronUp, Package, CarFront
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Modallar (Dosya yollarını projenin yapısına göre ayarlayabilirsin)
import SettingsModal from '../../components/SettingsModal';
import ProfileModal from '../../components/ProfileModal';
import UserAgreementModal from '../../components/UserAgreementModal';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import KVKKModal from '../../components/KVKKModal';
import ReportModal from '../../components/ReportModal';
import RatingModal from '../../components/RatingModal';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transporter-app-with-chatbot.onrender.com';
const LANG_STORAGE_KEY = 'Transport_lang';
const LANG_OPTIONS = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'ar', label: 'العربية' }
];

const UI_TEXT = {
  tr: {
    menu: 'Menü',
    cityActive: 'Şehir Aktif',
    tariffs: 'Tarifeler',
    history: 'Geçmiş',
    settings: 'Ayarlar',
    language: 'Dil Seçimi',
    donation: "Kazancın %10'una kadarı yardım kuruluşlarına aktarılmaktadır.",
    groups: { KURTARMA: 'Kurtarma', NAKLIYE: 'Nakliye', ENERJI: 'Enerji', YOLCU: 'Yolcu' },
    unit: 'Birim',
    preferences: 'Tercihler',
    notifications: 'Bildirimler',
    locationTracking: 'Konum Takibi',
    agreement: 'Sözleşme',
    kvkk: 'KVKK Metni',
    contact: 'Görüş ve şikayetleriniz için',
    contactTail: 'adresinden iletişim kurabilirsiniz.',
    deleteAccount: 'Hesabımı Sil',
    historyLoading: 'Geçmiş Taranıyor...',
    noHistory: 'Henüz İşlem Bulunmuyor',
    completed: 'Tamamlandı',
    licensedDriver: 'Lisanslı Sürücü',
    rate: 'Değerlendir',
    complain: 'Şikayet Et',
    notAgreed: 'Aradım Ama Anlaşamadım',
    advancedSettings: 'Gelişmiş Ayarlar',
    services: {
      kurtarici: 'Oto Kurtarma',
      vinc: 'Ağır Vinç',
      nakliye: 'Nakliye (Yurt İçi)',
      yurt_disi_nakliye: 'Yurt Dışı Lojistik',
      seyyar_sarj: 'Gezici Şarj',
      istasyon: 'Şarj İstasyonu',
      minibus: 'Minibüs',
      otobus: 'Otobüs',
      vip_tasima: 'VIP Transfer'
    }
  },
  en: {
    menu: 'Menu',
    cityActive: 'City Active',
    tariffs: 'Tariffs',
    history: 'History',
    settings: 'Settings',
    language: 'Language',
    donation: 'Up to 10% of revenue is donated to charities.',
    groups: { KURTARMA: 'Recovery', NAKLIYE: 'Transport', ENERJI: 'Energy', YOLCU: 'Passenger' },
    unit: 'Unit',
    preferences: 'Preferences',
    notifications: 'Notifications',
    locationTracking: 'Location Tracking',
    agreement: 'Agreement',
    kvkk: 'Privacy Text',
    contact: 'For feedback and complaints, contact us at',
    contactTail: '',
    deleteAccount: 'Delete My Account',
    historyLoading: 'Scanning history...',
    noHistory: 'No records yet',
    completed: 'Completed',
    licensedDriver: 'Licensed Driver',
    rate: 'Rate',
    complain: 'Report',
    notAgreed: "I Called But Didn't Agree",
    advancedSettings: 'Advanced Settings',
    services: {
      kurtarici: 'Roadside Recovery',
      vinc: 'Heavy Crane',
      nakliye: 'Domestic Transport',
      yurt_disi_nakliye: 'International Logistics',
      seyyar_sarj: 'Mobile Charging',
      istasyon: 'Charging Station',
      minibus: 'Minibus',
      otobus: 'Bus',
      vip_tasima: 'VIP Transfer'
    }
  },
  de: {
    menu: 'Menü',
    cityActive: 'Stadt aktiv',
    tariffs: 'Tarife',
    history: 'Verlauf',
    settings: 'Einstellungen',
    language: 'Sprache',
    donation: 'Bis zu 10% der Einnahmen werden gespendet.',
    groups: { KURTARMA: 'Bergung', NAKLIYE: 'Transport', ENERJI: 'Energie', YOLCU: 'Passagier' },
    unit: 'Einheit',
    preferences: 'Präferenzen',
    notifications: 'Benachrichtigungen',
    locationTracking: 'Standortverfolgung',
    agreement: 'Vertrag',
    kvkk: 'Datenschutztext',
    contact: 'Für Rückmeldungen und Beschwerden:',
    contactTail: '',
    deleteAccount: 'Konto löschen',
    historyLoading: 'Verlauf wird geladen...',
    noHistory: 'Noch keine Einträge',
    completed: 'Abgeschlossen',
    licensedDriver: 'Lizenzierter Fahrer',
    rate: 'Bewerten',
    complain: 'Beschwerde',
    notAgreed: 'Angerufen, aber keine Einigung',
    advancedSettings: 'Erweiterte Einstellungen',
    services: { kurtarici: 'Pannenhilfe', vinc: 'Schwerer Kran', nakliye: 'Inlandstransport', yurt_disi_nakliye: 'Internationale Logistik', seyyar_sarj: 'Mobiles Laden', istasyon: 'Ladestation', minibus: 'Minibus', otobus: 'Bus', vip_tasima: 'VIP Transfer' }
  },
  fr: {
    menu: 'Menu',
    cityActive: 'Ville active',
    tariffs: 'Tarifs',
    history: 'Historique',
    settings: 'Paramètres',
    language: 'Langue',
    donation: 'Jusqu’à 10% des revenus sont reversés.',
    groups: { KURTARMA: 'Dépannage', NAKLIYE: 'Transport', ENERJI: 'Énergie', YOLCU: 'Passager' },
    unit: 'Unité',
    preferences: 'Préférences',
    notifications: 'Notifications',
    locationTracking: 'Suivi de position',
    agreement: 'Contrat',
    kvkk: 'Texte RGPD',
    contact: 'Pour retours et réclamations:',
    contactTail: '',
    deleteAccount: 'Supprimer mon compte',
    historyLoading: 'Analyse de l’historique...',
    noHistory: 'Aucun enregistrement',
    completed: 'Terminé',
    licensedDriver: 'Chauffeur agréé',
    rate: 'Évaluer',
    complain: 'Signaler',
    notAgreed: 'Appelé mais sans accord',
    advancedSettings: 'Paramètres avancés',
    services: { kurtarici: 'Assistance routière', vinc: 'Grue lourde', nakliye: 'Transport national', yurt_disi_nakliye: 'Logistique internationale', seyyar_sarj: 'Charge mobile', istasyon: 'Station de charge', minibus: 'Minibus', otobus: 'Bus', vip_tasima: 'Transfert VIP' }
  },
  it: {
    menu: 'Menu',
    cityActive: 'Città attiva',
    tariffs: 'Tariffe',
    history: 'Cronologia',
    settings: 'Impostazioni',
    language: 'Lingua',
    donation: 'Fino al 10% dei ricavi viene donato.',
    groups: { KURTARMA: 'Soccorso', NAKLIYE: 'Trasporto', ENERJI: 'Energia', YOLCU: 'Passeggero' },
    unit: 'Unità',
    preferences: 'Preferenze',
    notifications: 'Notifiche',
    locationTracking: 'Tracciamento posizione',
    agreement: 'Contratto',
    kvkk: 'Testo privacy',
    contact: 'Per feedback e reclami:',
    contactTail: '',
    deleteAccount: 'Elimina account',
    historyLoading: 'Scansione cronologia...',
    noHistory: 'Nessun record',
    completed: 'Completato',
    licensedDriver: 'Autista autorizzato',
    rate: 'Valuta',
    complain: 'Segnala',
    notAgreed: 'Ho chiamato ma niente accordo',
    advancedSettings: 'Impostazioni avanzate',
    services: { kurtarici: 'Soccorso stradale', vinc: 'Gru pesante', nakliye: 'Trasporto nazionale', yurt_disi_nakliye: 'Logistica internazionale', seyyar_sarj: 'Ricarica mobile', istasyon: 'Stazione di ricarica', minibus: 'Minibus', otobus: 'Autobus', vip_tasima: 'Transfer VIP' }
  },
  es: {
    menu: 'Menú',
    cityActive: 'Ciudad activa',
    tariffs: 'Tarifas',
    history: 'Historial',
    settings: 'Ajustes',
    language: 'Idioma',
    donation: 'Hasta el 10% de los ingresos se dona.',
    groups: { KURTARMA: 'Rescate', NAKLIYE: 'Transporte', ENERJI: 'Energía', YOLCU: 'Pasajero' },
    unit: 'Unidad',
    preferences: 'Preferencias',
    notifications: 'Notificaciones',
    locationTracking: 'Seguimiento de ubicación',
    agreement: 'Contrato',
    kvkk: 'Texto de privacidad',
    contact: 'Para comentarios y reclamos:',
    contactTail: '',
    deleteAccount: 'Eliminar cuenta',
    historyLoading: 'Escaneando historial...',
    noHistory: 'Sin registros',
    completed: 'Completado',
    licensedDriver: 'Conductor autorizado',
    rate: 'Calificar',
    complain: 'Reportar',
    notAgreed: 'Llamé pero no hubo acuerdo',
    advancedSettings: 'Ajustes avanzados',
    services: { kurtarici: 'Auxilio vial', vinc: 'Grúa pesada', nakliye: 'Transporte nacional', yurt_disi_nakliye: 'Logística internacional', seyyar_sarj: 'Carga móvil', istasyon: 'Estación de carga', minibus: 'Minibús', otobus: 'Autobús', vip_tasima: 'Transfer VIP' }
  },
  pt: {
    menu: 'Menu',
    cityActive: 'Cidade ativa',
    tariffs: 'Tarifas',
    history: 'Histórico',
    settings: 'Configurações',
    language: 'Idioma',
    donation: 'Até 10% da receita é doada.',
    groups: { KURTARMA: 'Resgate', NAKLIYE: 'Transporte', ENERJI: 'Energia', YOLCU: 'Passageiro' },
    unit: 'Unidade',
    preferences: 'Preferências',
    notifications: 'Notificações',
    locationTracking: 'Rastreamento de localização',
    agreement: 'Contrato',
    kvkk: 'Texto de privacidade',
    contact: 'Para feedback e reclamações:',
    contactTail: '',
    deleteAccount: 'Excluir conta',
    historyLoading: 'Lendo histórico...',
    noHistory: 'Nenhum registro',
    completed: 'Concluído',
    licensedDriver: 'Motorista licenciado',
    rate: 'Avaliar',
    complain: 'Reclamar',
    notAgreed: 'Liguei, mas sem acordo',
    advancedSettings: 'Configurações avançadas',
    services: { kurtarici: 'Socorro rodoviário', vinc: 'Guindaste pesado', nakliye: 'Transporte nacional', yurt_disi_nakliye: 'Logística internacional', seyyar_sarj: 'Carga móvel', istasyon: 'Estação de carga', minibus: 'Micro-ônibus', otobus: 'Ônibus', vip_tasima: 'Transfer VIP' }
  },
  ru: {
    menu: 'Меню',
    cityActive: 'Город активен',
    tariffs: 'Тарифы',
    history: 'История',
    settings: 'Настройки',
    language: 'Язык',
    donation: 'До 10% дохода направляется на благотворительность.',
    groups: { KURTARMA: 'Эвакуация', NAKLIYE: 'Перевозка', ENERJI: 'Энергия', YOLCU: 'Пассажир' },
    unit: 'Ед.',
    preferences: 'Параметры',
    notifications: 'Уведомления',
    locationTracking: 'Отслеживание геопозиции',
    agreement: 'Соглашение',
    kvkk: 'Текст конфиденциальности',
    contact: 'Для отзывов и жалоб:',
    contactTail: '',
    deleteAccount: 'Удалить аккаунт',
    historyLoading: 'Загрузка истории...',
    noHistory: 'Записей нет',
    completed: 'Завершено',
    licensedDriver: 'Лицензированный водитель',
    rate: 'Оценить',
    complain: 'Пожаловаться',
    notAgreed: 'Позвонил, но не договорились',
    advancedSettings: 'Расширенные настройки',
    services: { kurtarici: 'Эвакуатор', vinc: 'Тяжелый кран', nakliye: 'Внутренние перевозки', yurt_disi_nakliye: 'Международная логистика', seyyar_sarj: 'Мобильная зарядка', istasyon: 'Зарядная станция', minibus: 'Микроавтобус', otobus: 'Автобус', vip_tasima: 'VIP трансфер' }
  },
  zh: {
    menu: '菜单',
    cityActive: '城市已激活',
    tariffs: '费率',
    history: '历史',
    settings: '设置',
    language: '语言',
    donation: '最多10%的收益将捐赠给慈善机构。',
    groups: { KURTARMA: '救援', NAKLIYE: '运输', ENERJI: '能源', YOLCU: '客运' },
    unit: '单位',
    preferences: '偏好',
    notifications: '通知',
    locationTracking: '位置跟踪',
    agreement: '协议',
    kvkk: '隐私文本',
    contact: '反馈与投诉请联系：',
    contactTail: '',
    deleteAccount: '删除账户',
    historyLoading: '正在扫描历史...',
    noHistory: '暂无记录',
    completed: '已完成',
    licensedDriver: '持证司机',
    rate: '评价',
    complain: '投诉',
    notAgreed: '已联系但未达成一致',
    advancedSettings: '高级设置',
    services: { kurtarici: '道路救援', vinc: '重型吊车', nakliye: '国内运输', yurt_disi_nakliye: '国际物流', seyyar_sarj: '移动充电', istasyon: '充电站', minibus: '小巴', otobus: '公交车', vip_tasima: 'VIP接送' }
  },
  ja: {
    menu: 'メニュー',
    cityActive: '都市アクティブ',
    tariffs: '料金',
    history: '履歴',
    settings: '設定',
    language: '言語',
    donation: '収益の最大10%を寄付します。',
    groups: { KURTARMA: '救援', NAKLIYE: '輸送', ENERJI: 'エネルギー', YOLCU: '旅客' },
    unit: '単位',
    preferences: '設定',
    notifications: '通知',
    locationTracking: '位置追跡',
    agreement: '契約',
    kvkk: 'プライバシー文書',
    contact: 'ご意見・苦情：',
    contactTail: '',
    deleteAccount: 'アカウント削除',
    historyLoading: '履歴を読み込み中...',
    noHistory: '履歴はありません',
    completed: '完了',
    licensedDriver: '認定ドライバー',
    rate: '評価',
    complain: '苦情',
    notAgreed: '連絡したが合意なし',
    advancedSettings: '詳細設定',
    services: { kurtarici: 'ロードサービス', vinc: '大型クレーン', nakliye: '国内輸送', yurt_disi_nakliye: '国際物流', seyyar_sarj: '移動充電', istasyon: '充電ステーション', minibus: 'ミニバス', otobus: 'バス', vip_tasima: 'VIP送迎' }
  },
  ko: {
    menu: '메뉴',
    cityActive: '도시 활성',
    tariffs: '요금',
    history: '기록',
    settings: '설정',
    language: '언어',
    donation: '수익의 최대 10%를 기부합니다.',
    groups: { KURTARMA: '구난', NAKLIYE: '운송', ENERJI: '에너지', YOLCU: '승객' },
    unit: '단위',
    preferences: '환경설정',
    notifications: '알림',
    locationTracking: '위치 추적',
    agreement: '약관',
    kvkk: '개인정보 문서',
    contact: '피드백/신고:',
    contactTail: '',
    deleteAccount: '계정 삭제',
    historyLoading: '기록을 불러오는 중...',
    noHistory: '기록 없음',
    completed: '완료',
    licensedDriver: '인증 기사',
    rate: '평가',
    complain: '신고',
    notAgreed: '통화했지만 합의 실패',
    advancedSettings: '고급 설정',
    services: { kurtarici: '긴급 견인', vinc: '대형 크레인', nakliye: '국내 운송', yurt_disi_nakliye: '국제 물류', seyyar_sarj: '이동 충전', istasyon: '충전소', minibus: '미니버스', otobus: '버스', vip_tasima: 'VIP 이동' }
  },
  ar: {
    menu: 'القائمة',
    cityActive: 'المدينة نشطة',
    tariffs: 'التعرفة',
    history: 'السجل',
    settings: 'الإعدادات',
    language: 'اللغة',
    donation: 'حتى 10٪ من الإيرادات تُخصص للتبرعات.',
    groups: { KURTARMA: 'إنقاذ', NAKLIYE: 'نقل', ENERJI: 'طاقة', YOLCU: 'ركاب' },
    unit: 'الوحدة',
    preferences: 'التفضيلات',
    notifications: 'الإشعارات',
    locationTracking: 'تتبع الموقع',
    agreement: 'الاتفاقية',
    kvkk: 'نص الخصوصية',
    contact: 'للملاحظات والشكاوى:',
    contactTail: '',
    deleteAccount: 'حذف الحساب',
    historyLoading: 'جارٍ فحص السجل...',
    noHistory: 'لا توجد سجلات',
    completed: 'مكتمل',
    licensedDriver: 'سائق مرخص',
    rate: 'تقييم',
    complain: 'شكوى',
    notAgreed: 'اتصلت ولم يتم الاتفاق',
    advancedSettings: 'إعدادات متقدمة',
    services: { kurtarici: 'إنقاذ الطرق', vinc: 'رافعة ثقيلة', nakliye: 'نقل داخلي', yurt_disi_nakliye: 'لوجستيات دولية', seyyar_sarj: 'شحن متنقل', istasyon: 'محطة شحن', minibus: 'ميني باص', otobus: 'حافلة', vip_tasima: 'نقل VIP' }
  }
} as const;

const BASE_DATA: any = {
  kurtarici: { unit: 45, unitLabel: 'km', labelKey: 'kurtarici', icon: <Wrench size={24}/>, color: 'text-red-600 bg-red-100', group: 'KURTARMA' },
  vinc: { unit: 250, unitLabel: 'km', labelKey: 'vinc', icon: <Construction size={24}/>, color: 'text-red-800 bg-red-200', group: 'KURTARMA' },
  nakliye: { unit: 50, unitLabel: 'km', labelKey: 'nakliye', icon: <Truck size={24}/>, color: 'text-purple-600 bg-purple-100', group: 'NAKLIYE' },
  yurt_disi_nakliye: { unit: 150, unitLabel: 'km', labelKey: 'yurt_disi_nakliye', icon: <Globe size={24}/>, color: 'text-indigo-600 bg-indigo-100', group: 'NAKLIYE' },
  seyyar_sarj: { unit: 30, unitLabel: 'kw', labelKey: 'seyyar_sarj', icon: <Zap size={24}/>, color: 'text-blue-600 bg-blue-100', group: 'ENERJI' },
  istasyon: { unit: 15, unitLabel: 'kw', labelKey: 'istasyon', icon: <Navigation size={24}/>, color: 'text-blue-800 bg-blue-200', group: 'ENERJI' },
  minibus: { unit: 35, unitLabel: 'km', labelKey: 'minibus', icon: <Users size={24}/>, color: 'text-teal-600 bg-teal-100', group: 'YOLCU' },
  otobus: { unit: 80, unitLabel: 'km', labelKey: 'otobus', icon: <Bus size={24}/>, color: 'text-teal-800 bg-teal-200', group: 'YOLCU' },
  vip_tasima: { unit: 60, unitLabel: 'km', labelKey: 'vip_tasima', icon: <Crown size={24}/>, color: 'text-emerald-700 bg-emerald-100', group: 'YOLCU' }
};

const getOrderIcon = (type: string) => {
  const t = type?.toLowerCase();
  if (t?.includes('kurtarici') || t?.includes('vinc')) return <CarFront size={20} className="text-red-600"/>;
  if (t?.includes('sarj') || t?.includes('istasyon')) return <Zap size={20} className="text-blue-600"/>;
  if (t?.includes('yolcu') || t?.includes('vip') || t?.includes('bus')) return <Users size={20} className="text-emerald-600"/>;
  return <Truck size={20} className="text-purple-600"/>;
};

const getOrderColor = (type: string) => {
  const t = type?.toLowerCase();
  if (t?.includes('kurtarici') || t?.includes('vinc')) return 'bg-red-50 border-red-100';
  if (t?.includes('sarj') || t?.includes('istasyon')) return 'bg-blue-50 border-blue-100';
  if (t?.includes('yolcu') || t?.includes('vip') || t?.includes('bus')) return 'bg-emerald-50 border-emerald-100';
  return 'bg-purple-50 border-purple-100';
};

export default function SettingsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'tariff' | 'history'>('tariff');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('Misafir Kullanıcı');

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [appLang, setAppLang] = useState('tr');

  const toggleNotif = () => {
    setNotifEnabled(prev => {
      localStorage.setItem('Transport_notif', String(!prev));
      return !prev;
    });
  };
  const toggleLocation = () => {
    setLocationEnabled(prev => {
      localStorage.setItem('Transport_location', String(!prev));
      return !prev;
    });
  };

  // Accordion (Geçmiş Sipariş Detayları)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Genel Modallar
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [showKVKK, setShowKVKK] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Şikayet ve Değerlendirme Modalları
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportDriverId, setReportDriverId] = useState<string | null>(null);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTargetId, setRatingTargetId] = useState<string | null>(null);
  const [ratingDriverId, setRatingDriverId] = useState<string | null>(null);
  const normalizedLang = (UI_TEXT as any)[appLang] ? appLang : 'en';
  const t = (UI_TEXT as any)[normalizedLang];
  const dateLocale = appLang === 'tr' ? 'tr-TR' : 'en-US';

  useEffect(() => {
    setIsMounted(true);
    const storedName = localStorage.getItem('Transport_user_name');
    setUserName(storedName || 'Misafir Kullanıcı');
    const storedNotif = localStorage.getItem('Transport_notif');
    const storedLocation = localStorage.getItem('Transport_location');
    const storedLang = (localStorage.getItem(LANG_STORAGE_KEY) || '').toLowerCase();
    const deviceLang = (navigator.language || 'tr').split('-')[0].toLowerCase();
    const resolvedLang = LANG_OPTIONS.some(l => l.code === storedLang)
      ? String(storedLang)
      : (LANG_OPTIONS.some(l => l.code === deviceLang) ? deviceLang : 'tr');
    if (storedNotif !== null) setNotifEnabled(storedNotif === 'true');
    if (storedLocation !== null) setLocationEnabled(storedLocation === 'true');
    setAppLang(resolvedLang);
    localStorage.setItem(LANG_STORAGE_KEY, resolvedLang);
    document.documentElement.lang = resolvedLang;
  }, []);

  const handleLanguageChange = (nextLang: string) => {
    if (nextLang === appLang) return;
    setAppLang(nextLang);
    localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    document.documentElement.lang = nextLang;
    window.location.reload();
  };

  useEffect(() => {
    if (activeTab === 'history') {
      const myDeviceId = localStorage.getItem('Transport_device_id') || "";
      setLoading(true);
      fetch(`${API_URL}/orders?customerId=${myDeviceId}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setOrders(data); })
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const handleDeleteAccount = async () => {
    const customerId = localStorage.getItem('Transport_device_id');
    if (!customerId) { localStorage.clear(); window.location.href = '/'; return; }
    try {
      const res = await fetch(`${API_URL}/customers/${customerId}`, { method: 'DELETE' });
      if (res.ok) { localStorage.clear(); window.location.href = '/'; }
    } catch (error) { console.error(error); }
  };

  const toggleOrderDetails = (id: string) => {
    setExpandedOrder(prev => prev === id ? null : id);
  };

  // Gerçek Rating API İsteği (İsteğe bağlı)
  const handleRateSubmit = async (data: { rating: number; comment: string; tags: string[] }) => {
    if (!ratingDriverId) return;
    await fetch(`${API_URL}/users/${ratingDriverId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: data.rating,
        comment: data.comment,
        tags: data.tags,
        orderId: ratingTargetId
      })
    });
  };

  const handleNotAgreed = async (orderId: string) => {
    await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerOutcome: 'NOT_AGREED' })
    });
    await fetch(`${API_URL}/orders/${orderId}`, { method: 'DELETE' });
    setOrders(prev => prev.filter(o => o._id !== orderId));
  };

  if (!isMounted) return null;

  return (
    <main className="relative w-full min-h-screen flex flex-col font-sans text-gray-900 bg-gradient-to-br from-[#e0e7ff] via-[#f1f5f9] to-[#e2e8f0] overflow-hidden">
      
      {/* HEADER - Glassmorphism */}
      <div className="px-6 md:px-12 pt-14 pb-8 z-10 shrink-0 bg-white/60 border-b border-white/50 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6 mb-8">
            <button 
              onClick={() => router.push('/')} 
              className="w-12 h-12 bg-white/70 border border-white rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md hover:bg-white text-gray-700 hover:text-blue-600"
            >
              <ArrowLeft size={24} strokeWidth={2.5}/>
            </button>
            <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter italic">{t.menu}</h1>
          </div>

          <div onClick={() => setShowProfile(true)} className="rounded-[2.5rem] p-6 border-2 border-white bg-white/40 backdrop-blur-md shadow-xl cursor-pointer hover:bg-white/60 active:scale-[0.98] transition-all mb-8">
             <div className="flex items-center gap-6 text-gray-900">
                <div className="w-16 h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-inner">
                  <UserCircle2 size={36} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black uppercase text-xl text-slate-800 truncate">{userName}</h3>
                  <p className="text-[11px] text-blue-600 font-black uppercase mt-1 flex items-center gap-1.5 bg-blue-50/50 w-fit px-3 py-1 rounded-lg">
                    <MapPin size={12} /> {t.cityActive}
                  </p>
                </div>
             </div>
          </div>

          <div className="flex bg-slate-200/50 p-2 rounded-3xl border border-white/40 backdrop-blur-sm shadow-inner">
            <button onClick={() => setActiveTab('tariff')} className={`flex-1 py-4 text-xs font-black rounded-2xl transition-all uppercase tracking-widest ${activeTab === 'tariff' ? 'bg-white text-slate-800 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>{t.tariffs}</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 text-xs font-black rounded-2xl transition-all uppercase tracking-widest ${activeTab === 'history' ? 'bg-white text-slate-800 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>{t.history}</button>
          </div>
        </div>
      </div>

      {/* İÇERİK ALANI */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'tariff' && (
            <div className="space-y-10">
              <div className="p-5 rounded-[2rem] bg-white/70 backdrop-blur-sm border-2 border-white shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600"><Globe size={20} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.settings}</p>
                      <p className="text-sm font-black text-slate-700 uppercase">{t.language}</p>
                    </div>
                  </div>
                  <select
                    value={appLang}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-black text-slate-700 uppercase outline-none"
                  >
                    {LANG_OPTIONS.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-5 rounded-[2rem] bg-red-50/80 backdrop-blur-sm border border-red-100 flex items-center gap-4 shadow-sm">
                <div className="bg-red-100 p-3 rounded-full shrink-0"><Heart size={20} className="text-red-500 fill-red-500" /></div>
                <p className="text-xs font-black text-red-800 leading-tight uppercase tracking-tight">{t.donation}</p>
              </div>

              {['KURTARMA', 'NAKLIYE', 'ENERJI', 'YOLCU'].map(group => (
                <div key={group} className="space-y-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {t.groups[group as keyof typeof t.groups]}
                  </span>
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(BASE_DATA).filter(([_, v]:any) => v.group === group).map(([key, val]: [string, any]) => (
                      <div key={key} className="bg-white/60 backdrop-blur-xl border-2 border-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-[1.5rem] ${val.color} shadow-sm border border-white/50`}>{val.icon}</div>
                            <div>
                              <h4 className="font-black text-slate-800 text-sm md:text-base uppercase leading-none">{t.services[val.labelKey as keyof typeof t.services]}</h4>
                              <p className="text-[11px] font-black text-blue-600 mt-1.5 uppercase tracking-wide">{t.unit}: ₺{val.unit} / {val.unitLabel}</p>
                            </div>
                          </div>
                          <div className="text-right bg-slate-50/50 px-5 py-3 rounded-2xl border border-white">
                            <div className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter leading-none">₺{val.unit}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">/{val.unitLabel}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-4 pt-6">
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {t.preferences}</span>
                <div onClick={toggleNotif} className="flex items-center justify-between p-6 rounded-[2rem] bg-white/60 border-2 border-white shadow-sm active:scale-[0.98] cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${notifEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><Bell size={20} /></div>
                    <span className="text-sm font-black text-slate-700 uppercase">{t.notifications}</span>
                  </div>
                  {notifEnabled ? <ToggleRight size={40} className="text-blue-600 fill-current"/> : <ToggleLeft size={40} className="text-slate-300"/>}
                </div>
                <div onClick={toggleLocation} className="flex items-center justify-between p-6 rounded-[2rem] bg-white/60 border-2 border-white shadow-sm active:scale-[0.98] cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${locationEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><Locate size={20} /></div>
                    <span className="text-sm font-black text-slate-700 uppercase">{t.locationTracking}</span>
                  </div>
                  {locationEnabled ? <ToggleRight size={40} className="text-blue-600 fill-current"/> : <ToggleLeft size={40} className="text-slate-300"/>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowAgreement(true)} className="flex flex-col items-center justify-center gap-3 p-8 rounded-[2rem] bg-white/60 backdrop-blur-xl border-2 border-white text-slate-500 hover:text-blue-600 transition-all shadow-sm active:scale-95">
                  <div className="bg-slate-100 p-4 rounded-2xl text-inherit"><FileText size={28} /></div>
                  <span className="text-[11px] font-black uppercase tracking-widest">{t.agreement}</span>
                </button>
                <button onClick={() => setShowKVKK(true)} className="flex flex-col items-center justify-center gap-3 p-8 rounded-[2rem] bg-white/60 backdrop-blur-xl border-2 border-white text-slate-500 hover:text-green-600 transition-all shadow-sm active:scale-95">
                  <div className="bg-slate-100 p-4 rounded-2xl text-inherit"><Shield size={28} /></div>
                  <span className="text-[11px] font-black uppercase tracking-widest">{t.kvkk}</span>
                </button>
              </div>

              <div className="pt-8 pb-10 space-y-4">
                <div className="w-full p-6 bg-slate-50/80 backdrop-blur-sm border-2 border-slate-200 rounded-[2rem] flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-xl shrink-0 mt-0.5"><Mail size={16} className="text-blue-600" /></div>
                  <p className="text-xs font-black text-slate-700 leading-relaxed">
                    {t.contact}{' '}
                    <a href="mailto:iletisimtransporter@gmail.com" className="text-blue-600 underline break-all">
                      iletisimtransporter@gmail.com
                    </a>{' '}
                    {t.contactTail}
                  </p>
                </div>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-6 bg-red-50/80 backdrop-blur-sm border-2 border-red-200 rounded-[2rem] text-xs font-black text-red-600 uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-red-100 transition-all active:scale-95 shadow-md"
                >
                  <Trash2 size={18} /> {t.deleteAccount}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
               {loading ? (
                  <div className="flex flex-col items-center py-40 gap-6 text-slate-400">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <span className="text-xs font-black uppercase tracking-widest bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm">{t.historyLoading}</span>
                  </div>
               ) : orders.length === 0 ? (
                  <div className="text-center py-40 text-slate-400">
                    <div className="bg-white/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white">
                      <History size={48} className="opacity-40" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest">{t.noHistory}</p>
                  </div>
               ) : (
                  orders.map((order) => {
                    const isExpanded = expandedOrder === order._id;
                    return (
                      <div key={order._id} className="bg-white/70 backdrop-blur-xl border-2 border-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-all">
                        
                        {/* Sipariş Özeti (Tıklanabilir Başlık) */}
                        <div 
                          onClick={() => toggleOrderDetails(order._id)}
                          className="p-6 cursor-pointer hover:bg-white/40 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-5">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getOrderColor(order.serviceType)}`}>
                              {getOrderIcon(order.serviceType)}
                              <span className="text-[10px] font-black uppercase tracking-wider">{order.serviceType?.replace('_', ' ')}</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-600 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 uppercase tracking-widest italic">{t.completed}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-black text-slate-800 text-sm md:text-base uppercase">{order?.driver?.businessName || t.licensedDriver}</h4>
                              <p className="text-[11px] text-slate-500 font-bold mt-1.5 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString(dateLocale)}</p>
                            </div>
                            <div className="flex items-center gap-4 text-right">
                               <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">₺{order?.driver?.pricing?.pricePerUnit || '---'}</p>
                               {isExpanded ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                            </div>
                          </div>
                        </div>

                        {/* 🔥 Açılır (Accordion) Değerlendirme & Şikayet Alanı */}
                        <div className={`bg-slate-50/80 border-t border-slate-100 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 hidden'}`}>
                          <div className="p-4 grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => {
                                setRatingTargetId(order._id);
                                setRatingDriverId(order?.driver?._id || null);
                                setShowRatingModal(true);
                              }}
                              className="flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:text-yellow-600 hover:border-yellow-200 transition-all active:scale-95 shadow-sm"
                            >
                              <Star size={16} /> {t.rate}
                            </button>
                            <button 
                              onClick={() => { 
                                setReportTargetId(order._id); 
                                setReportDriverId(order?.driver?._id || null); 
                                setShowReportModal(true); 
                              }} 
                              className="flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:text-red-600 hover:border-red-200 transition-all active:scale-95 shadow-sm"
                            >
                              <AlertTriangle size={16} /> {t.complain}
                            </button>
                            <button
                              onClick={() => handleNotAgreed(order._id)}
                              className="col-span-2 flex items-center justify-center gap-2 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:text-slate-800 transition-all active:scale-95 shadow-sm"
                            >
                              {t.notAgreed}
                            </button>
                          </div>
                        </div>

                      </div>
                    )
                  })
               )}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER (Sabit Alt Kısım) */}
      <div className="p-6 md:p-8 bg-white/90 border-t border-white/60 text-center shrink-0 rounded-t-[2.5rem] shadow-[0_-4px_12px_rgba(0,0,0,0.04)] z-10">
        <div className="max-w-md mx-auto">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] border-2 border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all bg-white hover:bg-slate-50">
             <Settings size={20} /> {t.advancedSettings}
          </button>
          <div className="flex items-center justify-center gap-2 opacity-30 mt-6">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Transport 245</span>
          </div>
        </div>
      </div>

      {/* KLASİK MODALLAR */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <UserAgreementModal isOpen={showAgreement} onClose={() => setShowAgreement(false)} readOnly={true} />
      <KVKKModal isOpen={showKVKK} onClose={() => setShowKVKK(false)} readOnly={true} />
      <DeleteAccountModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleDeleteAccount} 
      />

      {/* YENİ MODALLAR (ŞİKAYET VE DEĞERLENDİRME) */}
      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        orderId={reportTargetId}
        driverId={reportDriverId}
      />
      <RatingModal 
        isOpen={showRatingModal} 
        onClose={() => setShowRatingModal(false)} 
        onRate={handleRateSubmit}
      />
    </main>
  );
}
