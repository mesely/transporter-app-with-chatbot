'use client';

import { X, Bell, Shield, CreditCard, LogOut, Trash2, ChevronRight, Heart } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  const handleDeleteAccount = () => {
    if (confirm("Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('transporter_user_role');
    localStorage.removeItem('transporter_provider_id');
    window.location.reload();
  };

  return (
    // Overlay: Çok hafif gri ve az bulanık
    <div className="fixed inset-0 z-[6000] bg-gray-900/10 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Modal Container: GLASSMORPHISM ANA KATMANI */}
      {/* bg-white/70 (yarı saydam beyaz), backdrop-blur-2xl (güçlü buzlu cam), border-white/40 (parlak kenar) */}
      <div className="w-full max-w-sm rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative border border-white/40 bg-white/70 backdrop-blur-2xl max-h-[85vh]">
        
        {/* HEADER & KAPAT BUTONU */}
        <div className="p-6 flex justify-between items-center border-b border-white/20 sticky top-0 z-10 bg-white/10 backdrop-blur-md">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Ayarlar</h2>
          
          {/* Glass Kapat Butonu */}
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-white/40 border border-white/50 hover:bg-white/80 hover:text-red-500 rounded-full flex items-center justify-center text-gray-600 transition-all active:scale-95 shadow-sm"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* ABONELİK KUTUSU (Glass Card - Siyah Yok) */}
          <div className="rounded-3xl p-6 relative overflow-hidden group border border-white/60 shadow-sm bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl">
            {/* Arkadaki hafif mavi ışık efekti */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-100/50 transition-all"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <CreditCard size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Premium Üyelik</span>
              </div>
              <h3 className="text-2xl font-black mb-1 text-gray-900">STANDART PLAN</h3>
              <p className="text-xs text-gray-500 font-bold mb-4">Deneme Sürümü Aktif</p>
              
              <div className="bg-white/50 rounded-2xl p-3 backdrop-blur-md border border-white/60 shadow-inner">
                <p className="text-[10px] leading-relaxed text-gray-600 font-medium">
                  Ödemeler App Store / Google Play üzerinden güvenle yönetilir. Kart bilgisi saklanmaz.
                </p>
              </div>
            </div>
          </div>

          {/* MENÜ GRUBU 1 (Glass List) */}
          <div className="rounded-3xl p-2 shadow-sm border border-white/60 bg-white/40 backdrop-blur-md">
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/60 rounded-2xl transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50/80 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><Bell size={18}/></div>
                <span className="text-xs font-black text-gray-700 uppercase">Bildirimler</span>
              </div>
              <ChevronRight size={16} className="text-gray-400/70" />
            </button>
            <div className="h-[1px] bg-white/30 mx-4"></div>
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/60 rounded-2xl transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-50/80 border border-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><Shield size={18}/></div>
                <span className="text-xs font-black text-gray-700 uppercase">Gizlilik</span>
              </div>
              <ChevronRight size={16} className="text-gray-400/70" />
            </button>
          </div>

          {/* BAĞIŞ BİLGİSİ (Glass Card) */}
          <div className="rounded-3xl p-5 shadow-sm border border-white/60 bg-white/40 backdrop-blur-md flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50/80 border border-red-100 text-red-500 rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Heart size={20} className="fill-current" />
            </div>
            <div>
              <h4 className="font-black text-gray-900 text-xs uppercase">Sosyal Sorumluluk</h4>
              <p className="text-[10px] text-gray-500 font-bold mt-0.5 leading-tight">Gelirlerin %10'u yardım kuruluşlarına bağışlanır.</p>
            </div>
          </div>

          {/* HESAP İŞLEMLERİ (Glass List) */}
          <div className="rounded-3xl p-2 shadow-sm border border-white/60 bg-white/40 backdrop-blur-md">
             <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 hover:bg-white/60 rounded-2xl transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100/80 border border-gray-200 text-gray-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><LogOut size={18}/></div>
                <span className="text-xs font-black text-gray-700 uppercase">Çıkış Yap</span>
              </div>
            </button>
            <div className="h-[1px] bg-white/30 mx-4"></div>
            <button onClick={handleDeleteAccount} className="w-full flex items-center justify-between p-4 hover:bg-red-50/80 hover:border-red-100 rounded-2xl transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-50/80 border border-red-100 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><Trash2 size={18}/></div>
                <span className="text-xs font-black text-red-600 uppercase">Hesabı Sil</span>
              </div>
            </button>
          </div>
          
          <div className="text-center pt-2 pb-4">
            <p className="text-[9px] text-gray-400/80 font-black uppercase tracking-[0.2em]">v2.4.5 • Transporter Glass</p>
          </div>

        </div>
      </div>
    </div>
  );
}