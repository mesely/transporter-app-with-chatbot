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
      <div className="absolute inset-0 bg-slate-700/35 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in duration-300">
        <div className="shrink-0 border-b border-gray-100 p-6 text-gray-900 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2">
                <FileText className="text-blue-600" size={24} />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tighter sm:text-xl">Kullanici Sozlesmesi</h2>
            </div>
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition-all hover:bg-red-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar space-y-8 overflow-y-auto p-6 text-sm font-medium leading-relaxed text-gray-600 sm:p-10">
          <p>
            Isbu sozlesme; mobil uygulamayi kullanan gercek veya tuzel kisiler ("Kullanici") ile uygulamanin
            isletmecisi olan Platform arasinda, uygulamanin kullanim sartlarini ve taraflarin hak ve yukumluluklerini
            belirlemek amaciyla duzenlenmistir.
          </p>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">1. Platformun Niteligi</h3>
            <p>
              Platform, kullanicilar ile hizmet saglayicilari bir araya getiren araci bir teknoloji platformudur.
              Platform yalnizca bilgi paylasimi ve eslestirme saglayan bir teknoloji altyapisi sunar. Kullanicilar ile
              ucuncu kisiler arasinda kurulacak iliski ve dogabilecek uyusmazliklardan Platform sorumlu tutulamaz.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">2. Kullanici Hesabi</h3>
            <p>
              Uygulamadan yararlanabilmek icin kullanicilarin dogru, guncel ve kendilerine ait bilgilerle hesap
              olusturmasi gerekmektedir. Kullanici, hesap guvenliginden, hesabi uzerinden yapilan tum islemlerden ve
              paylasilan bilgilerden bizzat sorumludur.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">3. Kullanim Kosullari</h3>
            <p>Kullanici, uygulamayi hukuka, genel ahlaka ve yururlukteki mevzuata uygun sekilde kullanacagini kabul eder.</p>
            <p>
              Platform; yaniltici bilgi, kotuye kullanim, sahte icerik veya sistem guvenligini tehlikeye atan
              davranislar tespit ettiginde kullanici hesabini gecici olarak askiya alma veya kalici olarak sonlandirma
              hakkini sakli tutar.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">4. Icerik ve Sorumluluk Sinirlari</h3>
            <p>
              Uygulama icerisinde yer alan bilgiler; ucuncu taraflardan, herkese acik kaynaklardan veya kullanici
              girislerinden elde edilebilir. Platform, bu iceriklerin dogrulugu, guncelligi veya eksiksizligi konusunda
              herhangi bir garanti vermez.
            </p>
            <p>
              Platform; hizmet kesintileri, veri kayiplari, kullanicilar veya ucuncu kisiler arasinda yasanan
              anlasmazliklar ile dogrudan veya dolayli zararlar nedeniyle sorumlu tutulamaz.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">5. Veri Kaynaklari ve Bilgi Kullanimi</h3>
            <p>
              Uygulama kapsaminda bazi nakliye firmalarina veya hizmet saglayicilara ait bilgiler herkese acik
              kaynaklardan elde edilebilir. Bu bilgiler; firma adi, telefon numarasi, yaklasik konum veya adres ve
              hizmete dair genel tanitim bilgileri ile sinirlidir.
            </p>
            <p>
              Platform, uygulamanin isleyisini gelistirmek amaciyla kendi iceriklerini ve bilgilendirici verilerini
              uygulamaya ekleyebilir. Kullanicilar, firma bilgilerini veya hizmet detaylarini uygulama uzerinden
              ekleyebilir, guncelleyebilir veya duzeltebilir. Kullanici tarafindan girilen verilerin dogrulugundan ilgili
              kullanici sorumludur.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">6. Bagis Politikasi</h3>
            <p>
              Platform, elde edilen gelirlerin %10'una kadar olan kismini sosyal sorumluluk kapsaminda belirlenen yardim
              kuruluslarina bagislamayi hedefleyebilir. Bagis orani ve yontemi Platform'un takdirindedir.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">7. Gizlilik ve Kisisel Verilerin Korunmasi</h3>
            <p>
              Kullaniciya ait kisisel veriler, yururlukteki veri koruma mevzuatlarina uygun sekilde islenir ve korunur.
              Kisisel verilerin islenmesine iliskin detayli bilgiler Gizlilik Politikasi icerisinde yer almaktadir.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">8. Hesap Silme ve Sona Erme</h3>
            <p>
              Kullanici, diledigi zaman uygulama icerisinden hesabini kalici olarak silebilir. Mevzuat geregi
              saklanmasi zorunlu olan veriler haricindeki tum kisisel veriler silinir, yok edilir veya anonim hale
              getirilir.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">9. Degisiklik Hakki</h3>
            <p>
              Platform, isbu sozlesmede gerekli gordugu degisiklikleri yapma hakkini sakli tutar. Guncel sozlesme
              uygulama icerisinde yayimlandigi tarihten itibaren gecerli olur. Esasli degisiklikler gerekli oldugunda
              kullanicinin onayina yeniden sunulabilir.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-black uppercase tracking-wide text-gray-900">10. Yurutme ve Uygulanacak Hukuk</h3>
            <p>
              Isbu sozlesme, kullanicinin uygulamayi kullanmaya baslamasiyla yururluge girer. Sozlesmeden dogabilecek
              uyusmazliklarda Turkiye Cumhuriyeti hukuku uygulanir ve yetkili mahkemeler Turkiye'de bulunan
              mahkemelerdir.
            </p>
          </section>
        </div>

        {!readOnly && (
          <div className="flex justify-end border-t border-gray-100 bg-gray-50 p-6 sm:p-8">
            <button onClick={onClose} className="w-full rounded-2xl bg-blue-600 px-10 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-blue-700 active:scale-95 sm:w-auto">
              SOZLESMEYI ONAYLIYORUM
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
