import React from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';

/**
 * Product picker sidebar for the 3D virtual room.
 * Lists products from the database and test images.
 * When a product is selected, its image appears on the display board
 * and its color tints the mannequin.
 */

// Default test products when no products from DB are available
const TEST_PRODUCTS = [
    {
        _id: 'test-1',
        name: 'Blah Blah Blah Tee',
        imageUrl: process.env.PUBLIC_URL + '/test-images/test-2.png',
        color: '#6a8fa7',
    },
    {
        _id: 'test-2',
        name: 'Classic Red Dress',
        imageUrl: null,
        color: '#c0392b',
    },
    {
        _id: 'test-3',
        name: 'Navy Blazer',
        imageUrl: null,
        color: '#2c3e50',
    },
    {
        _id: 'test-4',
        name: 'Emerald Gown',
        imageUrl: null,
        color: '#27ae60',
    },
    {
        _id: 'test-5',
        name: 'Lavender Blouse',
        imageUrl: null,
        color: '#9b59b6',
    },
    {
        _id: 'test-6',
        name: 'Coral Sundress',
        imageUrl: null,
        color: '#e74c3c',
    },
];

const ProductPicker = ({ products = [], selectedProduct, onSelectProduct }) => {
    // If DB products are available, use those; otherwise fall back to test products
    const displayProducts = products.length > 0
        ? products.map((p) => ({
            _id: p._id,
            name: p.name,
            imageUrl: p.image?.url ? `http://localhost:5000${p.image.url}` : null,
            color: p.availableColors?.[0] || '#e8a0bf',
        }))
        : TEST_PRODUCTS;

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-rose-500" />
                Select Dress
            </h3>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {displayProducts.map((product) => {
                    const isSelected = selectedProduct?._id === product._id;
                    return (
                        <button
                            key={product._id}
                            onClick={() => onSelectProduct(product)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200
                ${isSelected
                                    ? 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-300 shadow-md ring-2 ring-rose-200'
                                    : 'bg-gray-50 border-gray-200 hover:bg-rose-50 hover:border-rose-200 hover:shadow-sm'
                                }
                border active:scale-[0.98]`}
                        >
                            {/* Color swatch */}
                            <div
                                className="w-10 h-10 rounded-lg shadow-inner flex-shrink-0 border border-white/50"
                                style={{ backgroundColor: product.color }}
                            />

                            {/* Product info */}
                            <div className="flex-1 min-w-0">
                                <p
                                    className={`text-sm font-medium truncate ${isSelected ? 'text-rose-700' : 'text-gray-700'
                                        }`}
                                >
                                    {product.name}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {product.imageUrl ? 'Image available' : 'Color only'}
                                </p>
                            </div>

                            {/* Selection indicator */}
                            {isSelected && (
                                <Sparkles className="w-4 h-4 text-rose-500 flex-shrink-0" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Info note */}
            <div className="mt-4 p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>Tip:</strong> Select a dress to see it displayed on the board
                    and its color applied to the mannequin.
                </p>
            </div>
        </div>
    );
};

export default ProductPicker;
