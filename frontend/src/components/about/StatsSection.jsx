import React, { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const StatsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [counts, setCounts] = useState({
    customers: 0,
    products: 0,
    brands: 0,
    satisfaction: 0
  });

  const stats = [
    { label: 'Happy Customers', target: 50000, key: 'customers' },
    { label: 'Products Tried', target: 10000, key: 'products' },
    { label: 'Premium Brands', target: 500, key: 'brands' },
    { label: '% Satisfaction Rate', target: 99, key: 'satisfaction' }
  ];

  useEffect(() => {
    if (isInView) {
      stats.forEach((stat, index) => {
        let current = 0;
        const increment = stat.target / 100;
        const timer = setInterval(() => {
          current += increment;
          if (current >= stat.target) {
            current = stat.target;
            clearInterval(timer);
          }
          setCounts(prev => ({ ...prev, [stat.key]: Math.floor(current) }));
        }, 20);
      });
    }
  }, [isInView]);

  return (
    <section ref={ref} className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="stats-counter">
                {counts[stat.key].toLocaleString()}
              </div>
              <p className="text-gray-600 font-accent mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;