import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useProducts, useProductsModel } from "../../context/ProductsContext";
import { useCart } from "../../context/CartContext";
import { ShoppingCart, Eye } from "lucide-react";
import QuickViewModal from "../common/QuickViewModal";

const ResultsSection = ({ recommendedProducts = [] }) => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendedProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative group">
              <img
                src={
                  product.image?.url
                    ? `http://localhost:5000${product.image.url}`
                    : product.image
                }
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
                {/* <span className="text-sm text-gray-500 line-through">LKR {product.price}</span> */}
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {product.discount}% OFF
                </span>
              </div>
              <button
                onClick={() => handleQuickView(product)}
                className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

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
