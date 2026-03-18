'use client';

import { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import TariffModule from '../../components/admin/modules/TariffModule';
import ProviderModule from '../../components/admin/modules/ProviderModule';
import ComplaintModule from '../../components/admin/modules/ComplaintModule';
import { Lock, UserCircle, Settings } from 'lucide-react';

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

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900">
            <Lock size={30} strokeWidth={1.5} />
          </div>
          <div className="mb-8">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Transport 245</p>
            <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">Yönetici Paneli</h1>
          </div>
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <input 
              type="password" placeholder="Erişim Şifresi" autoFocus value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-lg font-black text-slate-900 outline-none"
            />
            <button className="w-full rounded-[1rem] bg-slate-900 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-white">
              Sisteme Bağlan
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <AdminSidebar 
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} onTabChange={setActiveTab} 
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 shrink-0 border-b border-slate-200 bg-white px-8 flex items-center justify-between z-40">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden rounded-xl border border-slate-200 bg-white p-3">
            <div className="w-5 h-0.5 bg-gray-900 mb-1 rounded-full"></div>
            <div className="w-3 h-0.5 bg-gray-900 rounded-full"></div>
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
             <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Merkezi Yönetim</p>
                <p className="text-xs font-black text-slate-900 uppercase mt-1">Transport 245</p>
             </div>
             <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 relative">
                <UserCircle size={24} />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
             </div>
             <button className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500"><Settings size={18} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-white p-6 lg:p-10 custom-scrollbar overscroll-contain">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center gap-3">
               <div className="w-2 h-8 bg-slate-900 rounded-full"></div>
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
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

      </main>
    </div>
  );
}
