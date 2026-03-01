'use client';

import { Settings, User, X } from 'lucide-react';
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
            <input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Firma veya hizmet ara"
              className="flex-1 bg-transparent text-[12px] font-semibold text-slate-800 outline-none"
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
                  onClick={() => onPickSuggestion(d)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50"
                >
                  <div className="text-[12px] font-black uppercase text-slate-800">{d.businessName}</div>
                  <div className="text-[10px] font-semibold text-slate-500">
                    {(d.address?.city || '')} {(d.address?.district || '')}
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
