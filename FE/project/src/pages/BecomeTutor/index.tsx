import HeroSection from './components/sections/hero-section';
import BenefitsSection from './components/sections/benefits-section';
import RequirementsSection from './components/sections/requirements-section';
import HowItWorksSection from './components/sections/how-it-works-section';
import CTASection from './components/sections/cta-section';

const BecomeTutor = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <BenefitsSection />
      <RequirementsSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
};

export default BecomeTutor;