/**
 * @file app/privacy/page.tsx
 * @description Transport 245 Resmi Gizlilik ve Kullanıcı Sözleşmesi Sayfası.
 * Özellikler: KVKK ve Kullanıcı Sözleşmesi tam metinleri, Çift Dil Altyapısı.
 */

'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Globe, ShieldCheck, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppLang, getPreferredLang, LANG_STORAGE_KEY } from '../../utils/language';

const CONTENT: any = {
  tr: {
    title: "Yasal Merkez",
    subtitle: "Transport 245 • Sürüm 2.0 • Güncelleme: 14 Şubat 2026",
    intro: "Aşağıdaki metinler, Transport 245 platformunun kullanımına ilişkin yasal haklarınızı, KVKK aydınlatma metnini ve Kullanıcı Sözleşmesini eksiksiz olarak içermektedir.",
    contactTitle: "Yasal İletişim",
    
    // BÖLÜM 1: KVKK
    kvkkTitle: "BÖLÜM 1: KİŞİSEL VERİLERİN KORUNMASI (KVKK)",
    kvkkSections: [
      {
        h: "1. Veri Sorumlusu",
        p: "Kişisel verileriniz, mobil uygulamanın işletmecisi olan Platform (Transport 245) tarafından, 6698 sayılı KVKK’ya uygun olarak işlenmektedir."
      },
      {
        h: "2. İşlenen Kişisel Veriler",
        p: "Uygulama kapsamında şu veriler işlenir: (a) Kullanıcıya Ait Veriler: Kimlik (ad, soyad), İletişim (tel, e-posta), Profil bilgileri, Kullanım kayıtları ve Konum bilgisi. (b) Hizmet Sağlayıcılara Ait Veriler: Firma adı, İşyeri telefonu, Adres/Konum ve Tanıtım bilgileri. (c) Ödeme Bilgileri: İşlemler Apple/Google üzerinden yapıldığından kart bilgileri Platform tarafından saklanmaz."
      },
      {
        h: "3. Kişisel Verilerin Kaynakları",
        p: "Kişisel veriler; (a) Kullanıcı Beyanı (kendi rızanızla girdiğiniz bilgiler), (b) Kullanıcı Tarafından Eklenen Veriler, (c) Herkese Açık Kaynaklar (Google vb. platformlardan elde edilen kamuya açık firma bilgileri) yoluyla toplanır."
      },
      {
        h: "4. İşlenme Amaçları",
        p: "Verileriniz; hizmetlerin sunulması, hesap güvenliği, eşleştirme faaliyetleri, abonelik takibi, talep yönetimi, performans geliştirme, hukuki yükümlülükler ve kötüye kullanımın önlenmesi amacıyla işlenir."
      },
      {
        h: "5. Hukuki Sebepler",
        p: "KVKK Madde 5 uyarınca; sözleşmenin kurulması ve ifası, hukuki yükümlülüklerin yerine getirilmesi, meşru menfaat ve gerektiğinde açık rıza sebeplerine dayanılır."
      },
      {
        h: "6. Verilerin Aktarılması",
        p: "Kişisel veriler; yasal yükümlülükler kapsamında kamu kurumlarına ve abonelik süreçleri için uygulama mağazalarına aktarılabilir. Verileriniz üçüncü kişilere satılmaz veya ticari amaçla paylaşılmaz."
      },
      {
        h: "7. Saklama Süresi",
        p: "Veriler, işlenme amacının gerektirdiği süre ve yasal saklama süreleri boyunca muhafaza edilir. Hesap silindiğinde, yasal zorunluluk dışındaki veriler silinir veya anonim hale getirilir."
      },
      {
        h: "8. İlgili Kişinin Hakları (Madde 11)",
        p: "Kullanıcılar; verilerinin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme isteme, silinmesini talep etme ve zararın giderilmesini isteme haklarına sahiptir."
      },
      {
        h: "9. Başvuru ve Yürürlük",
        p: "Taleplerinizi uygulama içi kanallardan iletebilirsiniz. Bu metin yayımlandığı tarihte yürürlüğe girer ve uygulamayı kullanarak bu metni kabul etmiş sayılırsınız."
      },
      {
        h: "10. Google Play Data Safety Beyanı",
        p: "Google Play Data Safety formunda; toplanan veri türleri (konum, iletişim bilgisi, profil verileri, kullanım verisi), veri işleme amacı (hizmet sunumu, güvenlik, destek), verinin üçüncü taraflarla paylaşım durumu ve verinin silinme talebi kapsamı açıkça beyan edilir. Platform, beyan ettiği kapsam dışında veri satışı yapmaz."
      },
      {
        h: "11. Konum İzni ve Arka Plan Kullanımı",
        p: "Konum verisi, kullanıcıya en yakın hizmet sağlayıcıların listelenmesi ve harita üzerinde doğru eşleştirme için işlenir. Uygulama konum iznini yalnızca gerekli fonksiyonlarda ister; izin verilmezse temel hizmetler sınırlı çalışabilir. Kullanıcı, cihaz ayarlarından konum iznini dilediği zaman değiştirebilir veya kaldırabilir."
      }
    ],

    // BÖLÜM 2: SÖZLEŞME
    agreementTitle: "BÖLÜM 2: KULLANICI SÖZLEŞMESİ",
    agreementSections: [
      {
        h: "1. Platformun Niteliği",
        p: "Platform (Transport 245), kullanıcılar ile hizmet sağlayıcıları bir araya getiren aracı bir teknoloji platformudur. Hizmetlerin doğrudan sağlayıcısı değildir ve taraflar arasındaki uyuşmazlıklardan sorumlu tutulamaz."
      },
      {
        h: "2. Kullanıcı Hesabı",
        p: "Kullanıcı, doğru ve güncel bilgilerle hesap oluşturmalıdır. Hesap güvenliğinden ve yapılan tüm işlemlerden kullanıcı bizzat sorumludur."
      },
      {
        h: "3. Kullanım Koşulları",
        p: "Kullanıcı, uygulamayı hukuka ve genel ahlaka uygun kullanacağını kabul eder. Yanıltıcı bilgi veya sistem güvenliğini tehlikeye atan durumlarda hesap askıya alınabilir."
      },
      {
        h: "4. İçerik ve Sorumluluk",
        p: "Platform, içeriklerin doğruluğunu garanti etmez. Hizmet kesintileri, veri kayıpları veya taraflar arası anlaşmazlıklardan sorumlu değildir."
      },
      {
        h: "5. Ücretlendirme ve Abonelik (ÖNEMLİ)",
        p: "Uygulamanın temel kullanımı, ilk kayıt tarihinden itibaren 12 (on iki) ay süreyle ÜCRETSİZDİR. Ücretsiz sürenin sonunda, hizmetlerden yararlanmaya devam etmek için yıllık abonelik (1 ABD Doları karşılığı yerel para birimi) gereklidir. Ödemeler Apple App Store veya Google Play Store üzerinden tahsil edilir. Platform kart bilgisi saklamaz. İptal edilmedikçe mağaza kuralları gereği otomatik yenilenir."
      },
      {
        h: "6. Veri Kaynakları",
        p: "Bilgiler; Google/herkese açık kaynaklar, Platform tarafından eklenen veriler ve kullanıcılar tarafından girilen verilerden oluşur. Platform bu verileri bilgilendirme amacıyla kullanır."
      },
      {
        h: "7. Bağış Politikası",
        p: "Platform, elde edilen gelirlerin %10’unu sosyal sorumluluk kapsamında belirlenen yardım kuruluşlarına bağışlamayı hedefler."
      },
      {
        h: "8. Gizlilik ve Hesap Silme",
        p: "Kullanıcı verileri KVKK metnine uygun korunur. Kullanıcı dilediği zaman hesabını silebilir; yasal zorunluluk haricindeki veriler imha edilir."
      },
      {
        h: "9. Yürürlük",
        p: "Uygulamayı kullanmaya başlamanız, bu sözleşme hükümlerini okuduğunuz ve kabul ettiğiniz anlamına gelir. Güncel metin her zaman bu sayfada mevcuttur."
      }
    ]
  },
  en: {
    title: "Legal Center",
    subtitle: "Transport 245 • Version 2.0 • Updated: Feb 14, 2026",
    intro: "The texts below explicitly cover your legal rights regarding the use of the Transport 245 platform, the Privacy Policy (KVKK), and the User Agreement.",
    contactTitle: "Legal Contact",
    kvkkTitle: "PART 1: PRIVACY POLICY (GDPR/KVKK)",
    kvkkSections: [
      { h: "1. Data Controller", p: "Your personal data is processed by the Platform operator (Transport 245) in accordance with relevant laws." },
      { h: "2. Processed Data", p: "We process User Data (ID, Contact, Location) and Service Provider Data (Business Name, Address). Financial data is handled by App Stores." },
      { h: "3. Purposes", p: "Data is processed to provide services, improve matching quality, ensure account/security operations, and fulfill legal obligations." },
      { h: "4. Storage and Deletion", p: "Data is retained only for the required legal/business duration. Users may request deletion; non-mandatory records are deleted or anonymized." },
      { h: "5. Google Play Data Safety", p: "Our Google Play Data Safety declaration states what data is collected, why it is used, whether it is shared, and how deletion requests are handled. We do not sell personal data." },
      { h: "6. Location Permission", p: "Location is used to show nearby providers and accurate map matching. If location permission is denied, some functions may be limited. Permission can be changed anytime from device settings." },
    ],
    agreementTitle: "PART 2: USER AGREEMENT",
    agreementSections: [
      { h: "1. Nature of Platform", p: "Transport 245 is an intermediary technology platform connecting users with providers. It is not the direct provider of services." },
      { h: "5. Pricing & Subscription", p: "Usage is FREE for the first 12 months. Afterwards, an annual subscription fee of 1 USD (local currency equivalent) applies via App Stores." }
    ]
  }
};

const PRIVACY_UI: Record<AppLang, any> = {
  tr: {},
  en: {},
  de: { title: 'Rechtliches Zentrum', contactTitle: 'Rechtlicher Kontakt', kvkkTitle: 'TEIL 1: DATENSCHUTZ', agreementTitle: 'TEIL 2: NUTZERVEREINBARUNG', back: 'Zur Startseite' },
  fr: { title: 'Centre juridique', contactTitle: 'Contact juridique', kvkkTitle: 'PARTIE 1: POLITIQUE DE CONFIDENTIALITÉ', agreementTitle: 'PARTIE 2: CONTRAT UTILISATEUR', back: "Retour à l'accueil" },
  it: { title: 'Centro legale', contactTitle: 'Contatto legale', kvkkTitle: 'PARTE 1: INFORMATIVA PRIVACY', agreementTitle: 'PARTE 2: CONTRATTO UTENTE', back: 'Torna alla home' },
  es: { title: 'Centro legal', contactTitle: 'Contacto legal', kvkkTitle: 'PARTE 1: POLÍTICA DE PRIVACIDAD', agreementTitle: 'PARTE 2: ACUERDO DE USUARIO', back: 'Volver al inicio' },
  pt: { title: 'Centro jurídico', contactTitle: 'Contato jurídico', kvkkTitle: 'PARTE 1: POLÍTICA DE PRIVACIDADE', agreementTitle: 'PARTE 2: ACORDO DO USUÁRIO', back: 'Voltar para início' },
  ru: { title: 'Юридический центр', contactTitle: 'Юридический контакт', kvkkTitle: 'РАЗДЕЛ 1: ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ', agreementTitle: 'РАЗДЕЛ 2: ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ', back: 'Назад на главную' },
  zh: { title: '法律中心', contactTitle: '法律联系', kvkkTitle: '第1部分：隐私政策', agreementTitle: '第2部分：用户协议', back: '返回首页' },
  ja: { title: '法務センター', contactTitle: '法務連絡先', kvkkTitle: '第1部：プライバシーポリシー', agreementTitle: '第2部：利用規約', back: 'ホームへ戻る' },
  ko: { title: '법률 센터', contactTitle: '법률 문의', kvkkTitle: '1부: 개인정보 처리방침', agreementTitle: '2부: 이용약관', back: '홈으로 돌아가기' },
  ar: { title: 'المركز القانوني', contactTitle: 'التواصل القانوني', kvkkTitle: 'القسم 1: سياسة الخصوصية', agreementTitle: 'القسم 2: اتفاقية المستخدم', back: 'العودة للرئيسية' }
};

export default function PrivacyPage() {
  const router = useRouter();
  const [lang, setLang] = useState<AppLang>('tr');
  const base = CONTENT[lang === 'tr' ? 'tr' : 'en'];
  const t = { ...base, ...(PRIVACY_UI[lang] || {}) };

  useEffect(() => {
    const preferred = getPreferredLang();
    setLang(preferred);
    document.documentElement.lang = preferred;
  }, []);

  const handleToggleLang = () => {
    const next = lang === 'tr' ? 'en' : 'tr';
    setLang(next);
    localStorage.setItem(LANG_STORAGE_KEY, next);
    document.documentElement.lang = next;
  };

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] text-slate-900 overflow-y-auto font-sans">
      
      {/* HEADER */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => router.push('/')}
          className="text-slate-900 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} /> {(PRIVACY_UI[lang] && PRIVACY_UI[lang].back) || (lang === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home')}
        </button>
        
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-blue-600"/>
          <span className="font-black text-xs uppercase tracking-tighter italic">Transport 245</span>
        </div>

        <button 
          onClick={handleToggleLang}
          className="flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors shadow-lg"
        >
          <Globe size={14} /> {lang === 'tr' ? 'EN' : 'TR'}
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        
        {/* BAŞLIK */}
        <div className="mb-16 text-center space-y-4">
           <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">{t.title}</h1>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">{t.subtitle}</p>
           <div className="max-w-2xl mx-auto border-l-4 border-blue-500 pl-6 py-2 mt-8 text-left">
             <p className="font-bold text-slate-700 text-sm leading-relaxed italic">"{t.intro}"</p>
           </div>
        </div>

        <div className="space-y-20">
          
          {/* BÖLÜM 1: KVKK */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-slate-100">
            <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
              <div className="p-3 bg-green-100 rounded-2xl text-green-700"><ShieldCheck size={28}/></div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t.kvkkTitle}</h2>
            </div>
            <div className="space-y-8">
              {t.kvkkSections.map((section: any, idx: number) => (
                <section key={idx} className="space-y-2">
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {section.h}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium pl-3.5 border-l border-slate-200">
                    {section.p}
                  </p>
                </section>
              ))}
            </div>
          </div>

          {/* BÖLÜM 2: SÖZLEŞME */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-slate-100">
            <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
              <div className="p-3 bg-blue-100 rounded-2xl text-blue-700"><FileText size={28}/></div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t.agreementTitle}</h2>
            </div>
            <div className="space-y-8">
              {t.agreementSections.map((section: any, idx: number) => (
                <section key={idx} className={`space-y-2 ${section.h.includes('Ücret') ? 'bg-blue-50/50 p-6 rounded-3xl border border-blue-100' : ''}`}>
                  <h3 className={`font-black uppercase text-xs tracking-widest flex items-center gap-2 ${section.h.includes('Ücret') ? 'text-blue-700' : 'text-slate-900'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${section.h.includes('Ücret') ? 'bg-blue-600' : 'bg-slate-900'}`}></span> {section.h}
                  </h3>
                  <p className={`text-sm leading-relaxed font-medium pl-3.5 border-l ${section.h.includes('Ücret') ? 'text-blue-800 border-blue-200' : 'text-slate-600 border-slate-200'}`}>
                    {section.p}
                  </p>
                </section>
              ))}
            </div>
          </div>

        </div>

        {/* İLETİŞİM & FOOTER */}
        <div className="mt-24 pt-10 border-t border-slate-200 text-center space-y-6">
           <h3 className="font-black text-slate-900 uppercase text-lg italic tracking-tighter">{t.contactTitle}</h3>
           <a href="mailto:legal@transport245.com" className="text-slate-900 font-black text-2xl hover:text-blue-600 transition-colors block">
             legal@transport245.com
           </a>
           <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] pt-8">
             Transport 245 Sovereign Platform • Intellectual Property 2026
           </p>
        </div>

      </main>
    </div>
  );
}
