import React from 'react';
import { RotateCcw, Eye, Sun, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * UI controls panel for the 3D virtual room.
 * Provides camera presets, lighting options, and zoom controls.
 */
const RoomControls = ({ onCameraPreset, onResetView }) => {
    const cameraPresets = [
        { label: 'Front', icon: '👤', key: 'front' },
        { label: 'Side', icon: '👈', key: 'side' },
        { label: 'Back', icon: '🔙', key: 'back' },
        { label: 'Top', icon: '📐', key: 'top' },
    ];

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-500" />
                View Controls
            </h3>

            {/* Camera Presets */}
            <div className="grid grid-cols-2 gap-2 mb-5">
                {cameraPresets.map((preset) => (
                    <button
                        key={preset.key}
                        onClick={() => onCameraPreset?.(preset.key)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium
              bg-gradient-to-br from-gray-50 to-gray-100 hover:from-rose-50 hover:to-rose-100
              text-gray-700 hover:text-rose-700 transition-all duration-200 border border-gray-200
              hover:border-rose-200 hover:shadow-sm active:scale-95"
                    >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                    </button>
                ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-4" />

            {/* Tips */}
            <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-500 flex items-center gap-2">
                    <ZoomIn className="w-3.5 h-3.5 text-gray-400" />
                    Scroll to zoom in/out
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                    Click + drag to rotate
                </p>
            </div>

            {/* Reset Button */}
            <button
                onClick={onResetView}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
          bg-gradient-to-r from-rose-500 to-pink-500 text-white
          hover:from-rose-600 hover:to-pink-600 transition-all duration-200
          shadow-md hover:shadow-lg active:scale-95"
            >
                <RotateCcw className="w-4 h-4" />
                Reset View
            </button>
        </div>
    );
};

export default RoomControls;
