/**
 * @file page.tsx
 * FIX v4: İki fazlı sidebar açma sistemi.
 * Faz 1 → Map unmount (mapMounted=false)
 * Faz 2 → 80ms sonra Sidebar mount (sidebarOpen=true)
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
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 100 : p + 2)), 30);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (progress >= 100) onFinish(); }, [progress, onFinish]);

  return (
    <div className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center">
      <div className="bg-gray-50 p-8 rounded-[2.5rem] mb-8 border border-gray-100">
        <Truck size={40} className="text-blue-600" />
      </div>
      <h2 className="text-xl font-black uppercase text-gray-900 tracking-tighter italic">
        Transport 245
      </h2>
      <div className="w-48 h-1 bg-gray-100 rounded-full mt-6 overflow-hidden">
        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapMounted, setMapMounted] = useState(true);

  const [showLoader, setShowLoader] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [showKVKK, setShowKVKK] = useState(false);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [actionType, setActionType] = useState('kurtarici');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    console.log(`[Transport 245] Render: ${renderCount.current}, Sidebar: ${sidebarOpen}`);
  });

  // Faz 1: haritayı kaldır → Faz 2: sidebar'ı aç
  const openSidebar = useCallback(() => {
    setActiveDriverId(null);
    setMapMounted(false);
    setTimeout(() => setSidebarOpen(true), 80);
  }, []);

  // Sidebar kapat → haritayı geri getir
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setTimeout(() => setMapMounted(true), 200);
  }, []);

  const fetchDrivers = useCallback(async (lat: number, lng: number, type: string) => {
    setLoading(true);
    try {
      const url =
        type === 'seyyar_sarj'
          ? `${API_URL}/users/all?type=seyyar_sarj`
          : `${API_URL}/users/nearby?lat=${lat}&lng=${lng}&type=${type}&zoom=9`;
      const res = await fetch(url);
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchCoords) fetchDrivers(39.9334, 32.8597, 'kurtarici');
  }, [fetchDrivers, searchCoords]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const s = d.service;
      if (!s) return false;
      let match = false;
      if (actionType === 'seyyar_sarj')    match = s.subType === 'seyyar_sarj';
      else if (actionType === 'kurtarici') match = s.mainType === 'KURTARICI';
      else if (actionType === 'nakliye')   match = s.mainType === 'NAKLIYE';
      else if (actionType === 'yolcu')     match = s.mainType === 'YOLCU';
      else if (CATEGORY_MAP[actionType])
        match = s.subType === actionType || CATEGORY_MAP[actionType].includes(s.subType);
      else match = s.subType === actionType;
      if (!match) return false;
      if (activeTags.length > 0) return activeTags.some((t) => (s.tags || []).includes(t));
      return true;
    });
  }, [drivers, actionType, activeTags]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white">
      {showLoader && <ScanningLoader onFinish={() => setShowLoader(false)} />}

      <TopBar
        sidebarOpen={sidebarOpen}
        onMenuClick={openSidebar}
        onProfileClick={() => setShowProfile(true)}
      />

      <div className="absolute inset-0 z-0">
        {mapMounted && !sidebarOpen && (
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
          closeSidebar();
        }}
        onFilterApply={(type) => {
          setActionType(type);
          setActiveTags([]);
          fetchDrivers(searchCoords?.[0] ?? 39.9, searchCoords?.[1] ?? 32.8, type);
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
          onClose={closeSidebar}
          onSelectAction={(type) => {
            closeSidebar();
            setTimeout(
              () => fetchDrivers(searchCoords?.[0] ?? 39.9, searchCoords?.[1] ?? 32.8, type),
              300
            );
          }}
          onOpenProfile={() => { closeSidebar(); setShowProfile(true); }}
          onOpenSettings={() => { closeSidebar(); setShowSettings(true); }}
          onOpenAgreement={() => { closeSidebar(); setShowAgreement(true); }}
          onOpenKVKK={() => { closeSidebar(); setShowKVKK(true); }}
        />
      )}

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <UserAgreementModal isOpen={showAgreement} onClose={() => setShowAgreement(false)} readOnly />
      <KVKKModal isOpen={showKVKK} onClose={() => setShowKVKK(false)} readOnly />
    </main>
  );
}