import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Eye } from "lucide-react";
import QuickViewModal from "../common/QuickViewModal";
import { resolveProductImageUrl } from "../../utils/runtimeConfig";

const ResultsSection = ({
  highlyRecommendedProducts = [],
  otherRecommendedProducts = [],
  predictedLabel = '',
  usedFallback = false,
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuickView = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const calculateFinalPrice = (price, discount) => {
    return Math.round(price - (price * discount) / 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-8"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Perfect Matches for You!
        </h3>
        <p className="text-gray-600">
          Based on your photo, here are our top recommendations:
        </p>
      </div>

      {highlyRecommendedProducts.length === 0 && otherRecommendedProducts.length === 0 && (
        <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-left">
          <h4 className="text-lg font-semibold text-amber-700">No strong catalog match yet</h4>
          <p className="mt-2 text-sm text-amber-700">
            The model predicted <span className="font-semibold">{predictedLabel || 'an item'}</span>, but the current MongoDB catalog does not contain a close match.
          </p>
        </div>
      )}

      {usedFallback && (highlyRecommendedProducts.length > 0 || otherRecommendedProducts.length > 0) && (
        <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-blue-200 bg-blue-50 px-6 py-5 text-left">
          <h4 className="text-lg font-semibold text-blue-700">Showing the closest alternatives</h4>
          <p className="mt-2 text-sm text-blue-700">
            We could not find a direct name match, so these results were ranked using color, gender, and garment-type signals.
          </p>
        </div>
      )}

      {/* HIGHLY RECOMMENDED */}
      {highlyRecommendedProducts.length > 0 && (
        <div className="mb-10 border-4 border-green-500 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-green-700 mb-6 text-center">
            Highly Recommended For You
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlyRecommendedProducts.map((product, index) => (
              <motion.div
                key={product.id || product._id || index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative group">
                  <img
                    src={resolveProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={() => handleQuickView(product)}
                      className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Quick View</span>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-rose-600">
                      LKR {calculateFinalPrice(product.price, product.discount)}
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {product.discount}% OFF
                    </span>
                  </div>
                  <button
                    onClick={() => handleQuickView(product)}
                    className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Quick View & Add</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* OTHER RECOMMENDED */}
      {otherRecommendedProducts.length > 0 && (
        <div className="border-4 border-blue-500 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-blue-700 mb-6 text-center">
            More Recommendations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherRecommendedProducts.map((product, index) => (
              <motion.div
                key={product.id || product._id || index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative group">
                  <img
                    src={resolveProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={() => handleQuickView(product)}
                      className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Quick View</span>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-rose-600">
                      LKR {calculateFinalPrice(product.price, product.discount)}
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {product.discount}% OFF
                    </span>
                  </div>
                  <button
                    onClick={() => handleQuickView(product)}
                    className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Quick View & Add</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </motion.div>
  );
};

export default ResultsSection;
