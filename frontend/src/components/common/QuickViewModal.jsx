// src/components/products/QuickViewModal.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useCart } from "../../context/CartContext";

const defaultSizes = ["Free Size", "XS", "S", "M", "L", "XL"];
const defaultColors  = ["Black", "White", "Navy", "Beige"];

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  // Reset selection when product changes / modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSize(null);
      setSelectedColor(null);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) return;
    addToCart(product, selectedSize, selectedColor);
    onClose();
  };

  // Ensure we have a portal root (document.body fallback)
  const portalRoot = typeof document !== "undefined" ? document.body : null;
  if (!portalRoot) return null;

  const calculateFinalPrice = (price, discount) => {
    return Math.round(price - (price * discount) / 100);
  };
  
  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - placed above navbar (z-50) and with blur */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose} // click outside closes
          />

          {/* Modal box - above overlay */}
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={onClose} // also allow closing by clicking outside container area
          >
            {/* The inner container stops propagation so clicks inside don't close the modal */}
            <div
              className="bg-white rounded-2xl w-full max-w-3xl md:max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                  {product.name}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-200 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 grid md:grid-cols-2 gap-6 md:gap-8">
                <div className="flex justify-center">
                  <img
                    src={product.image?.url ? `http://localhost:5000${product.image.url}` : product.image}
                    alt={product.name}
                    className="w-full max-w-sm rounded-lg object-cover shadow-md"
                  />
                </div>

                <div>
                  <p className="text-gray-600 mb-4">{product.description}</p>

                  <div className="flex items-center space-x-3 mb-6">
                    <span className="text-3xl font-bold text-rose-600">LKR {calculateFinalPrice(product.price, product.discount)}</span>
                    <span className="text-lg text-gray-500 line-through">
                      LKR {product.price}
                    </span>
                    <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                      {product.discount}% OFF
                    </span>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Size</h4>
                    <div className="flex flex-wrap gap-2">
                      {(product?.availableSizes?.length ? product.availableSizes : defaultSizes).map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 rounded border text-sm transition-colors ${
                            selectedSize === size
                              ? "border-rose-500 text-rose-600 bg-rose-50"
                              : "border-gray-300 hover:border-rose-500 hover:text-rose-500"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Color</h4>
                    <div className="flex flex-wrap gap-2">
                      {(product?.availableColors?.length ? product.availableColors : defaultColors).map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 rounded border text-sm transition-colors ${
                            selectedColor === color
                              ? "border-rose-500 text-rose-600 bg-rose-50"
                              : "border-gray-300 hover:border-rose-500 hover:text-rose-500"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedSize || !selectedColor}
                    className={`w-full py-3 rounded-lg text-white font-semibold text-lg transition-colors ${
                      selectedSize && selectedColor ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {selectedSize && selectedColor ? "Add to Cart" : "Select Size & Color First"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
};

export default QuickViewModal;
