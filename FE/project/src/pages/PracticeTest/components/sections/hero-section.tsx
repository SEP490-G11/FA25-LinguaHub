import React from 'react';
import { motion } from 'framer-motion';

const PracticeTestHeroSection = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <section className="bg-gradient-to-r from-green-600 to-blue-700 py-20">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <motion.div 
          className="text-center text-white"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h1 className="text-5xl font-bold mb-6">Practice Tests</h1>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Prepare for your language certification exams with our comprehensive practice tests. 
            Get real exam experience and detailed feedback.
          </p>
          <div className="flex justify-center space-x-8 text-center">
            <div>
              <div className="text-3xl font-bold">50+</div>
              <div className="text-green-200">Practice Tests</div>
            </div>
            <div>
              <div className="text-3xl font-bold">100K+</div>
              <div className="text-green-200">Test Takers</div>
            </div>
            <div>
              <div className="text-3xl font-bold">95%</div>
              <div className="text-green-200">Pass Rate</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PracticeTestHeroSection;