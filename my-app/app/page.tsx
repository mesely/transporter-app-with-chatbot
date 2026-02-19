/**
 * @file page.tsx
 * FIX: Sidebar kaldırıldı, yerine Settings butonu eklendi.
 * Settings butonu → /settings sayfasına yönlendiriyor.
 * FIX: Eski gömülü ScanningLoader kaldırıldı, yeni nesil loader import edildi.
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import TopBar from '../components/home/TopBar';
import ActionPanel from '../components/home/ActionPanel';
import ProfileModal from '../components/ProfileModal';

// 🔥 YENİ LOADER'I BURAYA IMPORT EDİYORUZ
// Not: Dosya yolunu (path) kendi proje yapına göre düzenlemeyi unutma!
import ScanningLoader from '../components/ScanningLoader'; 

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

export default function Home() {
  const [showLoader, setShowLoader] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [actionType, setActionType] = useState('kurtarici');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    console.log(`[Transport 245] Render: ${renderCount.current}`);
  });

  // 🔥 YENİ LOADER İÇİN ZAMANLAYICI (7.5 Saniye sonra gizler)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 7500); 
    return () => clearTimeout(timer);
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
      {/* YENİ LOADER ÇAĞRILIYOR */}
      {showLoader && <ScanningLoader />}

      {/* TopBar artık Settings butonu gösteriyor (Sidebar yerine) */}
      <TopBar
        onProfileClick={() => setShowProfile(true)}
      />

      <div className="absolute inset-0 z-0">
        <Map
          searchCoords={searchCoords}
          drivers={filteredDrivers}
          activeDriverId={activeDriverId}
          onSelectDriver={setActiveDriverId}
          onMapClick={() => setActiveDriverId(null)}
          onStartOrder={() => {}}
        />
      </div>

      <ActionPanel
        onSearchLocation={(lat, lng) => {
          setSearchCoords([lat, lng]);
          fetchDrivers(lat, lng, actionType);
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
        isSidebarOpen={false}
      />

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </main>
  );
}