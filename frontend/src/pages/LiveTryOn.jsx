import React, { useRef, useEffect, useState } from 'react';
import { Camera as CameraIcon, AlertCircle, User, Check, Zap, Layers, RefreshCw } from 'lucide-react';
import { Camera } from '@mediapipe/camera_utils';
import { getPoseEngine } from '../lib/pose/PoseEngine';
import { computeTransform, smoothLandmarks } from '../lib/pose/poseMath';
import { TryOnRenderer2D } from '../lib/render/TryOnRenderer2D';
import { Compositor } from '../lib/render/Compositor';
import { getOcclusionPolygons } from '../lib/pose/occlusionRegions';

const LiveTryOn = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const compositorRef = useRef(null);

    const [garments, setGarments] = useState([]);
    const [selectedGarment, setSelectedGarment] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDebug, setShowDebug] = useState(true);
    const [useOcclusion, setUseOcclusion] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [fps, setFps] = useState(0);

    // Refs for real-time access inside the camera loop
    const prevLandmarksRef = useRef(null);
    const garmentImages = useRef({});
    const selectedGarmentRef = useRef(null);
    const showDebugRef = useRef(showDebug);
    const useOcclusionRef = useRef(useOcclusion);
    const latestSegmentationMaskRef = useRef(null);

    // Sync state changes to refs IMMEDIATELY for the render loop to pick up
    // without re-running the heavy initialization useEffect.
    selectedGarmentRef.current = selectedGarment;
    showDebugRef.current = showDebug;
    useOcclusionRef.current = useOcclusion;

    // 1. Load Garments
    useEffect(() => {
        const loadAssets = async () => {
            try {
                const response = await fetch('/assets/garments/garments.json');
                const data = await response.json();
                setGarments(data);
                data.forEach(g => {
                    const img = new Image();
                    img.src = g.image;
                    img.onload = () => { garmentImages.current[g.id] = img; };
                });
            } catch (err) { setError("Failed to load garment library."); }
        };
        loadAssets();
    }, []);

    // 2. Initialize Engines
    useEffect(() => {
        let cameraInstance = null;
        let lastFrameTime = performance.now();
        let isCancelled = false;

        const init = async () => {
            if (!canvasRef.current || !videoRef.current) return;

            rendererRef.current = new TryOnRenderer2D(canvasRef.current);
            compositorRef.current = new Compositor(canvasRef.current);

            const poseEngine = getPoseEngine();

            // Unified Render Loop
            poseEngine.onResults((results) => {
                if (isCancelled || !results.poseLandmarks) return;
                setIsModelLoaded(true);

                // Update shared segmentation mask from Pose results
                latestSegmentationMaskRef.current = results.segmentationMask;

                const now = performance.now();
                setFps(Math.round(1000 / (now - lastFrameTime)));
                lastFrameTime = now;

                const smoothed = smoothLandmarks(prevLandmarksRef.current, results.poseLandmarks, 0.4);
                prevLandmarksRef.current = smoothed;

                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const { width, height } = canvas;

                // Apply Mirroring for Selfie View
                ctx.save();
                ctx.translate(width, 0);
                ctx.scale(-1, 1);

                // Composite the final frame
                compositorRef.current.composite(
                    videoRef.current,
                    latestSegmentationMaskRef.current,
                    (passCtx) => {
                        if (selectedGarmentRef.current) {
                            const transform = computeTransform(
                                smoothed,
                                selectedGarmentRef.current,
                                width,
                                height
                            );
                            const img = garmentImages.current[selectedGarmentRef.current.id];
                            if (transform && img) {
                                rendererRef.current.ctx = passCtx;
                                rendererRef.current.drawGarment(img, transform);
                                rendererRef.current.ctx = ctx; // Reset back to main mirrored ctx
                            }
                        }
                    },
                    useOcclusionRef.current ? getOcclusionPolygons(smoothed, width, height) : []
                );

                // Overlay Debug Info
                if (showDebugRef.current) {
                    rendererRef.current.drawSkeleton(smoothed);
                }

                ctx.restore();
            });

            cameraInstance = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current?.readyState >= 2) {
                        // Send frame to single consolidated engine
                        await poseEngine.send(videoRef.current);
                    }
                },
                width: 1280,
                height: 720
            });

            try {
                setIsModelLoaded(false);

                // Warm up the neural engine (downloads WASM and prepares memory)
                // Wait on the cached initialization promise to prevent duplicate injections
                await poseEngine.initializationPromise;

                // Start webcam stream
                await cameraInstance.start();
                setIsLoading(false);
            } catch (err) {
                setError("Camera access denied.");
                setIsLoading(false);
            }
        };

        init();
        return () => { isCancelled = true; cameraInstance?.stop(); };
    }, []);

    return (
        <div className="pt-24 min-h-screen bg-[#fafafa] flex flex-col items-center">
            <div className="max-w-7xl w-full px-4 py-8">
                <header className="mb-12 text-center">
                    <span className="text-rose-600 font-bold text-xs uppercase tracking-[0.2em] mb-2 block">Advanced Compositing</span>
                    <h1 className="text-5xl font-display font-black text-gray-900 mb-4 tracking-tight">AI Try-On Studio</h1>
                    <div className="h-1 w-20 bg-rose-500 mx-auto rounded-full" />
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white h-fit sticky top-28">
                        <h2 className="text-2xl font-display font-bold mb-8 flex items-center text-gray-900">
                            <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            My Closet
                        </h2>

                        <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {garments.map((g) => (
                                <button
                                    key={g.id}
                                    onClick={() => setSelectedGarment(g.id === selectedGarment?.id ? null : g)}
                                    className={`w-full group relative flex items-center p-4 rounded-2xl border-2 transition-all duration-300 ${selectedGarment?.id === g.id
                                        ? 'border-rose-500 bg-rose-50'
                                        : 'border-transparent bg-gray-50 hover:bg-white hover:border-rose-200'
                                        }`}
                                >
                                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex items-center justify-center p-1">
                                        <img src={g.image} alt="" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="text-sm font-bold text-gray-900">{g.name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{g.fit}</p>
                                    </div>
                                    {selectedGarment?.id === g.id && <Check className="w-4 h-4 text-rose-500 ml-auto" />}
                                </button>
                            ))}
                        </div>

                        {/* Toggles moved below video */}
                    </div>

                    <div className="lg:col-span-9">
                        <div className="relative bg-black rounded-[3rem] overflow-hidden shadow-2xl aspect-[16/9] border-[12px] border-white ring-1 ring-gray-100">
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] text-white z-20">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-2 border-rose-500/20 rounded-full animate-pulse" />
                                        <div className="absolute inset-0 w-24 h-24 border-t-2 border-rose-500 rounded-full animate-spin" />
                                        <CameraIcon className="absolute inset-0 m-auto w-8 h-8 text-rose-500" />
                                    </div>
                                    <p className="mt-8 font-display tracking-[0.3em] text-xs uppercase font-bold text-white/40">Initializing Neural Engine</p>
                                </div>
                            )}

                            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-0" />
                            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" width={1280} height={720} />

                            {!error && !isLoading && (
                                <div className="absolute top-8 left-8 z-30 flex flex-col space-y-3">
                                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-2xl flex items-center space-x-3 text-white text-[10px] tracking-widest uppercase font-black">
                                        <div className="relative">
                                            <div className={`w-2.5 h-2.5 rounded-full ${isModelLoaded ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <div className={`absolute -inset-1 blur-sm rounded-full ${isModelLoaded ? 'bg-emerald-500/50' : 'bg-rose-500/50'}`} />
                                        </div>
                                        <span>{isModelLoaded ? `Neural Link: ${fps} FPS` : 'Syncing Data'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.6)_100%)] z-20" />
                        </div>

                        {/* Toggles below the video */}
                        <div className="mt-6 flex justify-center space-x-6">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all shadow-sm bg-white text-gray-600 border border-gray-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                                title="Reload neural engine"
                            >
                                <RefreshCw className="w-5 h-5" />
                                <span className="font-bold">Refresh</span>
                            </button>

                            <button
                                onClick={() => setUseOcclusion(!useOcclusion)}
                                className={`flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all shadow-sm ${useOcclusion ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95'}`}
                            >
                                <Layers className="w-5 h-5" />
                                <span className="font-bold">Smart Occlusion</span>
                                <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${useOcclusion ? 'bg-rose-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${useOcclusion ? 'translate-x-4' : ''}`} />
                                </div>
                            </button>

                            <button
                                onClick={() => setShowDebug(!showDebug)}
                                className={`flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all shadow-sm ${showDebug ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95'}`}
                            >
                                <Zap className="w-5 h-5" />
                                <span className="font-bold">Skeleton Mode</span>
                                <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${showDebug ? 'bg-rose-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showDebug ? 'translate-x-4' : ''}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveTryOn;
