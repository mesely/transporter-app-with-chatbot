'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Purchases, PurchasesStoreProduct } from '@revenuecat/purchases-capacitor';

const PRODUCT_ID = 'com.mesely.transporter.premium.yearly';
const RC_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY || '';
const RC_ENTITLEMENT_ID = process.env.NEXT_PUBLIC_REVENUECAT_ENTITLEMENT_ID || '';

function extractActiveSubscription(customerInfo: any) {
  const active = customerInfo?.entitlements?.active || {};
  const values = Object.values(active || {}) as any[];
  if (RC_ENTITLEMENT_ID && active?.[RC_ENTITLEMENT_ID]) return active[RC_ENTITLEMENT_ID];
  if (values.length > 0) return values[0];
  return null;
}

export function useMembershipIap() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [expiresDate, setExpiresDate] = useState<string | null>(null);
  const [priceText, setPriceText] = useState<string>('Yıllık');
  const [errorText, setErrorText] = useState<string | null>(null);
  const configuredOnceRef = useRef(false);

  const isNativeIOS = useMemo(
    () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios',
    []
  );
  const hasPurchasesPlugin = useMemo(
    () => Capacitor.isPluginAvailable('Purchases'),
    []
  );

  const configureIfNeeded = useCallback(async () => {
    if (!isNativeIOS) return false;
    if (!hasPurchasesPlugin) {
      setErrorText('IAP eklentisi iOS buildinde bulunamadı. Xcode tarafında paketleri yeniden çözümleyip tekrar build alın.');
      return false;
    }
    if (!RC_API_KEY) {
      setErrorText('IAP yapılandırması eksik (RevenueCat API key).');
      return false;
    }
    if (configuredOnceRef.current) return true;
    try {
      await Purchases.configure({
        apiKey: RC_API_KEY,
      });
      configuredOnceRef.current = true;
      setIsConfigured(true);
      return true;
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/not implemented/i.test(msg)) {
        setErrorText('IAP eklentisi iOS buildinde aktif değil. `npx cap sync ios` sonrası Xcode paketi yenilenmeli.');
      } else {
        setErrorText(msg || 'IAP yapılandırması başarısız.');
      }
      return false;
    }
  }, [hasPurchasesPlugin, isNativeIOS]);

  const loadProductAndStatus = useCallback(async () => {
    if (!isNativeIOS) return;
    setIsLoading(true);
    setErrorText(null);
    try {
      const ok = await configureIfNeeded();
      if (!ok) return;

      const productRes = await Purchases.getProducts({
        productIdentifiers: [PRODUCT_ID],
      });
      const product: PurchasesStoreProduct | undefined = productRes?.products?.[0];
      if (product) {
        const localized = String(product.priceString || '').trim();
        if (localized) setPriceText(localized);
      }

      const infoRes = await Purchases.getCustomerInfo();
      const activeEntitlement = extractActiveSubscription(infoRes?.customerInfo);
      const activeNow = !!activeEntitlement;
      setIsActive(activeNow);
      const expiry = activeEntitlement?.expirationDate || activeEntitlement?.expiresDate || null;
      setExpiresDate(expiry ? String(expiry) : null);
    } catch (e: any) {
      setErrorText(String(e?.message || 'Abonelik bilgisi alınamadı.'));
    } finally {
      setIsLoading(false);
    }
  }, [configureIfNeeded, isNativeIOS]);

  const purchase = useCallback(async () => {
    if (!isNativeIOS) {
      alert('Satın alma yalnızca iOS uygulamasında kullanılabilir.');
      return;
    }
    setIsLoading(true);
    setErrorText(null);
    try {
      const ok = await configureIfNeeded();
      if (!ok) return;
      const productsRes = await Purchases.getProducts({
        productIdentifiers: [PRODUCT_ID],
      });
      const product = productsRes?.products?.[0];
      if (!product) {
        setErrorText('Abonelik ürünü bulunamadı.');
        return;
      }
      await Purchases.purchaseStoreProduct({ product });
      await loadProductAndStatus();
      alert('Abonelik işlemi tamamlandı.');
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (!/cancel/i.test(msg)) {
        setErrorText(msg || 'Satın alma başarısız.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [configureIfNeeded, isNativeIOS, loadProductAndStatus]);

  const restore = useCallback(async () => {
    if (!isNativeIOS) return;
    setIsLoading(true);
    setErrorText(null);
    try {
      const ok = await configureIfNeeded();
      if (!ok) return;
      await Purchases.restorePurchases();
      await loadProductAndStatus();
      alert('Satın alımlar geri yüklendi.');
    } catch (e: any) {
      setErrorText(String(e?.message || 'Geri yükleme başarısız.'));
    } finally {
      setIsLoading(false);
    }
  }, [configureIfNeeded, isNativeIOS, loadProductAndStatus]);

  const openManageSubscriptions = useCallback(() => {
    const url = 'https://apps.apple.com/account/subscriptions';
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }, []);

  useEffect(() => {
    void loadProductAndStatus();
  }, [loadProductAndStatus]);

  return {
    isNativeIOS,
    hasPurchasesPlugin,
    isLoading,
    isConfigured,
    isActive,
    expiresDate,
    priceText,
    errorText,
    purchase,
    restore,
    openManageSubscriptions,
    refresh: loadProductAndStatus,
  };
}
