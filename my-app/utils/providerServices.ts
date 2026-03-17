export function normalizeProviderServiceType(value: string) {
  const s = String(value || '').toLocaleLowerCase('tr').trim();
  if (s === 'lastikçi' || s === 'lastik') return 'lastikci';
  if (s === 'istasyon_sarj' || s === 'sarj_istasyonu') return 'istasyon';
  if (s === 'gezici_sarj' || s === 'mobil_unit' || s === 'mobile_unit') return 'seyyar_sarj';
  return s;
}

export function extractProviderServiceTypes(service?: any, legacyServiceType?: string) {
  const tagTypes = (Array.isArray(service?.tags) ? service.tags : [])
    .map((tag: string) => String(tag || '').trim())
    .filter((tag: string) => tag.startsWith('type:'))
    .map((tag: string) => normalizeProviderServiceType(tag.replace(/^type:/, '')))
    .filter(Boolean);

  const primary = [
    normalizeProviderServiceType(String(service?.subType || '')),
    normalizeProviderServiceType(String(legacyServiceType || '')),
  ].filter(Boolean);

  return Array.from(new Set([...tagTypes, ...primary]));
}

export function getProviderPrimaryServiceType(service?: any, legacyServiceType?: string) {
  const types = extractProviderServiceTypes(service, legacyServiceType);
  return types[0] || normalizeProviderServiceType(String(service?.subType || legacyServiceType || ''));
}

export function mapProviderMainType(subType: string) {
  const s = normalizeProviderServiceType(subType);
  if (['oto_kurtarma', 'vinc', 'lastikci'].includes(s)) return 'KURTARICI';
  if (['istasyon', 'seyyar_sarj'].includes(s)) return 'SARJ';
  if (['minibus', 'otobus', 'midibus', 'vip_tasima', 'yolcu_tasima', 'yolcu'].includes(s)) return 'YOLCU';
  if (['yurt_disi_nakliye'].includes(s)) return 'YURT_DISI';
  return 'NAKLIYE';
}

export function providerMatchesActionType(service: any, legacyServiceType: string | undefined, actionType: string) {
  const types = extractProviderServiceTypes(service, legacyServiceType);
  const mainType = String(service?.mainType || '').toLocaleUpperCase('tr');
  const wanted = normalizeProviderServiceType(actionType);

  const hasAny = (tokens: string[]) => {
    const normalizedTokens = tokens.map(normalizeProviderServiceType);
    return types.some((type) => normalizedTokens.includes(type));
  };

  if (wanted === 'seyyar_sarj') return hasAny(['seyyar_sarj']);
  if (wanted === 'sarj') return mainType.includes('SARJ') || hasAny(['istasyon', 'seyyar_sarj']);
  if (wanted === 'kurtarici') return mainType.includes('KURTARICI') || hasAny(['oto_kurtarma', 'vinc', 'lastikci']);
  if (wanted === 'nakliye') return mainType.includes('NAKLIYE') || hasAny(['yurt_disi_nakliye', 'evden_eve', 'tir', 'kamyon', 'kamyonet', 'nakliye']);
  if (wanted === 'yolcu') return mainType.includes('YOLCU') || hasAny(['yolcu_tasima', 'minibus', 'otobus', 'midibus', 'vip_tasima']);

  return types.includes(wanted);
}

export function providerCanShowPrice(driver: any) {
  const tags = Array.isArray(driver?.service?.tags) ? driver.service.tags.map((tag: any) => String(tag || '').trim()) : [];
  return (
    Number(driver?.pricing?.pricePerUnit) > 0 &&
    (
      driver?.isVerified ||
      tags.includes('source:manual') ||
      tags.includes('self_register') ||
      Boolean(String(driver?.taxNumber || '').trim())
    )
  );
}
