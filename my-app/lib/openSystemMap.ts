'use client';

import { Capacitor } from '@capacitor/core';

export function openSystemMap(lat: number, lng: number, label = 'Destination') {
  if (typeof window === 'undefined') return;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const safeLabel = encodeURIComponent(label);
  const iosUrl = `maps://?q=${safeLabel}&ll=${lat},${lng}`;
  const androidUrl = `geo:0,0?q=${lat},${lng}(${safeLabel})`;
  const webUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  if (Capacitor.isNativePlatform()) {
    const target = Capacitor.getPlatform() === 'ios' ? iosUrl : androidUrl;
    window.location.href = target;
    return;
  }

  window.open(webUrl, '_blank', 'noopener,noreferrer');
}
