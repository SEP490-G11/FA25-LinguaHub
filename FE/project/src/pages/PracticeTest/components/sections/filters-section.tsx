import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface PracticeTestFiltersSectionProps {
  selectedLanguage: string;
  selectedLevel: string;
  onLanguageChange: (language: string) => void;
  onLevelChange: (level: string) => void;
  testCount: number;
}

const PracticeTestFiltersSection = ({ 
  selectedLanguage, 
  selectedLevel, 
  onLanguageChange, 
  onLevelChange, 
  testCount 
}: PracticeTestFiltersSectionProps) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const languages = ['All', 'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  return (
    <section className="py-8 bg-white border-b">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <motion.div 
          className="flex flex-wrap items-center gap-6"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600">Language:</label>
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600">Level:</label>
            <select
              value={selectedLevel}
              onChange={(e) => onLevelChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {testCount} tests available
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PracticeTestFiltersSection;