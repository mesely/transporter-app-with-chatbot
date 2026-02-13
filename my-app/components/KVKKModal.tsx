/**
 * @file KVKKModal.tsx
 * @description Transport 245 KVKK Aydınlatma Metni (Tam Metin).
 * FIX: Gönderilen 10 maddelik tam metin işlendi.
 * FIX: readOnly prop'u ile onay butonu kontrolü sağlandı.
 */

'use client';

import { X, ShieldCheck } from 'lucide-react';

interface KVKKModalProps {
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean; 
}

export default function KVKKModal({ isOpen, onClose, readOnly = false }: KVKKModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 shrink-0 text-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl">
              <ShieldCheck className="text-green-600" size={24} />
            </div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter">
              KVKK Aydınlatma Metni
            </h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 hover:bg-red-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar text-gray-600 text-sm leading-relaxed space-y-8 font-medium">
          
          <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 italic text-green-800 text-xs">
            İşbu Aydınlatma Metni, mobil uygulamayı kullanan kullanıcıların, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında kişisel verilerinin işlenme süreçlerini açıklar.
          </div>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">1. Veri Sorumlusu</h3>
            <p>Kişisel verileriniz, mobil uygulamanın işletmecisi olan Platform (Transport 245) tarafından, KVKK’ya uygun olarak işlenmektedir.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">2. İşlenen Kişisel Veriler</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Kullanıcı Verileri:</strong> Kimlik (Ad, Soyad), İletişim (Tel, E-posta), Profil bilgileri, Kullanım kayıtları ve Konum bilgisi.</li>
              <li><strong>Hizmet Sağlayıcı Verileri:</strong> Firma adı, İşyeri telefonu, Adres/Konum ve Hizmet tanıtım bilgileri.</li>
              <li><strong>Ödeme Bilgileri:</strong> İşlemler Apple App Store ve Google Play Store üzerinden yapıldığından, kart bilgileri Platform tarafından saklanmaz.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">3. Kişisel Verilerin Kaynakları</h3>
            <p>Veriler; kullanıcı beyanı, kullanıcı tarafından eklenen/düzeltilen bilgiler ve Google gibi herkese açık üçüncü taraf kaynaklardan elde edilir.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">4. İşlenme Amaçları</h3>
            <p>Hizmetlerin sunulması, hesap güvenliği, eşleştirme faaliyetleri, abonelik takibi, talep yönetimi ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">5. Hukuki Sebepler</h3>
            <p>KVKK Madde 5 uyarınca; sözleşmenin ifası, hukuki yükümlülük, meşru menfaat ve gerektiğinde açık rıza sebeplerine dayanılır.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">6. Verilerin Aktarılması</h3>
            <p>Yasal yükümlülükler kapsamında kamu kurumlarına ve abonelik süreçleri için uygulama mağazalarına aktarılabilir. Üçüncü kişilere satılmaz.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">7. Saklama Süresi</h3>
            <p>Veriler işlenme amacı süresince ve yasal saklama süreleri kadar muhafaza edilir. Hesap silindiğinde yasal zorunluluk dışındaki veriler imha edilir.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">8. Haklarınız (Madde 11)</h3>
            <p>Verilerinizin işlenip işlenmediğini öğrenme, düzeltme, silme ve zararın giderilmesini talep etme haklarına sahipsiniz.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">9. Başvuru Yöntemi</h3>
            <p>Taleplerinizi uygulama içerisindeki iletişim kanalları aracılığıyla Platform’a iletebilirsiniz.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase tracking-wide">10. Yürürlük</h3>
            <p>Bu metin yayımlandığı tarihte yürürlüğe girer. Uygulamayı kullanarak bu metni kabul etmiş sayılırsınız.</p>
          </section>

        </div>

        {/* Footer */}
        {!readOnly && (
          <div className="p-6 sm:p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button onClick={onClose} className="w-full sm:w-auto px-10 py-4 bg-black text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">
              OKUDUM, ANLADIM
            </button>
          </div>
        )}
      </div>
    </div>
  );
}