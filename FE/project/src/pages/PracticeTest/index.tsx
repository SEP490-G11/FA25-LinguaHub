import React, { useState } from 'react';
import PracticeTestHeroSection from './components/sections/hero-section';
import PracticeTestFiltersSection from './components/sections/filters-section';
import PracticeTestsGrid from './components/sections/tests-grid';
import PracticeTestCTASection from './components/sections/cta-section';

const PracticeTest = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');

  const practiceTests = [
    {
      id: 1,
      title: 'IELTS Speaking Practice Test',
      language: 'English',
      flag: '🇺🇸',
      level: 'Intermediate',
      duration: '15 minutes',
      questions: 25,
      participants: 15420,
      rating: 4.8,
      price: 0,
      image: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Practice IELTS speaking test with real exam format and AI feedback',
      features: ['Real exam format', 'AI feedback', 'Score prediction', 'Detailed analysis']
    },
    {
      id: 2,
      title: 'DELE B2 Grammar Test',
      language: 'Spanish',
      flag: '🇪🇸',
      level: 'Advanced',
      duration: '30 minutes',
      questions: 40,
      participants: 8750,
      rating: 4.7,
      price: 125000,
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Comprehensive DELE B2 grammar practice with detailed explanations',
      features: ['Official format', 'Instant results', 'Grammar explanations', 'Progress tracking']
    },
    {
      id: 3,
      title: 'DELF B1 Listening Test',
      language: 'French',
      flag: '🇫🇷',
      level: 'Intermediate',
      duration: '25 minutes',
      questions: 20,
      participants: 6890,
      rating: 4.9,
      price: 150000,
      image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'DELF B1 listening comprehension test with native speaker audio',
      features: ['Native audio', 'Multiple attempts', 'Transcript provided', 'Score breakdown']
    },
    {
      id: 4,
      title: 'TestDaF Reading Practice',
      language: 'German',
      flag: '🇩🇪',
      level: 'Advanced',
      duration: '45 minutes',
      questions: 30,
      participants: 4560,
      rating: 4.6,
      price: 175000,
      image: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'TestDaF reading comprehension with academic texts and strategies',
      features: ['Academic texts', 'Time management tips', 'Strategy guide', 'Performance analytics']
    },
    {
      id: 5,
      title: 'HSK 4 Vocabulary Test',
      language: 'Chinese',
      flag: '🇨🇳',
      level: 'Intermediate',
      duration: '20 minutes',
      questions: 50,
      participants: 12340,
      rating: 4.8,
      price: 100000,
      image: 'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'HSK 4 vocabulary practice with pinyin and character recognition',
      features: ['Character practice', 'Pinyin support', 'Spaced repetition', 'Memory techniques']
    },
    {
      id: 6,
      title: 'JLPT N3 Grammar Mock Test',
      language: 'Japanese',
      flag: '🇯🇵',
      level: 'Intermediate',
      duration: '35 minutes',
      questions: 35,
      participants: 9870,
      rating: 4.9,
      price: 200000,
      image: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'JLPT N3 grammar patterns and usage with cultural context',
      features: ['Grammar patterns', 'Cultural context', 'Example sentences', 'Study recommendations']
    }
  ];

  const filteredTests = practiceTests.filter(test => {
    const languageMatch = selectedLanguage === 'All' || test.language === selectedLanguage;
    const levelMatch = selectedLevel === 'All' || test.level === selectedLevel;
    return languageMatch && levelMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <PracticeTestHeroSection />
      <PracticeTestFiltersSection 
        selectedLanguage={selectedLanguage}
        selectedLevel={selectedLevel}
        onLanguageChange={setSelectedLanguage}
        onLevelChange={setSelectedLevel}
        testCount={filteredTests.length}
      />
      <PracticeTestsGrid tests={filteredTests} />
      <PracticeTestCTASection />
    </div>
  );
};

export default PracticeTest;