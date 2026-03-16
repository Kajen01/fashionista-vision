import React from 'react';
import { AlertCircle, Camera, Loader2, Sparkles, Zap } from 'lucide-react';

const TONE_STYLES = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
};

const StatusChip = ({ icon: Icon, tone = 'slate', children, spinning = false }) => (
  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${TONE_STYLES[tone]}`}>
    <Icon className={`h-3.5 w-3.5 ${spinning ? 'animate-spin' : ''}`} />
    <span>{children}</span>
  </div>
);

const MirrorStatusBar = ({ cameraReady, modelReady, fps, isLoading, error }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {isLoading && (
        <StatusChip icon={Loader2} tone="amber" spinning>
          Starting mirror
        </StatusChip>
      )}

      <StatusChip icon={Camera} tone={cameraReady ? 'emerald' : 'slate'}>
        {cameraReady ? 'Camera ready' : 'Camera standby'}
      </StatusChip>

      <StatusChip icon={Sparkles} tone={modelReady ? 'emerald' : 'slate'}>
        {modelReady ? 'Pose model ready' : 'Pose model loading'}
      </StatusChip>

      <StatusChip icon={Zap} tone={fps > 0 ? 'sky' : 'slate'}>
        {fps > 0 ? `${fps} FPS` : 'FPS waiting'}
      </StatusChip>

      {error && (
        <StatusChip icon={AlertCircle} tone="rose">
          {error}
        </StatusChip>
      )}
    </div>
  );
};

export default MirrorStatusBar;
