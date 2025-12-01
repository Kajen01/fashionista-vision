import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Palette, Ruler } from 'lucide-react';

const VirtualFittingRoom = ({ selectedModel, selectedClothing, uploadedPhoto }) => {
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('original');
  const [fitQuality, setFitQuality] = useState({ text: 'Perfect Fit', color: 'green', width: '85%' });

  const modelImages = {
    model1: 'https://kimi-web-img.moonshot.cn/img/www.fashiongonerogue.com/6280f1fa7e47b759494fcc5242218684a2185e48.jpg',
    model2: 'https://kimi-web-img.moonshot.cn/img/cdn.cliqueinc.com/69c63837de5e945115bf7d4f4b12318e667a229b.jpg',
    model3: 'https://kimi-web-img.moonshot.cn/img/thewowstyle.com/41fe89edc0b30e3fa37ae7767cae61827d476cb3.jpg',
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const colors = ['original', 'black', 'white', 'navy', 'red'];

  const updateFitQuality = (size) => {
    const qualities = {
      'XS': { text: 'Loose Fit', color: 'orange', width: '60%' },
      'S': { text: 'Slightly Loose', color: 'yellow', width: '75%' },
      'M': { text: 'Perfect Fit', color: 'green', width: '85%' },
      'L': { text: 'Slightly Tight', color: 'yellow', width: '70%' },
      'XL': { text: 'Tight Fit', color: 'red', width: '45%' }
    };
    setFitQuality(qualities[size]);
  };

  const resetFitting = () => {
    setSelectedSize('M');
    setSelectedColor('original');
    setFitQuality({ text: 'Perfect Fit', color: 'green', width: '85%' });
  };

  return (
    <div className="lg:col-span-1">
      <div className="virtual-fitting-room mb-4">
        <div className="relative h-96 flex items-center justify-center p-8">
          <div id="modelDisplay" className="relative">
            <img
              id="currentModel"
              src={uploadedPhoto || modelImages[selectedModel]}
              alt="Model"
              className="h-80 object-contain"
            />
            {selectedClothing && (
              <div id="clothingOverlay" className="fitting-overlay">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  className="absolute inset-0 bg-rose-100 rounded-lg"
                  style={{
                    backgroundColor: selectedColor === 'original' ? '#F7E7E1' : selectedColor,
                    mixBlendMode: 'multiply'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fitting Controls */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Fitting Controls</h4>
          <button
            onClick={resetFitting}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Size</label>
            <select
              value={selectedSize}
              onChange={(e) => {
                setSelectedSize(e.target.value);
                updateFitQuality(e.target.value);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              <Palette className="w-4 h-4 inline mr-1" />
              Color
            </label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              {colors.map(color => (
                <option key={color} value={color}>
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">
            Fit Quality: <span className={`font-medium text-${fitQuality.color}-600`}>{fitQuality.text}</span>
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: fitQuality.width }}
              className={`bg-${fitQuality.color}-500 h-2 rounded-full`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualFittingRoom;