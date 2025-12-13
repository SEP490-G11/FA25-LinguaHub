import  { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Languages } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle Google OAuth callback
    const handleGoogleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          console.error('Google OAuth error:', error);
          navigate('/auth/signin?error=oauth_failed');
          return;
        }

        if (code) {
          // Exchange code for tokens
          // This would typically be handled by your backend
          console.log('Google OAuth code:', code);
          
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Redirect to home on success
          navigate('/');
        } else {
          navigate('/auth/signin');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/auth/signin?error=oauth_failed');
      }
    };

    handleGoogleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg mb-6 inline-block">
          <Languages className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Completing Sign In...</h2>
        <p className="text-gray-600 mb-8">Please wait while we process your Google authentication.</p>
        <LoadingSpinner size="lg" />
      </motion.div>
    </div>
  );
};

export default GoogleCallback;