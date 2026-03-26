// src/components/products/QuickViewModal.jsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../hooks/useAuth";
import { useProductsModel } from "../../context/ProductsContext";
import { resolveProductImageUrl } from "../../utils/runtimeConfig";
import { productReviewApi } from "../../utils/productReviewApi";
import { getPersistentProductId, getProductRatingSummary } from "../../utils/ratingHelpers";
import ProductStarRating from "../ratings/ProductStarRating";
import ProductReviewForm from "../ratings/ProductReviewForm";

const defaultSizes = ["Free Size", "XS", "S", "M", "L", "XL"];
const defaultColors = ["Black", "White", "Navy", "Beige"];

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const { isAuthenticated, token } = useAuth();
  const { refreshMongoProducts } = useProductsModel();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [loadingReviewData, setLoadingReviewData] = useState(false);

  const persistentProductId = getPersistentProductId(product);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSize(null);
      setSelectedColor(null);
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (!product || !isOpen) {
      setRatingSummary(null);
      setMyReview(null);
      setLoadingReviewData(false);
      return;
    }

    setRatingSummary(getProductRatingSummary(product));

    if (!persistentProductId) {
      setMyReview(null);
      setLoadingReviewData(false);
      return;
    }

    const loadReviewData = async () => {
      setLoadingReviewData(true);

      try {
        const [summaryResponse, myReviewResponse] = await Promise.all([
          productReviewApi.getProductSummary(persistentProductId),
          isAuthenticated
            ? productReviewApi.getMyProductReview(persistentProductId, token)
            : Promise.resolve({ review: null }),
        ]);

        setRatingSummary(getProductRatingSummary(summaryResponse));
        setMyReview(myReviewResponse.review || null);
      } catch (error) {
        setRatingSummary(getProductRatingSummary(product));
        setMyReview(null);
      } finally {
        setLoadingReviewData(false);
      }
    };

    loadReviewData();
  }, [isAuthenticated, isOpen, persistentProductId, product, token]);

  if (!product) return null;

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) return;
    const added = addToCart(product, selectedSize, selectedColor);

    if (added) {
      onClose();
    }
  };

  const portalRoot = typeof document !== "undefined" ? document.body : null;
  if (!portalRoot) return null;

  const calculateFinalPrice = (price, discount) => {
    return Math.round(price - (price * discount) / 100);
  };

  const handleReviewSaved = async (response) => {
    setRatingSummary(getProductRatingSummary(response.summary || {}));
    setMyReview(response.review || null);

    if (persistentProductId) {
      try {
        await refreshMongoProducts();
      } catch (error) {
        // Keep the modal state updated even if the shared product refresh fails.
      }
    }
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={onClose}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-3xl md:max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
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

              <div className="p-6 grid md:grid-cols-2 gap-6 md:gap-8">
                <div className="flex justify-center">
                  <img
                    src={resolveProductImageUrl(product)}
                    alt={product.name}
                    className="w-full max-w-sm rounded-lg object-cover shadow-md"
                  />
                </div>

                <div>
                  <p className="text-gray-600 mb-4">{product.description}</p>

                  <ProductStarRating
                    product={product}
                    summary={ratingSummary}
                    size="lg"
                    className="mb-4"
                  />

                  {loadingReviewData ? (
                    <p className="mb-4 text-sm text-slate-500">Loading review details...</p>
                  ) : ratingSummary?.reviewCount > 0 ? (
                    <p className="mb-4 text-sm text-slate-500">
                      Style Match: {ratingSummary.styleMatchRatingAvg.toFixed(1)} | Quality: {ratingSummary.qualityRatingAvg.toFixed(1)}
                    </p>
                  ) : null}

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

                  {persistentProductId ? (
                    <ProductReviewForm
                      product={product}
                      initialReview={myReview}
                      onSaved={handleReviewSaved}
                    />
                  ) : null}
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
