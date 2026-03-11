import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  Palette,
  Ruler,
  Camera,
  Image as ImageIcon,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LiveTryOnCanvas from './LiveTryOnCanvas';

const ML_SERVICE_URL =
  process.env.REACT_APP_ML_SERVICE_URL || 'http://127.0.0.1:8002';

const modelImages = {
  model1:
    'https://kimi-web-img.moonshot.cn/img/www.fashiongonerogue.com/6280f1fa7e47b759494fcc5242218684a2185e48.jpg',
  model2:
    'https://kimi-web-img.moonshot.cn/img/cdn.cliqueinc.com/69c63837de5e945115bf7d4f4b12318e667a229b.jpg',
  model3:
    'https://kimi-web-img.moonshot.cn/img/thewowstyle.com/41fe89edc0b30e3fa37ae7767cae61827d476cb3.jpg',
};

const getClothingImage = (item) =>
  item?.image || item?.mainImage || item?.imageUrl || item?.thumbnail || '';

const getSizeScale = (size) =>
  ({ XS: 0.90, S: 0.97, M: 1.0, L: 1.06, XL: 1.12 }[size] || 1.0);

const VirtualFittingRoom = ({
  selectedModel,
  selectedClothing,
  uploadedPhoto,
  onOpenSizeGuide,
}) => {
  const [viewerMode, setViewerMode] = useState('live');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('original');
  const [debugMode, setDebugMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [photoTryOnResult, setPhotoTryOnResult] = useState(null);

  const [controls, setControls] = useState({
    scale: 1.0,
    waistScale: 1.0,
    xOffset: 0,
    yOffset: 0,
    rotation: 0,
    opacity: 0.96,
  });

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const colors = ['original', 'black', 'white', 'navy', 'red'];

  const fitQuality = useMemo(() => {
    const map = {
      XS: { text: 'Loose Fit', color: 'text-amber-500', width: '60%' },
      S: { text: 'Balanced Loose', color: 'text-yellow-500', width: '74%' },
      M: { text: 'Perfect Fit', color: 'text-emerald-500', width: '88%' },
      L: { text: 'Structured Fit', color: 'text-yellow-500', width: '72%' },
      XL: { text: 'Tight Fit', color: 'text-red-500', width: '48%' },
    };
    return map[selectedSize];
  }, [selectedSize]);

  useEffect(() => {
    setControls((prev) => ({ ...prev, scale: getSizeScale(selectedSize) }));
  }, [selectedSize]);

  const resetFitting = () => {
    setSelectedSize('M');
    setSelectedColor('original');
    setDebugMode(false);
    setPhotoTryOnResult(null);
    setControls({
      scale: 1.0,
      waistScale: 1.0,
      xOffset: 0,
      yOffset: 0,
      rotation: 0,
      opacity: 0.96,
    });
    toast.success('Fitting settings reset');
  };

  const generatePhotoTryOn = async () => {
    if (!uploadedPhoto?.file) {
      toast.error('Upload a photo first');
      return;
    }
    if (!selectedClothing) {
      toast.error('Select a garment first');
      return;
    }

    const garmentUrl = getClothingImage(selectedClothing);
    if (!garmentUrl) {
      toast.error('Selected garment image is missing');
      return;
    }

    try {
      setIsGenerating(true);
      setPhotoTryOnResult(null);

      const garmentResp = await fetch(garmentUrl);
      const garmentBlob = await garmentResp.blob();

      const params = {
        category: (selectedClothing.category || 'dress')
          .replace('dresses', 'dress')
          .replace('tops', 'top'),
        scale: controls.scale,
        waistScale: controls.waistScale,
        xOffset: controls.xOffset,
        yOffset: controls.yOffset,
        rotation: controls.rotation,
      };

      const formData = new FormData();
      formData.append('user_image', uploadedPhoto.file);
      formData.append(
        'garment_image',
        garmentBlob,
        selectedClothing.name || 'garment.png',
      );
      formData.append('params', JSON.stringify(params));

      const resp = await fetch(`${ML_SERVICE_URL}/tryon`, {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();

      if (!resp.ok || data.error) {
        throw new Error(data.error || 'Try-on generation failed');
      }

      setPhotoTryOnResult(data.tryon_image);
      toast.success('Photo try-on generated');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to generate photo try-on');
    } finally {
      setIsGenerating(false);
    }
  };

  const previewImage =
    photoTryOnResult || uploadedPhoto?.preview || modelImages[selectedModel];

  /* ── sliders config ─────────────────────────────────────────── */

  const sliders = [
    { key: 'scale', label: 'Overall Scale', min: 0.8, max: 1.35, step: 0.01 },
    { key: 'waistScale', label: 'Lower Width', min: 0.75, max: 1.35, step: 0.01 },
    { key: 'xOffset', label: 'Horizontal Offset', min: -160, max: 160, step: 1 },
    { key: 'yOffset', label: 'Vertical Offset', min: -180, max: 180, step: 1 },
    { key: 'rotation', label: 'Rotation', min: -18, max: 18, step: 0.2 },
    { key: 'opacity', label: 'Opacity', min: 0.65, max: 1.0, step: 0.01 },
  ];

  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* ── header ─────────────────────────────────────── */}
        <div className="px-6 py-5 border-b bg-gradient-to-r from-rose-50 to-pink-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">
                Virtual Fitting Room
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Live pose-aware try-on for dresses, tops, and jackets.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewerMode('live')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewerMode === 'live'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Live
              </button>
              <button
                onClick={() => setViewerMode('photo')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewerMode === 'photo'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Photo
              </button>
            </div>
          </div>
        </div>

        {/* ── main area ───────────────────────────────────── */}
        <div className="p-6">
          {viewerMode === 'live' ? (
            <LiveTryOnCanvas
              selectedClothing={selectedClothing}
              controls={controls}
              debugMode={debugMode}
              mirrored
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
                <img
                  src={previewImage}
                  alt="Try-on preview"
                  className="w-full max-h-[720px] object-cover bg-gray-100"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={generatePhotoTryOn}
                  disabled={
                    isGenerating ||
                    !uploadedPhoto?.file ||
                    !selectedClothing
                  }
                  className="px-5 py-3 rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 transition-colors"
                >
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  {isGenerating
                    ? 'Generating…'
                    : 'Generate Photo Try-On'}
                </button>

                <button
                  onClick={onOpenSizeGuide}
                  className="px-5 py-3 rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                >
                  <Ruler className="w-4 h-4 inline mr-2" />
                  Open Size Guide
                </button>
              </div>

              {!uploadedPhoto?.file && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                  Upload your own photo from the left panel to use
                  backend photo try-on.
                </div>
              )}
            </div>
          )}

          {/* ── controls row ──────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
            {/* fitting controls */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border rounded-2xl p-5 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  Fitting Controls
                </h4>
                <button
                  onClick={resetFitting}
                  className="text-sm text-rose-600 hover:text-rose-700"
                >
                  <RotateCcw className="w-4 h-4 inline mr-1" />
                  Reset
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Size
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) =>
                      setSelectedSize(e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    {sizes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    <Palette className="w-4 h-4 inline mr-1" />
                    Color
                  </label>
                  <select
                    value={selectedColor}
                    onChange={(e) =>
                      setSelectedColor(e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    {colors.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() +
                          c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-700 mb-2">
                    <span>Fit Quality</span>
                    <span
                      className={`font-medium ${fitQuality.color}`}
                    >
                      {fitQuality.text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: fitQuality.width }}
                    />
                  </div>
                </div>

                <button
                  onClick={onOpenSizeGuide}
                  className="w-full rounded-xl border border-gray-300 py-3 hover:bg-white transition-colors"
                >
                  <Ruler className="w-4 h-4 inline mr-2" />
                  View Size Guide
                </button>
              </div>
            </motion.div>

            {/* live alignment tuning */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border rounded-2xl p-5 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  Live Alignment Tuning
                </h4>
                <button
                  onClick={() =>
                    setDebugMode((prev) => !prev)
                  }
                  className={`text-sm px-3 py-2 rounded-lg transition-colors ${debugMode
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  <SlidersHorizontal className="w-4 h-4 inline mr-2" />
                  {debugMode ? 'Debug On' : 'Debug Off'}
                </button>
              </div>

              <div className="space-y-4">
                {sliders.map((s) => (
                  <div key={s.key}>
                    <div className="flex justify-between text-sm text-gray-700 mb-2">
                      <span>{s.label}</span>
                      <span>{controls[s.key]}</span>
                    </div>
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={controls[s.key]}
                      onChange={(e) =>
                        setControls((prev) => ({
                          ...prev,
                          [s.key]: Number(
                            e.target.value,
                          ),
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-white border p-4 text-sm text-gray-600">
                <div className="flex items-start">
                  <Palette className="w-4 h-4 mr-2 mt-0.5 text-rose-500 shrink-0" />
                  <p>
                    Use the sliders to fine-tune how the
                    dress follows the shoulder and hip
                    region. Debug mode shows the body
                    alignment quad and skeleton.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualFittingRoom;