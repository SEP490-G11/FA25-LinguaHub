import React from 'react';
import PolicyHeroSection from './components/sections/hero-section';
import PrivacyPolicy from './components/sections/privacy-policy';
import TermsOfService from './components/sections/terms-of-service';
import ContactSection from './components/sections/contact-section';

const PolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <PolicyHeroSection />
      <PrivacyPolicy />
      <TermsOfService />
      <ContactSection />
    </div>
  );
};

export default PolicyPage;