import React, { useRef } from 'react';
import { Check, Loader2, Sparkles, Upload, Trash2 } from 'lucide-react';

const GarmentPicker = ({
  garments,
  garmentsLoading,
  garmentsError,
  selectedGarment,
  onSelectGarment,
  onUploadGarment,
  uploadingGarment,
  onDeleteGarment,
  deletingGarmentId,
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
    <section className="rounded-[2rem] border border-white bg-white/95 p-4 shadow-lg shadow-slate-200/50">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rose-500">Wardrobe</p>
          <h2 className="mt-1 font-display text-lg font-bold text-slate-900">Garment Picker</h2>
        </div>
        <div className="rounded-full bg-rose-50 p-2.5 text-rose-500">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      <p className="mb-3 text-xs leading-5 text-slate-500">
        Use a catalog garment or upload your own dress image. Uploaded garments are analyzed, cropped, and added back into this list automatically.
      </p>

      <div className="mb-3 rounded-[1.25rem] border border-dashed border-rose-200 bg-rose-50/70 p-3">
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
          className="flex w-full items-center justify-center gap-2 rounded-[1rem] bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm shadow-rose-100/70 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {uploadingGarment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploadingGarment ? 'Analyzing garment...' : 'Upload garment photo'}
        </button>

        <p className="mt-2 text-[10px] leading-tight text-slate-500">
          Best results come from a single dress or top on a light or transparent background.
        </p>
      </div>

      {garmentsError && (
        <div className="mb-3 rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {garmentsError}
        </div>
      )}

      {garmentsLoading && garments.length === 0 && (
        <div className="rounded-[1rem] border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
          Loading garments...
        </div>
      )}

      {!garmentsLoading && garments.length === 0 && !garmentsError && (
        <div className="rounded-[1rem] border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
          No garments are available right now.
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {garments.map((garment) => {
          const isSelected = selectedGarment?.id === garment.id;
          const sourceLabel = garment.source === 'upload' ? 'Uploaded' : 'Catalog';

          return (
            <button
              key={garment.id}
              type="button"
              onClick={() => onSelectGarment(isSelected ? null : garment)}
              className={`group overflow-hidden rounded-[1rem] border text-left transition-all duration-200 relative ${isSelected
                ? 'border-rose-300 bg-rose-50 shadow-sm shadow-rose-100'
                : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-sm hover:shadow-slate-200/50'
                }`}
            >
              {garment.source === 'upload' && onDeleteGarment && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteGarment(garment.id);
                  }}
                  disabled={deletingGarmentId === garment.id}
                  className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-slate-400 opacity-0 shadow-sm backdrop-blur-sm transition-all hover:bg-rose-100 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100 disabled:opacity-50"
                  title="Delete garment"
                >
                  {deletingGarmentId === garment.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              )}

              <div className="flex items-center gap-3 p-2.5">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[0.75rem] bg-slate-50 p-2">
                  <img
                    src={garment.previewUrl}
                    alt={garment.name}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`rounded-full px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-[0.18em] ${garment.source === 'upload'
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-slate-100 text-slate-600'
                      }`}>
                      {sourceLabel}
                    </span>
                  </div>
                  <p className="truncate text-xs font-semibold text-slate-900">{garment.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{garment.fit}</p>
                </div>

                {isSelected && <Check className="h-4 w-4 flex-shrink-0 text-rose-500" />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default GarmentPicker;
