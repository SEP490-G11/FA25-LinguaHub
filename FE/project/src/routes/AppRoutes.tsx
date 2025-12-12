import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/constants/routes.ts';
import { ProtectedRoute, AdminRoute, TutorRoute, LearnerRoute } from './ProtectedRoute';

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
import AdminRefundManagement from '@/pages/Admin/RefundManagement/Refund.tsx';
import CategoryManagement from '@/pages/Admin/CategoryManagement';
import LanguageManagement from '@/pages/Admin/LanguageManagement';
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
import TutorPayment from '@/pages/TutorPages/Payment';
// import TutorSettings from '@/pages/TutorPages/Settings';
import TutorPackages from '@/pages/TutorPages/Packages';
import TutorCourseDetailPage from '@/pages/TutorPages/CourseDetail';
import TutorWithdrawal from '@/pages/TutorPages/Withdrawal';
import TutorWithdrawalHistory from '@/pages/TutorPages/WithdrawalHistory';
import BookedSlots from '@/pages/TutorPages/BookedSlots/booked-slots';
import Messages from '@/pages/MessagesPage/boxchat.tsx';
import BookTutor from '@/pages/BookTutor/book-tutor.tsx';
import MyBookings from "@/pages/MyBookings/my-booking.tsx";
import RefundRequests from "@/pages/RefundRequests/refund-requests.tsx";
import Notifications from "@/pages/Notifications/notifications.tsx";

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

            {/* Public pages - accessible to all (không cần đăng nhập) */}
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.POLICY} element={<PolicyPage />} />
            <Route path={ROUTES.LANGUAGES} element={<Languages />} />
            <Route path={ROUTES.LANGUAGE_COURSES} element={<LanguageCourses />} />
            <Route path={ROUTES.TUTORS} element={<Tutors />} />
            <Route path={ROUTES.TUTOR_DETAIL} element={<TutorDetail />} />
            <Route path={ROUTES.COURSE_DETAIL} element={<CourseDetail />} />
            <Route path={ROUTES.BECOME_TUTOR} element={<BecomeTutor />} />

            {/* Shared authenticated pages - Yêu cầu đăng nhập */}
            <Route element={<ProtectedRoute />}>
                <Route path={ROUTES.PROFILE} element={<Profile />} />
                <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePassword />} />
                <Route path={ROUTES.MESSAGES} element={<Messages />} />
                <Route path={ROUTES.MESSAGES_CONVERSATION} element={<Messages />} />
                <Route path={ROUTES.NOTIFICATIONS} element={<Notifications />} />
                <Route path={ROUTES.LESSON_DETAIL} element={<LessonDetail />} />
            </Route>

            {/* Learner-only pages - Requires authentication as Learner */}
            <Route element={<LearnerRoute />}>
                <Route path={ROUTES.PRACTICE_TEST} element={<PracticeTest />} />
                <Route path={ROUTES.WISHLIST} element={<Wishlist />} />
                <Route path={ROUTES.BOOK_TUTOR} element={<BookTutor />} />
                <Route path={ROUTES.MY_BOOKINGS} element={<MyBookings />} />
                <Route path={ROUTES.REFUND_REQUESTS} element={<RefundRequests />} />
                <Route path={ROUTES.PAYMENT_HISTORY} element={<PaymentHistory />} />
                <Route path={ROUTES.MY_ENROLLMENTS} element={<MyEnrollments />} />
                <Route path={ROUTES.APPLY_TUTOR} element={<ApplyTutor />} />
            </Route>

            {/* Admin Dashboard with Layout - Protected for Admin only */}
            <Route element={<AdminRoute />}>
                <Route path={ROUTES.ADMIN} element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
                    <Route path={ROUTES.ADMIN_COURSES} element={<AdminCourses />} />
                    <Route path={ROUTES.ADMIN_COURSE_DETAIL} element={<CoursesDetailPage />} />
                    <Route path={ROUTES.ADMIN_COURSE_APPROVAL} element={<CourseApprovalPage />} />
                    <Route path={ROUTES.ADMIN_COURSE_APPROVAL_DETAIL} element={<CourseApprovalDetailPage />} />
                    <Route path={ROUTES.ADMIN_COURSE_APPROVAL_DRAFTS} element={<DraftListPage />} />
                    <Route path={ROUTES.ADMIN_COURSE_APPROVAL_DRAFT_DETAIL} element={<DraftDetailPage />} />
                    <Route path={ROUTES.ADMIN_TUTOR_APPROVAL} element={<TutorApproval />} />
                    <Route path={ROUTES.ADMIN_TUTOR_APPROVAL_DETAIL} element={<ApplicationDetailPage />} />
                    <Route path={ROUTES.ADMIN_USER_MANAGEMENT} element={<UserManagement />} />
                    <Route path={ROUTES.ADMIN_PAYMENTS} element={<AdminPayments />} />
                    <Route path={ROUTES.ADMIN_WITHDRAW_REQUESTS} element={<AdminWithdrawRequests />} />
                    <Route path={ROUTES.ADMIN_COMMISSION_SETTINGS} element={<AdminCommissionSettings />} />
                    <Route path={ROUTES.ADMIN_REFUND_MANAGEMENT} element={<AdminRefundManagement />} />
                    <Route path={ROUTES.ADMIN_CATEGORY_MANAGEMENT} element={<CategoryManagement />} />
                    <Route path={ROUTES.ADMIN_LANGUAGE_MANAGEMENT} element={<LanguageManagement />} />
                </Route>
            </Route>

            {/* Tutor Dashboard with Layout - Protected for Tutor only */}
            <Route element={<TutorRoute />}>
                <Route element={<TutorDashboardLayout />}>
                    <Route path={ROUTES.TUTOR_DASHBOARD} element={<TutorDashboard />} />
                    <Route path={ROUTES.TUTOR_COURSES} element={<CourseList />} />
                    <Route path={ROUTES.TUTOR_COURSE_DETAILS} element={<TutorCourseDetailPage />} />
                    <Route path={ROUTES.TUTOR_COURSE_CONTENT} element={<EditCourse />} />
                    <Route path={ROUTES.TUTOR_COURSE_DRAFT_CONTENT} element={<EditCourse />} />
                    <Route path={ROUTES.CREATE_COURSES} element={<CreateCourse />} />
                    <Route path={ROUTES.TUTOR_STUDENTS} element={<TutorStudents />} />
                    <Route path={ROUTES.TUTOR_SCHEDULE} element={<TutorSchedule />} />
                    <Route path={ROUTES.TUTOR_BOOKED_SLOTS} element={<BookedSlots />} />
                    <Route path={ROUTES.TUTOR_PACKAGES} element={<TutorPackages />} />
                    <Route path={ROUTES.PAYMENTS} element={<TutorPayment />} />
                    <Route path={ROUTES.WITHDRAWAL} element={<TutorWithdrawal />} />
                    <Route path={ROUTES.WITHDRAWAL_HISTORY} element={<TutorWithdrawalHistory />} />
                    <Route path={ROUTES.TUTOR_MESSAGES} element={<TutorMessages />} />
                    <Route path={`${ROUTES.TUTOR_MESSAGES}/:conversationId`} element={<TutorMessages />} />
                    {/* <Route path="/resources" element={<TutorResources />} />
                <Route path="/settings" element={<TutorSettings />} /> */}
                </Route>
            </Route>


            {/* Not found */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}



