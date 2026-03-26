import React from 'react';
import { RefreshCw, Settings2 } from 'lucide-react';

const TOGGLE_ITEMS = [
  {
    key: 'showSkeleton',
    label: 'Skeleton View',
    description: 'Display the tracked body guide on top of the live stage.',
  },
  {
    key: 'showOverlay',
    label: 'Dress Overlay',
    description: 'Show or hide the garment render while keeping the camera running.',
  },
  {
    key: 'smoothMovement',
    label: 'Smooth Movement',
    description: 'Apply an extra pass of UI-side landmark smoothing for steadier motion.',
  },
  {
    key: 'useOcclusion',
    label: 'Smart Occlusion',
    description: 'Keep arm regions in front of the garment when pose tracking allows it.',
  },
];

const SLIDER_ITEMS = [
  {
    key: 'scale',
    label: 'Scale',
    min: 0.8,
    max: 1.6,
    step: 0.05,
    formatValue: (value) => `${value.toFixed(2)}x`,
  },
  {
    key: 'rotation',
    label: 'Rotation',
    min: -45,
    max: 45,
    step: 1,
    formatValue: (value) => `${value}deg`,
  },
  {
    key: 'xOffset',
    label: 'Horizontal Offset',
    min: -120,
    max: 120,
    step: 1,
    formatValue: (value) => `${value}px`,
  },
  {
    key: 'yOffset',
    label: 'Vertical Offset',
    min: -180,
    max: 180,
    step: 1,
    formatValue: (value) => `${value}px`,
  },
];

const MirrorControls = ({ toggles, setToggles, params, setParams, onReset }) => {
  const handleToggle = (key) => {
    setToggles((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleBodyMode = (bodyMode) => {
    setToggles((current) => ({
      ...current,
      bodyMode,
    }));
  };

  const handleParamChange = (key, value) => {
    setParams((current) => ({
      ...current,
      [key]: key === 'scale' ? parseFloat(value) : parseInt(value, 10),
    }));
  };

  return (
    <section className="rounded-[2rem] border border-white bg-white/95 p-4 shadow-lg shadow-slate-200/50">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rose-500">Controls</p>
          <h2 className="mt-1 font-display text-lg font-bold text-slate-900">Mirror Settings</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <p className="mb-4 text-xs leading-5 text-slate-500">
        Tune the live overlay in real time. These controls reuse the same parameter names as the existing Trial Room flow.
      </p>

      <div className="space-y-3">
        {TOGGLE_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleToggle(item.key)}
            className="flex w-full items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-rose-200 hover:bg-rose-50"
          >
            <div className="rounded-[1rem] bg-white p-2.5 text-rose-500 shadow-sm shadow-slate-200/70">
              <Settings2 className="h-3.5 w-3.5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900">{item.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">{item.description}</p>
            </div>

            <div className={`flex h-6 w-10 items-center rounded-full px-1 transition-colors ${toggles[item.key] ? 'bg-rose-500' : 'bg-slate-300'}`}>
              <div className={`h-4 w-4 rounded-full bg-white transition-transform ${toggles[item.key] ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Body Mode</p>
          <span className="text-[10px] font-medium text-slate-500">{toggles.bodyMode === 'full' ? 'Full body skeleton' : 'Upper body skeleton'}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {['full', 'half'].map((mode) => {
            const isActive = toggles.bodyMode === mode;

            return (
              <button
                key={mode}
                type="button"
                onClick={() => handleBodyMode(mode)}
                className={`rounded-[1.25rem] px-3 py-2 text-xs font-semibold capitalize transition ${isActive
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-300/50'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-600'
                  }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {SLIDER_ITEMS.map((item) => (
          <div key={item.key} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-900" htmlFor={`mirror-${item.key}`}>
                {item.label}
              </label>
              <span className="text-[11px] font-semibold text-rose-500">{item.formatValue(params[item.key])}</span>
            </div>

            <input
              id={`mirror-${item.key}`}
              type="range"
              min={item.min}
              max={item.max}
              step={item.step}
              value={params[item.key]}
              onChange={(event) => handleParamChange(item.key, event.target.value)}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-300 accent-rose-500"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default MirrorControls;
