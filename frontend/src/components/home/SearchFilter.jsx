import React from 'react';
import { useProducts } from '../../context/ProductsContext';
import { Search, X } from 'lucide-react';

const SearchFilter = () => {
  const { filterBySearch, filterByCategory, selectedCategory } = useProducts();
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearch = (value) => {
    setSearchTerm(value);
    filterBySearch(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    filterBySearch('');
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'dresses', label: 'Dresses' },
    { id: 'tops', label: 'Tops' },
    { id: 'bottoms', label: 'Bottoms' },
    { id: 'accessories', label: 'Accessories' },
  ];

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for products..."
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => filterByCategory(category.id)}
                className={`px-6 py-2 rounded-full font-medium transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-rose-100 hover:text-rose-600'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchFilter;