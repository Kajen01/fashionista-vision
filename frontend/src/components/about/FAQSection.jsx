import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: 'How does the AI styling feature work?',
      answer: 'Our AI analyzes your uploaded photo to understand your body type, skin tone, and personal style. It then compares these characteristics with our extensive database of fashion items to provide personalized recommendations that flatter your unique features.'
    },
    {
      question: 'Is my photo data secure and private?',
      answer: 'Absolutely. We take privacy seriously. Your photos are processed securely and are not stored permanently on our servers. All AI analysis is done in real-time, and your personal data is never shared with third parties.'
    },
    {
      question: 'How accurate is the virtual try-on feature?',
      answer: 'Our virtual try-on technology uses advanced computer vision to provide highly accurate representations of how clothing will fit and look on you. We continuously improve our algorithms based on user feedback to ensure the best possible experience.'
    },
    {
      question: 'What brands do you work with?',
      answer: 'We partner with over 500 premium and emerging fashion brands, from established luxury labels to innovative independent designers. Our curated selection ensures quality, style diversity, and the latest fashion trends.'
    }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 font-accent">
            Everything you need to know about Fashionista Vision
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`faq-item bg-white rounded-lg shadow-sm border border-gray-200 ${
                activeIndex === index ? 'active' : ''
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left p-6 focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                  <ChevronDown
                    className={`faq-icon w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      activeIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="faq-content"
                  >
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 font-accent">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;