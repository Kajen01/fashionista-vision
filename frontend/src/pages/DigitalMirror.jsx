import React, { useEffect, useRef, useState } from 'react';
import MirrorSidebar from '../components/digital-mirror/MirrorSidebar';
import MirrorStage from '../components/digital-mirror/MirrorStage';
import { RefreshCw } from 'lucide-react';
import { useDigitalMirror } from '../hooks/useDigitalMirror';
import { useGarmentLibrary } from '../hooks/useGarmentLibrary';
import {
  DEFAULT_MIRROR_PARAMS,
  DEFAULT_MIRROR_TOGGLES,
} from '../lib/digital-mirror/mirrorDefaults';

const DigitalMirror = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const didAutoSelectRef = useRef(false);

  const [selectedGarment, setSelectedGarment] = useState(null);
  const [toggles, setToggles] = useState(() => ({ ...DEFAULT_MIRROR_TOGGLES }));
  const [params, setParams] = useState(() => ({ ...DEFAULT_MIRROR_PARAMS }));

  const {
    garments,
    garmentImages,
    garmentsLoading,
    garmentsError,
  } = useGarmentLibrary();

  const {
    isLoading,
    cameraReady,
    modelReady,
    fps,
    error,
  } = useDigitalMirror({
    videoRef,
    canvasRef,
    selectedGarment,
    garmentImages,
    toggles,
    params,
  });

  useEffect(() => {
    if (!didAutoSelectRef.current && garments.length > 0) {
      setSelectedGarment(garments[0]);
      didAutoSelectRef.current = true;
    }
  }, [garments]);

  const handleReset = () => {
    setToggles({ ...DEFAULT_MIRROR_TOGGLES });
    setParams({ ...DEFAULT_MIRROR_PARAMS });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffaf8_0%,_#ffffff_45%,_#f8fafc_100%)] pb-12 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">Live Styling Studio</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              See the fit settle in real time
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-500 sm:text-lg">
              Keep the camera view in focus while you switch garments, fine-tune placement, and compare how each look sits across the shoulders and torso.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <div className="rounded-[1.5rem] border border-rose-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm shadow-rose-100/60">
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Body Mode</span>
              <span className="mt-1 block font-semibold capitalize text-slate-900">{toggles.bodyMode}</span>
            </div>
            <div className="rounded-[1.5rem] border border-rose-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm shadow-rose-100/60">
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Garment</span>
              <span className="mt-1 block font-semibold text-slate-900">{selectedGarment?.name || 'None selected'}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="rounded-[1.5rem] border border-rose-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm shadow-rose-100/60 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95"
              title="Refresh page"
            >
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">
                System
              </span>

              <span className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </span>
            </button>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-8">
            <MirrorStage
              videoRef={videoRef}
              canvasRef={canvasRef}
              isLoading={isLoading}
              error={error}
              cameraReady={cameraReady}
              modelReady={modelReady}
              fps={fps}
              selectedGarment={selectedGarment}
              garmentsLoading={garmentsLoading}
            />
          </div>

          <div className="lg:col-span-4">
            <MirrorSidebar
              garments={garments}
              garmentsLoading={garmentsLoading}
              garmentsError={garmentsError}
              selectedGarment={selectedGarment}
              onSelectGarment={setSelectedGarment}
              toggles={toggles}
              setToggles={setToggles}
              params={params}
              setParams={setParams}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalMirror;
