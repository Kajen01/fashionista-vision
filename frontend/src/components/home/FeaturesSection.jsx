import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Eye, Award } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'AI Styling',
      description: 'Get personalized fashion recommendations based on your photos and preferences.'
    },
    {
      icon: Eye,
      title: 'Virtual Try-On',
      description: 'See how clothes look on you before buying with our advanced virtual fitting room.'
    },
    {
      icon: Award,
      title: 'Premium Quality',
      description: 'Handpicked collection of high-quality fashion pieces from renowned designers.'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 font-accent">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;