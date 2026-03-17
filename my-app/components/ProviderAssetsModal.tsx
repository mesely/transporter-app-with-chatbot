'use client';

import { X } from 'lucide-react';

type VehicleItem = { name: string; photoUrls: string[] };

interface ProviderAssetsModalProps {
  isOpen: boolean;
  mode: 'vehicles' | 'photos';
  driverName: string;
  vehicleItems: VehicleItem[];
  photoUrls: string[];
  onClose: () => void;
}

export default function ProviderAssetsModal({
  isOpen,
  mode,
  driverName,
  vehicleItems,
  photoUrls,
  onClose,
}: ProviderAssetsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100010] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-black uppercase text-slate-900">{mode === 'vehicles' ? 'Araçlar' : 'Fotoğraflar'}</h3>
            <p className="truncate text-xs font-semibold text-slate-500">{driverName || 'Firma'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[calc(86vh-88px)] overflow-y-auto p-5">
          {mode === 'vehicles' ? (
            vehicleItems.length > 0 ? (
              <div className="space-y-3">
                {vehicleItems.map((vehicle, index) => (
                  <div key={`${vehicle.name || 'vehicle'}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-sm font-black uppercase text-slate-900">{vehicle.name || `Araç ${index + 1}`}</div>
                    {vehicle.photoUrls?.length > 0 && (
                      <div className="mt-2 text-[11px] font-semibold text-slate-500">{vehicle.photoUrls.length} fotoğraf</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm font-semibold text-slate-500">
                Kayıtlı araç bilgisi yok.
              </div>
            )
          ) : photoUrls.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photoUrls.map((url, index) => (
                <a
                  key={`${url}-${index}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                >
                  <img src={url} alt={`Araç fotoğrafı ${index + 1}`} className="h-48 w-full object-cover" loading="lazy" />
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm font-semibold text-slate-500">
              Kayıtlı fotoğraf yok.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
