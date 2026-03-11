/**
 * landmarkSmoother.js — Dedicated EMA landmark smoothing module
 *
 * Provides per-landmark exponential moving average smoothing with
 * configurable alpha per landmark group.
 */

const DEFAULT_ALPHA = {
    shoulders: 0.42,   // indices 11, 12
    hips: 0.38,        // indices 23, 24
    arms: 0.35,        // indices 13, 14, 15, 16
    head: 0.30,        // index 0 (nose)
    default: 0.35,
};

const GROUP_MAP = {
    0: 'head',
    11: 'shoulders', 12: 'shoulders',
    13: 'arms', 14: 'arms', 15: 'arms', 16: 'arms',
    23: 'hips', 24: 'hips',
};

function getAlpha(index, alphaConfig) {
    const group = GROUP_MAP[index] || 'default';
    return alphaConfig[group] ?? alphaConfig.default ?? 0.35;
}

function lerpValue(prev, next, alpha) {
    if (prev === null || prev === undefined || isNaN(prev)) return next;
    return alpha * next + (1 - alpha) * prev;
}

export class LandmarkSmoother {
    /**
     * @param {Object} [alphaConfig] — override per-group alpha values
     */
    constructor(alphaConfig) {
        this.alpha = { ...DEFAULT_ALPHA, ...alphaConfig };
        this.prev = {};
    }

    /**
     * Smooth a set of raw landmarks.
     * @param {Object} rawLandmarks  — { [index]: { x, y, visibility } }
     * @returns {Object} smoothed landmarks in the same shape
     */
    smooth(rawLandmarks) {
        if (!rawLandmarks) return rawLandmarks;

        const result = {};

        for (const key of Object.keys(rawLandmarks)) {
            const index = Number(key);
            const raw = rawLandmarks[index];
            if (!raw) { result[index] = raw; continue; }

            const alpha = getAlpha(index, this.alpha);
            const prev = this.prev[index];

            result[index] = {
                x: lerpValue(prev?.x, raw.x, alpha),
                y: lerpValue(prev?.y, raw.y, alpha),
                visibility: raw.visibility,
            };
        }

        this.prev = { ...this.prev, ...result };
        return result;
    }

    /** Clear all smoothed state (call on garment switch or mode change) */
    reset() {
        this.prev = {};
    }
}

export default LandmarkSmoother;
