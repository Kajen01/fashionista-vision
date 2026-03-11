import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Sparkles, Ruler, Camera } from 'lucide-react';

import ModelSelector from '../components/try-on/ModelSelector';
import VirtualFittingRoom from '../components/try-on/VirtualFittingRoom';
import ClothingSelector from '../components/try-on/ClothingSelector';
import SizeGuideModal from '../components/try-on/SizeGuideModal';

const TryOn = () => {
  const [selectedModel, setSelectedModel] = useState('model1');
  const [selectedClothing, setSelectedClothing] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    toast.success(`Model ${model} selected`);
  };

  const handleClothingSelect = (clothing) => {
    setSelectedClothing(clothing);
    toast.success(`${clothing.name} selected for try-on`);
  };

  /** Store both the File object (for backend FormData) and a preview URL */
  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setUploadedPhoto({ file, preview: previewUrl, name: file.name });
    toast.success('Photo uploaded successfully');
  };

  return (
    <div className="pt-16">
      {/* ── hero ───────────────────────────────────────────── */}
      <section className="hero-bg pt-16 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6"
          >
            Virtual Try-On Studio
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-lg md:text-xl text-gray-600 font-accent mb-8 leading-relaxed max-w-3xl mx-auto"
          >
            Upload a photo for static fitting, or switch to live
            camera mode to preview dresses attached to your body in
            real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600"
          >
            <div className="flex items-center bg-white/70 px-4 py-2 rounded-full shadow-sm">
              <Camera className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Live Camera Try-On</span>
            </div>
            <div className="flex items-center bg-white/70 px-4 py-2 rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Pose-Aware Dress Placement</span>
            </div>
            <div className="flex items-center bg-white/70 px-4 py-2 rounded-full shadow-sm">
              <Ruler className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Scale + Offset Controls</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── main grid: 4-column layout ────────────────────── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            <ModelSelector
              selectedModel={selectedModel}
              onModelSelect={handleModelSelect}
              onPhotoUpload={handlePhotoUpload}
              uploadedPhoto={uploadedPhoto?.preview || null}
            />

            <VirtualFittingRoom
              selectedModel={selectedModel}
              selectedClothing={selectedClothing}
              uploadedPhoto={uploadedPhoto}
              onOpenSizeGuide={() => setShowSizeGuide(true)}
            />

            <ClothingSelector
              onClothingSelect={handleClothingSelect}
              selectedClothing={selectedClothing}
            />
          </div>
        </div>
      </section>

      <SizeGuideModal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
      />
    </div>
  );
};

export default TryOn;