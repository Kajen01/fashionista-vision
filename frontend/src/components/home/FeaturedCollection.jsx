import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Eye } from 'lucide-react';
import QuickViewModal from "../common/QuickViewModal";

const FeaturedCollection = () => {
  const { filteredProducts } = useProducts();
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(16);
  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setVisibleProducts(filteredProducts.slice(0, visibleCount));
  }, [filteredProducts, visibleCount]);

  const handleQuickView = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleLoadMore = () => {
    const newCount = Math.min(visibleCount + 12, filteredProducts.length);
    setVisibleProducts(filteredProducts.slice(0, newCount));
    setVisibleCount(newCount);
  };
  
  const calculateFinalPrice = (price, discount) => {
    return Math.round(price - (price * discount) / 100);
  };

  return (
    <section id="featuredCollection" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Featured Collection
          </h2>
          <p className="text-xl text-gray-600 font-accent">
            Discover our handpicked selection of premium fashion pieces
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {visibleProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative group">
                <img
                  src={product.image?.url ? `http://localhost:5000${product.image.url}` : product.image}
                  alt={product.name}
                  className="w-full h-64 object-cover"
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
                <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-rose-600">LKR {calculateFinalPrice(product.price, product.discount)}</span>
                    <span className="text-sm text-gray-500 line-through">LKR {product.price}</span>
                  </div>
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

        {visibleProducts.length < filteredProducts.length && (
          <div className="text-center mt-12">
            <button
              onClick={handleLoadMore}
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-full hover:bg-gray-200 transition-colors duration-200 font-semibold"
            >
              Load More Products
            </button>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

    </section>
  );
};

export default FeaturedCollection;