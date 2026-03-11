/**
 * poseMath.js — Torso quad extraction + confidence-based fallback
 *
 * Landmarks used:
 *   11 = left shoulder, 12 = right shoulder
 *   13 = left elbow, 14 = right elbow
 *   15 = left wrist, 16 = right wrist
 *   23 = left hip, 24 = right hip
 */

// ── helpers ──────────────────────────────────────────────────────────

export const smoothValue = (prev, curr, factor = 0.3) => {
    if (prev === null || prev === undefined) return curr;
    return prev * (1 - factor) + curr * factor;
};

export const smoothLandmarks = (prevLandmarks, currLandmarks, factor = 0.5) => {
    if (!prevLandmarks) return currLandmarks;
    return currLandmarks.map((lm, i) => ({
        x: smoothValue(prevLandmarks[i]?.x, lm.x, factor),
        y: smoothValue(prevLandmarks[i]?.y, lm.y, factor),
        z: smoothValue(prevLandmarks[i]?.z, lm.z, factor),
        visibility: lm.visibility,
    }));
};

export const distance = (a, b) =>
    Math.hypot((b.x ?? 0) - (a.x ?? 0), (b.y ?? 0) - (a.y ?? 0));

export const midpoint = (a, b) => ({
    x: ((a.x ?? 0) + (b.x ?? 0)) / 2,
    y: ((a.y ?? 0) + (b.y ?? 0)) / 2,
});

/** Convert a normalised landmark to pixel coords */
export const toPixel = (lm, w, h) => ({
    x: lm.x * w,
    y: lm.y * h,
    visibility: lm.visibility ?? 0,
});

// ── confidence check ────────────────────────────────────────────────

const MIN_SHOULDER_VIS = 0.25;
const MIN_HIP_VIS = 0.20;

/**
 * Returns 'torso' | 'shoulders' | null
 *   torso     — shoulders + hips are reliable → full quad
 *   shoulders — only shoulders are reliable   → affine fallback
 *   null      — pose too weak → hide garment
 */
export const getPoseConfidence = (landmarks) => {
    if (!landmarks) return null;

    const ls = landmarks[11];
    const rs = landmarks[12];
    const lh = landmarks[23];
    const rh = landmarks[24];

    const shouldersOk =
        ls && rs &&
        (ls.visibility ?? 0) >= MIN_SHOULDER_VIS &&
        (rs.visibility ?? 0) >= MIN_SHOULDER_VIS;

    if (!shouldersOk) return null;

    const hipsOk =
        lh && rh &&
        (lh.visibility ?? 0) >= MIN_HIP_VIS &&
        (rh.visibility ?? 0) >= MIN_HIP_VIS;

    return hipsOk ? 'torso' : 'shoulders';
};

// ── torso quad ──────────────────────────────────────────────────────

/**
 * Build a 4-point destination quad from shoulders + hips.
 *
 * @param {Object[]} landmarks  smoothed, pixel-space landmarks
 * @param {Object}   controls   { scale, waistScale, xOffset, yOffset }
 * @param {string}   category   'dress' | 'top' | 'jacket'
 * @returns {{ upperLeft, upperRight, lowerLeft, lowerRight,
 *             shoulderWidth, hipWidth, torsoHeight, angle } | null}
 */
export const computeTorsoQuad = (landmarks, controls = {}, category = 'dress') => {
    const confidence = getPoseConfidence(landmarks);
    if (!confidence) return null;

    const ls = landmarks[11];
    const rs = landmarks[12];

    const scale = controls.scale ?? 1.0;
    const waistScale = controls.waistScale ?? 1.0;
    const xOff = controls.xOffset ?? 0;
    const yOff = controls.yOffset ?? 0;

    const shoulderCenter = midpoint(ls, rs);
    const shoulderWidth = distance(ls, rs);
    const angle = Math.atan2(rs.y - ls.y, rs.x - ls.x);

    // ── full torso path ──
    if (confidence === 'torso') {
        const lh = landmarks[23];
        const rh = landmarks[24];
        const hipCenter = midpoint(lh, rh);
        const hipWidth = distance(lh, rh);
        const torsoHeight = Math.max(60, distance(shoulderCenter, hipCenter));

        const shoulderExpand = shoulderWidth * 0.14 * scale;
        const hipExpand = hipWidth * 0.10 * waistScale * scale;
        const topLift = torsoHeight * 0.08 * scale;

        const dressMultiplier =
            category === 'top' ? 1.20 :
                category === 'jacket' ? 1.45 : 2.10;

        const lowerExtension =
            category === 'top' ? 0 : torsoHeight * Math.max(0.9, dressMultiplier - 1.0);
        const skirtFlare =
            category === 'top' ? 0 : hipWidth * 0.08;

        return {
            upperLeft: { x: ls.x - shoulderExpand + xOff, y: ls.y - topLift + yOff },
            upperRight: { x: rs.x + shoulderExpand + xOff, y: rs.y - topLift + yOff },
            lowerLeft: { x: lh.x - hipExpand - skirtFlare + xOff, y: lh.y + lowerExtension + yOff },
            lowerRight: { x: rh.x + hipExpand + skirtFlare + xOff, y: rh.y + lowerExtension + yOff },
            shoulderWidth,
            hipWidth,
            torsoHeight,
            angle,
            mode: 'torso',
        };
    }

    // ── shoulder-only fallback ──
    const estimatedTorso = shoulderWidth * 1.5;
    const halfW = shoulderWidth * 0.60 * scale;

    return {
        upperLeft: { x: shoulderCenter.x - halfW + xOff, y: shoulderCenter.y - estimatedTorso * 0.08 + yOff },
        upperRight: { x: shoulderCenter.x + halfW + xOff, y: shoulderCenter.y - estimatedTorso * 0.08 + yOff },
        lowerLeft: { x: shoulderCenter.x - halfW * waistScale + xOff, y: shoulderCenter.y + estimatedTorso + yOff },
        lowerRight: { x: shoulderCenter.x + halfW * waistScale + xOff, y: shoulderCenter.y + estimatedTorso + yOff },
        shoulderWidth,
        hipWidth: shoulderWidth * 0.95,
        torsoHeight: estimatedTorso,
        angle,
        mode: 'shoulders',
    };
};
