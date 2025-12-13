package edu.lms.service;

import edu.lms.dto.response.LessonInSectionResponse;
import edu.lms.dto.response.SectionProgressResponse;
import edu.lms.dto.response.StudentCourseListItemResponse;
import edu.lms.dto.response.StudentCourseResponse;
import edu.lms.entity.*;
import edu.lms.enums.EnrollmentStatus;
import edu.lms.enums.LessonType;
import edu.lms.exception.AppException;
import edu.lms.repository.*;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho StudentCourseService
 *
 * Cover:
 *  - getCoursesSummary()
 *      + Không có enrollment
 *      + Có enrollment: course không có section
 *      + Có enrollment: course có nhiều section, 1 số có progress, 1 số không -> tính avg & isCompleted
 *
 *  - getCourseDetail()
 *      + Enrollment không tồn tại -> AppException
 *      + Course không có section -> sectionProgress rỗng, progress = 0
 *      + Course có section + lesson Video + lesson Quiz (đã làm quiz, có kết quả) -> mapLessonInSection full
 *
 * Lưu ý: Chỉ assert throw AppException, không assert ErrorCode cụ thể.
 */
@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class StudentCourseServiceTest {

    @Mock
    EnrollmentRepository enrollmentRepository;
    @Mock
    UserCourseSectionRepository userCourseSectionRepository;
    @Mock
    UserLessonRepository userLessonRepository;
    @Mock
    QuizQuestionRepository quizQuestionRepository;
    @Mock
    UserQuizResultRepository userQuizResultRepository;

    @InjectMocks
    StudentCourseService studentCourseService;

    // =========================
    // HELPER: So sánh BigDecimal
    // =========================

    /**
     * Helper so sánh BigDecimal theo value, bỏ qua scale.
     * Ví dụ: 0 và 0.0 được coi là bằng nhau.
     */
    private void assertBigDecimalEquals(double expected, BigDecimal actual) {
        assertNotNull(actual, "Actual BigDecimal must not be null");
        assertEquals(
                0,
                actual.compareTo(BigDecimal.valueOf(expected)),
                () -> "Expected BigDecimal " + expected + " but was " + actual
        );
    }

    // =========================
    // HELPER BUILDERS
    // =========================

    private User buildUser(Long id, String fullName) {
        User u = new User();
        u.setUserID(id);
        u.setFullName(fullName);
        return u;
    }

    private Tutor buildTutor(Long tutorId, User user) {
        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setUser(user);
        return t;
    }

    private Course buildCourse(Long courseId, Tutor tutor) {
        Course c = new Course();
        c.setCourseID(courseId);
        c.setTutor(tutor);
        c.setTitle("Course " + courseId);
        c.setLanguage("EN");
        c.setPrice(BigDecimal.valueOf(100));
        c.setThumbnailURL("thumb-" + courseId + ".png");
        return c;
    }

    private CourseSection buildSection(Long sectionId, Course course, String title) {
        CourseSection s = new CourseSection();
        s.setSectionID(sectionId);
        s.setCourse(course);
        s.setTitle(title);
        return s;
    }

    private Lesson buildLesson(Long lessonId, CourseSection section, String title, LessonType type) {
        Lesson l = new Lesson();
        l.setLessonID(lessonId);
        l.setSection(section);
        l.setTitle(title);
        l.setLessonType(type);
        return l;
    }

    private Enrollment buildEnrollment(Long id, User user, Course course, EnrollmentStatus status) {
        Enrollment e = new Enrollment();
        e.setEnrollmentID(id);
        e.setUser(user);
        e.setCourse(course);
        e.setStatus(status);
        e.setCreatedAt(LocalDateTime.of(2025, 1, 1, 10, 0));
        return e;
    }

    private UserCourseSection buildUserCourseSection(Long id, User user, CourseSection section, BigDecimal progress) {
        UserCourseSection ucs = new UserCourseSection();
        ucs.setUserCourseSectionID(id);      // ✅ đúng field trong entity
        ucs.setUser(user);
        ucs.setSection(section);
        ucs.setProgress(progress);
        return ucs;
    }

    private UserLesson buildUserLesson(Long id, User user, Lesson lesson, boolean isDone) {
        UserLesson ul = new UserLesson();
        ul.setUserLessonID(id);             // ✅ đúng field trong entity
        ul.setUser(user);
        ul.setLesson(lesson);
        ul.setIsDone(isDone);
        return ul;
    }

    private UserQuizResult buildUserQuizResult(
            Long id,
            User user,
            Lesson lesson,
            Integer correctQuestions,
            BigDecimal percentage,
            Boolean passed
    ) {
        UserQuizResult r = new UserQuizResult();
        r.setId(id);                        // ✅ đúng field trong entity
        r.setUser(user);
        r.setLesson(lesson);
        r.setCorrectQuestions(correctQuestions);
        r.setPercentage(percentage);
        r.setPassed(passed);
        r.setSubmittedAt(LocalDateTime.of(2025, 1, 2, 12, 0));
        return r;
    }

    // =====================================================================
    // getCoursesSummary
    // =====================================================================
    @Nested
    @DisplayName("StudentCourseService.getCoursesSummary")
    class GetCoursesSummaryTests {

        /**
         * CASE 1
         * NOTE – User chưa ghi danh khoá nào -> trả về list rỗng
         */
        @Test
        @DisplayName("Không có enrollment -> trả về list rỗng")
        void getCoursesSummary_noEnrollment_returnEmptyList() {
            Long userId = 1L;
            when(enrollmentRepository.findByUser_UserID(userId))
                    .thenReturn(List.of());

            List<StudentCourseListItemResponse> res =
                    studentCourseService.getCoursesSummary(userId);

            assertNotNull(res);
            assertTrue(res.isEmpty());

            verify(enrollmentRepository).findByUser_UserID(userId);
            verifyNoInteractions(userCourseSectionRepository);
        }

        /**
         * CASE 2
         * NOTE – Có enrollment nhưng course không có section
         *  - Kỳ vọng:
         *      + progressPercent = 0
         *      + isCompleted = false
         *      + map tutorName, course fields, status, enrolledAt đúng
         */
        @Test
        @DisplayName("Course không có section -> progress=0, isCompleted=false")
        void getCoursesSummary_courseNoSections_progressZero() {
            Long userId = 1L;
            User user = buildUser(userId, "Student A");

            Tutor tutor = buildTutor(10L, buildUser(100L, "Tutor X"));
            Course course = buildCourse(20L, tutor);
            course.setSections(null); // không có sections

            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            when(enrollmentRepository.findByUser_UserID(userId))
                    .thenReturn(List.of(enrollment));

            List<StudentCourseListItemResponse> res =
                    studentCourseService.getCoursesSummary(userId);

            assertEquals(1, res.size());
            StudentCourseListItemResponse item = res.get(0);

            assertEquals(20L, item.getCourseID());
            assertEquals("Course 20", item.getCourseTitle());
            assertEquals("Tutor X", item.getTutorName());
            assertEquals(BigDecimal.valueOf(100), item.getPrice());
            assertEquals("EN", item.getLanguage());
            assertEquals("thumb-20.png", item.getThumbnailURL());
            assertEquals(EnrollmentStatus.Active.name(), item.getStatus());
            assertEquals(enrollment.getCreatedAt(), item.getEnrolledAt());

            // ✅ dùng helper so sánh BigDecimal (0 vs 0.0)
            assertBigDecimalEquals(0.0, item.getProgressPercent());
            assertFalse(item.getIsCompleted());
        }

        /**
         * CASE 3
         * NOTE – Course có nhiều section:
         *  - Section1: progress 100
         *  - Section2: progress 50
         *  - avg progress = (100 + 50)/2 = 75 => isCompleted=false
         */
        @Test
        @DisplayName("Course có nhiều section -> tính avg progress & isCompleted đúng")
        void getCoursesSummary_courseWithSections_avgProgress() {
            Long userId = 1L;
            User user = buildUser(userId, "Student A");

            Tutor tutor = buildTutor(10L, buildUser(100L, "Tutor X"));
            Course course = buildCourse(20L, tutor);

            CourseSection sec1 = buildSection(100L, course, "Section 1");
            CourseSection sec2 = buildSection(101L, course, "Section 2");
            course.setSections(List.of(sec1, sec2));

            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            when(enrollmentRepository.findByUser_UserID(userId))
                    .thenReturn(List.of(enrollment));

            // progress section 1 = 100
            when(userCourseSectionRepository.findByUser_UserIDAndSection_SectionID(userId, 100L))
                    .thenReturn(Optional.of(buildUserCourseSection(1000L, user, sec1, BigDecimal.valueOf(100))));
            // progress section 2 = 50
            when(userCourseSectionRepository.findByUser_UserIDAndSection_SectionID(userId, 101L))
                    .thenReturn(Optional.of(buildUserCourseSection(1001L, user, sec2, BigDecimal.valueOf(50))));

            List<StudentCourseListItemResponse> res =
                    studentCourseService.getCoursesSummary(userId);

            assertEquals(1, res.size());
            StudentCourseListItemResponse item = res.get(0);

            // avg = (100 + 50)/2 = 75
            assertBigDecimalEquals(75.0, item.getProgressPercent());
            assertFalse(item.getIsCompleted());
        }

        /**
         * CASE 4
         * NOTE – Course có nhiều section, tất cả 100% -> isCompleted = true
         */
        @Test
        @DisplayName("Course tất cả section 100% -> isCompleted=true")
        void getCoursesSummary_allSectionsDone_completedTrue() {
            Long userId = 1L;
            User user = buildUser(userId, "Student A");

            Tutor tutor = buildTutor(10L, buildUser(100L, "Tutor X"));
            Course course = buildCourse(20L, tutor);

            CourseSection sec1 = buildSection(100L, course, "Section 1");
            CourseSection sec2 = buildSection(101L, course, "Section 2");
            course.setSections(List.of(sec1, sec2));

            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Completed);

            when(enrollmentRepository.findByUser_UserID(userId))
                    .thenReturn(List.of(enrollment));

            when(userCourseSectionRepository.findByUser_UserIDAndSection_SectionID(userId, 100L))
                    .thenReturn(Optional.of(buildUserCourseSection(1000L, user, sec1, BigDecimal.valueOf(100))));
            when(userCourseSectionRepository.findByUser_UserIDAndSection_SectionID(userId, 101L))
                    .thenReturn(Optional.of(buildUserCourseSection(1001L, user, sec2, BigDecimal.valueOf(100))));

            List<StudentCourseListItemResponse> res =
                    studentCourseService.getCoursesSummary(userId);

            assertEquals(1, res.size());
            StudentCourseListItemResponse item = res.get(0);

            assertBigDecimalEquals(100.0, item.getProgressPercent());
            assertTrue(item.getIsCompleted());
        }
    }

    // =====================================================================
    // getCourseDetail
    // =====================================================================
    @Nested
    @DisplayName("StudentCourseService.getCourseDetail")
    class GetCourseDetailTests {

        /**
         * CASE 1
         * NOTE – User chưa enroll khoá này -> ENROLLMENT_NOT_FOUND -> AppException
         */
        @Test
        @DisplayName("Enrollment không tồn tại -> throw AppException")
        void getCourseDetail_enrollmentNotFound_shouldThrow() {
            Long userId = 1L;
            Long courseId = 20L;

            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> studentCourseService.getCourseDetail(userId, courseId));

            verify(enrollmentRepository)
                    .findByUser_UserIDAndCourse_CourseID(userId, courseId);
        }

        /**
         * CASE 2
         * NOTE – Course không có section:
         *  - sectionProgress = []
         *  - progressPercent = 0
         *  - isCompleted = false
         */
        @Test
        @DisplayName("Course không có section -> sectionProgress rỗng, progress=0, isCompleted=false")
        void getCourseDetail_courseNoSections() {
            Long userId = 1L;
            User user = buildUser(userId, "Student A");
            Tutor tutor = buildTutor(10L, buildUser(100L, "Tutor X"));
            Course course = buildCourse(20L, tutor);
            course.setSections(List.of()); // empty

            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, 20L))
                    .thenReturn(Optional.of(enrollment));

            StudentCourseResponse res =
                    studentCourseService.getCourseDetail(userId, 20L);

            assertEquals(20L, res.getCourseID());
            assertEquals("Course 20", res.getCourseTitle());
            assertEquals("Tutor X", res.getTutorName());
            assertEquals(BigDecimal.valueOf(100), res.getPrice());
            assertEquals("EN", res.getLanguage());
            assertEquals("thumb-20.png", res.getThumbnailURL());
            assertEquals(EnrollmentStatus.Active.name(), res.getStatus());
            assertEquals(enrollment.getCreatedAt(), res.getEnrolledAt());

            assertBigDecimalEquals(0.0, res.getProgressPercent());
            assertFalse(res.getIsCompleted());
            assertNotNull(res.getSectionProgress());
            assertTrue(res.getSectionProgress().isEmpty());

            verifyNoInteractions(userCourseSectionRepository);
        }

        /**
         * CASE 3 – HAPPY PATH FULL
         * NOTE – Course có 1 section với 2 lesson:
         *  - Lesson1: Video
         *      + UserLesson.isDone = true
         *      + Không có quiz -> các field quiz = null
         *
         *  - Lesson2: Quiz
         *      + UserLesson: không có -> isDone=false
         *      + quizQuestionRepository.countByLesson = 5
         *      + userQuizResultRepository.findTop... trả về:
         *          correctQuestions = 4
         *          percentage = 80
         *          passed = true
         *
         *  - UserCourseSection.progress = 80
         *  => Course progress = 80, isCompleted=false
         */
        @Test
        @DisplayName("Course có section với Video + Quiz lesson -> mapLessonInSection đầy đủ")
        void getCourseDetail_withSectionAndLessons_quizAndVideo() {
            Long userId = 1L;
            User user = buildUser(userId, "Student A");
            Tutor tutor = buildTutor(10L, buildUser(100L, "Tutor X"));
            Course course = buildCourse(20L, tutor);

            // Section
            CourseSection section = buildSection(100L, course, "Section 1");
            course.setSections(List.of(section));

            // Lessons
            Lesson lessonVideo = buildLesson(1000L, section, "Video lesson", LessonType.Video);
            Lesson lessonQuiz = buildLesson(1001L, section, "Quiz lesson", LessonType.Quiz);
            section.setLessons(List.of(lessonVideo, lessonQuiz));

            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, 20L))
                    .thenReturn(Optional.of(enrollment));

            // Section progress = 80
            when(userCourseSectionRepository.findByUser_UserIDAndSection_SectionID(userId, 100L))
                    .thenReturn(Optional.of(
                            buildUserCourseSection(2000L, user, section, BigDecimal.valueOf(80))
                    ));

            // userLesson cho Video lesson -> isDone = true
            when(userLessonRepository.findByUser_UserIDAndLesson_LessonID(userId, 1000L))
                    .thenReturn(Optional.of(
                            buildUserLesson(3000L, user, lessonVideo, true)
                    ));

            // userLesson cho Quiz lesson -> chưa có -> Optional.empty -> isDone=false
            when(userLessonRepository.findByUser_UserIDAndLesson_LessonID(userId, 1001L))
                    .thenReturn(Optional.empty());

            // Quiz info cho lessonQuiz
            when(quizQuestionRepository.countByLesson(lessonQuiz))
                    .thenReturn(5L);
            when(userQuizResultRepository
                    .findTopByUser_UserIDAndLesson_LessonIDOrderBySubmittedAtDesc(userId, 1001L))
                    .thenReturn(Optional.of(
                            buildUserQuizResult(4000L, user, lessonQuiz,
                                    4, BigDecimal.valueOf(80), true)
                    ));

            StudentCourseResponse res =
                    studentCourseService.getCourseDetail(userId, 20L);

            // Header course info
            assertEquals(20L, res.getCourseID());
            assertEquals("Course 20", res.getCourseTitle());
            assertEquals("Tutor X", res.getTutorName());
            assertEquals(BigDecimal.valueOf(100), res.getPrice());
            assertEquals("EN", res.getLanguage());
            assertEquals("thumb-20.png", res.getThumbnailURL());
            assertEquals(EnrollmentStatus.Active.name(), res.getStatus());
            assertEquals(enrollment.getCreatedAt(), res.getEnrolledAt());

            // Course progress = 80 (1 section)
            assertBigDecimalEquals(80.0, res.getProgressPercent());
            assertFalse(res.getIsCompleted());

            // Section progress list
            assertEquals(1, res.getSectionProgress().size());
            SectionProgressResponse sp = res.getSectionProgress().get(0);
            assertEquals(100L, sp.getSectionId());
            assertEquals("Section 1", sp.getSectionTitle());
            assertBigDecimalEquals(80.0, sp.getProgress());
            assertFalse(sp.getIsCompleted());

            // Lessons in section
            assertEquals(2, sp.getLessons().size());
            LessonInSectionResponse lVideo = sp.getLessons().get(0);
            LessonInSectionResponse lQuiz = sp.getLessons().get(1);

            // Video lesson assertions
            assertEquals(1000L, lVideo.getLessonId());
            assertEquals("Video lesson", lVideo.getLessonTitle());
            assertEquals(LessonType.Video, lVideo.getLessonType());
            assertTrue(lVideo.getIsDone());
            assertNull(lVideo.getTotalQuizQuestions());
            assertNull(lVideo.getCorrectAnswers());
            assertNull(lVideo.getScorePercent());
            assertNull(lVideo.getPassed());

            // Quiz lesson assertions
            assertEquals(1001L, lQuiz.getLessonId());
            assertEquals("Quiz lesson", lQuiz.getLessonTitle());
            assertEquals(LessonType.Quiz, lQuiz.getLessonType());
            assertFalse(lQuiz.getIsDone()); // chưa có UserLesson

            assertEquals(5, lQuiz.getTotalQuizQuestions());
            assertEquals(4, lQuiz.getCorrectAnswers());
            assertEquals(80.0, lQuiz.getScorePercent());   // Double -> OK
            assertTrue(lQuiz.getPassed());
        }
    }
}
