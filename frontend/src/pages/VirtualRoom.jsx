import React, { Suspense, useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Box, Loader2 } from 'lucide-react';

import RoomScene from '../components/virtual-room/RoomScene';
import SceneEnvironment from '../components/virtual-room/SceneEnvironment';
import AnimeMannequin from '../components/virtual-room/AnimeMannequin';
import DressDisplayBoard from '../components/virtual-room/DressDisplayBoard';
import ProductPicker from '../components/virtual-room/ProductPicker';
import RoomControls from '../components/virtual-room/RoomControls';

/**
 * 3D Virtual Room page — displays an anime mannequin with a dress display board.
 * Users can browse products, see them on the display board, and view the
 * mannequin wearing the extracted color.
 */
const VirtualRoom = () => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const controlsRef = useRef();

    // Camera preset positions
    const cameraPresets = {
        front: { position: [0, 1.5, 6], target: [0, 0.5, 0] },
        side: { position: [6, 1.5, 0], target: [0, 0.5, 0] },
        back: { position: [0, 1.5, -6], target: [0, 0.5, 0] },
        top: { position: [0, 7, 3], target: [0, 0, 0] },
    };

    const handleCameraPreset = useCallback(
        (presetKey) => {
            const preset = cameraPresets[presetKey];
            if (controlsRef.current && preset) {
                const controls = controlsRef.current;
                // Animate the camera by setting new target
                controls.object.position.set(...preset.position);
                controls.target.set(...preset.target);
                controls.update();
            }
        },
        []
    );

    const handleResetView = useCallback(() => {
        if (controlsRef.current) {
            const controls = controlsRef.current;
            controls.object.position.set(0, 2, 7);
            controls.target.set(0, 0.5, 0);
            controls.update();
        }
    }, []);

    const handleSelectProduct = useCallback((product) => {
        console.log('Product selected in 3D Room:', product);
        setSelectedProduct(product);
    }, []);

    return (
        <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-50 via-white to-rose-50">
            {/* Hero Section */}
            <section className="pt-8 pb-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-3 flex items-center justify-center gap-3">
                            <Box className="w-8 h-8 md:w-10 md:h-10 text-rose-500" />
                            3D Virtual Showroom
                        </h1>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            Explore dresses in an interactive 3D environment. Select a garment
                            to see it on display and visualize the color on our anime mannequin.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Main 3D Layout */}
            <section className="pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-4 gap-6">
                        {/* Left Sidebar — Product Picker */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-1 space-y-4"
                        >
                            <ProductPicker
                                selectedProduct={selectedProduct}
                                onSelectProduct={handleSelectProduct}
                            />
                        </motion.div>

                        {/* Center — 3D Canvas */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="lg:col-span-2"
                        >
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-gradient-to-br from-gray-100 to-gray-50"
                                style={{ height: '600px' }}
                            >
                                {/* Loading overlay */}
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                    <Suspense
                                        fallback={
                                            <div className="flex flex-col items-center gap-3 text-gray-500">
                                                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                                                <p className="text-sm font-medium">Loading 3D Scene...</p>
                                            </div>
                                        }
                                    >
                                        <></>
                                    </Suspense>
                                </div>

                                {/* Three.js Canvas */}
                                <Canvas
                                    camera={{ position: [0, 2, 7], fov: 45, near: 0.1, far: 100 }}
                                    shadows
                                    dpr={[1, 2]}
                                    gl={{ antialias: true, alpha: false }}
                                    style={{ background: 'linear-gradient(180deg, #f0eeea 0%, #e8e4de 100%)' }}
                                >
                                    <Suspense fallback={null}>
                                        {/* Room */}
                                        <RoomScene />
                                        <SceneEnvironment />

                                        {/* Anime Mannequin */}
                                        <AnimeMannequin
                                            dressColor={selectedProduct?.color || '#e8a0bf'}
                                        />

                                        {/* Dress Display Board */}
                                        <DressDisplayBoard
                                            imageUrl={selectedProduct?.imageUrl || null}
                                            productName={
                                                selectedProduct?.name || 'Select a dress from the sidebar'
                                            }
                                        />

                                        {/* Orbit Controls */}
                                        <OrbitControls
                                            ref={controlsRef}
                                            enablePan={true}
                                            enableZoom={true}
                                            enableRotate={true}
                                            minDistance={3}
                                            maxDistance={15}
                                            minPolarAngle={0.2}
                                            maxPolarAngle={Math.PI / 2 - 0.1}
                                            target={[0, 0.5, 0]}
                                            dampingFactor={0.08}
                                            enableDamping={true}
                                        />
                                    </Suspense>
                                </Canvas>

                                {/* Canvas overlay badge */}
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    3D Interactive
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Sidebar — Controls */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="lg:col-span-1 space-y-4"
                        >
                            <RoomControls
                                onCameraPreset={handleCameraPreset}
                                onResetView={handleResetView}
                            />

                            {/* Selected product info card */}
                            {selectedProduct && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-5 border border-gray-100"
                                >
                                    <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">
                                        Currently Viewing
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl shadow-inner border border-white/50"
                                            style={{ backgroundColor: selectedProduct.color }}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedProduct.name}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Color applied to mannequin
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default VirtualRoom;
