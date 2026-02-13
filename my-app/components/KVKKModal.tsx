/**
 * @file KVKKModal.tsx
 * @description Transport 245 KVKK Aydınlatma Metni Modalı.
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
        <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar text-gray-600 text-sm leading-relaxed space-y-6">
          <p className="font-medium italic">İşbu Aydınlatma Metni, Transport 245 kullanıcılarının 6698 sayılı KVKK kapsamında bilgilendirilmesi amacıyla hazırlanmıştır.</p>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase">1. Veri Sorumlusu</h3>
            <p>Kişisel verileriniz, Transport 245 Platformu tarafından KVKK’ya uygun olarak işlenmektedir.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase">2. İşlenen Kişisel Veriler</h3>
            <div className="pl-4 border-l-2 border-gray-100 space-y-3">
              <p><strong>a) Kullanıcıya Ait Veriler:</strong> Kimlik (Ad-Soyad), İletişim (Tel, E-posta), Profil bilgileri, Kullanım kayıtları ve Konum bilgisi.</p>
              <p><strong>b) Hizmet Sağlayıcılara Ait Veriler:</strong> Firma adı, İşyeri telefonu, Adres/Konum ve Hizmet tanıtım bilgileri.</p>
              <p><strong>c) Ödeme Bilgileri:</strong> Ödemeler uygulama mağazaları üzerinden yapılır; kart bilgileriniz tarafımızca toplanmaz.</p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase">3. Veri Kaynakları</h3>
            <p>Veriler; kullanıcı beyanı, eklenen/düzeltilen bilgiler ve Google gibi üçüncü taraf herkese açık kaynaklardan elde edilir.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase">4. İşlenme Amaçları</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Hizmetlerin sunulması ve yönetilmesi</li>
              <li>Hesap güvenliğinin sağlanması</li>
              <li>Abonelik süreçlerinin takibi</li>
              <li>Hukuki yükümlülüklerin yerine getirilmesi</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase">5. Saklama Süresi ve Aktarım</h3>
            <p>Verileriniz işlenme amacı süresince saklanır. Yasal yükümlülükler dışında üçüncü şahıslara satılmaz veya ticari amaçla paylaşılmaz.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black text-gray-900 uppercase">6. Haklarınız (Madde 11)</h3>
            <p>Verilerinizin işlenip işlenmediğini öğrenme, düzeltme, silme ve zararın giderilmesini talep etme haklarına sahipsiniz.</p>
          </section>
        </div>

        {/* Footer */}
        {!readOnly && (
          <div className="p-6 sm:p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button onClick={onClose} className="w-full sm:w-auto px-10 py-4 bg-black text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95">
              OKUDUM, ANLADIM
            </button>
          </div>
        )}
      </div>
    </div>
  );
}