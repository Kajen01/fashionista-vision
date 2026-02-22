import React, { useRef, useEffect, useState } from 'react';
import { Camera as CameraIcon, AlertCircle, Settings, User, Check, Zap } from 'lucide-react';
import { Camera } from '@mediapipe/camera_utils';
import { getPoseEngine } from '../lib/pose/PoseEngine';
import { computeTransform, smoothLandmarks } from '../lib/pose/poseMath';
import { TryOnRenderer2D } from '../lib/render/TryOnRenderer2D';

const LiveTryOn = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const [garments, setGarments] = useState([]);
    const [selectedGarment, setSelectedGarment] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDebug, setShowDebug] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [fps, setFps] = useState(0);

    // Smooth state tracking
    const prevLandmarksRef = useRef(null);
    const garmentImages = useRef({});
    const selectedGarmentRef = useRef(null);
    const showDebugRef = useRef(showDebug);

    // Sync refs for results callback
    useEffect(() => { selectedGarmentRef.current = selectedGarment; }, [selectedGarment]);
    useEffect(() => { showDebugRef.current = showDebug; }, [showDebug]);

    // 1. Load Garments & Assets
    useEffect(() => {
        const loadAssets = async () => {
            try {
                const response = await fetch('/assets/garments/garments.json');
                const data = await response.json();
                setGarments(data);

                // Preload images
                data.forEach(g => {
                    const img = new Image();
                    img.src = g.image;
                    img.onload = () => { garmentImages.current[g.id] = img; };
                });
            } catch (err) {
                console.error("Asset Load Error:", err);
                setError("Failed to load garment library.");
            }
        };
        loadAssets();
    }, []);

    // 2. Initialize Engine & Renderer
    useEffect(() => {
        let cameraInstance = null;
        let lastFrameTime = performance.now();
        let isCancelled = false;

        const init = async () => {
            if (!canvasRef.current || !videoRef.current) return;

            rendererRef.current = new TryOnRenderer2D(canvasRef.current);
            const engine = getPoseEngine();

            engine.onResults((results) => {
                if (isCancelled || !results.poseLandmarks) return;

                if (!isModelLoaded) setIsModelLoaded(true);

                // Performance tracking
                const now = performance.now();
                setFps(Math.round(1000 / (now - lastFrameTime)));
                lastFrameTime = now;

                const renderer = rendererRef.current;
                renderer.clear();

                // Advanced Smoothing (EMA)
                const currentLandmarks = results.poseLandmarks;
                const smoothed = smoothLandmarks(prevLandmarksRef.current, currentLandmarks, 0.4);
                prevLandmarksRef.current = smoothed;

                // Garment Transformation
                if (selectedGarmentRef.current) {
                    const transform = computeTransform(
                        smoothed,
                        selectedGarmentRef.current,
                        canvasRef.current.width,
                        canvasRef.current.height
                    );
                    const img = garmentImages.current[selectedGarmentRef.current.id];
                    if (transform && img) {
                        renderer.drawGarment(img, transform);
                    }
                }

                // Debug Skeleton
                if (showDebugRef.current) {
                    renderer.drawSkeleton(smoothed);
                }
            });

            cameraInstance = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current?.readyState >= 2) {
                        const engine = getPoseEngine();
                        await engine.send(videoRef.current);
                    }
                },
                width: 1280,
                height: 720
            });

            try {
                await cameraInstance.start();
                setIsLoading(false);
            } catch (err) {
                setError("Camera access denied or unavailable.");
                setIsLoading(false);
            }
        };

        init();

        return () => {
            isCancelled = true;
            if (cameraInstance) cameraInstance.stop();
        };
    }, []);

    return (
        <div className="pt-24 min-h-screen bg-[#fafafa] flex flex-col items-center">
            <div className="max-w-7xl w-full px-4 py-8">
                <header className="mb-12 text-center">
                    <span className="text-rose-600 font-bold text-xs uppercase tracking-[0.2em] mb-2 block">Premium Experience</span>
                    <h1 className="text-5xl font-display font-black text-gray-900 mb-4 tracking-tight">AI Fitting Studio</h1>
                    <div className="h-1 w-20 bg-rose-500 mx-auto rounded-full" />
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Sidebar */}
                    <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-rose-100/50 border border-white h-fit sticky top-28">
                        <h2 className="text-2xl font-display font-bold mb-8 flex items-center text-gray-900">
                            <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-rose-200">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            My Closet
                        </h2>

                        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                            {garments.map((g) => (
                                <button
                                    key={g.id}
                                    onClick={() => setSelectedGarment(g.id === selectedGarment?.id ? null : g)}
                                    className={`w-full group relative flex items-center p-4 rounded-2xl border-2 transition-all duration-300 ${selectedGarment?.id === g.id
                                            ? 'border-rose-500 bg-rose-50 shadow-lg'
                                            : 'border-transparent bg-gray-50 hover:bg-white hover:border-rose-200'
                                        }`}
                                >
                                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex items-center justify-center p-1 shadow-sm">
                                        <img src={g.image} alt="" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="text-sm font-bold text-gray-900">{g.name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{g.fit}</p>
                                    </div>
                                    {selectedGarment?.id === g.id && (
                                        <Check className="w-4 h-4 text-rose-500 ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                            <button
                                onClick={() => setShowDebug(!showDebug)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${showDebug ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-600'
                                    }`}
                            >
                                <div className="flex items-center space-x-3 text-sm font-bold">
                                    <Zap className="w-4 h-4" />
                                    <span>Skeleton Mode</span>
                                </div>
                                <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${showDebug ? 'bg-rose-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showDebug ? 'translate-x-4' : ''}`} />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Main Stage */}
                    <div className="lg:col-span-9">
                        <div className="relative bg-black rounded-[3rem] overflow-hidden shadow-2xl aspect-[16/9] border-[12px] border-white ring-1 ring-gray-100">
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] text-white z-20">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-2 border-rose-500/20 rounded-full animate-pulse" />
                                        <div className="absolute inset-0 w-24 h-24 border-t-2 border-rose-500 rounded-full animate-spin" />
                                        <CameraIcon className="absolute inset-0 m-auto w-8 h-8 text-rose-500" />
                                    </div>
                                    <p className="mt-8 font-display tracking-[0.3em] text-xs uppercase font-bold text-white/40">Powering AI Nodes</p>
                                </div>
                            )}

                            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none scale-x-[-1]" width={1280} height={720} />

                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-xl text-white p-10 text-center z-50">
                                    <AlertCircle className="w-16 h-16 text-rose-500 mb-6" />
                                    <h2 className="text-2xl font-display font-bold mb-4">{error}</h2>
                                    <button onClick={() => window.location.reload()} className="px-10 py-4 bg-rose-600 rounded-2xl font-bold hover:bg-rose-700 transition-colors shadow-xl shadow-rose-900/40">Initialize System</button>
                                </div>
                            )}

                            {!error && !isLoading && (
                                <div className="absolute top-8 left-8 z-30 flex flex-col space-y-3">
                                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-2xl flex items-center space-x-3 text-white text-[10px] tracking-widest uppercase font-black shadow-lg">
                                        <div className="relative">
                                            <div className={`w-2.5 h-2.5 rounded-full ${isModelLoaded ? 'bg-emerald-500' : 'bg-rose-500 pulse'}`} />
                                            <div className={`absolute -inset-1 blur-sm rounded-full ${isModelLoaded ? 'bg-emerald-500/50' : 'bg-rose-500/50 pulse'}`} />
                                        </div>
                                        <span>{isModelLoaded ? `Neural Link: ${fps} FPS` : 'Syncing Pose Data'}</span>
                                    </div>
                                </div>
                            )}

                            {selectedGarment && (
                                <div className="absolute bottom-8 right-8 z-30">
                                    <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-5 rounded-3xl text-white shadow-2xl flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-white rounded-lg p-1">
                                            <img src={selectedGarment.image} alt="" className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase font-black text-white/40 tracking-[0.2em]">Active Mode</p>
                                            <p className="text-base font-display font-bold leading-tight">{selectedGarment.name}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.6)_100%)] z-20" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveTryOn;
