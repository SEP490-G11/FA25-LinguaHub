import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import TutorSidebar from '@/components/layout/tutor/TutorSidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useUser } from '@/contexts/UserContext';
import { ROUTES } from '@/constants/routes';

/**
 * TutorDashboardLayout - Layout wrapper for tutor routes
 * 
 * Provides route protection (tutor role required)
 * Includes sidebar navigation for tutor pages
 * 
 * Requirement: 10.1 - Route protection for tutor dashboard
 */
const TutorDashboardLayout: React.FC = () => {
  const { isOpen } = useSidebar();
  const { user, loading } = useUser();
  const navigate = useNavigate();

  // Route protection: redirect non-tutors to home page
  useEffect(() => {
    if (!loading && user && user.role !== 'Tutor') {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Don't render if user is not a tutor
  if (!user || user.role !== 'Tutor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <TutorSidebar isOpen={isOpen} />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 pt-16 min-h-screen ${
          isOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default TutorDashboardLayout;
