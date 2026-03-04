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

function findAnnualPackage(offeringsRes: any) {
  const current = offeringsRes?.all?.current || offeringsRes?.current || null;
  const availablePackages = Array.isArray(current?.availablePackages) ? current.availablePackages : [];
  if (availablePackages.length === 0) return null;

  const byProductId = availablePackages.find((p: any) => p?.storeProduct?.identifier === PRODUCT_ID);
  if (byProductId) return byProductId;

  const byAnnualName = availablePackages.find((p: any) =>
    String(p?.identifier || '').toLowerCase().includes('annual') ||
    String(p?.packageType || '').toUpperCase().includes('ANNUAL')
  );
  if (byAnnualName) return byAnnualName;

  return availablePackages[0];
}

function normalizeIapError(error: any) {
  const raw = String(error?.message || error || '').trim();
  const lower = raw.toLowerCase();
  if (lower.includes('wrong api key') || lower.includes('production key')) {
    return 'RevenueCat production Apple API key gerekli. `.env` içinde NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY değerini `appl_...` production key ile güncelle.';
  }
  if (lower.includes('configuration') || lower.includes('underlying error')) {
    return 'IAP yapılandırma hatası var. RevenueCat App (App Store) eşleşmesi, Product ID ve API key ayarlarını kontrol et.';
  }
  if (lower.includes('product') && lower.includes('not found')) {
    return 'Abonelik ürünü bulunamadı. Product ID, Offering ve Entitlement eşleşmesini kontrol et.';
  }
  return raw || 'Abonelik işlemi sırasında hata oluştu.';
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
    if (RC_API_KEY.startsWith('test_')) {
      setErrorText('RevenueCat test API key kullanılıyor. TestFlight/App Review için production Apple key (`appl_...`) girilmelidir.');
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
      console.error('[IAP configure error]', e);
      if (/not implemented/i.test(msg)) {
        setErrorText('IAP eklentisi iOS buildinde aktif değil. `npx cap sync ios` sonrası Xcode paketi yenilenmeli.');
      } else {
        setErrorText(normalizeIapError(e));
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

      const productRes = await Purchases.getProducts({ productIdentifiers: [PRODUCT_ID] });
      const product: PurchasesStoreProduct | undefined = productRes?.products?.[0];
      if (product?.priceString) {
        const localized = String(product.priceString).trim();
        if (localized) setPriceText(localized);
      } else {
        const offeringsRes = await Purchases.getOfferings();
        const annualPackage = findAnnualPackage(offeringsRes);
        const packagePrice = String(annualPackage?.storeProduct?.priceString || '').trim();
        if (packagePrice) setPriceText(packagePrice);
      }

      const infoRes = await Purchases.getCustomerInfo();
      const activeEntitlement = extractActiveSubscription(infoRes?.customerInfo);
      const activeNow = !!activeEntitlement;
      setIsActive(activeNow);
      const expiry = activeEntitlement?.expirationDate || activeEntitlement?.expiresDate || null;
      setExpiresDate(expiry ? String(expiry) : null);
    } catch (e: any) {
      console.error('[IAP loadProductAndStatus error]', e);
      setErrorText(normalizeIapError(e));
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
      const productsRes = await Purchases.getProducts({ productIdentifiers: [PRODUCT_ID] });
      const product = productsRes?.products?.[0];
      if (product) {
        await Purchases.purchaseStoreProduct({ product });
      } else {
        const offeringsRes = await Purchases.getOfferings();
        const annualPackage = findAnnualPackage(offeringsRes);
        if (!annualPackage) {
          setErrorText('Abonelik ürünü bulunamadı. App Store metadata ve RevenueCat offering ayarlarını kontrol edin.');
          return;
        }
        await Purchases.purchasePackage({ aPackage: annualPackage });
      }
      await loadProductAndStatus();
      alert('Abonelik işlemi tamamlandı.');
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (!/cancel/i.test(msg)) {
        console.error('[IAP purchase error]', e);
        setErrorText(normalizeIapError(e));
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
      console.error('[IAP restore error]', e);
      setErrorText(normalizeIapError(e));
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
