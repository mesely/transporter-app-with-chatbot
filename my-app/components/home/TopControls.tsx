'use client';

import { Bus, CarFront, Circle, Search, Settings, Truck, User, Wrench, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TopControlsProps {
  topOffset: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  suggestions: any[];
  onPickSuggestion: (driver: any) => void;
  onProfileClick: () => void;
}

export default function TopControls({
  topOffset,
  searchQuery,
  onSearchQueryChange,
  suggestions,
  onPickSuggestion,
  onProfileClick,
}: TopControlsProps) {
  const router = useRouter();

  const getServiceType = (driver: any) => {
    const subType = String(driver?.service?.subType || '').toLocaleLowerCase('tr');
    const mainType = String(driver?.service?.mainType || '').toLocaleLowerCase('tr');
    const merged = `${subType} ${mainType}`;

    if (subType === 'vinc' || merged.includes('vinc')) return 'vinc';
    if (subType === 'lastik' || merged.includes('lastik')) return 'lastik';
    if (
      subType === 'seyyar_sarj' ||
      subType === 'istasyon' ||
      merged.includes('sarj') ||
      merged.includes('istasyon') ||
      merged.includes('seyyar_sarj')
    ) return 'sarj';
    if (
      subType === 'nakliye' ||
      subType === 'tir' ||
      subType === 'kamyon' ||
      subType === 'kamyonet' ||
      subType === 'yurt_disi_nakliye' ||
      subType === 'evden_eve' ||
      merged.includes('nakliye') ||
      merged.includes('tir') ||
      merged.includes('kamyon') ||
      merged.includes('evden_eve')
    ) return 'nakliye';
    if (
      subType === 'yolcu' ||
      subType === 'minibus' ||
      subType === 'otobus' ||
      subType === 'midibus' ||
      subType === 'vip_tasima' ||
      merged.includes('yolcu') ||
      merged.includes('otobus') ||
      merged.includes('minibus') ||
      merged.includes('vip')
    ) return 'yolcu';
    if (subType === 'oto_kurtarma' || merged.includes('kurtar')) return 'kurtarici';
    return 'kurtarici';
  };

  const renderSuggestionIcon = (driver: any) => {
    const type = getServiceType(driver);
    if (type === 'vinc') return <Wrench className="h-4 w-4 text-red-700" />;
    if (type === 'lastik') return <Circle className="h-4 w-4 text-rose-700" />;
    if (type === 'sarj') return <Zap className="h-4 w-4 text-cyan-700" />;
    if (type === 'nakliye') return <Truck className="h-4 w-4 text-indigo-700" />;
    if (type === 'yolcu') return <Bus className="h-4 w-4 text-emerald-700" />;
    return <CarFront className="h-4 w-4 text-red-700" />;
  };

  return (
    <div className="absolute left-0 right-0 z-[500] pointer-events-auto" style={{ top: topOffset }}>
      <div className="mx-auto w-full px-2 md:px-3">
        <div className="grid grid-cols-[1fr_minmax(220px,760px)_1fr] items-center gap-2">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => router.push('/settings')}
              className="h-10 w-10 rounded-xl border border-gray-100 bg-white text-gray-800 shadow-md flex items-center justify-center"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>

          <div className="relative">
          <div className="h-10 rounded-xl border border-gray-100 bg-white/95 shadow-md backdrop-blur-md px-2.5 flex items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Firma veya hizmet ara"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="search"
              className="flex-1 bg-transparent text-base font-semibold text-slate-800 outline-none"
            />
            {searchQuery && (
              <button onClick={() => onSearchQueryChange('')} className="rounded-lg p-1 text-slate-500">
                <X size={15} />
              </button>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg">
              {suggestions.map((d) => (
                <button
                  key={d._id}
                  type="button"
                  onTouchStart={() => onPickSuggestion(d)}
                  onClick={() => onPickSuggestion(d)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 active:bg-slate-100"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">{renderSuggestionIcon(d)}</div>
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-black uppercase text-slate-800">{d.businessName}</div>
                      <div className="text-[10px] font-semibold text-slate-500">
                        {(d.address?.city || '')} {(d.address?.district || '')}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onProfileClick}
              className="h-10 w-10 rounded-xl border border-gray-100 bg-white text-gray-800 shadow-md flex items-center justify-center"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
