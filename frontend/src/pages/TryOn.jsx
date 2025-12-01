import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Sparkles, Upload, Ruler } from 'lucide-react';
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

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedPhoto(e.target.result);
      toast.success('Photo uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="hero-bg pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-display font-bold text-gray-900 mb-6"
          >
            Virtual Try-On Studio
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 font-accent mb-8 leading-relaxed"
          >
            Experience the future of online shopping with our advanced virtual fitting room.
            See how clothes look on you before making a purchase.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center space-x-4 text-sm text-gray-500"
          >
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-green-500" />
              <span>Real-time Fitting</span>
            </div>
            <div className="flex items-center">
              <Ruler className="w-5 h-5 mr-2 text-green-500" />
              <span>Size Recommendations</span>
            </div>
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-green-500" />
              <span>Save & Share</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Virtual Try-On Interface */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Model Selection */}
            <ModelSelector
              selectedModel={selectedModel}
              onModelSelect={handleModelSelect}
              onPhotoUpload={handlePhotoUpload}
              uploadedPhoto={uploadedPhoto}
            />

            {/* Virtual Fitting Room */}
            <VirtualFittingRoom
              selectedModel={selectedModel}
              selectedClothing={selectedClothing}
              uploadedPhoto={uploadedPhoto}
            />

            {/* Clothing Selection */}
            <ClothingSelector
              onClothingSelect={handleClothingSelect}
              selectedClothing={selectedClothing}
            />
          </div>
        </div>
      </section>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
      />
    </div>
  );
};

export default TryOn;