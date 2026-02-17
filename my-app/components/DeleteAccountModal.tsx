/**
 * @file DeleteAccountModal.tsx
 * @description Kullanıcıyı kalıcı veri kaybı konusunda uyaran kırmızı onay modalı.
 */

'use client';

import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleAction = async () => {
    setIsDeleting(true);
    // Gerçek silme işlemi onConfirm içinde parent bileşende yapılacak
    await onConfirm();
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-[120000] bg-red-950/20 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      
      <div className="w-full max-w-sm bg-white rounded-[3.5rem] shadow-[0_40px_100px_rgba(220,38,38,0.2)] border border-red-100 p-8 flex flex-col items-center relative overflow-hidden animate-in zoom-in duration-300">
        
        {/* Kapat Butonu */}
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors">
          <X size={24} />
        </button>

        {/* Uyarı İkonu */}
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-600 mb-6 relative">
           <div className="absolute inset-0 bg-red-500/20 rounded-[2rem] animate-ping opacity-20"></div>
           <AlertTriangle size={40} strokeWidth={2} className="relative z-10" />
        </div>

        {/* Metin */}
        <div className="text-center space-y-3 mb-8">
           <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Hesabı Sil?</h3>
           <p className="text-[11px] text-slate-500 font-bold uppercase leading-relaxed tracking-tight px-4">
             Bu işlem geri alınamaz. Tüm verileriniz, geçmişiniz ve profil bilgileriniz **kalıcı olarak** imha edilecektir.
           </p>
        </div>

        {/* Butonlar */}
        <div className="w-full space-y-3">
          <button 
            onClick={handleAction}
            disabled={isDeleting}
            className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <><Trash2 size={16} /> Kalıcı Olarak Sil</>}
          </button>
          
          <button 
            onClick={onClose}
            className="w-full py-5 bg-slate-100 text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
          >
            Vazgeç
          </button>
        </div>

        {/* Alt Bilgi */}
        <p className="mt-8 text-[8px] text-slate-300 font-black uppercase tracking-widest italic">
           Transport Security Policy 2026
        </p>

      </div>
    </div>
  );
}