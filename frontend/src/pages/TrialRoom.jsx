import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, Ruler, RefreshCw, ChevronRight, Settings, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = window.location.port === '3000' ? 'http://localhost:5000' : '';

const TrialRoom = () => {
    const [userImage, setUserImage] = useState(null);
    const [userImageFile, setUserImageFile] = useState(null);
    const [selectedGarment, setSelectedGarment] = useState(null);
    const [skeletonUrl, setSkeletonUrl] = useState(null);
    const [tryonUrl, setTryonUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    const [params, setParams] = useState({
        scale: 1.15,
        yOffset: 0,
        xOffset: 0,
        rotation: 0
    });

    const [garments, setGarments] = useState([]);

    React.useEffect(() => {
        const fetchGarments = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/trialroom/garments`);
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    setGarments(data);
                    if (data.length > 0) setSelectedGarment(data[0]);
                } catch (e) {
                    if (text.startsWith('<!DOCTYPE')) {
                        console.error('Proxy not active. Please restart npm start.');
                    }
                    throw e;
                }
            } catch (error) {
                console.error('Error fetching garments:', error);
                toast.error('Failed to load garments');
            }
        };
        fetchGarments();
    }, []);

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${API_BASE}/api/trialroom/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            setUserImageFile(data.imageId);
            setUserImage(data.imageUrl);
            setSkeletonUrl(null);
            setTryonUrl(null);
            toast.success('User photo uploaded!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload photo');
        } finally {
            setLoading(false);
        }
    };

    const handleGetSkeleton = async () => {
        if (!userImageFile) {
            toast.error('Please upload a photo first');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/trialroom/pose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageId: userImageFile }),
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setSkeletonUrl(data.skeleton_image);
            setLoading(false);
            toast.success('Skeleton generated!');
        } catch (error) {
            console.error('Skeleton error:', error);
            toast.error(error.message || 'Failed to generate skeleton');
            setLoading(false);
        }
    };

    const handleTryOn = async () => {
        if (!userImageFile || !selectedGarment) {
            toast.error('Please upload a photo and select a garment');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/trialroom/tryon`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageId: userImageFile,
                    garmentId: selectedGarment.id,
                    params
                }),
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setTryonUrl(data.tryon_image);
            setLoading(false);
            toast.success('Try-on successful!');
        } catch (error) {
            console.error('Try-on error:', error);
            toast.error(error.message || 'Failed to process try-on');
            setLoading(false);
        }
    };

    return (
        <div className="pt-20 min-h-screen bg-gray-50 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-10 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-display font-bold text-gray-900"
                    >
                        Virtual Trial Room
                    </motion.h1>
                    <p className="mt-2 text-gray-600 font-accent text-lg">AI-powered 2D Virtual Try-On</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left: Controls & Garment Selector */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Upload Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Upload className="w-5 h-5 mr-2 text-rose-500" />
                                1. Upload Your Photo
                            </h3>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    id="user-photo-upload"
                                />
                                <label
                                    htmlFor="user-photo-upload"
                                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${userImage ? 'border-rose-300 bg-rose-50' : 'border-gray-300 hover:border-rose-400 hover:bg-gray-50'
                                        }`}
                                >
                                    {userImage ? (
                                        <div className="relative w-full h-full p-2">
                                            <img src={userImage?.startsWith('data:') ? userImage : `${API_BASE}${userImage}`} alt="User Preview" className="w-full h-full object-contain rounded-lg shadow-sm" />
                                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                                <RefreshCw className="text-white w-8 h-8" />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-500 font-medium">Click to upload photo</span>
                                            <span className="text-xs text-gray-400 mt-1">Front-facing portraits work best</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Garment Selector */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Sparkles className="w-5 h-5 mr-2 text-rose-500" />
                                2. Select a Garment
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {garments.map((garment) => (
                                    <div
                                        key={garment.id}
                                        onClick={() => setSelectedGarment(garment)}
                                        className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${selectedGarment?.id === garment.id ? 'border-rose-500 ring-2 ring-rose-100' : 'border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        <img src={garment.thumbnail} alt={garment.name} className="w-full h-24 object-cover" />
                                        <div className="p-2 bg-white text-center">
                                            <span className="text-xs font-medium text-gray-900 truncate block">{garment.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>


                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                            <button
                                onClick={handleGetSkeleton}
                                disabled={loading || !userImage}
                                className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                            >
                                Get Skeleton
                            </button>
                            <button
                                onClick={handleTryOn}
                                disabled={loading || !userImage || !selectedGarment}
                                className="flex-2 bg-rose-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? 'Processing...' : 'Try On Now'}
                            </button>
                        </div>
                    </div>

                    {/* Right: Results Display */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-4 h-full min-h-[600px] flex flex-col">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                                    <span className="text-sm font-medium text-gray-600">{loading ? 'Working our magic...' : 'System Ready'}</span>
                                </div>
                                <div className="text-xs text-gray-400">Preview Area</div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                {/* Result Panel 1: Skeleton Analysis */}
                                <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex flex-col h-[450px]">
                                    <div className="py-3 px-4 bg-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Skeleton Analysis</div>
                                    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                                        {skeletonUrl ? (
                                            <img
                                                src={skeletonUrl}
                                                alt="Skeleton Overlay"
                                                className="max-w-full max-h-full object-contain rounded-lg shadow-inner bg-black mx-auto"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <Ruler className="w-12 h-12 text-gray-200 mx-auto" />
                                                <p className="text-xs text-gray-400 mt-3 font-medium italic">Body landmarks</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Result Panel 2: Try-On Output */}
                                <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 flex flex-col md:col-span-1 h-[450px]">
                                    <div className="py-3 px-4 bg-gray-800 text-[11px] font-bold text-rose-400 uppercase tracking-wider flex justify-between items-center">
                                        <span>Final Result</span>
                                        <ChevronRight className="w-3 h-3" />
                                    </div>
                                    <div className="flex-1 overflow-hidden relative bg-black/20 flex flex-col justify-center items-center p-4">
                                        {tryonUrl ? (
                                            <img
                                                src={tryonUrl?.startsWith('data:') ? tryonUrl : `${API_BASE}${tryonUrl}`}
                                                alt="Try On Result"
                                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg shadow-rose-900/40"
                                            />
                                        ) : userImage ? (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <img
                                                    src={userImage?.startsWith('data:') ? userImage : `${API_BASE}${userImage}`}
                                                    alt="Base for Alignment"
                                                    className="max-w-full max-h-full object-contain rounded-lg opacity-40 grayscale-[50%]"
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <Sparkles className="w-12 h-12 text-gray-700 mx-auto" />
                                                <p className="text-xs text-gray-500 mt-3 font-medium italic">AI Composite</p>
                                            </div>
                                        )}

                                        {/* Real-time Adjustment Guide Overlay */}
                                        {selectedGarment && !tryonUrl && (
                                            <div
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 bg-opacity-10 border-2 border-dashed border-rose-400 pointer-events-none transition-transform duration-75 flex items-center justify-center rounded-lg shadow-2xl"
                                                style={{
                                                    width: `${160 * params.scale}px`,
                                                    height: `${220 * params.scale}px`,
                                                    transform: `translate(calc(-50% + ${params.xOffset}px), calc(-50% + ${params.yOffset}px)) rotate(${params.rotation}deg)`,
                                                }}
                                            >
                                                <img
                                                    src={selectedGarment.thumbnail}
                                                    className="w-full h-full object-contain opacity-80 mix-blend-multiply"
                                                    alt="Guide Garment"
                                                />
                                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded-full whitespace-nowrap shadow-sm">
                                                    ALIGNMENT GUIDE
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Integrated Fine-Tune Adjustments Footer */}
                            <div className="mt-auto pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <Settings className="w-5 h-5 mr-2 text-rose-500" />
                                        <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Fine-Tune Adjustments</h3>
                                    </div>
                                    <span className="text-xs text-gray-400 italic">Apply changes by clicking "Try On Now"</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Scale</span>
                                            <span className="text-[11px] font-black text-rose-600">{params.scale}x</span>
                                        </div>
                                        <input
                                            type="range" min="0.8" max="1.5" step="0.05"
                                            value={params.scale}
                                            onChange={(e) => setParams({ ...params, scale: parseFloat(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                                        />
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Vertical</span>
                                            <span className="text-[11px] font-black text-rose-600">{params.yOffset}px</span>
                                        </div>
                                        <input
                                            type="range" min="-150" max="150" step="1"
                                            value={params.yOffset}
                                            onChange={(e) => setParams({ ...params, yOffset: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                                        />
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Horizontal</span>
                                            <span className="text-[11px] font-black text-rose-600">{params.xOffset}px</span>
                                        </div>
                                        <input
                                            type="range" min="-100" max="100" step="1"
                                            value={params.xOffset}
                                            onChange={(e) => setParams({ ...params, xOffset: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                                        />
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Rotation</span>
                                            <span className="text-[11px] font-black text-rose-600">{params.rotation}°</span>
                                        </div>
                                        <input
                                            type="range" min="-45" max="45" step="1"
                                            value={params.rotation}
                                            onChange={(e) => setParams({ ...params, rotation: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TrialRoom;
