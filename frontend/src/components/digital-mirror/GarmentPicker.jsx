import React, { useRef } from 'react';
import { Check, Loader2, Sparkles, Upload } from 'lucide-react';

const GarmentPicker = ({
  garments,
  garmentsLoading,
  garmentsError,
  selectedGarment,
  onSelectGarment,
  onUploadGarment,
  uploadingGarment,
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !onUploadGarment) {
      return;
    }

    try {
      await onUploadGarment(file);
    } finally {
      event.target.value = '';
    }
  };

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
        Use a catalog garment or upload your own dress image. Uploaded garments are analyzed, cropped, and added back into this list automatically.
      </p>

      <div className="mb-5 rounded-[1.5rem] border border-dashed border-rose-200 bg-rose-50/70 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingGarment}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-rose-100/70 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {uploadingGarment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploadingGarment ? 'Analyzing garment...' : 'Upload garment photo'}
        </button>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Best results come from a single dress or top on a light or transparent background.
        </p>
      </div>

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
          const sourceLabel = garment.source === 'upload' ? 'Uploaded' : 'Catalog';

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
                    src={garment.previewUrl}
                    alt={garment.name}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${garment.source === 'upload'
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-slate-100 text-slate-600'
                      }`}>
                      {sourceLabel}
                    </span>
                  </div>
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
