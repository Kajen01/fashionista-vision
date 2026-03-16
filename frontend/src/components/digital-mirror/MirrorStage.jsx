import React from 'react';
import { AlertCircle, Camera, Sparkles } from 'lucide-react';
import MirrorStatusBar from './MirrorStatusBar';

const MirrorStage = ({
  videoRef,
  canvasRef,
  isLoading,
  error,
  cameraReady,
  modelReady,
  fps,
  selectedGarment,
  garmentsLoading,
}) => {
  const showLibraryLoading = !isLoading && !error && garmentsLoading && !selectedGarment;
  const showEmptyState = !isLoading && !error && !garmentsLoading && !selectedGarment;

  return (
    <section className="overflow-hidden rounded-[2.5rem] border border-white/80 bg-[#0f0f12] shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/10]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,180,160,0.18),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,0.08),_rgba(15,15,18,0.4))]" />

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 -scale-x-100"
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover -scale-x-100"
        />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(15,15,18,0.12),_rgba(15,15,18,0.28))]" />

        <div className="absolute left-4 right-4 top-4 z-20">
          <MirrorStatusBar
            cameraReady={cameraReady}
            modelReady={modelReady}
            fps={fps}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {selectedGarment && !error && (
          <div className="absolute bottom-4 left-4 z-20 rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
            Garment: {selectedGarment.name}
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/45 px-6 text-center text-white backdrop-blur-sm">
            <div className="mb-5 rounded-full border border-white/20 bg-white/10 p-4">
              <Camera className="h-8 w-8 text-rose-200" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Initializing</p>
            <h2 className="mt-3 font-display text-3xl font-bold">Preparing your digital mirror</h2>
            <p className="mt-3 max-w-md text-sm text-white/70">
              We are starting the webcam and warming up the pose model for the live overlay.
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 px-6 text-center text-white backdrop-blur-sm">
            <div className="mb-5 rounded-full border border-rose-300/40 bg-rose-500/15 p-4">
              <AlertCircle className="h-8 w-8 text-rose-200" />
            </div>
            <h2 className="font-display text-3xl font-bold">Mirror unavailable</h2>
            <p className="mt-3 max-w-md text-sm text-white/75">{error}</p>
          </div>
        )}

        {showLibraryLoading && (
          <div className="absolute inset-0 z-10 flex items-end justify-center px-6 pb-8 text-center">
            <div className="max-w-md rounded-[1.75rem] border border-white/15 bg-black/45 px-6 py-5 text-white backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">Garment Library</p>
              <p className="mt-2 text-sm text-white/75">Loading garments so the overlay is ready as soon as the mirror starts.</p>
            </div>
          </div>
        )}

        {showEmptyState && (
          <div className="absolute inset-0 z-10 flex items-end justify-center px-6 pb-8 text-center">
            <div className="max-w-md rounded-[1.75rem] border border-white/15 bg-black/45 px-6 py-5 text-white backdrop-blur-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Sparkles className="h-6 w-6 text-rose-200" />
              </div>
              <p className="text-lg font-semibold">Choose a garment to begin</p>
              <p className="mt-2 text-sm text-white/75">
                The live mirror is running. Pick an item from the sidebar to see the overlay and fine-tune its fit.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MirrorStage;
