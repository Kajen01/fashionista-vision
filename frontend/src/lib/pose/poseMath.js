/**
 * EMA (Exponential Moving Average) Smoothing for landmarks and transforms
 */
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
        visibility: lm.visibility
    }));
};

/**
 * 3D-Aware Fitting Math
 */
export const computeTransform = (landmarks, garment, canvasWidth, canvasHeight) => {
    const ls = landmarks[11]; // Left Shoulder
    const rs = landmarks[12]; // Right Shoulder
    const lh = landmarks[23]; // Left Hip
    const rh = landmarks[24]; // Right Hip

    if (!ls || !rs || ls.visibility < 0.2 || rs.visibility < 0.2) return null;

    // 1. Center & Orientation
    const midX = (ls.x + rs.x) / 2;
    const midY = (ls.y + rs.y) / 2;

    // 2. Yaw (Perspective) Proxy
    const dz = ls.z - rs.z;
    const dx = ls.x - rs.x;
    const yawAngle = Math.atan2(dz, Math.abs(dx));
    const perspectiveFactor = 1 / Math.max(0.6, Math.abs(Math.cos(yawAngle)));

    // 3. Roll (Rotation)
    let dx_roll = rs.x - ls.x;
    let dy_roll = rs.y - ls.y;
    let rollAngle = Math.atan2(dy_roll, dx_roll);

    // Normalize to keep upright
    if (Math.abs(rollAngle) > Math.PI / 2) {
        rollAngle = rollAngle > 0 ? rollAngle - Math.PI : rollAngle + Math.PI;
    }
    if (Math.abs(rollAngle) > 0.8) rollAngle = 0;

    // 4. Scale Detection
    const shoulderWidth = Math.sqrt(Math.pow(rs.x - ls.x, 2) + Math.pow(rs.y - ls.y, 2)) * canvasWidth;

    // Torso Height for vertical anchoring
    const torsoHeight = lh && rh ? Math.sqrt(
        Math.pow(((lh.x + rh.x) / 2) - midX, 2) +
        Math.pow(((lh.y + rh.y) / 2) - midY, 2)
    ) * canvasHeight : shoulderWidth * 1.5;

    // 5. Final Dimensions
    const baseWidth = shoulderWidth * garment.scale * (garment.fit === 'tight' ? 1.05 : 1.3);
    const garmentWidth = baseWidth * perspectiveFactor;

    return {
        x: midX * canvasWidth,
        y: midY * canvasHeight + (torsoHeight * (garment.offset.y || 0.15)),
        width: garmentWidth,
        rotation: rollAngle,
        yawSkew: Math.sin(yawAngle) * 0.1,
        perspectiveFactor
    };
};
