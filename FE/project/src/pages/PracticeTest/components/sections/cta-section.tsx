import React from 'react';
import { motion } from 'framer-motion';

const PracticeTestCTASection = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <section className="py-16 bg-gradient-to-r from-green-500 to-blue-600">
      <div className="max-w-7xl mx-auto px-8 lg:px-16 text-center">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h2 
            className="text-4xl font-bold text-white mb-6"
            variants={fadeInUp}
          >
            Ready to Test Your Skills?
          </motion.h2>
          <motion.p 
            className="text-xl text-green-100 mb-8"
            variants={fadeInUp}
          >
            Take a free practice test and see where you stand
          </motion.p>
          <motion.button 
            className="bg-white text-green-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
            variants={fadeInUp}
          >
            Start Free Test
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default PracticeTestCTASection;