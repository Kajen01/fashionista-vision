import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Calculator } from 'lucide-react';

const SizeGuideModal = ({ isOpen, onClose }) => {
  const [measurements, setMeasurements] = useState({
    height: '',
    bust: '',
    waist: '',
    hips: ''
  });

  const [recommendedSize, setRecommendedSize] = useState('M');

  const handleMeasurementChange = (field, value) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const calculateSize = () => {
    // Simple size calculation logic
    const { bust, waist, hips } = measurements;
    if (bust && waist && hips) {
      if (bust < 82 && waist < 62 && hips < 86) {
        setRecommendedSize('XS');
      } else if (bust < 86 && waist < 66 && hips < 90) {
        setRecommendedSize('S');
      } else if (bust < 90 && waist < 70 && hips < 94) {
        setRecommendedSize('M');
      } else if (bust < 94 && waist < 74 && hips < 98) {
        setRecommendedSize('L');
      } else {
        setRecommendedSize('XL');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-display font-bold text-gray-900">Size Guide</h3>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Measurement Input */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      <Ruler className="w-5 h-5 inline mr-2" />
                      Enter Your Measurements
                    </h4>
                    <div className="space-y-4">
                      {[
                        { field: 'height', label: 'Height (cm)', placeholder: '165' },
                        { field: 'bust', label: 'Bust (cm)', placeholder: '86' },
                        { field: 'waist', label: 'Waist (cm)', placeholder: '66' },
                        { field: 'hips', label: 'Hips (cm)', placeholder: '92' }
                      ].map((field) => (
                        <div key={field.field}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                          </label>
                          <input
                            type="number"
                            value={measurements[field.field]}
                            onChange={(e) => handleMeasurementChange(field.field, e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-transform focus:scale-105"
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={calculateSize}
                      className="w-full mt-6 bg-rose-600 text-white py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-semibold flex items-center justify-center space-x-2"
                    >
                      <Calculator className="w-5 h-5" />
                      <span>Get My Size Recommendation</span>
                    </button>
                  </div>

                  {/* Size Chart */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Size Chart</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Size</th>
                            <th className="text-left py-2">Bust</th>
                            <th className="text-left py-2">Waist</th>
                            <th className="text-left py-2">Hips</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-600">
                          {[
                            { size: 'XS', bust: '78-82 cm', waist: '58-62 cm', hips: '84-88 cm' },
                            { size: 'S', bust: '82-86 cm', waist: '62-66 cm', hips: '88-92 cm' },
                            { size: 'M', bust: '86-90 cm', waist: '66-70 cm', hips: '92-96 cm' },
                            { size: 'L', bust: '90-94 cm', waist: '70-74 cm', hips: '96-100 cm' },
                            { size: 'XL', bust: '94-98 cm', waist: '74-78 cm', hips: '100-104 cm' }
                          ].map((row) => (
                            <tr key={row.size} className="border-b">
                              <td className="py-2 font-medium">{row.size}</td>
                              <td className="py-2">{row.bust}</td>
                              <td className="py-2">{row.waist}</td>
                              <td className="py-2">{row.hips}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 p-4 bg-rose-50 rounded-lg">
                      <h5 className="font-medium text-rose-800 mb-2">Size Recommendation</h5>
                      <p className="text-sm text-rose-700">
                        Based on your measurements, we recommend size <strong>{recommendedSize}</strong> for the best fit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SizeGuideModal;