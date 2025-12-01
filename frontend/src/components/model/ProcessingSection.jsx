import React from 'react';
import { motion } from 'framer-motion';

const ProcessingSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-8"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-gray-600 mb-4">Analyzing your style and finding perfect matches...</p>
        <div className="max-w-md mx-auto bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="bg-rose-600 h-2 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ProcessingSection;