package edu.lms.service;

import edu.lms.dto.response.*;
import edu.lms.entity.*;
import edu.lms.enums.CourseDraftStatus;
import edu.lms.enums.CourseStatus;
import edu.lms.enums.NotificationType;
import edu.lms.exception.AppException;
import edu.lms.repository.*;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * AdminCourseServiceTest – unit test cho các method public của AdminCourseService
 *
 * Lưu ý:
 *  - Dùng @MockitoSettings(strictness = Strictness.LENIENT) để tránh UnnecessaryStubbingException
 *    vì một số stub được dùng gián tiếp thông qua các hàm helper nội bộ.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@FieldDefaults(level = AccessLevel.PRIVATE)
class AdminCourseServiceTest {

    // =========================
    // Mock dependencies
    // =========================
    @Mock
    CourseRepository courseRepository;
    @Mock
    CourseObjectiveRepository courseObjectiveRepository;
    @Mock
    CourseObjectiveDraftRepository courseObjectiveDraftRepository;
    @Mock
    CourseDraftRepository courseDraftRepository;
    @Mock
    CourseSectionRepository courseSectionRepository;
    @Mock
    LessonRepository lessonRepository;
    @Mock
    LessonResourceRepository lessonResourceRepository;
    @Mock
    UserLessonRepository userLessonRepository;
    @Mock
    UserCourseSectionRepository userCourseSectionRepository;
    @Mock
    EnrollmentRepository enrollmentRepository;
    @Mock
    EmailService emailService;
    @Mock
    NotificationService notificationService;
    @Mock
    QuizQuestionRepository quizQuestionRepository;
    @Mock
    QuizOptionRepository quizOptionRepository;
    @Mock
    QuizQuestionDraftRepository quizQuestionDraftRepository;
    @Mock
    QuizOptionDraftRepository quizOptionDraftRepository;
    @Mock
    CourseReviewRepository courseReviewRepository;

    @InjectMocks
    AdminCourseService adminCourseService;

    // =========================
    // Helper dựng entity
    // =========================

    /**
     * Helper dựng Course với:
     *  - Category: dùng CourseCategory (đúng entity)
     *  - Tutor + User: để test email + notification
     */
    private Course buildCourse(Long id, CourseStatus status) {
        Course c = new Course();
        c.setCourseID(id);
        c.setTitle("Course " + id);
        c.setShortDescription("Short");
        c.setDescription("Desc");
        c.setRequirement("Req");
        c.setStatus(status);
        c.setPrice(BigDecimal.TEN);
        c.setDuration(100);
        c.setLanguage("English");
        c.setCreatedAt(LocalDateTime.now().minusDays(1));
        c.setUpdatedAt(LocalDateTime.now().minusHours(1));

        CourseCategory courseCategory = new CourseCategory();
        courseCategory.setName("Category");
        c.setCategory(courseCategory);

        Tutor tutor = new Tutor();
        User user = new User();
        user.setUserID(99L);
        user.setEmail("tutor@mail.com");
        user.setFullName("Tutor Name");
        tutor.setUser(user);
        c.setTutor(tutor);

        return c;
    }

    /**
     * Helper dựng CourseDraft:
     *  - Gắn với course gốc
     *  - Category riêng
     *  - Tutor + User: để test email + notification
     */
    private CourseDraft buildCourseDraft(Long draftId, Course course, CourseDraftStatus status) {
        CourseDraft d = new CourseDraft();
        d.setDraftID(draftId);
        d.setCourse(course);
        d.setTitle("Draft Title");
        d.setShortDescription("Draft Short");
        d.setDescription("Draft Desc");
        d.setRequirement("Draft Req");
        d.setStatus(status);
        d.setPrice(BigDecimal.valueOf(20));
        d.setDuration(200);
        d.setLanguage("English");
        d.setCreatedAt(LocalDateTime.now().minusDays(1));
        d.setUpdatedAt(LocalDateTime.now().minusHours(1));

        CourseCategory courseCategory = new CourseCategory();
        courseCategory.setName("Draft Category");
        d.setCategory(courseCategory);

        Tutor tutor = new Tutor();
        User u = new User();
        u.setUserID(99L);
        u.setEmail("tutor@mail.com");
        u.setFullName("Tutor Name");
        tutor.setUser(u);
        d.setTutor(tutor);

        d.setObjectives(new ArrayList<>());
        d.setSections(new ArrayList<>());

        return d;
    }

    // =====================================================================
    // getAllCoursesForAdmin(CourseStatus) và getAllCoursesForAdmin()
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.getAllCoursesForAdmin(status)")
    class GetAllCoursesForAdminWithStatusTests {

        /**
         * Case: status = null
         *  - Kỳ vọng: dùng courseRepository.findAll()
         *  - Trả về toàn bộ course
         */
        @Test
        @DisplayName("Trả về tất cả course khi status = null")
        void getAllCoursesForAdmin_statusNull_shouldReturnAll() {
            Course c1 = buildCourse(1L, CourseStatus.Approved);
            Course c2 = buildCourse(2L, CourseStatus.Pending);

            when(courseRepository.findAll()).thenReturn(List.of(c1, c2));

            List<AdminCourseResponse> result =
                    adminCourseService.getAllCoursesForAdmin((CourseStatus) null);

            assertEquals(2, result.size());
            assertEquals(1L, result.get(0).getId());
            assertEquals(2L, result.get(1).getId());
        }

        /**
         * Case: status = Pending
         *  - Kỳ vọng: dùng courseRepository.findByStatus(Pending)
         */
        @Test
        @DisplayName("Filter theo status cụ thể (Pending)")
        void getAllCoursesForAdmin_statusPending_shouldUseFindByStatus() {
            Course c1 = buildCourse(3L, CourseStatus.Pending);

            when(courseRepository.findByStatus(CourseStatus.Pending))
                    .thenReturn(List.of(c1));

            List<AdminCourseResponse> result =
                    adminCourseService.getAllCoursesForAdmin(CourseStatus.Pending);

            assertEquals(1, result.size());
            assertEquals(3L, result.get(0).getId());
            assertEquals("Pending", result.get(0).getStatus());
        }
    }

    @Nested
    @DisplayName("AdminCourseService.getAllCoursesForAdmin()")
    class GetAllCoursesForAdminNoStatusTests {

        /**
         * Case: không truyền status
         *  - Kỳ vọng: gọi courseRepository.findAll() và map ra đủ 2 course
         */
        @Test
        @DisplayName("Trả về tất cả course")
        void getAllCoursesForAdmin_shouldReturnAll() {
            Course c1 = buildCourse(1L, CourseStatus.Approved);
            Course c2 = buildCourse(2L, CourseStatus.Rejected);

            when(courseRepository.findAll()).thenReturn(List.of(c1, c2));

            List<AdminCourseResponse> result = adminCourseService.getAllCoursesForAdmin();

            assertEquals(2, result.size());
            assertEquals(1L, result.get(0).getId());
            assertEquals(2L, result.get(1).getId());
        }
    }

    // =====================================================================
    // getCourseDetail(Long courseID)
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.getCourseDetail")
    class GetCourseDetailTests {

        /**
         * Case: Course không tồn tại
         *  - Kỳ vọng: ném AppException(COURSE_NOT_FOUND)
         */
        @Test
        @DisplayName("Course không tồn tại -> AppException")
        void getCourseDetail_courseNotFound_shouldThrow() {
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class, () -> adminCourseService.getCourseDetail(1L));
        }

        /**
         * Case: Course tồn tại, không có review, không section/objective
         *  - Kỳ vọng: map sang AdminCourseDetailResponse với:
         *      + courseID đúng
         *      + title đúng
         *      + status = Approved
         *      + learnerCount = 5
         */
        @Test
        @DisplayName("Course tồn tại -> map sang AdminCourseDetailResponse")
        void getCourseDetail_happyPath_shouldReturnDetail() {
            Course course = buildCourse(2L, CourseStatus.Approved);

            when(courseRepository.findById(2L)).thenReturn(Optional.of(course));
            when(enrollmentRepository.countByCourse_CourseID(2L)).thenReturn(5L);
            when(courseReviewRepository.findByCourse_CourseID(2L))
                    .thenReturn(List.of()); // không có review

            // Không có section/objective -> các repo trả list rỗng
            when(courseSectionRepository.findByCourse_CourseID(2L))
                    .thenReturn(List.of());
            when(courseObjectiveRepository
                    .findByCourse_CourseIDOrderByOrderIndexAsc(2L))
                    .thenReturn(List.of());

            AdminCourseDetailResponse result = adminCourseService.getCourseDetail(2L);

            assertEquals(2L, result.getCourseID());
            assertEquals("Course 2", result.getTitle());
            assertEquals("Approved", result.getStatus());
            assertEquals(5L, result.getLearnerCount());
        }
    }

    // =====================================================================
    // updateCourseReviewNote & updateCourseDraftReviewNote
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.updateCourseReviewNote")
    class UpdateCourseReviewNoteTests {

        /**
         * Case: Course không tồn tại
         *  - Kỳ vọng: ném AppException(COURSE_NOT_FOUND)
         */
        @Test
        @DisplayName("Course không tồn tại -> AppException")
        void updateCourseReviewNote_courseNotFound_shouldThrow() {
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.updateCourseReviewNote(1L, "note"));
        }

        /**
         * Case: Cập nhật note cho course live
         *  - Kỳ vọng: adminReviewNote được set, trả về detail có note mới
         */
        @Test
        @DisplayName("Cập nhật review note cho course live")
        void updateCourseReviewNote_happyPath_shouldUpdateNote() {
            Course c = buildCourse(2L, CourseStatus.Pending);
            when(courseRepository.findById(2L)).thenReturn(Optional.of(c));

            when(enrollmentRepository.countByCourse_CourseID(2L)).thenReturn(0L);
            when(courseReviewRepository.findByCourse_CourseID(2L)).thenReturn(List.of());
            when(courseSectionRepository.findByCourse_CourseID(2L)).thenReturn(List.of());
            when(courseObjectiveRepository
                    .findByCourse_CourseIDOrderByOrderIndexAsc(2L))
                    .thenReturn(List.of());

            AdminCourseDetailResponse result =
                    adminCourseService.updateCourseReviewNote(2L, "Admin note");

            assertEquals("Admin note", result.getAdminReviewNote());
        }
    }

    @Nested
    @DisplayName("AdminCourseService.updateCourseDraftReviewNote")
    class UpdateCourseDraftReviewNoteTests {

        /**
         * Case: Draft không tồn tại
         *  - Kỳ vọng: AppException(DRAFT_NOT_FOUND)
         */
        @Test
        @DisplayName("Draft không tồn tại -> AppException")
        void updateCourseDraftReviewNote_draftNotFound_shouldThrow() {
            when(courseDraftRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.updateCourseDraftReviewNote(1L, "note"));
        }

        /**
         * Case: Cập nhật note cho draft
         *  - Kỳ vọng:
         *      + adminReviewNote = "Draft note"
         *      + id = draftID
         *      + draft = true
         */
        @Test
        @DisplayName("Cập nhật review note cho course draft")
        void updateCourseDraftReviewNote_happyPath_shouldUpdateNote() {
            Course course = buildCourse(10L, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(3L, course, CourseDraftStatus.PENDING_REVIEW);

            when(courseDraftRepository.findById(3L)).thenReturn(Optional.of(draft));
            when(enrollmentRepository.countByCourse_CourseID(draft.getDraftID())).thenReturn(0L);
            when(courseReviewRepository.findByCourse_CourseID(draft.getDraftID()))
                    .thenReturn(List.of());
            when(courseSectionRepository.findByCourse_CourseID(course.getCourseID()))
                    .thenReturn(List.of());
            when(courseObjectiveRepository
                    .findByCourse_CourseIDOrderByOrderIndexAsc(course.getCourseID()))
                    .thenReturn(List.of());

            AdminCourseDetailResponse result =
                    adminCourseService.updateCourseDraftReviewNote(3L, "Draft note");

            assertEquals("Draft note", result.getAdminReviewNote());
            assertEquals(3L, result.getId());
            assertEquals(true, result.getDraft());
        }
    }

    // =====================================================================
    // getCourseDraftsForAdmin, getCourseDraftDetail, getCourseDraftDetailWithCurriculum
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.getCourseDraftsForAdmin")
    class GetCourseDraftsForAdminTests {

        /**
         * Case: status = null
         *  - Kỳ vọng: gọi findAll() và trả về danh sách đầy đủ
         */
        @Test
        @DisplayName("status = null -> tất cả draft")
        void getCourseDraftsForAdmin_statusNull_shouldReturnAll() {
            Course c = buildCourse(5L, CourseStatus.Approved);
            CourseDraft d1 = buildCourseDraft(1L, c, CourseDraftStatus.PENDING_REVIEW);
            CourseDraft d2 = buildCourseDraft(2L, c, CourseDraftStatus.EDITING);

            when(courseDraftRepository.findAll()).thenReturn(List.of(d1, d2));

            List<AdminCourseDraftResponse> result =
                    adminCourseService.getCourseDraftsForAdmin(null);

            assertEquals(2, result.size());
            assertEquals(1L, result.get(0).getDraftID());
            assertEquals(2L, result.get(1).getDraftID());
        }

        /**
         * Case: filter theo status PENDING_REVIEW
         *  - Kỳ vọng: gọi findByStatus(PENDING_REVIEW)
         */
        @Test
        @DisplayName("Filter theo status PENDING_REVIEW")
        void getCourseDraftsForAdmin_statusPending_shouldUseFindByStatus() {
            Course c = buildCourse(5L, CourseStatus.Approved);
            CourseDraft d1 = buildCourseDraft(1L, c, CourseDraftStatus.PENDING_REVIEW);

            when(courseDraftRepository.findByStatus(CourseDraftStatus.PENDING_REVIEW))
                    .thenReturn(List.of(d1));

            List<AdminCourseDraftResponse> result =
                    adminCourseService.getCourseDraftsForAdmin(CourseDraftStatus.PENDING_REVIEW);

            assertEquals(1, result.size());
            assertEquals(1L, result.get(0).getDraftID());
        }
    }

    @Nested
    @DisplayName("AdminCourseService.getCourseDraftDetail")
    class GetCourseDraftDetailTests {

        /**
         * Case: Draft không tồn tại
         */
        @Test
        @DisplayName("Draft không tồn tại -> AppException")
        void getCourseDraftDetail_notFound_shouldThrow() {
            when(courseDraftRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class, () -> adminCourseService.getCourseDraftDetail(1L));
        }

        /**
         * Case: Draft tồn tại -> map ra AdminCourseDraftResponse
         */
        @Test
        @DisplayName("Draft tồn tại -> trả về AdminCourseDraftResponse")
        void getCourseDraftDetail_happyPath_shouldReturn() {
            Course c = buildCourse(5L, CourseStatus.Approved);
            CourseDraft d = buildCourseDraft(2L, c, CourseDraftStatus.PENDING_REVIEW);

            when(courseDraftRepository.findById(2L)).thenReturn(Optional.of(d));

            AdminCourseDraftResponse result =
                    adminCourseService.getCourseDraftDetail(2L);

            assertEquals(2L, result.getDraftID());
            assertEquals(c.getCourseID(), result.getCourseID());
        }
    }

    @Nested
    @DisplayName("AdminCourseService.getCourseDraftDetailWithCurriculum")
    class GetCourseDraftDetailWithCurriculumTests {

        /**
         * Case: Draft không tồn tại
         */
        @Test
        @DisplayName("Draft không tồn tại -> AppException")
        void getCourseDraftDetailWithCurriculum_notFound_shouldThrow() {
            when(courseDraftRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.getCourseDraftDetailWithCurriculum(1L));
        }

        /**
         * Case: Draft tồn tại, không có section/objective, không review
         *  - Kỳ vọng: detail draft có:
         *      + draft = true
         *      + id = draftID
         *      + courseID = id course gốc
         */
        @Test
        @DisplayName("Draft tồn tại -> trả về detail draft có curriculum")
        void getCourseDraftDetailWithCurriculum_happyPath_shouldReturnDetail() {
            Course c = buildCourse(10L, CourseStatus.Approved);
            CourseDraft d = buildCourseDraft(3L, c, CourseDraftStatus.PENDING_REVIEW);

            when(courseDraftRepository.findById(3L)).thenReturn(Optional.of(d));
            when(enrollmentRepository.countByCourse_CourseID(d.getDraftID()))
                    .thenReturn(0L);
            when(courseReviewRepository.findByCourse_CourseID(d.getDraftID()))
                    .thenReturn(List.of());
            when(courseSectionRepository.findByCourse_CourseID(c.getCourseID()))
                    .thenReturn(List.of());
            when(courseObjectiveRepository
                    .findByCourse_CourseIDOrderByOrderIndexAsc(c.getCourseID()))
                    .thenReturn(List.of());

            AdminCourseDetailResponse result =
                    adminCourseService.getCourseDraftDetailWithCurriculum(3L);

            assertEquals(true, result.getDraft());
            assertEquals(3L, result.getId());
            assertEquals(10L, result.getCourseID());
        }
    }

    // =====================================================================
    // approveLiveCourse, rejectLiveCourse
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.approveLiveCourse")
    class ApproveLiveCourseTests {

        /**
         * Case: Course không tồn tại
         */
        @Test
        @DisplayName("Course không tồn tại -> AppException")
        void approveLiveCourse_courseNotFound_shouldThrow() {
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.approveLiveCourse(1L, "note"));
        }

        /**
         * Case: Course status != Pending
         *  - Kỳ vọng: AppException(INVALID_STATE), không save
         */
        @Test
        @DisplayName("Course không ở trạng thái Pending -> INVALID_STATE")
        void approveLiveCourse_invalidState_shouldThrow() {
            Course c = buildCourse(2L, CourseStatus.Approved);
            when(courseRepository.findById(2L)).thenReturn(Optional.of(c));

            assertThrows(AppException.class,
                    () -> adminCourseService.approveLiveCourse(2L, "note"));

            verify(courseRepository, never()).save(any());
        }

        /**
         * Case: Happy path:
         *  - Course từ Pending -> Approved
         *  - Lưu DB
         *  - Gửi email + notification cho tutor
         */
        @Test
        @DisplayName("Happy path: status từ Pending -> Approved, gửi email + notification")
        void approveLiveCourse_happyPath_shouldUpdateAndNotify() {
            Course c = buildCourse(3L, CourseStatus.Pending);
            when(courseRepository.findById(3L)).thenReturn(Optional.of(c));

            String note = "Looks good";

            AdminCourseResponse result =
                    adminCourseService.approveLiveCourse(3L, note);

            assertEquals("Approved", result.getStatus());
            assertEquals(note, result.getAdminReviewNote());

            verify(courseRepository, times(1)).save(c);
            // verify email
            verify(emailService, times(1))
                    .sendCourseApprovedToTutor(eq("tutor@mail.com"), eq("Course 3"), eq(note));
            // verify notification
            verify(notificationService, times(1))
                    .sendNotification(
                            eq(99L),
                            contains("Course approved"),
                            contains("Course 3"),
                            eq(NotificationType.COURSE_APPROVED),
                            eq("/tutor/courses/3")
                    );
        }
    }

    @Nested
    @DisplayName("AdminCourseService.rejectLiveCourse")
    class RejectLiveCourseTests {

        /**
         * Case: Course không tồn tại
         */
        @Test
        @DisplayName("Course không tồn tại -> AppException")
        void rejectLiveCourse_courseNotFound_shouldThrow() {
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.rejectLiveCourse(1L, "note"));
        }

        /**
         * Case: Course status != Pending
         */
        @Test
        @DisplayName("Course không ở trạng thái Pending -> INVALID_STATE")
        void rejectLiveCourse_invalidState_shouldThrow() {
            Course c = buildCourse(2L, CourseStatus.Approved);
            when(courseRepository.findById(2L)).thenReturn(Optional.of(c));

            assertThrows(AppException.class,
                    () -> adminCourseService.rejectLiveCourse(2L, "note"));

            verify(courseRepository, never()).save(any());
        }

        /**
         * Case: Happy path:
         *  - Course từ Pending -> Rejected
         *  - Gửi email + notification cho tutor
         */
        @Test
        @DisplayName("Happy path: status từ Pending -> Rejected, gửi email + notification")
        void rejectLiveCourse_happyPath_shouldUpdateAndNotify() {
            Course c = buildCourse(3L, CourseStatus.Pending);
            when(courseRepository.findById(3L)).thenReturn(Optional.of(c));

            String note = "Reason";

            AdminCourseResponse result =
                    adminCourseService.rejectLiveCourse(3L, note);

            assertEquals("Rejected", result.getStatus());
            assertEquals(note, result.getAdminReviewNote());

            verify(courseRepository, times(1)).save(c);
            verify(emailService, times(1))
                    .sendCourseRejectedToTutor(eq("tutor@mail.com"), eq("Course 3"), eq(note));
            verify(notificationService, times(1))
                    .sendNotification(
                            eq(99L),
                            contains("Course rejected"),
                            contains("Course 3"),
                            eq(NotificationType.COURSE_REJECTED),
                            eq("/tutor/courses/3")
                    );
        }
    }

    // =====================================================================
    // approveCourseDraft (các case theo bảng UTCID01–UTCID05)
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.approveCourseDraft")
    class ApproveCourseDraftTests {

        /**
         * UTCID01
         * Case: Draft không tồn tại
         *  - Precondition: courseDraftRepository.findById trả Optional.empty()
         *  - Expected: AppException(DRAFT_NOT_FOUND)
         */
        @Test
        @DisplayName("Draft không tồn tại -> DRAFT_NOT_FOUND")
        void approveCourseDraft_draftNotFound_shouldThrow() {
            when(courseDraftRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.approveCourseDraft(1L));
        }

        /**
         * UTCID02
         * Case: Draft tồn tại nhưng status != PENDING_REVIEW
         *  - Precondition: draft.status = EDITING
         *  - Expected: AppException(INVALID_STATE), không save course
         */
        @Test
        @DisplayName("Draft tồn tại nhưng status != PENDING_REVIEW -> INVALID_STATE")
        void approveCourseDraft_invalidState_shouldThrow() {
            Course course = buildCourse(2L, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(3L, course, CourseDraftStatus.EDITING);

            when(courseDraftRepository.findById(3L)).thenReturn(Optional.of(draft));

            assertThrows(AppException.class,
                    () -> adminCourseService.approveCourseDraft(3L));

            verify(courseRepository, never()).save(any());
        }

        /**
         * UTCID03 / UTCID04 (no enrollment)
         * Case: Draft PENDING_REVIEW, course không có enrollment
         *  - Expected:
         *      + Merge metadata từ draft -> course
         *      + Xóa draft
         *      + Không gửi mail updated cho learner
         */
        @Test
        @DisplayName("Draft PENDING_REVIEW, không enrollment -> approve OK")
        void approveCourseDraft_pendReview_noEnrollment_shouldApprove() {
            Course course = buildCourse(10L, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(5L, course, CourseDraftStatus.PENDING_REVIEW);

            when(courseDraftRepository.findById(5L)).thenReturn(Optional.of(draft));

            // Các repo diff / sync trả list rỗng
            when(courseObjectiveRepository
                    .findByCourse_CourseIDOrderByOrderIndexAsc(course.getCourseID()))
                    .thenReturn(List.of());
            when(courseSectionRepository.findByCourse_CourseID(course.getCourseID()))
                    .thenReturn(List.of());
            when(lessonRepository.findBySection_SectionIDIn(anyList()))
                    .thenReturn(List.of());
            when(lessonResourceRepository.findByLesson_LessonIDIn(anyList()))
                    .thenReturn(List.of());
            when(courseReviewRepository.findByCourse_CourseID(course.getCourseID()))
                    .thenReturn(List.of());
            when(enrollmentRepository.countByCourse_CourseID(anyLong()))
                    .thenReturn(0L);
            when(enrollmentRepository.findAllByCourseId(anyLong()))
                    .thenReturn(List.of());
            when(userCourseSectionRepository.findBySection_SectionID(anyLong()))
                    .thenReturn(List.of());

            AdminCourseResponse result =
                    adminCourseService.approveCourseDraft(5L);

            assertEquals(course.getCourseID(), result.getId());
            assertEquals(draft.getTitle(), result.getTitle());

            verify(courseRepository, times(1)).save(course);
            verify(courseDraftRepository, times(1)).delete(draft);
            // Không có learner -> không gửi mail cập nhật khóa học
            verify(emailService, never())
                    .sendCourseUpdatedToLearner(anyString(), anyString(), anyString());
        }

        /**
         * UTCID05+
         * Case: Course có enrollment -> notify learner + tutor
         */
        @Test
        @DisplayName("Course có enrollment -> notify learner + tutor")
        void approveCourseDraft_withEnrollments_shouldNotifyLearnersAndTutor() {
            Course course = buildCourse(20L, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(7L, course, CourseDraftStatus.PENDING_REVIEW);

            when(courseDraftRepository.findById(7L)).thenReturn(Optional.of(draft));

            when(courseObjectiveRepository
                    .findByCourse_CourseIDOrderByOrderIndexAsc(course.getCourseID()))
                    .thenReturn(List.of());
            when(courseSectionRepository.findByCourse_CourseID(course.getCourseID()))
                    .thenReturn(List.of());
            when(lessonRepository.findBySection_SectionIDIn(anyList()))
                    .thenReturn(List.of());
            when(lessonResourceRepository.findByLesson_LessonIDIn(anyList()))
                    .thenReturn(List.of());
            when(courseReviewRepository.findByCourse_CourseID(course.getCourseID()))
                    .thenReturn(List.of());

            User learner1 = new User();
            learner1.setUserID(100L);
            learner1.setEmail("learner1@mail.com");

            User learner2 = new User();
            learner2.setUserID(101L);
            learner2.setEmail("learner2@mail.com");

            Enrollment e1 = new Enrollment();
            e1.setUser(learner1);
            e1.setCourse(course);

            Enrollment e2 = new Enrollment();
            e2.setUser(learner2);
            e2.setCourse(course);

            when(enrollmentRepository.countByCourse_CourseID(course.getCourseID()))
                    .thenReturn(2L);
            when(enrollmentRepository.findAllByCourseId(course.getCourseID()))
                    .thenReturn(List.of(e1, e2));

            when(userCourseSectionRepository.findBySection_SectionID(anyLong()))
                    .thenReturn(List.of());
            when(userLessonRepository
                    .countByUser_UserIDAndLesson_Section_SectionIDAndIsDoneTrue(
                            anyLong(), anyLong()))
                    .thenReturn(0L);

            AdminCourseResponse result =
                    adminCourseService.approveCourseDraft(7L);

            assertEquals(course.getCourseID(), result.getId());
            verify(courseRepository, times(1)).save(course);
            verify(courseDraftRepository, times(1)).delete(draft);

            // Có ít nhất 1 mail gửi cho learner
            verify(emailService, atLeastOnce())
                    .sendCourseUpdatedToLearner(anyString(), eq(course.getTitle()), anyString());
            // Có ít nhất 1 notification cho learner
            verify(notificationService, atLeastOnce())
                    .sendNotification(
                            anyLong(),
                            contains("Course updated"),
                            contains("has just been updated"),
                            eq(NotificationType.COURSE_UPDATED),
                            eq("/courses/" + course.getCourseID())
                    );
            // Email cho tutor về việc draft được approve
            verify(emailService, times(1))
                    .sendCourseDraftApprovedToTutor(
                            eq("tutor@mail.com"),
                            eq(course.getTitle()),
                            anyString()
                    );
            // Notification cho tutor
            verify(notificationService, times(1))
                    .sendNotification(
                            eq(99L),
                            contains("Course draft approved"),
                            contains("have been approved"),
                            eq(NotificationType.COURSE_DRAFT_APPROVED),
                            eq("/tutor/courses/" + course.getCourseID())
                    );
        }
    }

    // =====================================================================
    // rejectCourseDraft(draftID, note) + rejectCourseDraft(draftID)
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.rejectCourseDraft(draftID, note)")
    class RejectCourseDraftWithNoteTests {

        /**
         * UTCID02 + UTCID08
         * Case: Draft không tồn tại
         *  - Expected:
         *      + Ném AppException(DRAFT_NOT_FOUND)
         *      + Không tạo mới / không save draft nào
         */
        @Test
        @DisplayName("Draft không tồn tại -> DRAFT_NOT_FOUND, không save draft mới")
        void rejectCourseDraft_draftNotFound_shouldThrow() {
            when(courseDraftRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.rejectCourseDraft(1L, "note"));

            // UTCID08: No new CourseDraft records are created.
            verify(courseDraftRepository, never()).save(any(CourseDraft.class));
        }

        /**
         * UTCID03
         * Case: Draft status != PENDING_REVIEW (ví dụ EDITING/DRAFTING)
         *  - Expected:
         *      + AppException(INVALID_STATE)
         *      + Không gửi email
         *      + Không save draft
         */
        @Test
        @DisplayName("Draft status != PENDING_REVIEW -> INVALID_STATE")
        void rejectCourseDraft_invalidState_shouldThrow() {
            Course c = buildCourse(5L, CourseStatus.Approved);
            CourseDraft d = buildCourseDraft(2L, c, CourseDraftStatus.EDITING);

            when(courseDraftRepository.findById(2L)).thenReturn(Optional.of(d));

            assertThrows(AppException.class,
                    () -> adminCourseService.rejectCourseDraft(2L, "reason"));

            verify(emailService, never())
                    .sendCourseDraftRejectedToTutor(anyString(), anyString(), anyString());
            verify(courseDraftRepository, never()).save(any(CourseDraft.class));
        }

        /**
         * UTCID01 + UTCID04
         * Case:
         *  - Draft PENDING_REVIEW
         *  - AdminReview ban đầu = null
         *  - updatedAt ban đầu = 2024-12-01 10:00:00
         *  - Note = "Nội dung không phù hợp"
         *  - Expected:
         *      + status = REJECTED
         *      + adminReviewNote = note
         *      + updatedAt != 2024-12-01 10:00:00
         *      + gửi email + notification tutor
         */
        @Test
        @DisplayName("Draft PENDING_REVIEW, note đầy đủ -> REJECTED, note set, updatedAt đổi")
        void rejectCourseDraft_happyPath_shouldUpdateStatusNoteAndUpdatedAt() {
            Course c = buildCourse(5L, CourseStatus.Approved);
            CourseDraft d = buildCourseDraft(3L, c, CourseDraftStatus.PENDING_REVIEW);

            // UTCID04: set updatedAt ban đầu cố định
            LocalDateTime oldUpdatedAt = LocalDateTime.of(2024, 12, 1, 10, 0, 0);
            d.setUpdatedAt(oldUpdatedAt);
            d.setAdminReviewNote(null); // đảm bảo ban đầu là null

            when(courseDraftRepository.findById(3L)).thenReturn(Optional.of(d));

            String note = "Nội dung không phù hợp"; // đúng theo bảng

            adminCourseService.rejectCourseDraft(3L, note);

            assertEquals(CourseDraftStatus.REJECTED, d.getStatus());
            assertEquals(note, d.getAdminReviewNote());
            assertNotNull(d.getUpdatedAt());
            assertNotEquals(oldUpdatedAt, d.getUpdatedAt()); // updatedAt phải thay đổi

            verify(emailService, times(1))
                    .sendCourseDraftRejectedToTutor(
                            eq("tutor@mail.com"),
                            eq(c.getTitle()),
                            eq(note)
                    );
            verify(notificationService, times(1))
                    .sendNotification(
                            eq(99L),
                            contains("Course draft rejected"),
                            contains("was rejected"),
                            eq(NotificationType.COURSE_DRAFT_REJECTED),
                            eq("/tutor/courses/" + c.getCourseID())
                    );
        }

        /**
         * UTCID05
         * Case: Note = "Rejected"
         *  - Boundary test cho nội dung note
         *  - Expected:
         *      + status = REJECTED
         *      + adminReviewNote = "Rejected"
         */
        @Test
        @DisplayName("Draft PENDING_REVIEW, note = \"Rejected\" -> REJECTED, note='Rejected'")
        void rejectCourseDraft_noteRejected_shouldSetExactNote() {
            Course c = buildCourse(6L, CourseStatus.Approved);
            CourseDraft d = buildCourseDraft(4L, c, CourseDraftStatus.PENDING_REVIEW);

            when(courseDraftRepository.findById(4L)).thenReturn(Optional.of(d));

            String note = "Rejected";

            adminCourseService.rejectCourseDraft(4L, note);

            assertEquals(CourseDraftStatus.REJECTED, d.getStatus());
            assertEquals("Rejected", d.getAdminReviewNote());
        }

        /**
         * UTCID07
         * Case: Note = "" (empty string)
         *  - Expected:
         *      + status = REJECTED
         *      + adminReviewNote = ""
         */
        @Test
        @DisplayName("Draft PENDING_REVIEW, note rỗng \"\" -> REJECTED, adminReviewNote = \"\"")
        void rejectCourseDraft_emptyNote_shouldSetEmptyString() {
            Course c = buildCourse(7L, CourseStatus.Approved);
            CourseDraft d = buildCourseDraft(5L, c, CourseDraftStatus.PENDING_REVIEW);

            when(courseDraftRepository.findById(5L)).thenReturn(Optional.of(d));

            adminCourseService.rejectCourseDraft(5L, "");

            assertEquals(CourseDraftStatus.REJECTED, d.getStatus());
            assertEquals("", d.getAdminReviewNote());
        }
    }

    @Nested
    @DisplayName("AdminCourseService.rejectCourseDraft(draftID) (overload)")
    class RejectCourseDraftOverloadTests {

        /**
         * UTCID06
         * Case: gọi overload không truyền note
         *  - Expected:
         *      + nội bộ gọi rejectCourseDraft(draftID, null)
         *      + status = REJECTED
         *      + adminReviewNote = null
         *      + vẫn gửi notification tutor
         */
        @Test
        @DisplayName("Overload không note -> note = null, vẫn REJECTED & notify")
        void rejectCourseDraft_overload_shouldDelegateWithNullNote() {
            Course c = buildCourse(8L, CourseStatus.Approved);
            CourseDraft d = buildCourseDraft(4L, c, CourseDraftStatus.PENDING_REVIEW);

            when(courseDraftRepository.findById(4L)).thenReturn(Optional.of(d));

            adminCourseService.rejectCourseDraft(4L); // không truyền note => note = null

            assertEquals(CourseDraftStatus.REJECTED, d.getStatus());
            assertNull(d.getAdminReviewNote()); // UTCID06: adminReviewNote = null

            verify(notificationService, times(1))
                    .sendNotification(
                            eq(99L),
                            contains("Course draft rejected"),
                            contains("was rejected"),
                            eq(NotificationType.COURSE_DRAFT_REJECTED),
                            eq("/tutor/courses/" + c.getCourseID())
                    );
        }
    }

    // =====================================================================
    // getCourseDraftChanges(Long draftID)
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.getCourseDraftChanges")
    class GetCourseDraftChangesTests {

        /**
         * Case: Draft không tồn tại
         */
        @Test
        @DisplayName("Draft không tồn tại -> AppException")
        void getCourseDraftChanges_draftNotFound_shouldThrow() {
            when(courseDraftRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.getCourseDraftChanges(1L));
        }

        /**
         * Case: Draft tồn tại, nhưng không có diff (list rỗng)
         *  - Expected: trả về AdminCourseDraftChangesResponse với các list != null
         */
        @Test
        @DisplayName("Draft tồn tại -> trả về AdminCourseDraftChangesResponse (kể cả khi diff rỗng)")
        void getCourseDraftChanges_happyPath_shouldReturnDiff() {
            Course c = buildCourse(9L, CourseStatus.Approved);
            CourseDraft d = buildCourseDraft(6L, c, CourseDraftStatus.PENDING_REVIEW);

            when(courseDraftRepository.findById(6L)).thenReturn(Optional.of(d));

            when(courseObjectiveRepository
                    .findByCourse_CourseIDOrderByOrderIndexAsc(c.getCourseID()))
                    .thenReturn(List.of());
            when(courseSectionRepository.findByCourse_CourseID(c.getCourseID()))
                    .thenReturn(List.of());
            when(lessonRepository.findBySection_SectionIDIn(anyList()))
                    .thenReturn(List.of());
            when(lessonResourceRepository.findByLesson_LessonIDIn(anyList()))
                    .thenReturn(List.of());
            when(courseReviewRepository.findByCourse_CourseID(c.getCourseID()))
                    .thenReturn(List.of());

            AdminCourseDraftChangesResponse result =
                    adminCourseService.getCourseDraftChanges(6L);

            assertEquals(c.getCourseID(), result.getCourseId());
            assertEquals(d.getDraftID(), result.getDraftId());
            assertNotNull(result.getCourseChanges());
            assertNotNull(result.getLessons());
            assertNotNull(result.getResources());
        }
    }
}
