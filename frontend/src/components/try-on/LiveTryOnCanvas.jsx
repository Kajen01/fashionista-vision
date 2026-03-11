import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Camera as MPCamera } from '@mediapipe/camera_utils';
import { Pose } from '@mediapipe/pose';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

import { LandmarkSmoother } from '../../lib/pose/landmarkSmoother';
import { computeTorsoQuad, toPixel } from '../../lib/pose/poseMath';
import {
    buildGarmentShape,
    drawWarpedGarment,
    drawDebugOverlay,
    drawOcclusionLayer,
} from '../../lib/render/perspectiveWarp';

/* ── constants ─────────────────────────────────────────────────────── */

const CANVAS_W = 960;
const CANVAS_H = 720;
const SEG_INTERVAL = 3; // run segmentation every Nth frame

const getImageUrl = (item) =>
    item?.image || item?.mainImage || item?.imageUrl || item?.thumbnail || '';

/* ── component ─────────────────────────────────────────────────────── */

const LiveTryOnCanvas = ({
    selectedClothing,
    controls,
    debugMode,
    mirrored = true,
}) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const mpCameraRef = useRef(null);
    const poseRef = useRef(null);
    const segRef = useRef(null);
    const garmentImgRef = useRef(null);
    const smootherRef = useRef(new LandmarkSmoother());
    const frameCountRef = useRef(0);
    const cachedSegMaskRef = useRef(null);
    const isReadyRef = useRef(false);

    const [status, setStatus] = useState('Initializing live try-on…');
    const [cameraReady, setCameraReady] = useState(false);

    const garmentUrl = useMemo(() => getImageUrl(selectedClothing), [selectedClothing]);
    const category = (selectedClothing?.category || 'dress').toLowerCase()
        .replace('dresses', 'dress')
        .replace('tops', 'top')
        .replace('jackets', 'jacket');

    /* ── load garment image ───────────────────────────────────────── */

    useEffect(() => {
        garmentImgRef.current = null;
        if (!garmentUrl) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { garmentImgRef.current = img; };
        img.onerror = () => { garmentImgRef.current = null; };
        img.src = garmentUrl;

        // reset smoother when garment changes
        smootherRef.current.reset();
    }, [garmentUrl]);

    /* ── stable controls ref to avoid re-creating pose pipeline ──── */

    const controlsRef = useRef(controls);
    const debugRef = useRef(debugMode);
    const categoryRef = useRef(category);
    useEffect(() => { controlsRef.current = controls; }, [controls]);
    useEffect(() => { debugRef.current = debugMode; }, [debugMode]);
    useEffect(() => { categoryRef.current = category; }, [category]);

    /* ── process a single pose frame ─────────────────────────────── */

    const handlePoseResults = useCallback((results) => {
        const canvas = canvasRef.current;
        if (!canvas || !results?.image) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.save();
        ctx.clearRect(0, 0, w, h);

        if (mirrored) {
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
        }

        // 1. draw camera frame
        ctx.drawImage(results.image, 0, 0, w, h);

        // 2. smooth landmarks → pixel space
        let smoothed = null;
        if (results.poseLandmarks) {
            const raw = {};
            results.poseLandmarks.forEach((lm, i) => {
                raw[i] = toPixel(lm, w, h);
            });
            smoothed = smootherRef.current.smooth(raw);
        }

        // 3. compute torso quad
        const quad = smoothed
            ? computeTorsoQuad(smoothed, controlsRef.current, categoryRef.current)
            : null;

        // 4. garment warp
        const gImg = garmentImgRef.current;
        if (gImg && quad) {
            const shape = buildGarmentShape(quad, categoryRef.current);
            drawWarpedGarment(ctx, gImg, shape, controlsRef.current.opacity ?? 0.96);
        }

        // 5. arm/head occlusion
        if (smoothed && gImg && quad) {
            drawOcclusionLayer(ctx, results.image, smoothed);
        }

        // 6. debug overlay
        if (debugRef.current && smoothed) {
            drawDebugOverlay(ctx, smoothed, quad);
        }

        ctx.restore();
    }, [mirrored]);

    /* ── setup MediaPipe pipeline ────────────────────────────────── */

    useEffect(() => {
        let cancelled = false;

        const setup = async () => {
            try {
                const videoEl = videoRef.current;
                const canvasEl = canvasRef.current;
                if (!videoEl || !canvasEl) return;

                // Pose
                const pose = new Pose({
                    locateFile: (f) =>
                        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
                });
                pose.setOptions({
                    modelComplexity: 1,
                    smoothLandmarks: true,
                    enableSegmentation: false,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });
                pose.onResults((r) => {
                    if (!cancelled) handlePoseResults(r);
                });
                poseRef.current = pose;

                // Selfie segmentation (throttled)
                const seg = new SelfieSegmentation({
                    locateFile: (f) =>
                        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
                });
                seg.setOptions({ modelSelection: 1 });
                seg.onResults((r) => {
                    if (r?.segmentationMask) {
                        cachedSegMaskRef.current = r.segmentationMask;
                    }
                });
                segRef.current = seg;

                // Camera
                canvasEl.width = CANVAS_W;
                canvasEl.height = CANVAS_H;

                const camera = new MPCamera(videoEl, {
                    onFrame: async () => {
                        if (cancelled || !videoEl) return;

                        if (!isReadyRef.current) {
                            isReadyRef.current = true;
                            setStatus('Live try-on ready');
                            setCameraReady(true);
                        }

                        // pose every frame
                        await pose.send({ image: videoEl });

                        // segmentation throttled
                        frameCountRef.current += 1;
                        if (frameCountRef.current % SEG_INTERVAL === 0) {
                            try {
                                await seg.send({ image: videoEl });
                            } catch {
                                /* non-critical */
                            }
                        }
                    },
                    width: CANVAS_W,
                    height: CANVAS_H,
                });

                mpCameraRef.current = camera;
                await camera.start();

                if (!cancelled) setStatus('Camera started');
            } catch (err) {
                console.error('Live try-on init error:', err);
                setStatus('Unable to start live try-on. Check camera permission.');
            }
        };

        setup();

        return () => {
            cancelled = true;
            isReadyRef.current = false;

            try {
                if (mpCameraRef.current?.video?.srcObject) {
                    mpCameraRef.current.video.srcObject
                        .getTracks()
                        .forEach((t) => t.stop());
                }
            } catch (e) { console.warn(e); }

            try { poseRef.current?.close?.(); } catch (e) { console.warn(e); }
            try { segRef.current?.close?.(); } catch (e) { console.warn(e); }
        };
    }, [handlePoseResults]);

    /* ── render ───────────────────────────────────────────────────── */

    return (
        <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-xl">
                {/* hidden video element for MediaPipe camera */}
                <video ref={videoRef} className="hidden" playsInline muted />

                <canvas ref={canvasRef} className="w-full h-auto bg-black" />

                {/* status badge */}
                <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-3 py-2 rounded-full">
                    {status}
                </div>

                {/* no garment overlay */}
                {!selectedClothing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-white text-center p-6">
                        <div>
                            <p className="text-lg font-semibold mb-2">Select a garment first</p>
                            <p className="text-sm text-white/80">
                                Choose a dress, top, or jacket to start live overlay.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* info cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Mode', value: 'Live Camera' },
                    { label: 'Garment', value: selectedClothing?.name || 'Not selected' },
                    { label: 'Category', value: category },
                    { label: 'Camera', value: cameraReady ? 'Active' : 'Starting' },
                ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-gray-50 border p-3">
                        <div className="text-xs text-gray-500">{label}</div>
                        <div className="font-semibold text-gray-900 truncate capitalize">
                            {value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveTryOnCanvas;
