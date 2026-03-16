import React from 'react';
import { Check, Sparkles } from 'lucide-react';

const GarmentPicker = ({ garments, garmentsLoading, garmentsError, selectedGarment, onSelectGarment }) => {
  return (
    <section className="rounded-[2rem] border border-white bg-white/95 p-6 shadow-lg shadow-slate-200/50">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">Wardrobe</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-slate-900">Garment Picker</h2>
        </div>
        <div className="rounded-full bg-rose-50 p-3 text-rose-500">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <p className="mb-5 text-sm leading-6 text-slate-500">
        Click a garment to try it on. Click the selected garment again if you want a clean camera view.
      </p>

      {garmentsError && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {garmentsError}
        </div>
      )}

      {garmentsLoading && garments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Loading garments...
        </div>
      )}

      {!garmentsLoading && garments.length === 0 && !garmentsError && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          No garments are available right now.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {garments.map((garment) => {
          const isSelected = selectedGarment?.id === garment.id;

          return (
            <button
              key={garment.id}
              type="button"
              onClick={() => onSelectGarment(isSelected ? null : garment)}
              className={`group overflow-hidden rounded-[1.5rem] border text-left transition-all duration-200 ${isSelected
                ? 'border-rose-300 bg-rose-50 shadow-md shadow-rose-100'
                : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md hover:shadow-slate-200/50'
                }`}
            >
              <div className="flex items-center gap-4 p-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 p-3">
                  <img
                    src={garment.image}
                    alt={garment.name}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{garment.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{garment.fit}</p>
                </div>

                {isSelected && <Check className="h-5 w-5 flex-shrink-0 text-rose-500" />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default GarmentPicker;
