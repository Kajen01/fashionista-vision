import React from 'react';
import HeroSection from '../components/home/HeroSection';
import SearchFilter from '../components/home/SearchFilter';
import FeaturedCollection from '../components/home/FeaturedCollection';
import FeaturesSection from '../components/home/FeaturesSection';

const Home = () => {
  return (
    <div>
      <HeroSection />
      <SearchFilter />
      <FeaturedCollection />
      <FeaturesSection />
    </div>
  );
};

export default Home;