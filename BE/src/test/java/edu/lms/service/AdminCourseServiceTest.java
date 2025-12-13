package edu.lms.service;

import edu.lms.dto.response.AdminCourseDetailResponse;
import edu.lms.dto.response.AdminCourseDraftChangesResponse;
import edu.lms.dto.response.AdminCourseDraftResponse;
import edu.lms.dto.response.AdminCourseResponse;
import edu.lms.entity.*;
import edu.lms.enums.CourseDraftStatus;
import edu.lms.enums.CourseStatus;
import edu.lms.enums.LessonType;
import edu.lms.enums.NotificationType;
import edu.lms.exception.AppException;
import edu.lms.repository.*;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * AdminCourseServiceTest – unit test cho các method public của AdminCourseService
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@FieldDefaults(level = AccessLevel.PRIVATE)
class AdminCourseServiceTest {

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

        @Test
        @DisplayName("Course không tồn tại -> AppException")
        void getCourseDetail_courseNotFound_shouldThrow() {
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class, () -> adminCourseService.getCourseDetail(1L));
        }

        @Test
        @DisplayName("Course tồn tại -> map sang AdminCourseDetailResponse")
        void getCourseDetail_happyPath_shouldReturnDetail() {
            Course course = buildCourse(2L, CourseStatus.Approved);

            when(courseRepository.findById(2L)).thenReturn(Optional.of(course));
            when(enrollmentRepository.countByCourse_CourseID(2L)).thenReturn(5L);
            when(courseReviewRepository.findByCourse_CourseID(2L))
                    .thenReturn(List.of());
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

        @Test
        @DisplayName("Course không tồn tại -> AppException")
        void updateCourseReviewNote_courseNotFound_shouldThrow() {
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.updateCourseReviewNote(1L, "note"));
        }

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

        @Test
        @DisplayName("Draft không tồn tại -> AppException")
        void updateCourseDraftReviewNote_draftNotFound_shouldThrow() {
            when(courseDraftRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.updateCourseDraftReviewNote(1L, "note"));
        }

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
            assertTrue(result.getDraft());
        }
    }

    // =====================================================================
    // getCourseDraftsForAdmin, getCourseDraftDetail, getCourseDraftDetailWithCurriculum
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.getCourseDraftsForAdmin")
    class GetCourseDraftsForAdminTests {

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

        @Test
        @DisplayName("Draft không tồn tại -> AppException")
        void getCourseDraftDetail_notFound_shouldThrow() {
            when(courseDraftRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class, () -> adminCourseService.getCourseDraftDetail(1L));
        }

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

        @Test
        @DisplayName("Draft không tồn tại -> AppException")
        void getCourseDraftDetailWithCurriculum_notFound_shouldThrow() {
            when(courseDraftRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.getCourseDraftDetailWithCurriculum(1L));
        }

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

            assertTrue(result.getDraft());
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

        @Test
        @DisplayName("Course không tồn tại -> AppException")
        void approveLiveCourse_courseNotFound_shouldThrow() {
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.approveLiveCourse(1L, "note"));
        }

        @Test
        @DisplayName("Course không ở trạng thái Pending -> INVALID_STATE")
        void approveLiveCourse_invalidState_shouldThrow() {
            Course c = buildCourse(2L, CourseStatus.Approved);
            when(courseRepository.findById(2L)).thenReturn(Optional.of(c));

            assertThrows(AppException.class,
                    () -> adminCourseService.approveLiveCourse(2L, "note"));

            verify(courseRepository, never()).save(any());
        }

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
            verify(emailService, times(1))
                    .sendCourseApprovedToTutor(eq("tutor@mail.com"), eq("Course 3"), eq(note));
            verify(notificationService, times(1))
                    .sendNotification(
                            eq(99L),
                            contains("Khoá học đã được phê duyệt"),
                            contains("Course 3"),
                            eq(NotificationType.COURSE_APPROVED),
                            eq("/tutor/courses/3/details")
                    );
        }

        @Test
        @DisplayName("approveLiveCourse - tutor null -> skip email & notification")
        void approveLiveCourse_tutorNull_shouldSkipNotify() {
            Course c = buildCourse(10L, CourseStatus.Pending);
            c.setTutor(null);

            when(courseRepository.findById(10L)).thenReturn(Optional.of(c));

            AdminCourseResponse result =
                    adminCourseService.approveLiveCourse(10L, "note");

            assertEquals("Approved", result.getStatus());
            verify(emailService, never())
                    .sendCourseApprovedToTutor(anyString(), anyString(), anyString());
            verify(notificationService, never())
                    .sendNotification(anyLong(), anyString(), anyString(), any(), anyString());
        }

        @Test
        @DisplayName("approveLiveCourse - tutor email blank -> chỉ gửi notification")
        void approveLiveCourse_tutorEmailBlank_shouldSkipEmailButSendNotification() {
            Course c = buildCourse(11L, CourseStatus.Pending);
            c.getTutor().getUser().setEmail("   ");

            when(courseRepository.findById(11L)).thenReturn(Optional.of(c));

            adminCourseService.approveLiveCourse(11L, "note");

            verify(emailService, never())
                    .sendCourseApprovedToTutor(anyString(), anyString(), anyString());
            verify(notificationService, times(1))
                    .sendNotification(
                            eq(99L),
                            contains("Khoá học đã được phê duyệt"),
                            contains("Course 11"),
                            eq(NotificationType.COURSE_APPROVED),
                            eq("/tutor/courses/11/details")
                    );
        }
    }

    @Nested
    @DisplayName("AdminCourseService.rejectLiveCourse")
    class RejectLiveCourseTests {

        @Test
        @DisplayName("Course không tồn tại -> AppException")
        void rejectLiveCourse_courseNotFound_shouldThrow() {
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.rejectLiveCourse(1L, "note"));
        }

        @Test
        @DisplayName("Course không ở trạng thái Pending -> INVALID_STATE")
        void rejectLiveCourse_invalidState_shouldThrow() {
            Course c = buildCourse(2L, CourseStatus.Approved);
            when(courseRepository.findById(2L)).thenReturn(Optional.of(c));

            assertThrows(AppException.class,
                    () -> adminCourseService.rejectLiveCourse(2L, "note"));

            verify(courseRepository, never()).save(any());
        }

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
                            contains("Khoá học bị từ chối"),
                            contains("Course 3"),
                            eq(NotificationType.COURSE_REJECTED),
                            eq("/tutor/courses/3/details")
                    );
        }

        @Test
        @DisplayName("rejectLiveCourse - tutor email blank -> chỉ gửi notification")
        void rejectLiveCourse_tutorEmailBlank_shouldSkipEmailButSendNotification() {
            Course c = buildCourse(12L, CourseStatus.Pending);
            c.getTutor().getUser().setEmail("   ");

            when(courseRepository.findById(12L)).thenReturn(Optional.of(c));

            adminCourseService.rejectLiveCourse(12L, "reason");

            verify(emailService, never())
                    .sendCourseRejectedToTutor(anyString(), anyString(), anyString());
            verify(notificationService, times(1))
                    .sendNotification(
                            eq(99L),
                            contains("Khoá học bị từ chối"),
                            contains("Course 12"),
                            eq(NotificationType.COURSE_REJECTED),
                            eq("/tutor/courses/12/details")
                    );
        }
    }

    // =====================================================================
    // approveCourseDraft
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.approveCourseDraft")
    class ApproveCourseDraftTests {

        @Test
        @DisplayName("Draft không tồn tại -> DRAFT_NOT_FOUND")
        void approveCourseDraft_draftNotFound_shouldThrow() {
            when(courseDraftRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.approveCourseDraft(1L));
        }

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

        @Test
        @DisplayName("Draft PENDING_REVIEW, không enrollment -> approve OK")
        void approveCourseDraft_pendReview_noEnrollment_shouldApprove() {
            Course course = buildCourse(10L, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(5L, course, CourseDraftStatus.PENDING_REVIEW);

            when(courseDraftRepository.findById(5L)).thenReturn(Optional.of(draft));

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
            verify(emailService, never())
                    .sendCourseUpdatedToLearner(anyString(), anyString(), anyString());
        }

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

            verify(emailService, atLeastOnce())
                    .sendCourseUpdatedToLearner(anyString(), eq(course.getTitle()), anyString());
            verify(notificationService, atLeastOnce())
                    .sendNotification(
                            anyLong(),
                            contains("Khoá học đã được cập nhật"),
                            contains("vừa được cập nhật"),
                            eq(NotificationType.COURSE_UPDATED),
                            eq("/courses/" + course.getCourseID())
                    );
            verify(emailService, times(1))
                    .sendCourseDraftApprovedToTutor(
                            eq("tutor@mail.com"),
                            eq(course.getTitle()),
                            anyString()
                    );
            verify(notificationService, times(1))
                    .sendNotification(
                            eq(99L),
                            contains("Bản nháp đã được phê duyệt"),
                            contains("đã được Admin phê duyệt"),
                            eq(NotificationType.COURSE_DRAFT_APPROVED),
                            eq("/tutor/courses/" + course.getCourseID() + "/details")
                    );
        }
    }

    // =====================================================================
    // rejectCourseDraft(draftID, note) + rejectCourseDraft(draftID)
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.rejectCourseDraft(draftID, note)")
    class RejectCourseDraftWithNoteTests {

        @Test
        @DisplayName("Draft không tồn tại -> DRAFT_NOT_FOUND, không save draft mới")
        void rejectCourseDraft_draftNotFound_shouldThrow() {
            when(courseDraftRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.rejectCourseDraft(1L, "note"));

            verify(courseDraftRepository, never()).save(any(CourseDraft.class));
        }

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

        @Test
        @DisplayName("Draft PENDING_REVIEW, note đầy đủ -> REJECTED, note set, updatedAt đổi")
        void rejectCourseDraft_happyPath_shouldUpdateStatusNoteAndUpdatedAt() {
            Course c = buildCourse(5L, CourseStatus.Approved);
            CourseDraft d = buildCourseDraft(3L, c, CourseDraftStatus.PENDING_REVIEW);

            LocalDateTime oldUpdatedAt = LocalDateTime.of(2024, 12, 1, 10, 0, 0);
            d.setUpdatedAt(oldUpdatedAt);
            d.setAdminReviewNote(null);

            when(courseDraftRepository.findById(3L)).thenReturn(Optional.of(d));

            String note = "Nội dung không phù hợp";

            adminCourseService.rejectCourseDraft(3L, note);

            assertEquals(CourseDraftStatus.REJECTED, d.getStatus());
            assertEquals(note, d.getAdminReviewNote());
            assertNotNull(d.getUpdatedAt());
            assertNotEquals(oldUpdatedAt, d.getUpdatedAt());

            verify(emailService, times(1))
                    .sendCourseDraftRejectedToTutor(
                            eq("tutor@mail.com"),
                            eq(c.getTitle()),
                            eq(note)
                    );
            verify(notificationService, times(1))
                    .sendNotification(
                            eq(99L),
                            contains("Bản nháp bị từ chối"),
                            contains("đã bị Admin từ chối"),
                            eq(NotificationType.COURSE_DRAFT_REJECTED),
                            eq("/tutor/courses/" + c.getCourseID() + "/details")
                    );
        }

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

        @Test
        @DisplayName("rejectCourseDraft - tutor email blank -> skip email, vẫn notify")
        void rejectCourseDraft_tutorEmailBlank_shouldSkipEmailButNotify() {
            Course c = buildCourse(13L, CourseStatus.Approved);
            CourseDraft d = buildCourseDraft(9L, c, CourseDraftStatus.PENDING_REVIEW);
            d.getTutor().getUser().setEmail("   ");

            when(courseDraftRepository.findById(9L)).thenReturn(Optional.of(d));

            adminCourseService.rejectCourseDraft(9L, "note");

            verify(emailService, never())
                    .sendCourseDraftRejectedToTutor(anyString(), anyString(), anyString());
            verify(notificationService, times(1))
                    .sendNotification(
                            eq(99L),
                            contains("Bản nháp bị từ chối"),
                            contains("đã bị Admin từ chối"),
                            eq(NotificationType.COURSE_DRAFT_REJECTED),
                            eq("/tutor/courses/" + c.getCourseID() + "/details")
                    );
        }
    }

    @Nested
    @DisplayName("AdminCourseService.rejectCourseDraft(draftID) (overload)")
    class RejectCourseDraftOverloadTests {

        @Test
        @DisplayName("Overload không note -> note = null, vẫn REJECTED & notify")
        void rejectCourseDraft_overload_shouldDelegateWithNullNote() {
            Course c = buildCourse(8L, CourseStatus.Approved);
            CourseDraft d = buildCourseDraft(4L, c, CourseDraftStatus.PENDING_REVIEW);

            when(courseDraftRepository.findById(4L)).thenReturn(Optional.of(d));

            adminCourseService.rejectCourseDraft(4L);

            assertEquals(CourseDraftStatus.REJECTED, d.getStatus());
            assertNull(d.getAdminReviewNote());

            verify(notificationService, times(1))
                    .sendNotification(
                            eq(99L),
                            contains("Bản nháp bị từ chối"),
                            contains("đã bị Admin từ chối"),
                            eq(NotificationType.COURSE_DRAFT_REJECTED),
                            eq("/tutor/courses/" + c.getCourseID() + "/details")
                    );
        }
    }

    // =====================================================================
    // getCourseDraftChanges(Long draftID)
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.getCourseDraftChanges")
    class GetCourseDraftChangesTests {

        @Test
        @DisplayName("Draft không tồn tại -> AppException")
        void getCourseDraftChanges_draftNotFound_shouldThrow() {
            when(courseDraftRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCourseService.getCourseDraftChanges(1L));
        }

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

    // =====================================================================
    // EXTRA: approveCourseDraft – no diff summary fallback
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.approveCourseDraft - no visible changes")
    class ApproveCourseDraftNoChangeSummaryTests {

        @Test
        @DisplayName("approveCourseDraft - no diff -> summary fallback 'minor internal changes'")
        void approveCourseDraft_noDiff_shouldUseFallbackSummary() {
            Course course = buildCourse(40L, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(41L, course, CourseDraftStatus.PENDING_REVIEW);

            draft.setTitle(course.getTitle());
            draft.setShortDescription(course.getShortDescription());
            draft.setDescription(course.getDescription());
            draft.setRequirement(course.getRequirement());
            draft.setLevel(course.getLevel());
            draft.setDuration(course.getDuration());
            draft.setPrice(course.getPrice());
            draft.setLanguage(course.getLanguage());
            draft.setThumbnailURL(course.getThumbnailURL());
            draft.setCategory(course.getCategory());
            draft.setTutor(course.getTutor());
            draft.setObjectives(new ArrayList<>());
            draft.setSections(new ArrayList<>());

            when(courseDraftRepository.findById(41L)).thenReturn(Optional.of(draft));

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

            User learner = new User();
            learner.setUserID(500L);
            learner.setEmail("learner@mail.com");
            Enrollment e = new Enrollment();
            e.setUser(learner);
            e.setCourse(course);

            when(enrollmentRepository.countByCourse_CourseID(course.getCourseID()))
                    .thenReturn(1L);
            when(enrollmentRepository.findAllByCourseId(course.getCourseID()))
                    .thenReturn(List.of(e));

            when(userCourseSectionRepository.findBySection_SectionID(anyLong()))
                    .thenReturn(List.of());

            ArgumentCaptor<String> summaryCaptor = ArgumentCaptor.forClass(String.class);

            adminCourseService.approveCourseDraft(41L);

            verify(emailService, times(1))
                    .sendCourseUpdatedToLearner(
                            eq("learner@mail.com"),
                            eq(course.getTitle()),
                            summaryCaptor.capture()
                    );

            String summary = summaryCaptor.getValue();
            assertEquals("Course was updated with minor internal changes.\n", summary);

            verify(notificationService, times(1))
                    .sendNotification(
                            eq(500L),
                            contains("Khoá học đã được cập nhật"),
                            contains("vừa được cập nhật"),
                            eq(NotificationType.COURSE_UPDATED),
                            eq("/courses/" + course.getCourseID())
                    );
        }
    }

    // =====================================================================
    // EXTRA: approveCourseDraft – quiz change + reset progress
    // =====================================================================

    @Nested
    @DisplayName("AdminCourseService.approveCourseDraft - quiz & progress reset")
    class ApproveCourseDraftQuizAndProgressTests {

        @Test
        @DisplayName("Quiz thay đổi + video URL thay đổi -> reset progress & sync quiz")
        void approveCourseDraft_quizChange_shouldResetProgressAndSyncQuiz() {
            // LIVE COURSE + SECTION
            Course course = buildCourse(30L, CourseStatus.Approved);

            CourseSection sectionLive = new CourseSection();
            sectionLive.setSectionID(100L);
            sectionLive.setCourse(course);
            sectionLive.setTitle("Live section");
            sectionLive.setOrderIndex(1);

            Lesson liveVideoLesson = new Lesson();
            liveVideoLesson.setLessonID(200L);
            liveVideoLesson.setSection(sectionLive);
            liveVideoLesson.setLessonType(LessonType.Video);
            liveVideoLesson.setTitle("Video L");
            liveVideoLesson.setVideoURL("old-url");
            liveVideoLesson.setDuration((short) 10);
            liveVideoLesson.setOrderIndex(1);

            Lesson liveQuizLesson = new Lesson();
            liveQuizLesson.setLessonID(201L);
            liveQuizLesson.setSection(sectionLive);
            liveQuizLesson.setLessonType(LessonType.Quiz);
            liveQuizLesson.setTitle("Quiz L");
            liveQuizLesson.setDuration((short) 5);
            liveQuizLesson.setOrderIndex(2);


            sectionLive.setLessons(List.of(liveVideoLesson, liveQuizLesson));
            course.setSections(List.of(sectionLive));

            QuizQuestion liveQuestion = new QuizQuestion();
            liveQuestion.setQuestionID(300L);
            liveQuestion.setLesson(liveQuizLesson);
            liveQuestion.setQuestionText("Q1");
            liveQuestion.setOrderIndex(1);

            QuizOption liveOption = new QuizOption();
            liveOption.setOptionID(400L);
            liveOption.setQuestion(liveQuestion);
            liveOption.setOptionText("A");
            liveOption.setIsCorrect(true);
            liveOption.setOrderIndex(1);
            liveQuestion.setOptions(List.of(liveOption));

            when(quizQuestionRepository.findByLessonOrderByOrderIndexAsc(liveQuizLesson))
                    .thenReturn(List.of(liveQuestion));

            // DRAFT
            CourseDraft draft = buildCourseDraft(31L, course, CourseDraftStatus.PENDING_REVIEW);

            CourseSectionDraft sectionDraft = new CourseSectionDraft();
            sectionDraft.setSectionDraftID(101L);
            sectionDraft.setDraft(draft);
            sectionDraft.setOriginalSectionID(sectionLive.getSectionID());
            sectionDraft.setTitle("Live section (updated)");
            sectionDraft.setOrderIndex(1);

            LessonDraft draftVideo = new LessonDraft();
            draftVideo.setLessonDraftID(210L);
            draftVideo.setOriginalLessonID(liveVideoLesson.getLessonID());
            draftVideo.setLessonType(LessonType.Video);
            draftVideo.setTitle("Video L");
            draftVideo.setVideoURL("new-url");
            draftVideo.setDuration((short) 10);
            draftVideo.setOrderIndex(1);
            draftVideo.setResources(new ArrayList<>());

            LessonDraft draftQuiz = new LessonDraft();
            draftQuiz.setLessonDraftID(211L);
            draftQuiz.setOriginalLessonID(liveQuizLesson.getLessonID());
            draftQuiz.setLessonType(LessonType.Quiz);
            draftQuiz.setTitle("Quiz L");
            draftQuiz.setDuration((short) 5);
            draftQuiz.setOrderIndex(2);
            draftQuiz.setResources(new ArrayList<>());

            QuizQuestionDraft draftQuestion = new QuizQuestionDraft();
            draftQuestion.setQuestionDraftID(301L);
            draftQuestion.setLessonDraft(draftQuiz);
            draftQuestion.setQuestionText("Q1 changed");
            draftQuestion.setOrderIndex(1);

            QuizOptionDraft draftOption = new QuizOptionDraft();
            draftOption.setOptionDraftID(401L);
            draftOption.setQuestionDraft(draftQuestion);
            draftOption.setOptionText("B");
            draftOption.setIsCorrect(true);
            draftOption.setOrderIndex(1);
            draftQuestion.setOptions(List.of(draftOption));

            when(quizQuestionDraftRepository.findByLessonDraftOrderByOrderIndexAsc(draftQuiz))
                    .thenReturn(List.of(draftQuestion));

            sectionDraft.setLessons(List.of(draftVideo, draftQuiz));
            draft.setSections(List.of(sectionDraft));

            when(courseDraftRepository.findById(31L)).thenReturn(Optional.of(draft));

            when(courseSectionRepository.findByCourse_CourseID(course.getCourseID()))
                    .thenReturn(List.of(sectionLive));
            when(lessonRepository.findBySection_SectionIDIn(anyList()))
                    .thenReturn(List.of(liveVideoLesson, liveQuizLesson));
            when(lessonResourceRepository.findByLesson_LessonIDIn(anyList()))
                    .thenReturn(List.of());

            when(courseObjectiveRepository
                    .findByCourse_CourseIDOrderByOrderIndexAsc(course.getCourseID()))
                    .thenReturn(List.of());
            when(courseReviewRepository.findByCourse_CourseID(course.getCourseID()))
                    .thenReturn(List.of());

            User learner = new User();
            learner.setUserID(1000L);

            UserCourseSection ucs = new UserCourseSection();
            ucs.setSection(sectionLive);
            ucs.setUser(learner);
            ucs.setProgress(BigDecimal.ZERO);

            when(userCourseSectionRepository.findBySection_SectionID(sectionLive.getSectionID()))
                    .thenReturn(List.of(ucs));

            when(userLessonRepository
                    .countByUser_UserIDAndLesson_Section_SectionIDAndIsDoneTrue(
                            eq(1000L),
                            eq(sectionLive.getSectionID())
                    )).thenReturn(1L);

            when(enrollmentRepository.countByCourse_CourseID(course.getCourseID()))
                    .thenReturn(0L);
            when(enrollmentRepository.findAllByCourseId(course.getCourseID()))
                    .thenReturn(List.of());

            AdminCourseResponse response =
                    adminCourseService.approveCourseDraft(31L);

            assertEquals(course.getCourseID(), response.getId());
            assertTrue(ucs.getProgress().compareTo(BigDecimal.ZERO) > 0);

            verify(userLessonRepository, atLeastOnce())
                    .deleteByLesson_LessonIDIn(argThat(list ->
                            list.contains(200L) || list.contains(201L)
                    ));

            verify(quizQuestionRepository, atLeastOnce()).deleteAll(anyList());
            verify(quizQuestionRepository, atLeastOnce()).save(any(QuizQuestion.class));
            verify(quizOptionRepository, atLeastOnce()).save(any(QuizOption.class));
        }
    }
}
