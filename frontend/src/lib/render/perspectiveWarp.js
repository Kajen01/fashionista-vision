/**
 * perspectiveWarp.js — Piecewise-affine sliced warp for garment rendering
 *
 * This is the PRIMARY frontend warp path.
 * It approximates perspective/body fit using horizontal-slice affine warp.
 */

const SLICES = 32;

/**
 * Linearly interpolate between a and b by factor t
 */
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Build the garment shape descriptor from a torso quad and garment category.
 *
 * @param {Object} torsoQuad  — from computeTorsoQuad()
 * @param {string} category   — 'dress' | 'top' | 'jacket'
 * @returns {{ center, angle, upperWidth, lowerWidth, totalHeight }}
 */
export const buildGarmentShape = (torsoQuad, category = 'dress') => {
    if (!torsoQuad) return null;

    const { upperLeft, upperRight, lowerLeft, lowerRight, angle } = torsoQuad;

    const upperWidth = Math.hypot(
        upperRight.x - upperLeft.x,
        upperRight.y - upperLeft.y,
    );
    const lowerWidth = Math.hypot(
        lowerRight.x - lowerLeft.x,
        lowerRight.y - lowerLeft.y,
    );

    const upperCenter = {
        x: (upperLeft.x + upperRight.x) / 2,
        y: (upperLeft.y + upperRight.y) / 2,
    };
    const lowerCenter = {
        x: (lowerLeft.x + lowerRight.x) / 2,
        y: (lowerLeft.y + lowerRight.y) / 2,
    };

    const totalHeight = Math.hypot(
        lowerCenter.x - upperCenter.x,
        lowerCenter.y - upperCenter.y,
    );

    const center = {
        x: (upperCenter.x + lowerCenter.x) / 2,
        y: (upperCenter.y + lowerCenter.y) / 2,
    };

    return {
        center,
        angle: angle ?? 0,
        upperWidth,
        lowerWidth,
        totalHeight: Math.max(60, totalHeight),
    };
};

/**
 * Draw a garment image warped to the body using piecewise-affine slicing.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement}         image  — garment image element
 * @param {Object}                   shape  — from buildGarmentShape()
 * @param {number}                   [opacity=0.96]
 */
export const drawWarpedGarment = (ctx, image, shape, opacity = 0.96) => {
    if (!shape || !image) return;

    const { center, angle, upperWidth, lowerWidth, totalHeight } = shape;
    const srcW = image.naturalWidth || image.width;
    const srcH = image.naturalHeight || image.height;

    if (srcW === 0 || srcH === 0) return;

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);
    ctx.globalAlpha = opacity;

    const topY = -totalHeight / 2;
    const sliceH = totalHeight / SLICES;

    for (let i = 0; i < SLICES; i++) {
        const t = i / SLICES;
        const tNext = (i + 1) / SLICES;

        const widthNow = lerp(upperWidth, lowerWidth, t);
        const widthNext = lerp(upperWidth, lowerWidth, tNext);
        const drawWidth = Math.max(widthNow, widthNext);

        // source rectangle from the garment image
        const sy = t * srcH;
        const sh = Math.max(1, srcH / SLICES + 1); // +1 to avoid seam gaps

        // destination rectangle on canvas
        const dy = topY + t * totalHeight;

        ctx.drawImage(
            image,
            0, sy, srcW, sh,                   // source
            -drawWidth / 2, dy, drawWidth, sliceH + 2, // dest (+2 to avoid seam gaps)
        );
    }

    ctx.restore();
};

/**
 * Draw debug visualisation: skeleton, anchor dots, and quad outline.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} landmarks — smoothed, pixel-space { [index]: {x,y} }
 * @param {Object|null} torsoQuad — from computeTorsoQuad()
 */
export const drawDebugOverlay = (ctx, landmarks, torsoQuad) => {
    if (!landmarks) return;

    ctx.save();

    // ── skeleton lines ──
    const connections = [
        [11, 12], [11, 13], [13, 15],
        [12, 14], [14, 16], [11, 23],
        [12, 24], [23, 24],
    ];

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#14b8a6'; // teal
    ctx.fillStyle = '#0f766e';

    connections.forEach(([a, b]) => {
        const p1 = landmarks[a];
        const p2 = landmarks[b];
        if (!p1 || !p2) return;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    });

    // ── joint dots ──
    [11, 12, 13, 14, 15, 16, 23, 24].forEach((idx) => {
        const p = landmarks[idx];
        if (!p) return;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // ── 4 anchor dots (larger, coloured) ──
    if (torsoQuad) {
        const anchors = [
            { pt: torsoQuad.upperLeft, color: '#f59e0b' },
            { pt: torsoQuad.upperRight, color: '#f59e0b' },
            { pt: torsoQuad.lowerLeft, color: '#ef4444' },
            { pt: torsoQuad.lowerRight, color: '#ef4444' },
        ];

        anchors.forEach(({ pt, color }) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // ── quad outline ──
        ctx.beginPath();
        ctx.moveTo(torsoQuad.upperLeft.x, torsoQuad.upperLeft.y);
        ctx.lineTo(torsoQuad.upperRight.x, torsoQuad.upperRight.y);
        ctx.lineTo(torsoQuad.lowerRight.x, torsoQuad.lowerRight.y);
        ctx.lineTo(torsoQuad.lowerLeft.x, torsoQuad.lowerLeft.y);
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#f59e0b'; // amber
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.restore();
};

/**
 * Draw arm and head occlusion by compositing the original video
 * over the garment-rendered canvas in arm/head regions only.
 *
 * @param {CanvasRenderingContext2D} ctx — main canvas context
 * @param {HTMLVideoElement|HTMLCanvasElement} videoSource
 * @param {Object} landmarks — smoothed, pixel-space
 */
export const drawOcclusionLayer = (ctx, videoSource, landmarks) => {
    const ls = landmarks[11];
    const le = landmarks[13];
    const lw = landmarks[15];
    const rs = landmarks[12];
    const re = landmarks[14];
    const rw = landmarks[16];
    const nose = landmarks[0];

    if (!ls || !le || !lw || !rs || !re || !rw || !nose) return;

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    const shoulderWidth = Math.hypot(rs.x - ls.x, rs.y - ls.y);
    const armThickness = Math.max(18, shoulderWidth * 0.12);
    const headRadius = Math.max(28, shoulderWidth * 0.22);

    // ── build mask on offscreen canvases ──
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const maskCtx = maskCanvas.getContext('2d');

    maskCtx.fillStyle = '#fff';
    maskCtx.strokeStyle = '#fff';
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    maskCtx.lineWidth = armThickness;

    const drawArm = (a, b, c) => {
        maskCtx.beginPath();
        maskCtx.moveTo(a.x, a.y);
        maskCtx.lineTo(b.x, b.y);
        maskCtx.lineTo(c.x, c.y);
        maskCtx.stroke();
        // round caps at wrist
        maskCtx.beginPath();
        maskCtx.arc(c.x, c.y, armThickness * 0.35, 0, Math.PI * 2);
        maskCtx.fill();
    };

    drawArm(ls, le, lw); // left arm
    drawArm(rs, re, rw); // right arm

    // head
    maskCtx.beginPath();
    maskCtx.arc(nose.x, nose.y, headRadius, 0, Math.PI * 2);
    maskCtx.fill();

    // ── composite: video ∩ mask → main canvas ──
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext('2d');

    offCtx.drawImage(videoSource, 0, 0, w, h);
    offCtx.globalCompositeOperation = 'destination-in';
    offCtx.drawImage(maskCanvas, 0, 0);

    ctx.drawImage(offscreen, 0, 0);
};
