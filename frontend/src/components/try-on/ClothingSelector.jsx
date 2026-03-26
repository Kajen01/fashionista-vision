import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Share2, Save, Grid, List } from 'lucide-react';

const ClothingSelector = ({ onClothingSelect, selectedClothing }) => {
  const [selectedCategory, setSelectedCategory] = useState('dresses');
  const { getProductsByCategory } = useProducts();
  const { addToCart } = useCart();

  const categories = [
    { id: 'dresses', label: 'Dresses', icon: List },
    { id: 'tops', label: 'Tops', icon: Grid },
  ];

  const clothingItems = getProductsByCategory(selectedCategory);

  const handleSaveLook = () => {
    if (selectedClothing) {
      console.log('Look saved:', selectedClothing);
      // Add toast notification here
    }
  };

  const handleShareLook = () => {
    if (selectedClothing) {
      console.log('Look shared:', selectedClothing);
      // Add share functionality here
    }
  };

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Select Clothing</h3>
          <div className="flex space-x-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-rose-100 hover:text-rose-600'
                }`}
              >
                <category.icon className="w-4 h-4 inline mr-1" />
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clothing Items */}
        <div id="clothingGrid" className="space-y-4 max-h-96 overflow-y-auto">
          {clothingItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onClothingSelect(item)}
              className={`clothing-item border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                selectedClothing?.id === item.id
                  ? 'border-rose-500 bg-rose-50'
                  : 'border-gray-200 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                  <p className="text-rose-600 font-bold">${item.price}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleSaveLook}
            disabled={!selectedClothing}
            className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 inline mr-2" />
            Save This Look
          </button>
          <button
            onClick={handleShareLook}
            disabled={!selectedClothing}
            className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:border-gray-400 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 className="w-4 h-4 inline mr-2" />
            Share Look
          </button>
          <button
            onClick={() => selectedClothing && addToCart(selectedClothing)}
            disabled={!selectedClothing}
            className="w-full bg-rose-600 text-white py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4 inline mr-2" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClothingSelector;
