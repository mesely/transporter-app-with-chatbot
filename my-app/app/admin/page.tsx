/**
 * @file app/admin/page.tsx
 * @description Transport 245 Yönetim Merkezi.
 * GÜNCELLEME: Marka adı Transport 245 olarak revize edildi.
 * GÜNCELLEME: Tasarım dili (blur, yuvarlak hatlar) diğer sayfalarla eşitlendi.
 */

'use client';

import { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import TariffModule from '../../components/admin/modules/TariffModule';
import ProviderModule from '../../components/admin/modules/ProviderModule';
import ComplaintModule from '../../components/admin/modules/ComplaintModule';
import { Lock, UserCircle, Settings, ShieldCheck } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('providers');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'harun245') {
      setIsAuthenticated(true);
    } else {
      alert('Güvenlik Duvarı: Hatalı Şifre!');
    }
  };

  // --- GİRİŞ EKRANI (Transport 245 Temalı) ---
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-[#f1f5f9] flex items-center justify-center p-6 z-[9999]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]"></div>
        </div>
        <div className="w-full max-w-sm bg-white/70 backdrop-blur-3xl rounded-[3.5rem] shadow-2xl p-12 border border-white relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-900 text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-black/10">
            <Lock size={30} strokeWidth={1.5} />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Transport 245</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Yönetici Paneli</p>
          </div>
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <input 
              type="password" placeholder="Erişim Şifresi" autoFocus value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-center font-black text-lg outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner text-gray-900"
            />
            <button className="w-full bg-gray-900 text-white py-4 rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.25em] active:scale-95 transition-all shadow-lg shadow-black/20">
              Sisteme Bağlan
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- ANA PANEL EKRANI ---
  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <AdminSidebar 
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} onTabChange={setActiveTab} 
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/40 backdrop-blur-md border-b border-gray-200 px-8 flex items-center justify-between shrink-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-5 h-0.5 bg-gray-900 mb-1 rounded-full"></div>
            <div className="w-3 h-0.5 bg-gray-900 rounded-full"></div>
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
             <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Merkezi Yönetim</p>
                <p className="text-xs font-black text-gray-900 uppercase mt-1">Transport 245 v2.0</p>
             </div>
             <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 relative shadow-sm">
                <UserCircle size={24} />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
             </div>
             <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600 transition-all active:scale-90"><Settings size={18} /></button>
          </div>
        </header>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar overscroll-contain">
          <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8 flex items-center gap-3">
               <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
               <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">
                  {activeTab === 'tariffs' && 'Tarife Yönetimi'}
                  {activeTab === 'providers' && 'Sürücü Veritabanı'}
                  {activeTab === 'complaints' && 'Şikayet Merkezi'}
               </h2>
            </div>

            {activeTab === 'tariffs' && <TariffModule />}
            {activeTab === 'providers' && <ProviderModule />}
            {activeTab === 'complaints' && <ComplaintModule />}
          </div>
        </div>

        {/* Footer Bilgi */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-20 select-none pointer-events-none">
           <ShieldCheck size={12} />
           <span className="text-[8px] font-black uppercase tracking-[0.3em]">Güvenli Erişim Modu: Transport 245</span>
        </div>
      </main>
    </div>
  );
}