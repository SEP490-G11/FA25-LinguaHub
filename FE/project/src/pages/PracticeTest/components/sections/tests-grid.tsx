import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Star, Play, CheckCircle, TrendingUp } from 'lucide-react';

interface PracticeTestsGridProps {
  tests: any[];
}

const PracticeTestsGrid = ({ tests }: PracticeTestsGridProps) => {
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

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {tests.map((test) => (
            <motion.div
              key={test.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
              variants={fadeInUp}
            >
              <div className="relative">
                <img
                  src={test.image}
                  alt={test.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-medium">
                  {test.flag} {test.language}
                </div>
                <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs ${getDifficultyColor(test.level)}`}>
                  {test.level}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-full">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{test.title}</h3>
                <p className="text-gray-600 mb-4 text-sm">{test.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{test.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{test.participants.toLocaleString()} taken</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-600">{test.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">{test.questions} questions</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Features:</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {test.features.slice(0, 4).map((feature: string, index: number) => (
                      <div key={index} className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <div className="font-bold text-green-600 text-lg">{formatPrice(test.price)}</div>
                    {test.price === 0 && <span className="text-xs text-gray-500">No registration required</span>}
                  </div>
                  <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Start Test</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PracticeTestsGrid;