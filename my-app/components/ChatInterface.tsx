/**
 * @file ChatInterface.tsx
 * @description Transporter AI - Bakım ve Geliştirme Modu.
 * Bu sayfa geçici olarak kullanıma kapatılmıştır.
 */

'use client';

import React from 'react';
import { Bot, X, Construction, Clock, BookMarked, Lock } from 'lucide-react';

export default function ChatInterface({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[#f8fdfe] overflow-hidden relative font-sans">
      
      {/* ARKA PLAN DEKORASYONU */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-cyan-400 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[5%] left-[-15%] w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px]"></div>
      </div>

      {/* HEADER */}
      <div className="bg-indigo-950 px-6 py-6 flex justify-between items-center z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500 p-2 rounded-xl shadow-lg shadow-cyan-500/30">
            <Bot className="text-white w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-black text-xs uppercase italic tracking-tighter leading-none">Transporter AI</h3>
            <p className="text-cyan-400 text-[9px] font-bold uppercase mt-1 tracking-widest">Geliştirme Aşamasında</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white p-2 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {/* ANA İÇERİK */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
        <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 mb-6 shadow-2xl shadow-indigo-100 animate-bounce">
          <Construction size={48} strokeWidth={1.5} />
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-tight">
          Sistemi Daha İyi <br /> Hale Getiriyoruz
        </h2>
        
        <p className="text-slate-400 text-sm font-bold mt-4 max-w-[280px] leading-relaxed uppercase">
          Chat arayüzümüz ve akıllı lojistik motorumuz kısa bir süreliğine bakıma alınmıştır.
        </p>

        <div className="mt-8 flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-full shadow-lg">
          <Clock size={16} className="text-cyan-600" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Tahmini Dönüş: Çok Yakında
          </span>
        </div>

        {/* NOTLAR BÖLÜMÜ (PASİF) */}
        <div className="mt-12 w-full max-w-xs opacity-60">
          <div className="flex items-center gap-2 mb-3 px-2">
            <BookMarked size={16} className="text-slate-400" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hızlı Notlar</h4>
          </div>
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3">
            <Lock size={20} className="text-slate-300" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight text-center leading-relaxed">
              Notlar ve kayıtlı aramalar özelliği <br /> 
              <span className="text-indigo-600 italic">yakında kullanıma açılacaktır.</span>
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER BİLGİ */}
      <div className="p-8 text-center z-10">
        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">
          Transporter AI © 2026 • Güvenli Lojistik Ağı
        </p>
      </div>
    </div>
  );
}