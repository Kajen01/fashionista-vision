import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const HeroSection = () => {
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="hero-gradient pt-16 pb-12 relative overflow-hidden">
      <div className="floating-particles">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${10 + i * 10}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <h1 className="hero-title text-5xl lg:text-7xl font-display font-bold mb-6 leading-tight">
              Discover Your Style
            </h1>
            <p className="text-xl text-gray-600 mb-8 font-accent leading-relaxed">
              Curated collection of premium fashion pieces that define elegance and sophistication.
              From casual chic to evening glamour, find your perfect look.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="#featuredCollection"
                onClick={(e) => {
                  e.preventDefault(); // prevent page reload
                  scrollToSection("featuredCollection");
                }}
                className="bg-gray-900 text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                Shop Collection
              </Link>
              <Link
                to="/model"
                className="border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-full hover:bg-gray-900 hover:text-white transition-all duration-300 font-semibold"
              >
                Try AI Styling
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <div className="aspect-w-3 aspect-h-4 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://kimi-web-img.moonshot.cn/img/www.fashiongonerogue.com/6280f1fa7e47b759494fcc5242218684a2185e48.jpg"
                alt="Fashion Hero"
                className="w-full h-full object-cover"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg"
            >
              <div className="text-2xl font-bold text-rose-600">50% OFF</div>
              <div className="text-sm text-gray-600">Summer Collection</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="absolute -top-6 -right-6 bg-gray-900 text-white p-6 rounded-xl shadow-lg"
            >
              <div className="text-2xl font-bold">New</div>
              <div className="text-sm">Arrivals</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;