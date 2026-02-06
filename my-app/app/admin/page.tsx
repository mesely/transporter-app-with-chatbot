'use client';

import { useState, useEffect } from 'react';
import { Menu, Lock } from 'lucide-react';
// Eğer bu bileşenler yoksa hata verir, oluşturman gerekebilir. 
// Yoksa şimdilik yorum satırına alabilirsin.
import AdminSidebar from '../../components/admin/AdminSidebar';
import TariffModule from '../../components/admin/modules/TariffModule';
import ProviderModule from '../../components/admin/modules/ProviderModule';
import ComplaintModule from '../../components/admin/modules/ComplaintModule';

export default function AdminPage() {
  // --- GÜVENLİK ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // --- SAYFA DURUMU ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tariffs');

  // Sayfa yüklendiğinde oturum kontrolü (İsteğe bağlı localStorage eklenebilir)
  useEffect(() => {
    setLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Şifre kontrolü: Çevre değişkeni yoksa varsayılan olarak 'harun245' kabul et
    const secretPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'harun245';

    if (passwordInput === secretPass) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Hatalı şifre! Tekrar dene.');
    }
  };

  // --- GİRİŞ EKRANI (Login) ---
  if (!isAuthenticated) {
    if (loading) return null; // Yüklenirken beyaz ekran
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
          <div className="mx-auto bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-gray-800" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">YÖNETİCİ PANELİ</h2>
          <p className="text-gray-500 text-sm mb-6">Devam etmek için şifreyi girin</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Şifre" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-2 focus:ring-gray-200 outline-none transition-all text-gray-800 font-bold text-center"
            />
            {error && <p className="text-red-600 text-sm font-bold animate-pulse bg-red-50 p-2 rounded">{error}</p>}
            <button 
              type="submit" 
              className="w-full bg-black text-white py-3 rounded-lg font-black hover:bg-gray-800 active:scale-95 transition-all shadow-lg"
            >
              GİRİŞ YAP
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- YÖNETİCİ PANELİ İÇERİĞİ ---
  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans text-gray-900 overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-200 transition-all active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-gray-900 font-black text-xl tracking-tight hidden sm:block">TRANSPORTER <span className="text-blue-600">ADMIN</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900">Süper Admin</p>
            <button onClick={() => setIsAuthenticated(false)} className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer">ÇIKIŞ YAP</button>
          </div>
          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
            AD
          </div>
        </div>
      </div>

      {/* İÇERİK - SCROLLABLE ALAN */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full custom-scrollbar">
        <div className="max-w-7xl mx-auto pb-20">
          
          {/* Sekme İçerikleri */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[500px]">
            {activeTab === 'tariffs' && <TariffModule />}
            {activeTab === 'providers' && <ProviderModule />}
            {activeTab === 'complaints' && <ComplaintModule />}
          </div>

        </div>
      </div>

      {/* SIDEBAR BİLEŞENİ */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
}