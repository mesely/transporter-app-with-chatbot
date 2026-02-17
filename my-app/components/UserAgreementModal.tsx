/**
 * @file UserAgreementModal.tsx
 * @description Transport 245 Kullanıcı Sözleşmesi Modalı (Tam Metin).
 * FIX: Gönderilen 11 maddelik tam metin işlendi.
 * FIX: Abonelik ve Ücretlendirme maddesi vurgulandı.
 */

'use client';

import { X, FileText } from 'lucide-react';

interface UserAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

export default function UserAgreementModal({ isOpen, onClose, readOnly = false }: UserAgreementModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 shrink-0 text-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <FileText className="text-blue-600" size={24} />
            </div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter">
              Kullanıcı Sözleşmesi
            </h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 hover:bg-red-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar text-gray-600 text-sm leading-relaxed space-y-8 font-medium">
          
          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">1. Platformun Niteliği</h3>
            <p>Platform, kullanıcılar ile hizmet sağlayıcıları bir araya getiren aracı bir teknoloji platformudur. Hizmetlerin doğrudan sağlayıcısı değildir ve doğabilecek uyuşmazlıklardan sorumlu tutulamaz.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">2. Kullanıcı Hesabı</h3>
            <p>Kullanıcı, doğru ve güncel bilgilerle hesap oluşturmalıdır. Hesap güvenliğinden ve yapılan işlemlerden kullanıcı bizzat sorumludur.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">3. Kullanım Koşulları</h3>
            <p>Uygulama hukuka ve genel ahlaka uygun kullanılmalıdır. Yanıltıcı bilgi veya sistem güvenliğini tehlikeye atan durumlarda hesap askıya alınabilir.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">4. İçerik ve Sorumluluk</h3>
            <p>Platform, içeriğin doğruluğunu garanti etmez. Hizmet kesintileri, veri kayıpları veya taraflar arası anlaşmazlıklardan sorumlu değildir.</p>
          </section>

          {/* KRİTİK BÖLÜM VURGUSU */}
          <section className="bg-blue-50/60 p-6 rounded-[2rem] border border-blue-100 space-y-3">
            <h3 className="font-black text-blue-900 uppercase tracking-wide">5. Ücretlendirme ve Abonelik</h3>
            <ul className="list-disc pl-5 space-y-2 text-blue-800">
              <li><strong>Ücretsiz Dönem:</strong> İlk kayıt tarihinden itibaren <strong>12 (on iki) ay süreyle ücretsizdir.</strong></li>
              <li><strong>Abonelik Bedeli:</strong> Ücretsiz süre sonunda yıllık abonelik bedeli <strong>1 ABD Doları (USD)</strong> karşılığıdır.</li>
              <li><strong>Ödeme:</strong> Apple App Store veya Google Play Store üzerinden yerel para birimiyle tahsil edilir. Kart bilgileri saklanmaz.</li>
              <li><strong>Yenileme:</strong> Mağaza kuralları gereği iptal edilmedikçe otomatik yenilenir.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">6. Veri Kaynakları</h3>
            <p>Bilgiler; Google/herkese açık kaynaklar, Platform tarafından eklenen veriler ve kullanıcılar tarafından girilen verilerden oluşur.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">7. Bağış Politikası</h3>
            <p>Platform, kazancın <strong>%10’una</strong> kadarı sosyal sorumluluk kapsamında yardım kuruluşlarına bağışlamayı hedefler.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">8. Gizlilik</h3>
            <p>Kişisel veriler KVKK Aydınlatma Metni’ne ve mevzuata uygun şekilde korunur.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">9. Hesap Silme</h3>
            <p>Kullanıcı dilediği zaman hesabını silebilir. Yasal zorunluluk haricindeki veriler silinir veya anonim hale getirilir.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">10. Değişiklik Hakkı</h3>
            <p>Platform, sözleşmede değişiklik yapma hakkını saklı tutar. Güncel metin uygulamada yayımlandığı andan itibaren geçerlidir.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">11. Yürürlük</h3>
            <p>Uygulamayı kullanmaya başlamanız, bu sözleşmeyi okuduğunuz ve kabul ettiğiniz anlamına gelir.</p>
          </section>

        </div>

        {/* Footer */}
        {!readOnly && (
          <div className="p-6 sm:p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button onClick={onClose} className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all">
              SÖZLEŞMEYİ ONAYLIYORUM
            </button>
          </div>
        )}
      </div>
    </div>
  );
}