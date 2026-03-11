import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Save, Grid, List, Shirt } from 'lucide-react';

const getItemImage = (item) =>
  item?.image ||
  item?.mainImage ||
  item?.imageUrl ||
  item?.thumbnail ||
  item?.photo ||
  '';

const ClothingSelector = ({ onClothingSelect, selectedClothing }) => {
  const [selectedCategory, setSelectedCategory] = useState('dresses');
  const { getProductsByCategory } = useProducts();
  const { addToCart } = useCart();

  const categories = [
    { id: 'dresses', label: 'Dresses', icon: List },
    { id: 'tops', label: 'Tops', icon: Grid },
    { id: 'jackets', label: 'Jackets', icon: Shirt },
  ];

  const clothingItems = useMemo(() => {
    const items = getProductsByCategory?.(selectedCategory) || [];
    return items.map((item) => ({
      ...item,
      category: item?.category || selectedCategory,
      image: getItemImage(item),
    }));
  }, [getProductsByCategory, selectedCategory]);

  const handleSaveLook = () => {
    if (!selectedClothing) return;
    console.log('Look saved:', selectedClothing);
  };

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Select Clothing
          </h3>

          <div className="flex flex-wrap gap-2 justify-end">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${selectedCategory === cat.id
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-rose-100 hover:text-rose-600'
                  }`}
              >
                <cat.icon className="w-4 h-4 inline mr-1" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* items list */}
        <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
          {clothingItems.length === 0 && (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
              No clothing items found for this category.
            </div>
          )}

          {clothingItems.map((item) => {
            const itemKey =
              item.id || item._id || item.name || Math.random();
            const isSelected =
              selectedClothing?.id === item.id ||
              selectedClothing?._id === item._id;

            return (
              <motion.div
                key={itemKey}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onClothingSelect(item)}
                className={`border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${isSelected
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-gray-200 hover:border-rose-300'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs text-gray-500 capitalize mt-1">
                      {item.category || selectedCategory}
                    </p>
                    <p className="text-rose-600 font-bold mt-1">
                      ${item.price ?? '--'}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* action buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleSaveLook}
            disabled={!selectedClothing}
            className="w-full flex items-center justify-center rounded-xl bg-gray-900 text-white py-3 hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Look
          </button>

          {selectedClothing && (
            <button
              onClick={() => addToCart(selectedClothing)}
              className="w-full flex items-center justify-center rounded-xl bg-rose-500 text-white py-3 hover:bg-rose-600 transition-colors"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClothingSelector;