'use client';

import { X, MapPin, Search, CheckCircle } from 'lucide-react';

export default function CustomerGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center pointer-events-none">
      
      {/* Overlay - Tıklanabilir */}
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose}></div>
      
      {/* KART: Light Glass */}
      <div className="relative w-full max-w-sm bg-white/85 backdrop-blur-2xl m-4 p-8 rounded-[2.5rem] shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-10 duration-500 border border-white/50">
        
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-white/50 hover:bg-white rounded-full text-gray-600 transition-all shadow-sm">
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <h3 className="text-xl font-black text-gray-900 mb-8 text-center tracking-tight">NASIL KULLANILIR?</h3>
        
        <div className="space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-gray-900 text-sm">Konumunu Gör</h4>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Haritada yerini otomatik buluyoruz.</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-gray-900 text-sm">Hizmeti Seç</h4>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Çekici, Şarj veya Nakliye butonuna bas.</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-gray-900 text-sm">Tek Tıkla Çağır</h4>
              <p className="text-xs text-gray-500 font-medium mt-0.5">En yakın araç anında cebine düşsün.</p>
            </div>
          </div>
        </div>

        {/* BUTON: Katı Siyah */}
        <button onClick={onClose} className="w-full mt-10 bg-black text-white py-4 rounded-2xl font-black text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
          HEMEN BAŞLA
        </button>
      </div>
    </div>
  );
}