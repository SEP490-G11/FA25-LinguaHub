// Routes - Organized by feature
export const ROUTES = {
  // ========== PUBLIC ROUTES ==========
  HOME: '/',
  LANGUAGES: '/languages',
  LANGUAGE_COURSES: '/languages/:language',
  TUTORS: '/tutors',
  TUTOR_DETAIL: '/tutors/:id',
  COURSES: '/courses',
  COURSE_DETAIL: '/courses/:id',
  LESSON_DETAIL: '/lesson/:id',
  PRACTICE_TEST: '/practice-test',
  BECOME_TUTOR: '/become-tutor',
  POLICY: '/policy',

  // ========== AUTH ROUTES ==========
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_EMAIL_FORGOT_PASSWORD: '/auth/verify-email-forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  COMPLETE_FORGOT_PASSWORD: '/auth/complete-forgot-password',
  VERIFY_EMAIL: '/auth/verify-email',
  GOOGLE_CALLBACK: '/auth/google-callback',

  // ========== USER ROUTES ==========
  PROFILE: '/profile',
  CHANGE_PASSWORD: '/change-password',
  PAYMENT_HISTORY: '/payment-history',
  MY_ENROLLMENTS: '/my-enrollments',
  MY_BOOKINGS: '/learner/bookings',
  WISHLIST: '/wishlist',
  NOTIFICATIONS: '/notifications',
  MESSAGES: '/messages',
  MESSAGES_CONVERSATION: '/messages/:conversationId',
  BOOK_TUTOR: '/book-tutor/:tutorId',
  APPLY_TUTOR: '/learner/apply-tutor',
  REFUND_REQUESTS: '/learner/refunds',

  // ========== TUTOR ROUTES ==========
  TUTOR_DASHBOARD: '/dashboard',
  TUTOR_STUDENTS: '/students',
  TUTOR_SCHEDULE: '/schedule',
  TUTOR_BOOKED_SLOTS: '/booked-slots',
  TUTOR_PACKAGES: '/packages',
  TUTOR_MESSAGES: '/tutor/messages',

  // Tutor Courses
  TUTOR_COURSES: '/tutor/courses',
  TUTOR_COURSE_DETAILS: '/tutor/courses/:courseId/details',
  TUTOR_COURSE_CONTENT: '/tutor/courses/:courseId/content',
  TUTOR_COURSE_DRAFT_CONTENT: '/tutor/courses/:courseId/draft/:draftId/content',
  CREATE_COURSE: '/create-course',
  CREATE_COURSES: '/create-courses',

  // Tutor Payments
  PAYMENTS: '/payments',
  WITHDRAWAL: '/withdrawal',
  WITHDRAWAL_HISTORY: '/withdrawal-history',

  // ========== ADMIN ROUTES ==========
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USER_MANAGEMENT: '/admin/user-management',

  // Admin Courses
  ADMIN_COURSES: '/admin/courses',
  ADMIN_COURSE_DETAIL: '/admin/courses/:courseId',

  // Admin Course Approval
  ADMIN_COURSE_APPROVAL: '/admin/course-approval',
  ADMIN_COURSE_APPROVAL_DETAIL: '/admin/course-approval/:courseId',
  ADMIN_COURSE_APPROVAL_DRAFTS: '/admin/course-approval/drafts',
  ADMIN_COURSE_APPROVAL_DRAFT_DETAIL: '/admin/course-approval/drafts/:draftId',

  // Admin Tutor Approval
  ADMIN_TUTOR_APPROVAL: '/admin/tutor-approval',
  ADMIN_TUTOR_APPROVAL_DETAIL: '/admin/tutor-approval/:id',

  // Admin Payments
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_WITHDRAW_REQUESTS: '/admin/withdraw-requests',
  ADMIN_COMMISSION_SETTINGS: '/admin/commission-settings',
  ADMIN_REFUND_MANAGEMENT: '/admin/refund-management',

  // Admin Category & Language Management
  ADMIN_CATEGORY_MANAGEMENT: '/admin/categories',
  ADMIN_LANGUAGE_MANAGEMENT: '/admin/languages',
} as const;

// Helper function to generate dynamic routes
export const generatePath = (path: string, params: Record<string, string | number>): string => {
  let result = path;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value));
  });
  return result;
};

// Helper functions for dynamic routes
export const routeHelpers = {
  // Public routes
  tutorDetail: (id: string | number) => generatePath(ROUTES.TUTOR_DETAIL, { id }),
  courseDetail: (id: string | number) => generatePath(ROUTES.COURSE_DETAIL, { id }),
  lessonDetail: (id: string | number) => generatePath(ROUTES.LESSON_DETAIL, { id }),
  languageCourses: (language: string) => generatePath(ROUTES.LANGUAGE_COURSES, { language }),

  // User routes
  messagesConversation: (conversationId: string | number) => generatePath(ROUTES.MESSAGES_CONVERSATION, { conversationId }),
  bookTutor: (tutorId: string | number) => generatePath(ROUTES.BOOK_TUTOR, { tutorId }),

  // Tutor routes
  tutorCourseDetails: (courseId: string | number) => generatePath(ROUTES.TUTOR_COURSE_DETAILS, { courseId }),
  tutorCourseContent: (courseId: string | number) => generatePath(ROUTES.TUTOR_COURSE_CONTENT, { courseId }),
  tutorCourseDraftContent: (courseId: string | number, draftId: string | number) =>
    generatePath(ROUTES.TUTOR_COURSE_DRAFT_CONTENT, { courseId, draftId }),

  // Admin routes
  adminCourseDetail: (courseId: string | number) => generatePath(ROUTES.ADMIN_COURSE_DETAIL, { courseId }),
  adminCourseApprovalDetail: (courseId: string | number) => generatePath(ROUTES.ADMIN_COURSE_APPROVAL_DETAIL, { courseId }),
  adminCourseApprovalDraftDetail: (draftId: string | number) => generatePath(ROUTES.ADMIN_COURSE_APPROVAL_DRAFT_DETAIL, { draftId }),
  adminTutorApprovalDetail: (id: string | number) => generatePath(ROUTES.ADMIN_TUTOR_APPROVAL_DETAIL, { id }),
};
