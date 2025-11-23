import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/constants/routes.ts';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Pages
import HomePage from '@/pages/HomePage/HomePage.tsx';
import SignIn from '@/pages/auth/signin/signin.tsx';
import SignUp from '@/pages/SignUp/signup.tsx';
import Languages from '@/pages/Languages/Languages.tsx';
import Tutors from '@/pages/Tutors/listTutor.tsx';
import TutorDetail from '@/pages/TutorDetail/tutorDetail.tsx';
import CourseDetail from '@/pages/CourseDetail/CourseDetail.tsx';
import LessonDetail from '@/pages/LessonDetail/lesson.tsx';
import PracticeTest from '@/pages/PracticeTest/index';
import BecomeTutor from '@/pages/BecomeTutor/index';
import Wishlist from '@/pages/Wishlist/wishList.tsx';
import Payment from '@/pages/Payment/payment.tsx';
import NotFound from '@/pages/not-found';
import PolicyPage from '@/pages/PolicyPage/index';
import CompleteForgotPassword from '@/pages/auth/complete-forgot-password/complete-forgot-password.tsx';
import GoogleCallback from '@/pages/auth/login-google/login-google.tsx';
import LanguageCourses from '@/pages/LanguageCourses/LanguageCourses.tsx';
import ForgotPassword from '@/pages/auth/forgot-password/forgot-password.tsx';
import ResetPassword from '@/pages/auth/reset-password/reset-password.tsx';
import VerifyEmail from '@/pages/auth/verify-email/veryfy-email.tsx';
import PaymentHistory from "@/pages/PaymentHistory/payment-history.tsx";
import MyEnrollments from "@/pages/MyEnrollments/my-enrollments.tsx";
import Profile from '@/pages/Profile/profile.tsx';
import ChangePassword from '@/pages/ChangePassword/changePassword.tsx';
import VerifyEmailForgotPassword from '@/pages/auth/verify-email-forgot-password/verify-email-forgot-password.tsx';
import CreateCourse from '@/pages/TutorPages/CreateCourse/index';
import CourseApprovalPage from '@/pages/Admin/CourseApproval/index';
import CourseApprovalDetailPage from '@/pages/Admin/CourseApproval/CourseDetailPage';
import DraftListPage from '@/pages/Admin/CourseApproval/DraftListPage';
import DraftDetailPage from '@/pages/Admin/CourseApproval/DraftDetailPage';
import CoursesDetailPage from '@/pages/Admin/Courses/CourseDetailPage';
import ApplyTutor from '@/pages/ApplyTutor';
import TutorApproval from '@/pages/Admin/TutorApproval';
import ApplicationDetailPage from '@/pages/Admin/TutorApproval/ApplicationDetailPage';
import UserManagement from '@/pages/Admin/UserManagement';
import AdminWithdrawRequests from '@/pages/Admin/WithdrawRequests';
import AdminCommissionSettings from '@/pages/Admin/CommissionSettings';
import EditCourse from '@/pages/TutorPages/EditCourse';
import CourseList from '@/pages/TutorPages/CourseList';
import TutorDashboardLayout from '@/components/layout/tutor/TutorDashboardLayout';
import AdminLayout from '@/components/layout/admin/AdminLayout';
import AdminDashboard from '@/pages/Admin/Dashboard';
import AdminCourses from '@/pages/Admin/Courses';
import AdminPayments from '@/pages/Admin/Payments';
import TutorDashboard from '@/pages/TutorPages/Dashboard';
import TutorStudents from '@/pages/TutorPages/Students';
import TutorSchedule from '@/pages/TutorPages/Schedule';
import TutorMessages from '@/pages/TutorPages/Messages';
// import TutorResources from '@/pages/TutorPages/Resources';
import TutorPayment from  '@/pages/TutorPages/Payment';
// import TutorSettings from '@/pages/TutorPages/Settings';
import TutorPackages from '@/pages/TutorPages/Packages';
import TutorCourseDetailPage from '@/pages/TutorPages/CourseDetail';
import TutorWithdrawal from '@/pages/TutorPages/Withdrawal';
import TutorWithdrawalHistory from '@/pages/TutorPages/WithdrawalHistory';
import BookedSlots from '@/pages/TutorPages/BookedSlots';
import Messages from '@/pages/MessagesPage/boxchat.tsx';
import BookTutor from '@/pages/BookTutor/book-tutor.tsx';
import MyBookings from "@/pages/MyBookings/my-booking.tsx";
import RefundRequests from "@/pages/RefundRequests/refund-requests.tsx";
import Notifications from "@/pages/Notifications/notifications.tsx";
import AdminRefundManagement from "@/pages/Admin/RefundManagement";

export function AppRoutes() {
    return (
        <Routes>
            {/* Auth */}
            <Route path={ROUTES.SIGN_IN} element={<SignIn />} />
            <Route path={ROUTES.SIGN_UP} element={<SignUp />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
            <Route path={ROUTES.VERIFY_EMAIL_FORGOT_PASSWORD} element={<VerifyEmailForgotPassword />} />
            <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
            <Route path={ROUTES.COMPLETE_FORGOT_PASSWORD} element={<CompleteForgotPassword />} />
            <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
            <Route path={ROUTES.GOOGLE_CALLBACK} element={<GoogleCallback />} />

            {/* Main pages */}
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.LANGUAGES} element={<Languages />} />
            <Route path={ROUTES.TUTORS} element={<Tutors />} />
            <Route path={ROUTES.TUTOR_DETAIL} element={<TutorDetail />} />
            <Route path={ROUTES.COURSE_DETAIL} element={<CourseDetail />} />
            <Route path={ROUTES.LESSON_DETAIL} element={<LessonDetail />} />
            <Route path={ROUTES.LANGUAGE_COURSES} element={<LanguageCourses />} />
            <Route path={ROUTES.PRACTICE_TEST} element={<PracticeTest />} />
            <Route path={ROUTES.BECOME_TUTOR} element={<BecomeTutor />} />
            <Route path={ROUTES.WISHLIST} element={<Wishlist />} />
            <Route path={ROUTES.PAYMENT} element={<Payment />} />
            <Route path={ROUTES.POLICY} element={<PolicyPage />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Messages />} />
            <Route path="/book-tutor/:tutorId" element={<BookTutor />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route 
                path={ROUTES.REFUND_REQUESTS} 
                element={
                    <ProtectedRoute allowedRoles={['Learner', 'Admin']}>
                        <RefundRequests />
                    </ProtectedRoute>
                } 
            />
            <Route path={ROUTES.NOTIFICATIONS} element={<Notifications />} />
            {/* User */}
            <Route path={ROUTES.PROFILE} element={<Profile />} />
            <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePassword />} />
            <Route path={ROUTES.PAYMENT_HISTORY} element={<PaymentHistory />} />
            <Route path={ROUTES.MY_ENROLLMENTS} element={<MyEnrollments />} />
            <Route path={ROUTES.APPLY_TUTOR} element={<ApplyTutor />} />

            {/* Admin Dashboard with Layout */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="refund-management" element={<AdminRefundManagement />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="courses/:courseId" element={<CoursesDetailPage />} />
                <Route path="course-approval" element={<CourseApprovalPage />} />
                <Route path="course-approval/:courseId" element={<CourseApprovalDetailPage />} />
                <Route path="course-approval/drafts" element={<DraftListPage />} />
                <Route path="course-approval/drafts/:draftId" element={<DraftDetailPage />} />
                <Route path="tutor-approval" element={<TutorApproval />} />
                <Route path="tutor-approval/:id" element={<ApplicationDetailPage />} />
                <Route path="user-management" element={<UserManagement />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="withdraw-requests" element={<AdminWithdrawRequests />} />
                <Route path="commission-settings" element={<AdminCommissionSettings />} />
            </Route>
            
            {/* Tutor Dashboard with Layout */}
            <Route element={<TutorDashboardLayout />}>
            <Route path="/dashboard" element={<TutorDashboard />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:courseId/details" element={<TutorCourseDetailPage />} />
            <Route path="/courses/:courseId/content" element={<EditCourse />} />
            <Route path="/courses/:courseId/draft/:draftId/content" element={<EditCourse />} />
            <Route path="/create-courses" element={<CreateCourse />} />
            <Route path="/students" element={<TutorStudents />} />
            <Route path="/schedule" element={<TutorSchedule />} />
            <Route path="/booked-slots" element={<BookedSlots />} />
            <Route path="/packages" element={<TutorPackages />} />
            <Route path="/payments" element={<TutorPayment />} />
            <Route path="/withdrawal" element={<TutorWithdrawal />} />
            <Route path="/withdrawal-history" element={<TutorWithdrawalHistory />} />
            <Route path="/messages" element={<TutorMessages />} />
            {/* <Route path="/resources" element={<TutorResources />} />
            <Route path="/settings" element={<TutorSettings />} /> */}
        </Route>


            {/* Not found */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}



