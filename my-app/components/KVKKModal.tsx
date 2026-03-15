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
      <div className="absolute inset-0 bg-slate-700/35 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in duration-300">
        <div className="shrink-0 border-b border-gray-100 p-6 text-gray-900 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-50 p-2">
                <ShieldCheck className="text-green-600" size={24} />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tighter sm:text-xl">KVKK Aydinlatma Metni</h2>
            </div>
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition-all hover:bg-red-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar space-y-8 overflow-y-auto p-6 text-sm font-medium leading-relaxed text-gray-600 sm:p-10">
          <div className="rounded-2xl border border-green-100 bg-green-50/50 p-4 text-xs italic text-green-800">
            Isbu Aydinlatma Metni, mobil uygulamayi kullanan kullanicilarin kisisel verilerinin hangi amaclarla
            islendigini, hangi kaynaklardan elde edildigini ve kullanicilarin sahip oldugu haklari aciklamak amaciyla
            hazirlanmistir.
          </div>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">1. Veri Sorumlusu</h3>
            <p>Kisisel verileriniz, mobil uygulamanin isletmecisi olan Platform tarafindan veri sorumlusu sifatoyla islenmektedir.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">2. Islenen Kisisel Veriler</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Kimlik bilgileri, iletisim bilgileri, kullanici hesap ve profil bilgileri.</li>
              <li>Uygulama kullanim ve islem kayitlari, cihaz bilgileri ve teknik kullanim verileri.</li>
              <li>Kullanicinin acik rizasi ve cihaz izni dogrultusunda konum bilgisi.</li>
              <li>Firma adi, isyeri telefonu, yaklasik adres veya konum bilgisi ve hizmete iliskin genel tanitim bilgileri.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">3. Kisisel Verilerin Kaynaklari</h3>
            <p>
              Kisisel veriler; kullanici beyanlari, kullanicilar tarafindan uygulamaya eklenen veya guncellenen
              bilgiler ve herkese acik kaynaklardan elde edilen bilgilerden olusabilir.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">4. Kisisel Verilerin Islenme Amaclari</h3>
            <p>
              Kisisel veriler; uygulama hizmetlerinin sunulmasi ve yonetilmesi, kullanici hesabinin olusturulmasi ve
              guvenliginin saglanmasi, hizmet eslestirme ve bilgilendirme faaliyetleri, destek basvurularinin
              yanitlanmasi, performans iyilestirme, teknik sorunlarin tespiti ve hukuki yukumluluklerin yerine
              getirilmesi amaclariyla islenmektedir.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">5. Islenmenin Hukuki Sebepleri</h3>
            <p>
              Kisisel veriler KVKK'nin 5. maddesi uyarinca; bir sozlesmenin kurulmasi ve ifasi, hukuki yukumluluklerin
              yerine getirilmesi, veri sorumlusunun mesru menfaati ve gerektigi durumlarda acik riza sebeplerine
              dayanilarak islenmektedir.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">6. Kisisel Verilerin Aktarilmasi</h3>
            <p>
              Kisisel veriler; yasal yukumlulukler kapsaminda yetkili kamu kurum ve kuruluslarina ve uygulama
              altyapisinin guvenli ve saglikli sekilde calismasini saglayan teknik hizmet saglayicilara mevzuata uygun
              sekilde aktarilabilir. Bunun disinda ucuncu kisilere satilmaz, kiralanmaz veya ticari amacla paylasilmaz.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">7. Kisisel Verilerin Saklama Suresi</h3>
            <p>
              Kisisel veriler; islenme amacinin gerektirdigi sure boyunca ve ilgili mevzuatta ongorulen yasal saklama
              sureleri kadar saklanir. Kullanici hesabinin silinmesi halinde yasal zorunluluk disindaki veriler silinir,
              yok edilir veya anonim hale getirilir.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">8. Ilgili Kisinin Haklari</h3>
            <p>
              Kullanicilar; kisisel verilerinin islenip islenmedigini ogrenme, buna iliskin bilgi talep etme, yanlis
              veya eksik islenen verilerin duzeltilmesini isteme, silme veya yok etmeyi talep etme ve kanuna aykiri
              isleme nedeniyle zararin giderilmesini talep etme haklarina sahiptir.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">9. Basvuru ve Iletisim</h3>
            <p>
              Kullanicilar, kisisel verilerine iliskin taleplerini uygulama icerisindeki iletisim kanallari veya destek
              e-posta adresi uzerinden Platform'a iletebilir. Platform, basvurulari yururlukteki mevzuat kapsaminda
              makul sure icerisinde degerlendirir.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">10. Yurutme</h3>
            <p>
              Isbu Aydinlatma Metni uygulama icerisinde yayimlandigi tarihten itibaren yururluge girer. Kullanici,
              uygulamayi kullanmaya devam ederek bu metni okudugunu, anladigini ve kabul ettigini beyan eder.
            </p>
          </section>
        </div>

        {!readOnly && (
          <div className="flex justify-end border-t border-gray-100 bg-gray-50 p-6 sm:p-8">
            <button onClick={onClose} className="w-full rounded-2xl bg-black px-10 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 sm:w-auto">
              OKUDUM, ANLADIM
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
