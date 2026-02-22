import React, { useRef, useEffect, useState } from 'react';
import { Camera as CameraIcon, RefreshCw, AlertCircle, Settings, User, Check } from 'lucide-react';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const GARMENTS = [
    {
        id: 'dress1',
        name: 'Silk Evening Dress',
        image: '/assets/garments/dress1.png',
        scale: 1.4,
        offset: { x: 0, y: 0.1 },
        fit: 'relaxed'
    },
    {
        id: 'dress2',
        name: 'Floral Summer Set',
        image: '/assets/garments/dress2.png',
        scale: 1.3,
        offset: { x: 0, y: 0.15 },
        fit: 'relaxed'
    },
    {
        id: 'dress3_1',
        name: 'Casual Ensemble',
        image: '/assets/garments/dress3-1.png',
        scale: 1.2,
        offset: { x: 0, y: 0.12 },
        fit: 'relaxed'
    },
    {
        id: 'tshirt_jpg',
        name: 'Premium T-shirt (JPG)',
        image: '/assets/garments/dress3.jpg',
        scale: 1.1,
        offset: { x: 0, y: 0.05 },
        fit: 'tight'
    }
];

const LiveTryOn = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDebug, setShowDebug] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [selectedGarment, setSelectedGarment] = useState(null);
    const [frameCount, setFrameCount] = useState(0);
    const garmentImages = useRef({});

    // Use refs for state that onResults needs to access without re-initializing the model
    const selectedGarmentRef = useRef(null);
    const showDebugRef = useRef(showDebug);

    useEffect(() => {
        selectedGarmentRef.current = selectedGarment;
    }, [selectedGarment]);

    useEffect(() => {
        showDebugRef.current = showDebug;
    }, [showDebug]);

    // Preload garment images
    useEffect(() => {
        GARMENTS.forEach(g => {
            const img = new Image();
            img.src = g.image;
            img.onload = () => {
                garmentImages.current[g.id] = img;
            };
        });
    }, []);

    const drawGarment = (ctx, landmarks, garment) => {
        const img = garmentImages.current[garment.id];
        if (!img || !landmarks) return;

        // Landmarks: 11 (L shoulder), 12 (R shoulder), 23 (L hip), 24 (R hip)
        const ls = landmarks[11]; // Left
        const rs = landmarks[12]; // Right
        const lh = landmarks[23];
        const rh = landmarks[24];

        if (!ls || !rs || ls.visibility < 0.2 || rs.visibility < 0.2) return;

        // 1. Calculate Center and Orientation
        // Midpoint of shoulders
        const midX = (ls.x + rs.x) / 2;
        const midY = (ls.y + rs.y) / 2;

        // 2. Perspective (Yaw) Detection
        // MediaPipe landmarks are returned from the camera's perspective.
        // In a mirrored view, 'Left' shoulder is on the RIGHT side of the image.
        // dz > 0 means the left shoulder is closer to the camera.
        const dz = ls.z - rs.z;
        const dx = ls.x - rs.x;
        const yawAngle = Math.atan2(dz, Math.abs(dx)); // Use abs to keep base width stable

        // 3. Compensation
        const perspectiveFactor = 1 / Math.max(0.6, Math.abs(Math.cos(yawAngle)));

        // 4. Dimensions
        const shoulderWidth = Math.sqrt(
            Math.pow(rs.x - ls.x, 2) + Math.pow(rs.y - ls.y, 2)
        ) * ctx.canvas.width;

        // Torso Height (for offset calculation)
        const torsoHeight = lh && rh ? Math.sqrt(
            Math.pow(((lh.x + rh.x) / 2) - midX, 2) +
            Math.pow(((lh.y + rh.y) / 2) - midY, 2)
        ) * ctx.canvas.height : shoulderWidth * 1.2;

        // 5. Rotation (Roll) & Normalization
        // IMPORTANT: Invert Y for screen coordinates if rotation is inverted.
        let dx_roll = rs.x - ls.x;
        let dy_roll = rs.y - ls.y;
        let rollAngle = Math.atan2(dy_roll, dx_roll);

        // Safety check: Ensure the garment is never upside down (180deg flip)
        if (Math.abs(rollAngle) > Math.PI / 2) {
            rollAngle = rollAngle > 0 ? rollAngle - Math.PI : rollAngle + Math.PI;
        }

        // Double-safety: cap extreme tilts
        if (Math.abs(rollAngle) > 0.8) rollAngle = 0;

        // 6. Final Fit & Anchoring
        const baseWidth = shoulderWidth * garment.scale * (garment.fit === 'tight' ? 1.05 : 1.3);
        const garmentWidth = baseWidth * perspectiveFactor;
        const garmentHeight = garmentWidth * (img.height / img.width);

        ctx.save();
        // Translation: Move target lower to avoid the face
        // torsoHeight is the distance from shoulder-mid to hip-mid
        const verticalShift = torsoHeight * (garment.offset.y || 0.15); // Default to 15% down

        ctx.translate(midX * ctx.canvas.width, midY * ctx.canvas.height + verticalShift);
        ctx.rotate(rollAngle);

        // 7. Subtle 3D skew
        const skew = Math.sin(yawAngle) * 0.1;
        ctx.transform(1, skew, 0, 1, 0, 0);

        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 20;

        // Draw centering horizontally
        // Offset slightly up to make it sit 'on' the shoulders
        ctx.drawImage(
            img,
            -garmentWidth / 2,
            -garmentHeight * 0.1, // Sit a bit higher than the anchor to cover the neck
            garmentWidth,
            garmentHeight
        );
        ctx.restore();
    };

    useEffect(() => {
        let cameraInstance = null;
        let poseInstance = null;
        let isCancelled = false;
        let localFrameCount = 0;

        const initPose = async () => {
            try {
                poseInstance = new Pose({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
                    }
                });

                poseInstance.setOptions({
                    modelComplexity: 1,
                    smoothLandmarks: true,
                    enableSegmentation: false,
                    smoothSegmentation: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                poseInstance.onResults((results) => {
                    if (isCancelled) return;

                    localFrameCount++;
                    if (localFrameCount % 30 === 0) {
                        setFrameCount(localFrameCount);
                    }

                    const canvasElement = canvasRef.current;
                    if (!canvasElement) return;
                    const canvasCtx = canvasElement.getContext('2d');

                    if (canvasElement.width !== 1280 || canvasElement.height !== 720) {
                        canvasElement.width = 1280;
                        canvasElement.height = 720;
                    }

                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

                    if (results.poseLandmarks) {
                        if (!isModelLoaded) setIsModelLoaded(true);

                        const landmarks = results.poseLandmarks;

                        if (selectedGarmentRef.current) {
                            drawGarment(canvasCtx, landmarks, selectedGarmentRef.current);
                        }

                        if (showDebugRef.current) {
                            // High-visibility manual skeleton
                            canvasCtx.lineWidth = 4;
                            canvasCtx.strokeStyle = '#00FFFF';

                            const connect = (i, j) => {
                                const p1 = landmarks[i];
                                const p2 = landmarks[j];
                                if (p1 && p2 && p1.visibility > 0.4 && p2.visibility > 0.4) {
                                    canvasCtx.beginPath();
                                    canvasCtx.moveTo(p1.x * 1280, p1.y * 720);
                                    canvasCtx.lineTo(p2.x * 1280, p2.y * 720);
                                    canvasCtx.stroke();
                                }
                            };

                            connect(11, 12); connect(23, 24); connect(11, 23); connect(12, 24);
                            connect(11, 13); connect(13, 15); connect(12, 14); connect(14, 16);
                        }
                    }

                    canvasCtx.restore();
                });

                if (videoRef.current && !isCancelled) {
                    cameraInstance = new Camera(videoRef.current, {
                        onFrame: async () => {
                            if (!isCancelled && videoRef.current && videoRef.current.readyState >= 2 && poseInstance) {
                                try {
                                    await poseInstance.send({ image: videoRef.current });
                                } catch (e) { }
                            }
                        },
                        width: 1280,
                        height: 720
                    });
                    await cameraInstance.start();
                    if (!isCancelled) setIsLoading(false);
                }
            } catch (err) {
                console.error("AI Init Error:", err);
                if (!isCancelled) {
                    setError(`AI Error: ${err.message}`);
                    setIsLoading(false);
                }
            }
        };

        initPose();

        return () => {
            isCancelled = true;
            if (cameraInstance) cameraInstance.stop();
            if (poseInstance) poseInstance.close();
        };
    }, []);

    return (
        <div className="pt-24 min-h-screen bg-[#fafafa] flex flex-col items-center">
            <div className="max-w-7xl w-full px-4 py-8">
                <header className="mb-12 text-center">
                    <span className="text-rose-600 font-bold text-xs uppercase tracking-[0.2em] mb-2 block">Next-Gen Shopping</span>
                    <h1 className="text-5xl font-display font-black text-gray-900 mb-4 tracking-tight">Virtual Fitting Room</h1>
                    <div className="h-1 w-20 bg-rose-500 mx-auto rounded-full" />
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Garment Selection Panel */}
                    <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-rose-100/50 border border-white flex flex-col h-fit sticky top-28">
                        <h2 className="text-2xl font-display font-bold mb-8 flex items-center text-gray-900">
                            <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-rose-200">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            My Closet
                        </h2>

                        <div className="space-y-6 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 gap-4">
                                {GARMENTS.map((garment) => (
                                    <button
                                        key={garment.id}
                                        onClick={() => setSelectedGarment(garment === selectedGarment ? null : garment)}
                                        className={`w-full group relative flex items-center p-4 rounded-2xl border-2 transition-all duration-500 ${selectedGarment?.id === garment.id
                                            ? 'border-rose-500 bg-rose-50/50 shadow-xl shadow-rose-100 -translate-y-1'
                                            : 'border-gray-50 bg-gray-50 hover:border-rose-200 hover:bg-white hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex items-center justify-center p-1 shadow-sm border border-white flex-shrink-0">
                                            <img
                                                src={garment.image}
                                                alt={garment.name}
                                                className="max-w-full max-h-full object-contain transform group-hover:scale-125 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="ml-4 text-left">
                                            <p className={`text-sm font-bold leading-tight ${selectedGarment?.id === garment.id ? 'text-rose-900' : 'text-gray-900'}`}>
                                                {garment.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Ready</p>
                                        </div>
                                        {selectedGarment?.id === garment.id && (
                                            <div className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <div
                                    className="group flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl cursor-pointer hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100"
                                    onClick={() => setShowDebug(!showDebug)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gray-200 group-hover:bg-rose-100 rounded-lg flex items-center justify-center transition-colors">
                                            <Settings className="w-4 h-4 text-gray-500 group-hover:text-rose-500" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">Analytics</span>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${showDebug ? 'bg-rose-500' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showDebug ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Camera Preview */}
                    <div className="lg:col-span-9 relative">
                        <div className="relative bg-black rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] aspect-[16/9] flex items-center justify-center border-[12px] border-white ring-1 ring-gray-100">
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] text-white z-20">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-2 border-rose-500/20 rounded-full" />
                                        <div className="absolute inset-0 w-24 h-24 border-t-2 border-rose-500 rounded-full animate-spin" />
                                        <CameraIcon className="absolute inset-0 m-auto w-8 h-8 text-rose-500" />
                                    </div>
                                    <p className="mt-8 font-display tracking-[0.3em] text-xs uppercase font-bold text-white/60">Initializing AI Engines</p>
                                </div>
                            )}

                            <div className="absolute inset-0 z-0">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                            </div>

                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                                style={{ transform: 'scaleX(-1)' }}
                            />

                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-md text-white p-10 text-center z-50">
                                    <AlertCircle className="w-16 h-16 text-rose-500 mb-6" />
                                    <h2 className="text-2xl font-display font-bold mb-4">{error}</h2>
                                    <button onClick={() => window.location.reload()} className="px-10 py-4 bg-rose-600 rounded-2xl font-bold">Restart Session</button>
                                </div>
                            )}

                            {!error && !isLoading && (
                                <>
                                    <div className="absolute top-8 left-8 z-30 flex flex-col space-y-2">
                                        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-2xl flex items-center space-x-3 text-white text-[11px] tracking-widest uppercase font-black">
                                            <div className="relative">
                                                <div className={`w-2 h-2 rounded-full ${isModelLoaded ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                                                <div className={`absolute -inset-1 blur-sm rounded-full ${isModelLoaded ? 'bg-emerald-500/50' : 'bg-rose-500/50 animate-pulse'}`} />
                                            </div>
                                            <span>{isModelLoaded ? 'Neural Link Active' : 'Calibrating Sensors'}</span>
                                        </div>
                                        {frameCount > 0 && (
                                            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] text-white/60 font-mono">
                                                AI_SYNC: OK • F_ID: {frameCount}
                                            </div>
                                        )}
                                    </div>

                                    {selectedGarment && (
                                        <div className="absolute bottom-8 right-8 z-30 transition-all duration-500">
                                            <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-6 rounded-3xl text-white shadow-2xl">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl p-1">
                                                        <img src={selectedGarment.image} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Active Look</p>
                                                        <p className="text-lg font-display font-bold leading-tight tracking-tight">{selectedGarment.name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] z-20" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveTryOn;
