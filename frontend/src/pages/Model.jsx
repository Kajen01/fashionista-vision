import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Upload, Camera, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProcessingSection from '../components/model/ProcessingSection';
import ResultsSection from '../components/model/ResultsSection';
import { useProductsModel } from "../context/ProductsContext";
import { buildMlApiUrl } from '../utils/runtimeConfig';
import { recommendProducts } from '../utils/recommendationEngine';

const Model = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const uploadRef = useRef(null);
  const [recommendedProducts, setRecommendedProducts] = useState({
    highlyRecommendedProducts: [],
    otherRecommendedProducts: []
  });
  const [matchSummary, setMatchSummary] = useState(null);
  const [apiError, setApiError] = useState('');
  const { mongodbProducts } = useProductsModel();
  const [predictedLabel, setPredictedLabel] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [multiAttrs, setMultiAttrs] = useState({});
  
  const predictFromAPI = async (imageFile) => {
    setIsProcessing(true);
    setShowResults(false);
    setApiError('');
    setRecommendedProducts({
      highlyRecommendedProducts: [],
      otherRecommendedProducts: [],
    });
    setMatchSummary(null);
    setPredictedLabel('');
    setConfidence(null);
    setMultiAttrs({});

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch(buildMlApiUrl('/predict_multi'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const singleModels = Array.isArray(data.single_models) ? data.single_models : [];

        if (singleModels.length > 0) {
          const bestModel = singleModels.reduce((prev, curr) =>
            curr.confidence > prev.confidence ? curr : prev
          );

          const cleanedName = bestModel.predicted_class.replace(/_/g, " ");
          setPredictedLabel(cleanedName);
          setConfidence(bestModel.confidence);
        } else {
          throw new Error('Prediction API returned no single-model predictions.');
        }

        const bestModel = singleModels.reduce((prev, curr) =>
          curr.confidence > prev.confidence ? curr : prev
        );
        const cleanedName = bestModel.predicted_class.replace(/_/g, " ");
        const nextMultiAttrs = data.multi_model || {};
        const nextRecommendations = recommendProducts(mongodbProducts, {
          predictedLabel: cleanedName,
          confidence: bestModel.confidence,
          multiAttrs: nextMultiAttrs,
        });

        setMultiAttrs(nextMultiAttrs);
        setRecommendedProducts({
          highlyRecommendedProducts: nextRecommendations.highlyRecommendedProducts,
          otherRecommendedProducts: nextRecommendations.otherRecommendedProducts,
        });
        setMatchSummary(nextRecommendations.summary);

        setShowResults(true);
      } else {
        let text;
        try {
          text = await response.text();
        } catch (e) {
          text = '<no body>';
        }
        console.error('API Error status:', response.status, text);
        const message = `Prediction API error ${response.status}`;
        setApiError(message);
        toast.error(message);
      }
    } catch (error) {
      console.error('API call failed:', error);
      setApiError(error.message || 'Failed to call prediction API');
      toast.error(error.message || 'Failed to call prediction API');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      toast.success('Photo uploaded successfully!');
    };
    reader.readAsDataURL(file);

    predictFromAPI(file);
  };

  const clearResults = () => {
    setRecommendedProducts({
      highlyRecommendedProducts: [],
      otherRecommendedProducts: [],
    });
    setMatchSummary(null);
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setIsProcessing(false);
    setShowResults(false);
    setApiError('');
    setPredictedLabel('');
    setConfidence(null);
    setMultiAttrs({});
    clearResults();

    // Scroll to Upload section
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
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
            AI-Powered Style Recommendations
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 font-accent mb-8 leading-relaxed"
          >
            Upload your photo and let our advanced AI analyze your style, body type, and preferences
            to provide personalized fashion recommendations just for you.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center space-x-4 text-sm text-gray-500"
          >
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              <span>AI Analysis</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              <span>Personalized Results</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-16" ref={uploadRef}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
                Upload Your Photo
              </h2>
              <p className="text-gray-600 font-accent">
                Take or upload a clear photo of yourself for the best AI analysis results
              </p>
            </motion.div>

            {/* Upload Zone */}
            {!uploadedImage && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <input
                  type="file"
                  id="fileUpload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => document.getElementById('fileUpload').click()}
                  className="upload-zone rounded-xl p-12 text-center cursor-pointer"
                >
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Drop your photo here or click to browse
                  </h3>
                  <p className="text-gray-500 mb-4">Supports JPG, PNG, and HEIC formats</p>
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Camera className="w-4 h-4 mr-1" />
                      <span>Clear background</span>
                    </div>
                    <div className="flex items-center">
                      <span>Good lighting</span>
                    </div>
                    <div className="flex items-center">
                      <span>Front view</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Image Preview */}
            {uploadedImage && !isProcessing && !showResults && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mb-8"
              >
                <div className="mb-4">
                  <img
                    src={uploadedImage}
                    alt="Uploaded Photo"
                    className="max-w-full max-h-64 rounded-lg shadow-lg mx-auto"
                  />
                  <p className="text-sm text-gray-500 mt-2">Photo uploaded successfully!</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={resetUpload}
                    className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-full hover:border-gray-400 transition-colors duration-200 font-semibold"
                  >
                    Upload Different Photo
                  </button>
                </div>
              </motion.div>
            )}

            {/* Processing Section */}
            {isProcessing && <ProcessingSection />}

            {apiError && !isProcessing && (
              <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-left">
                <h3 className="text-lg font-semibold text-red-700">Prediction failed</h3>
                <p className="mt-2 text-sm text-red-600">
                  {apiError}. Make sure the backend and `predict_multi_api.py` service are running, then try another image.
                </p>
              </div>
            )}

            {/* Prediction Summary Card */}
            {showResults && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-3xl mx-auto mb-8"
              >
                <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-center">
                  
                  {/* Uploaded Image Preview */}
                  <img
                    src={uploadedImage}
                    alt="Uploaded Preview"
                    className="w-40 h-40 object-cover rounded-lg shadow-md"
                  />

                  {/* Prediction Info */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      AI Prediction Summary
                    </h3>

                    <p className="text-gray-600 text-lg mb-2">
                      <span className="font-semibold text-gray-800">Category:</span>{" "}
                      <span className="text-rose-600 font-bold">
                        {predictedLabel || "N/A"}
                      </span>
                    </p>

                    <p className="text-gray-600 text-lg">
                      <span className="font-semibold text-gray-800">Confidence:</span>{" "}
                      <span className="text-green-600 font-bold">
                        {typeof confidence === 'number' ? (confidence * 100).toFixed(2) + "%" : "N/A"}
                      </span>
                    </p>

                    {matchSummary && (
                      <p className="mt-3 text-sm text-gray-500">
                        {matchSummary.totalMatches > 0
                          ? `Ranked ${matchSummary.totalMatches} catalog matches${matchSummary.usedFallback ? ' using attribute fallback' : ''}.`
                          : 'No strong product matches were found in the current catalog.'}
                      </p>
                    )}
                  </div>

                  {/* Multi-Model Attributes */}  
                  <div className="flex flex-col gap-1 mt-4">
                    <p className="text-gray-600 text-lg">
                      <span className="font-semibold text-gray-800">Base Colour:</span>{" "}
                      <span className="text-blue-600 font-bold">
                        {multiAttrs?.baseColour || "N/A"}
                      </span>
                    </p>

                    <p className="text-gray-600 text-lg">
                      <span className="font-semibold text-gray-800">Gender:</span>{" "}
                      <span className="text-purple-600 font-bold">
                        {multiAttrs?.gender || "N/A"}
                      </span>
                    </p>

                    {/*
                    <p className="text-gray-600 text-lg">
                      <span className="font-semibold text-gray-800">Article Type:</span>{" "}
                      <span className="text-orange-600 font-bold">
                        {multiAttrs?.articleType || "N/A"}
                      </span>
                    </p>
                    */}

                  </div>
                </div>
              </motion.div>
            )}

            {/* Results Section */}
            {showResults && (
              <div className="flex flex-col items-center mt-6">
                <ResultsSection
                  highlyRecommendedProducts={recommendedProducts.highlyRecommendedProducts}
                  otherRecommendedProducts={recommendedProducts.otherRecommendedProducts}
                  predictedLabel={predictedLabel}
                  usedFallback={Boolean(matchSummary?.usedFallback)}
                />

                <div className="mt-6 w-full max-w-3xl rounded-2xl border border-rose-100 bg-rose-50 px-6 py-5 text-left">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-500">
                    Feedback Loop
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Rate how helpful the Model felt
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your profile now includes a dedicated Model feature rating card, so you can score this experience and help improve future recommendations.
                  </p>
                  <Link
                    to="/profile#model-feature-rating"
                    className="mt-4 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open Model Rating in Profile
                  </Link>
                </div>

                <button
                  onClick={resetUpload}
                  className="border-2 border-red-500 text-gray-700 px-8 py-3 rounded-full font-semibold mt-4
                            transition-all duration-200
                            hover:bg-red-500 hover:text-white hover:border-red-600"
                >
                  Upload Different Photo
                </button>
              </div>
            )}
            
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 font-accent">
              Simple steps to get your personalized style recommendations
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Upload Photo', description: 'Take or upload a clear photo of yourself for AI analysis' },
              { step: 2, title: 'AI Analysis', description: 'Our AI analyzes your body type, skin tone, and style preferences' },
              { step: 3, title: 'Get Results', description: 'Receive personalized fashion recommendations and styling tips' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-rose-600">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 font-accent">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Model;
