'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, ScrollText, CheckCircle2, Scale, 
  User, CreditCard, Heart, Lock, Trash2, Edit3, Clock 
} from 'lucide-react';

export default function UserAgreementModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Kullanıcı daha önce onaylamadıysa modalı aç
    const hasAgreed = localStorage.getItem('transporter_terms_agreed');
    if (!hasAgreed) {
      setIsOpen(true);
    }
  }, []);

  const handleAgree = () => {
    // Yasal ispat için onay zaman damgasıyla kaydedilir
    const timestamp = new Date().toISOString();
    localStorage.setItem('transporter_terms_agreed', timestamp);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    // GLASSMORPHISM OVERLAY
    <div className="fixed inset-0 z-[99999] bg-gray-900/15 backdrop-blur-[6px] flex items-center justify-center p-4 animate-in fade-in duration-500">
      
      {/* MODAL CONTAINER */}
      <div className="w-full max-w-lg h-[85vh] rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden border border-white/40 bg-white/70 backdrop-blur-3xl relative">
        
        {/* DEKORATİF IŞIK (Cam Etkisi İçin) */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* HEADER */}
        <div className="p-6 border-b border-white/30 text-center shrink-0 bg-white/30 backdrop-blur-md relative z-10">
          <div className="w-16 h-16 bg-blue-50/80 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm animate-pulse">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Kullanıcı Sözleşmesi</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Devam etmek için onaylamanız gerekmektedir</p>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar text-xs text-gray-600 leading-relaxed font-medium relative z-10 bg-white/10">
          
          <div className="bg-blue-50/60 border border-blue-100/50 p-5 rounded-3xl mb-4 shadow-inner">
            <p className="text-[11px] text-blue-800 font-bold text-center leading-normal italic">
              "İşbu sözleşme, yasal haklarınızı ve Platform ile aranızdaki sorumluluk sınırlarını belirleyen hukuki bir belgedir. Lütfen tüm maddeleri dikkatle okuyunuz."
            </p>
          </div>

          {/* MADDE 1 */}
          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] tracking-wide border-l-4 border-blue-600 pl-3">
              <Scale size={16} className="text-blue-600"/> 1. Platformun Niteliği
            </h3>
            <p className="text-justify">
              Platform, kullanıcıların belirli hizmetlere (oto kurtarma, vinç, nakliye, şarj) erişimini kolaylaştıran bir aracı teknoloji platformudur. Platform, 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun uyarınca hizmetin doğrudan sağlayıcısı değildir ve taraflar arasında kurulan ilişkilerden doğabilecek uyuşmazlıklardan doğrudan sorumlu tutulamaz.
            </p>
          </section>

          {/* MADDE 2 */}
          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] tracking-wide border-l-4 border-blue-600 pl-3">
              <User size={16} className="text-blue-600"/> 2. Kullanıcı Hesabı
            </h3>
            <p className="text-justify">
              Uygulamadan faydalanabilmek için kullanıcıların doğru, güncel ve eksiksiz bilgilerle hesap oluşturması gerekmektedir. Kullanıcı, hesabının erişim bilgilerinin güvenliğinden ve uygulama üzerinden gerçekleştirilen tüm işlemlerden şahsen sorumludur.
            </p>
          </section>

          {/* MADDE 3 */}
          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] tracking-wide border-l-4 border-blue-600 pl-3">
              <Edit3 size={16} className="text-blue-600"/> 3. Kullanım Koşulları
            </h3>
            <p className="text-justify">
              Kullanıcı, uygulamayı Türkiye Cumhuriyeti yasalarına, genel ahlaka ve yürürlükteki mevzuata uygun şekilde kullanmayı kabul ve taahhüt eder. Platform; kötüye kullanım, yanıltıcı bilgi beyanı veya sistem güvenliğini tehlikeye atan davranışlar halinde kullanıcı hesabını tek taraflı askıya alma veya sonlandırma hakkını saklı tutar.
            </p>
          </section>

          {/* MADDE 4 */}
          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] tracking-wide border-l-4 border-blue-600 pl-3">
              <ShieldCheck size={16} className="text-blue-600"/> 4. Sorumluluk Sınırları
            </h3>
            <p className="text-justify">
              Platform, uygulama üzerinden sunulan içeriklerin mutlak doğruluğu, hizmetin kesintisizliği veya üçüncü kişiler (sürücüler/firmalar) tarafından sunulan hizmetlerin niteliği konusunda herhangi bir garanti vermez. Platform, bu ilişkilerden doğabilecek dolaylı veya doğrudan maddi/manevi zararlardan sorumlu tutulamaz.
            </p>
          </section>

          {/* MADDE 5 */}
          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] tracking-wide border-l-4 border-blue-600 pl-3">
              <CreditCard size={16} className="text-blue-600"/> 5. Ücretlendirme, Ödeme ve Abonelik
            </h3>
            <p className="text-justify mb-3">
              Uygulama’nın temel kullanımı ücretsizdir. Ancak bazı özellikler ve hizmetler ücretli kullanım veya yıllık abonelik kapsamında sunulabilir.
            </p>
            <div className="bg-gray-50/50 border border-gray-200/50 p-4 rounded-2xl italic shadow-inner">
              <p className="mb-2">Ücretli kullanımlara ilişkin tüm ödemeler, <strong>Apple App Store</strong> ve <strong>Google Play Store</strong>’un kendi ödeme altyapıları üzerinden tahsil edilir. Kullanıcılar, ilgili mağazaların sunduğu ödeme yöntemlerini (kredi kartı, operatör faturalandırması vb.) kullanabilir.</p>
              <p>Platform, ödeme işlemlerinde doğrudan taraf değildir. İade ve ödeme yöntemlerine ilişkin tüm süreçler, ilgili uygulama mağazasının kendi politika ve kurallarına tabidir. Abonelikler yıllık olarak sunulur ve iptal edilmediği sürece otomatik olarak yenilenir.</p>
            </div>
          </section>

          {/* MADDE 6 */}
          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] tracking-wide border-l-4 border-blue-600 pl-3">
              <Heart size={16} className="text-blue-600"/> 6. Bağış Politikası
            </h3>
            <p className="text-justify">
              Platform, elde edilen net gelirlerin %10’unu sosyal sorumluluk kapsamında belirlenen yardım kuruluşlarına bağışlamayı hedefler. Bağış oranı ve yöntemi tamamen Platform’un takdirinde olup, bağış süreçlerine ilişkin periyodik bilgilendirmeler uygulama içerisinden yapılabilir.
            </p>
          </section>

          {/* MADDE 7 */}
          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] tracking-wide border-l-4 border-blue-600 pl-3">
              <Lock size={16} className="text-blue-600"/> 7. Gizlilik ve Veri Koruma
            </h3>
            <p className="text-justify">
              Kullanıcıya ait kişisel veriler (konum, iletişim vb.), 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Platform Gizlilik Politikası’na uygun olarak en yakın hizmet sağlayıcıyı bulmak ve güvenliği sağlamak amacıyla işlenir. Kullanıcı, bu verilerin işlenmesini kabul ettiğini beyan eder.
            </p>
          </section>

          {/* MADDE 8 */}
          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] tracking-wide border-l-4 border-blue-600 pl-3">
              <Trash2 size={16} className="text-blue-600"/> 8. Hesap Silme ve Sona Erme
            </h3>
            <p className="text-justify">
              Kullanıcı, dilediği zaman uygulama ayarları üzerinden hesabını kalıcı olarak silebilir. Platform, mevzuat gereği (finansal kayıtlar vb.) saklanması zorunlu veriler haricinde kullanıcı verilerini ivedilikle imha etmeyi taahhüt eder.
            </p>
          </section>

          {/* MADDE 9 */}
          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] tracking-wide border-l-4 border-blue-600 pl-3">
              <ScrollText size={16} className="text-blue-600"/> 9. Değişiklik Hakkı
            </h3>
            <p className="text-justify">
              Platform, işbu sözleşmede gerekli gördüğü teknik veya yasal değişiklikleri yapma hakkını saklı tutar. Güncel sözleşme metni uygulama içerisinde yayımlandığı tarihten itibaren tüm kullanıcılar için bağlayıcı hale gelir.
            </p>
          </section>

          {/* MADDE 10 */}
          <section>
            <h3 className="font-black text-gray-900 mb-3 uppercase flex items-center gap-3 text-[11px] tracking-wide border-l-4 border-blue-600 pl-3">
              <Clock size={16} className="text-blue-600"/> 10. Yürürlük
            </h3>
            <p className="text-justify">
              İşbu sözleşme, kullanıcının uygulamayı kullanmaya başlamasıyla birlikte dijital olarak yürürlüğe girer. Kullanıcı, sisteme giriş yaparak bu hükümlerin tamamını okuduğunu ve hür iradesiyle kabul ettiğini beyan eder.
            </p>
          </section>

          <div className="pt-8 pb-4 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] bg-white/40 py-2 rounded-full border border-white/50 shadow-sm">
              Son Güncelleme: 08 Şubat 2026
            </p>
          </div>
        </div>

        {/* FOOTER BUTTON */}
        <div className="p-6 border-t border-white/40 bg-white/60 backdrop-blur-md shrink-0 relative z-20">
          <button 
            onClick={handleAgree}
            className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(0,0,0,0.15)] group"
          >
            <CheckCircle2 size={18} className="group-hover:text-green-400 transition-colors" /> 
            Şartları Okudum ve Onaylıyorum
          </button>
        </div>

      </div>
    </div>
  );
}