import { Zap, MapPin, Radio, Loader2 } from 'lucide-react';

export default function ScanningLoader() {
  return (
    // 🔥 DEĞİŞİKLİK BURADA: bg-black/30 (Şeffaf Siyah) ve backdrop-blur-md (Buzlu Cam)
    <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-md flex flex-col items-center justify-center text-white cursor-wait">
      
      {/* Radar Efekti - Konteyner */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Dış Halka (Animasyonlu) */}
        <div className="absolute w-40 h-40 border-4 border-blue-500/20 rounded-full animate-[ping_2s_linear_infinite]"></div>
        <div className="absolute w-60 h-60 border border-blue-500/10 rounded-full animate-[pulse_3s_linear_infinite]"></div>
        
        {/* Merkez İkon Kutusu */}
        <div className="relative z-10 bg-black/80 p-5 rounded-3xl shadow-[0_0_60px_rgba(59,130,246,0.6)] border border-white/10 backdrop-blur-xl">
           <Radio className="w-12 h-12 text-blue-400 animate-pulse" strokeWidth={1.5} />
        </div>
      </div>

      {/* Yazılar (Okunabilirlik için hafif gölge eklendi) */}
      <div className="text-center space-y-2 px-6">
        <h3 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-md">
          Sürücüler Taranıyor
        </h3>
        <p className="text-xs text-blue-100/80 font-medium animate-pulse tracking-wide">
          Konumunuzdaki araçlarla iletişim kuruluyor...
        </p>
      </div>

      {/* Alt Bilgi İkonları */}
      <div className="absolute bottom-12 flex gap-6 text-white/60">
        <div className="flex flex-col items-center gap-1">
          <div className="bg-white/10 p-2 rounded-full"><Zap size={14} className="text-yellow-400" /></div>
          <span className="text-[9px] font-black uppercase tracking-wider">Hızlı</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="bg-white/10 p-2 rounded-full"><MapPin size={14} className="text-green-400" /></div>
          <span className="text-[9px] font-black uppercase tracking-wider">Kapsamlı</span>
        </div>
      </div>
    </div>
  );
}