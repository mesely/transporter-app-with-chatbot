'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AppLang, getPreferredLang } from '../utils/language';

export default function ScanningLoader() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [lang, setLang] = useState<AppLang>('tr');
  const messagesByLang: Record<AppLang, string[]> = {
    tr: [
      'Yeni nesil lojistik ağı hazırlanıyor',
      'Konuma en yakın araçlar listeleniyor',
      'En yakın kurtarıcı, vinç ve nakliye araçları bulunuyor',
      'Uygun hizmet sağlayıcılar filtreleniyor',
      'Güvenilir ve hızlı eşleşmeler oluşturuluyor'
    ],
    en: [
      'Preparing next-generation logistics network',
      'Listing vehicles closest to your location',
      'Finding nearest recovery, crane, and transport services',
      'Filtering suitable service providers',
      'Building reliable and fast matches'
    ],
    de: [
      'Das Logistiknetz der neuen Generation wird vorbereitet',
      'Die nächstgelegenen Fahrzeuge werden gelistet',
      'Nächste Abschlepp-, Kran- und Transportdienste werden gefunden',
      'Geeignete Dienstleister werden gefiltert',
      'Zuverlässige und schnelle Zuordnungen werden erstellt'
    ],
    fr: [
      'Préparation du réseau logistique nouvelle génération',
      'Liste des véhicules les plus proches de votre position',
      'Recherche des dépanneuses, grues et transports les plus proches',
      'Filtrage des prestataires adaptés',
      'Création de correspondances fiables et rapides'
    ],
    it: [
      'Preparazione della rete logistica di nuova generazione',
      'Elenco dei veicoli più vicini alla tua posizione',
      'Ricerca di soccorso stradale, gru e trasporto più vicini',
      'Filtraggio dei fornitori di servizi idonei',
      'Creazione di abbinamenti affidabili e rapidi'
    ],
    es: [
      'Preparando la red logística de nueva generación',
      'Listando los vehículos más cercanos a tu ubicación',
      'Buscando grúas y transporte más cercanos',
      'Filtrando proveedores de servicio adecuados',
      'Creando coincidencias rápidas y confiables'
    ],
    pt: [
      'Preparando a rede logística de nova geração',
      'Listando os veículos mais próximos da sua localização',
      'Encontrando guincho, guindaste e transporte mais próximos',
      'Filtrando prestadores de serviço adequados',
      'Criando correspondências rápidas e confiáveis'
    ],
    ru: [
      'Подготовка логистической сети нового поколения',
      'Показ ближайших автомобилей к вашей локации',
      'Поиск ближайших эвакуаторов, кранов и перевозчиков',
      'Фильтрация подходящих поставщиков услуг',
      'Формирование надежных и быстрых совпадений'
    ],
    zh: [
      '正在准备新一代物流网络',
      '正在列出距离您最近的车辆',
      '正在查找最近的救援车、吊车和运输车辆',
      '正在筛选合适的服务提供商',
      '正在建立可靠且快速的匹配'
    ],
    ja: [
      '次世代物流ネットワークを準備しています',
      '現在地に最も近い車両を表示しています',
      '最寄りのレッカー・クレーン・輸送車を検索しています',
      '適切なサービス提供者を絞り込んでいます',
      '信頼できる迅速なマッチングを作成しています'
    ],
    ko: [
      '차세대 물류 네트워크를 준비 중입니다',
      '현재 위치에서 가장 가까운 차량을 불러오는 중입니다',
      '가장 가까운 견인차, 크레인, 운송 차량을 찾는 중입니다',
      '적합한 서비스 제공업체를 필터링하는 중입니다',
      '신뢰할 수 있고 빠른 매칭을 생성하는 중입니다'
    ],
    ar: [
      'جارٍ تجهيز شبكة لوجستية من الجيل الجديد',
      'جارٍ عرض أقرب المركبات إلى موقعك',
      'جارٍ العثور على أقرب سحب ورافعات ونقل',
      'جارٍ تصفية مزوّدي الخدمة المناسبين',
      'جارٍ إنشاء مطابقة سريعة وموثوقة'
    ]
  };
  const messages = messagesByLang[lang] || messagesByLang.en;

  useEffect(() => {
    setLang(getPreferredLang());
  }, []);

  useEffect(() => {
    const totalTime = 7000;
    const intervalTime = 50;
    const steps = totalTime / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(oldProgress + increment, 100);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden">

      {/* ARKA PLAN GÖRSELİ */}
      <div className="absolute inset-0 z-[-2] bg-[url('/splash.jpeg')] bg-cover bg-center bg-no-repeat"></div>

      {/* BEYAZ ÖRTÜ */}
      <div className="absolute inset-0 z-[-1] bg-white/20"></div>

      {/* MERKEZ LOGO */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-12">
        <div className="bg-white/50 border border-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
          <img src="/favicon.ico" alt="Transport 245 logo" className="w-20 h-20 object-contain rounded-2xl" />
        </div>
        <div className="mt-3 text-[12px] sm:text-sm font-black uppercase tracking-wide text-gray-900 bg-white/70 border border-white/80 px-4 py-2 rounded-xl shadow-sm">
          Gelecegin lojistik agi
        </div>
      </div>

      <div className="relative z-10 mb-8 px-5 py-3 rounded-2xl bg-white/75 border border-white/80 shadow-lg max-w-[85vw]">
        <div className="text-[11px] sm:text-xs font-black uppercase tracking-wide text-gray-900 text-center">
          {messages[messageIndex]}
        </div>
      </div>

      {/* YÜKLEME BARI */}
      <div className="absolute bottom-24 flex flex-col items-center gap-3 w-72 z-10">
        <div className="w-full h-2 bg-white/40 rounded-full overflow-hidden border border-white/70 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-gray-800 via-blue-600 to-gray-900 rounded-full transition-all duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* MARKA KATMANI */}
      <div className="absolute bottom-8 flex items-center gap-2 bg-white/60 border border-white/70 backdrop-blur-lg px-6 py-2 rounded-full z-10 shadow-sm">
        <ShieldCheck size={14} className="text-blue-600" />
        <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em]">
          Transport <span className="text-gray-900">245</span>
        </span>
      </div>
    </div>
  );
}
