import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-2xl font-display font-bold mb-4">Fashionista Vision</h3>
          <p className="text-gray-400 font-accent mb-6">Redefining elegance through curated fashion</p>
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-500 text-sm">&copy; 2025 Fashionista Vision. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;