/**
 * @file page.tsx
 * @description Transport 245 Master Orchestrator
 * FIX: Sidebar açıkken Map tamamen unmount ediliyor → WKWebView crash engellendi.
 * FIX: grayscale/pointer-events-none CSS filtreleri kaldırıldı → GPU composite layer baskısı sıfırlandı.
 * FIX: capacitor.config.ts'de limitsiz allowNavigation wildcard kaldırıldı.
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Truck } from 'lucide-react';

import TopBar from '../components/home/TopBar';
import ActionPanel from '../components/home/ActionPanel';
import Sidebar from '../components/home/Sidebar';

import ProfileModal from '../components/ProfileModal';
import SettingsModal from '../components/SettingsModal';
import UserAgreementModal from '../components/UserAgreementModal';
import KVKKModal from '../components/KVKKModal';

// Haritayı dinamik yüklüyoruz
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-50" />,
});

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

const CATEGORY_MAP: Record<string, string[]> = {
  tir: ['tenteli', 'frigorifik', 'lowbed', 'konteyner', 'acik_kasa'],
  kamyon: ['6_teker', '8_teker', '10_teker', '12_teker', 'kirkayak'],
  kamyonet: ['panelvan', 'acik_kasa', 'kapali_kasa'],
  yolcu: ['minibus', 'otobus', 'midibus', 'vip_tasima'],
};

function ScanningLoader({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setProgress((old) => (old >= 100 ? 100 : old + 2)),
      30
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) onFinish();
  }, [progress, onFinish]);

  return (
    <div className="fixed inset-0 w-full h-full z-[99999] bg-white flex flex-col items-center justify-center p-10 text-center">
      <div className="bg-gray-50 p-8 rounded-[2.5rem] mb-8 border border-gray-100 shadow-sm">
        <Truck size={40} className="text-blue-600" />
      </div>
      <h2 className="text-xl font-black uppercase text-gray-900 tracking-tighter italic">
        Transport 245
      </h2>
      <div className="w-48 h-1 bg-gray-100 rounded-full mt-6 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [showKVKK, setShowKVKK] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [actionType, setActionType] = useState('kurtarici');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // 🔥 KRİTİK: Sidebar kapanırken haritanın hemen render edilmesini engelle
  // Önce sidebar kapanır, 300ms sonra harita geri gelir → bellek spike'ı önlenir
  const [mapVisible, setMapVisible] = useState(true);

  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    console.log(
      `[Transport 245] Render: ${renderCount.current}, Sidebar: ${sidebarOpen}`
    );
  });

  // Sidebar açılırken haritayı unmount et
  useEffect(() => {
    if (sidebarOpen) {
      setMapVisible(false);
      setActiveDriverId(null);
    } else {
      // Sidebar kapandıktan 300ms sonra haritayı geri getir
      const t = setTimeout(() => setMapVisible(true), 300);
      return () => clearTimeout(t);
    }
  }, [sidebarOpen]);

  const fetchDrivers = useCallback(
    async (lat: number, lng: number, type: string) => {
      setLoading(true);
      try {
        let url = `${API_URL}/users/nearby?lat=${lat}&lng=${lng}&type=${type}&zoom=9`;
        if (type === 'seyyar_sarj') url = `${API_URL}/users/all?type=seyyar_sarj`;
        const res = await fetch(url);
        const data = await res.json();
        setDrivers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Fetch Error:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!searchCoords) fetchDrivers(39.9334, 32.8597, 'kurtarici');
  }, [fetchDrivers, searchCoords]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const s = d.service;
      if (!s) return false;
      let matchesType = false;
      if (actionType === 'seyyar_sarj') matchesType = s.subType === 'seyyar_sarj';
      else if (actionType === 'kurtarici') matchesType = s.mainType === 'KURTARICI';
      else if (actionType === 'nakliye') matchesType = s.mainType === 'NAKLIYE';
      else if (actionType === 'yolcu') matchesType = s.mainType === 'YOLCU';
      else if (CATEGORY_MAP[actionType]) {
        matchesType =
          s.subType === actionType ||
          CATEGORY_MAP[actionType].includes(s.subType);
      } else matchesType = s.subType === actionType;

      if (!matchesType) return false;
      if (activeTags.length > 0)
        return activeTags.some((tag) => (s.tags || []).includes(tag));
      return true;
    });
  }, [drivers, actionType, activeTags]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white">
      {showLoader && <ScanningLoader onFinish={() => setShowLoader(false)} />}

      <TopBar
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(true)}
        onProfileClick={() => setShowProfile(true)}
      />

      {/*
        🔥 KRİTİK DEĞİŞİKLİK:
        ❌ ESKİ: sidebarOpen ? 'pointer-events-none grayscale-[0.5]' : ''
           Bu CSS filtreleri WKWebView'da yeni GPU composite layer açıyordu → CRASH

        ✅ YENİ: Sidebar açıkken Map tamamen DOM'dan kaldırılıyor (mapVisible=false)
           Böylece harita GPU kaynakları serbest bırakılıyor.
      */}
      <div className="absolute inset-0 z-0">
        {mapVisible && (
          <Map
            searchCoords={searchCoords}
            drivers={filteredDrivers}
            activeDriverId={activeDriverId}
            onSelectDriver={setActiveDriverId}
            onMapClick={() => setActiveDriverId(null)}
            onStartOrder={() => {}}
          />
        )}
      </div>

      <ActionPanel
        onSearchLocation={(lat, lng) => {
          setSearchCoords([lat, lng]);
          fetchDrivers(lat, lng, actionType);
          setSidebarOpen(false);
        }}
        onFilterApply={(type) => {
          setActionType(type);
          setActiveTags([]);
          const lat = searchCoords ? searchCoords[0] : 39.9;
          const lng = searchCoords ? searchCoords[1] : 32.8;
          fetchDrivers(lat, lng, type);
        }}
        actionType={actionType}
        onActionChange={setActionType}
        activeTags={activeTags}
        onTagsChange={setActiveTags}
        drivers={filteredDrivers}
        loading={loading}
        activeDriverId={activeDriverId}
        onSelectDriver={setActiveDriverId}
        onStartOrder={() => {}}
        isSidebarOpen={sidebarOpen}
      />

      {sidebarOpen && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectAction={(type) => {
            setSidebarOpen(false);
            setTimeout(
              () =>
                fetchDrivers(
                  searchCoords?.[0] || 39.9,
                  searchCoords?.[1] || 32.8,
                  type
                ),
              400
            );
          }}
          onOpenProfile={() => {
            setSidebarOpen(false);
            setShowProfile(true);
          }}
          onOpenSettings={() => {
            setSidebarOpen(false);
            setShowSettings(true);
          }}
          onOpenAgreement={() => {
            setSidebarOpen(false);
            setShowAgreement(true);
          }}
          onOpenKVKK={() => {
            setSidebarOpen(false);
            setShowKVKK(true);
          }}
        />
      )}

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <UserAgreementModal
        isOpen={showAgreement}
        onClose={() => setShowAgreement(false)}
        readOnly
      />
      <KVKKModal isOpen={showKVKK} onClose={() => setShowKVKK(false)} readOnly />
    </main>
  );
}