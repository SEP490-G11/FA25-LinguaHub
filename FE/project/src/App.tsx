import { AppRoutes } from '@/routes/AppRoutes';
import Header from '@/components/Header';
import TutorHeader from '@/components/layout/tutor/TutorHeader';
import HeaderSkeleton from '@/components/HeaderSkeleton';
import Footer from '@/components/Footer';
import FloatingChat from '@/components/FloatingChat';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { ScrollToTop } from "@/hooks/ScrollToTop";
import { Toaster } from "@/components/ui/toaster.tsx";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

function App() {
    const location = useLocation();
    const { user, loading } = useUser();

    // Hide footer for admin and tutor routes
    const tutorRoutes = [
        '/dashboard',
        '/students',
        '/schedule',
        '/booked-slots',
        '/packages',
        '/tutor/courses',
        '/create-course',
        '/payments',
        '/withdrawal',
        '/tutor/messages'
    ];

    const hideFooter = location.pathname.startsWith('/admin') ||
        tutorRoutes.some(route => location.pathname.startsWith(route));

    // Determine which header to show based on user role
    const isTutor = user?.role === 'Tutor';

    return (
        <SidebarProvider>
            <ScrollToTop />
            <div className="min-h-screen bg-background">
                {loading ? (
                    <HeaderSkeleton />
                ) : (
                    isTutor ? <TutorHeader /> : <Header />
                )}
                <main>
                    <AppRoutes />
                    <Toaster />
                    <SonnerToaster richColors />
                </main>
                {!hideFooter && <Footer />}
                <FloatingChat />
            </div>
        </SidebarProvider>
    );
}

export default App;
