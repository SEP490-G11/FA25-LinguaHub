package edu.lms.service;

import edu.lms.dto.request.SubmitQuizQuestionAnswer;
import edu.lms.dto.request.SubmitQuizRequest;
import edu.lms.dto.response.QuizQuestionResponse;
import edu.lms.dto.response.SubmitQuizQuestionResultResponse;
import edu.lms.dto.response.SubmitQuizResultResponse;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho StudentQuizService
 *
 * Cover:
 *  - getQuizForLesson()
 *      + Enrollment không tồn tại
 *      + Lesson không tồn tại
 *      + Lesson không thuộc course
 *      + Lesson không phải Quiz
 *      + Happy path: trả câu hỏi (không trả isCorrect + explanation)
 *
 *  - submitQuiz()
 *      + USER_NOT_EXIST
 *      + ENROLLMENT_NOT_FOUND
 *      + LESSON_NOT_FOUND
 *      + Lesson không thuộc course
 *      + Lesson không phải Quiz
 *      + Quiz không có câu hỏi
 *      + Happy path: có câu đúng, sai -> pass=false
 *      + Happy path: tất cả đúng -> pass=true & Enrollment Completed
 *
 *  - getLatestQuizResult()
 *      + USER_NOT_EXIST
 *      + QUIZ_RESULT_NOT_FOUND
 *      + Happy path: trả result mới nhất + chi tiết từng câu
 */
@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class StudentQuizServiceTest {

    @Mock
    EnrollmentRepository enrollmentRepository;
    @Mock
    LessonRepository lessonRepository;
    @Mock
    QuizQuestionRepository quizQuestionRepository;
    @Mock
    QuizOptionRepository quizOptionRepository;
    @Mock
    QuizAnswerRepository quizAnswerRepository;
    @Mock
    UserLessonRepository userLessonRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    UserQuizResultRepository userQuizResultRepository;
    @Mock
    UserCourseSectionRepository userCourseSectionRepository;

    @InjectMocks
    StudentQuizService studentQuizService;

    // Dùng ArgumentCaptor để bắt tham số save
    @Captor
    ArgumentCaptor<UserCourseSection> ucsCaptor;
    @Captor
    ArgumentCaptor<Enrollment> enrollmentCaptor;

    //==========================
    // HELPER: BigDecimal compare
    //==========================

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

    private Course buildCourse(Long courseId) {
        Course c = new Course();
        c.setCourseID(courseId);
        c.setTitle("Course " + courseId);
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

    private QuizQuestion buildQuestion(Long id, Lesson lesson, String text, int order, BigDecimal score) {
        QuizQuestion q = new QuizQuestion();
        q.setQuestionID(id);
        q.setLesson(lesson);
        q.setQuestionText(text);
        q.setOrderIndex(order);
        q.setScore(score);
        q.setExplanation("Giải thích cho " + text);
        return q;
    }

    private QuizOption buildOption(Long id, QuizQuestion question, String text, boolean isCorrect, int order) {
        QuizOption o = new QuizOption();
        o.setOptionID(id);
        o.setQuestion(question);
        o.setOptionText(text);
        o.setIsCorrect(isCorrect);
        o.setOrderIndex(order);
        return o;
    }

    private UserLesson buildUserLesson(Long id, User user, Lesson lesson, Enrollment enrollment, boolean isDone) {
        UserLesson ul = new UserLesson();
        ul.setUserLessonID(id);
        ul.setUser(user);
        ul.setLesson(lesson);
        ul.setEnrollment(enrollment);
        ul.setIsDone(isDone);
        ul.setWatchedDuration(0);
        return ul;
    }

    private UserCourseSection buildUserCourseSection(Long id, User user, CourseSection section, Enrollment enrollment, BigDecimal progress) {
        UserCourseSection ucs = new UserCourseSection();
        ucs.setUserCourseSectionID(id);
        ucs.setUser(user);
        ucs.setSection(section);
        ucs.setEnrollment(enrollment);
        ucs.setProgress(progress);
        return ucs;
    }

    private UserQuizResult buildUserQuizResult(
            Long id,
            User user,
            Lesson lesson,
            int totalQuestions,
            int correctQuestions,
            BigDecimal totalScore,
            BigDecimal maxScore,
            BigDecimal percentage,
            boolean passed
    ) {
        UserQuizResult r = new UserQuizResult();
        r.setId(id);
        r.setUser(user);
        r.setLesson(lesson);
        r.setTotalQuestions(totalQuestions);
        r.setCorrectQuestions(correctQuestions);
        r.setTotalScore(totalScore);
        r.setMaxScore(maxScore);
        r.setPercentage(percentage);
        r.setPassed(passed);
        r.setSubmittedAt(LocalDateTime.of(2025, 1, 2, 12, 0));
        return r;
    }

    // =====================================================================
    // getQuizForLesson
    // =====================================================================
    @Nested
    @DisplayName("StudentQuizService.getQuizForLesson")
    class GetQuizForLessonTests {

        /**
         * CASE 1
         * NOTE – User chưa enroll course -> ENROLLMENT_NOT_FOUND
         */
        @Test
        @DisplayName("Enrollment không tồn tại -> throw AppException")
        void getQuizForLesson_enrollmentNotFound_shouldThrow() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> studentQuizService.getQuizForLesson(userId, courseId, lessonId));

            verify(enrollmentRepository).findByUser_UserIDAndCourse_CourseID(userId, courseId);
            verifyNoInteractions(lessonRepository, quizQuestionRepository);
        }

        /**
         * CASE 2
         * NOTE – Lesson không tồn tại -> LESSON_NOT_FOUND
         */
        @Test
        @DisplayName("Lesson không tồn tại -> throw AppException")
        void getQuizForLesson_lessonNotFound_shouldThrow() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            Course course = buildCourse(courseId);
            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.of(enrollment));
            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> studentQuizService.getQuizForLesson(userId, courseId, lessonId));

            verify(lessonRepository).findById(lessonId);
        }

        /**
         * CASE 3
         * NOTE – Lesson tồn tại nhưng không thuộc courseId -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Lesson không thuộc course -> throw AppException")
        void getQuizForLesson_lessonNotBelongToCourse_shouldThrow() {
            Long userId = 1L;
            Long courseId = 10L;
            Long otherCourseId = 99L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            Course course = buildCourse(courseId);
            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            Course otherCourse = buildCourse(otherCourseId);
            CourseSection section = buildSection(1000L, otherCourse, "Section other");
            Lesson lesson = buildLesson(lessonId, section, "Quiz", LessonType.Quiz);

            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.of(enrollment));
            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));

            assertThrows(AppException.class,
                    () -> studentQuizService.getQuizForLesson(userId, courseId, lessonId));
        }

        /**
         * CASE 4
         * NOTE – Lesson thuộc course nhưng lessonType != Quiz -> INVALID_STATE
         */
        @Test
        @DisplayName("Lesson không phải Quiz -> throw AppException")
        void getQuizForLesson_lessonNotQuiz_shouldThrow() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            Course course = buildCourse(courseId);
            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            CourseSection section = buildSection(1000L, course, "Section 1");
            Lesson lesson = buildLesson(lessonId, section, "Video Lesson", LessonType.Video);

            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.of(enrollment));
            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));

            assertThrows(AppException.class,
                    () -> studentQuizService.getQuizForLesson(userId, courseId, lessonId));
        }

        /**
         * CASE 5 – HAPPY PATH
         * NOTE – Trả danh sách câu hỏi + options
         *  - Không trả explanation
         *  - Không trả isCorrect cho option
         */
        @Test
        @DisplayName("Happy path -> trả question + options, không trả đáp án đúng")
        void getQuizForLesson_success() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            Course course = buildCourse(courseId);
            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            CourseSection section = buildSection(1000L, course, "Section 1");
            Lesson lesson = buildLesson(lessonId, section, "Quiz Lesson", LessonType.Quiz);

            QuizQuestion q1 = buildQuestion(1L, lesson, "Q1", 1, BigDecimal.valueOf(2));
            QuizQuestion q2 = buildQuestion(2L, lesson, "Q2", 2, BigDecimal.ONE);

            QuizOption q1o1 = buildOption(11L, q1, "Q1 A", true, 1);
            QuizOption q1o2 = buildOption(12L, q1, "Q1 B", false, 2);
            q1.setOptions(List.of(q1o2, q1o1)); // đảo thứ tự để test sort theo orderIndex

            QuizOption q2o1 = buildOption(21L, q2, "Q2 A", false, 1);
            QuizOption q2o2 = buildOption(22L, q2, "Q2 B", true, 2);
            q2.setOptions(List.of(q2o1, q2o2));

            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.of(enrollment));
            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));
            when(quizQuestionRepository.findByLessonOrderByOrderIndexAsc(lesson))
                    .thenReturn(List.of(q1, q2));

            List<QuizQuestionResponse> res =
                    studentQuizService.getQuizForLesson(userId, courseId, lessonId);

            assertEquals(2, res.size());

            QuizQuestionResponse r1 = res.get(0);
            assertEquals(1L, r1.getQuestionID());
            assertEquals("Q1", r1.getQuestionText());
            assertNull(r1.getExplanation());  // ⬅️ không trả explanation
            assertEquals(2, r1.getOptions().size());
            // Option đã được sort theo orderIndex: 11 trước, 12 sau
            assertEquals(11L, r1.getOptions().get(0).getOptionID());
            assertNull(r1.getOptions().get(0).getIsCorrect()); // ⬅️ không trả isCorrect

            QuizQuestionResponse r2 = res.get(1);
            assertEquals(2L, r2.getQuestionID());
        }
    }

    // =====================================================================
    // submitQuiz
    // =====================================================================
    @Nested
    @DisplayName("StudentQuizService.submitQuiz")
    class SubmitQuizTests {

        /**
         * CASE 1
         * NOTE – User không tồn tại -> USER_NOT_EXIST
         */
        @Test
        @DisplayName("USER_NOT_EXIST -> throw AppException")
        void submitQuiz_userNotFound_shouldThrow() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            when(userRepository.findById(userId))
                    .thenReturn(Optional.empty());

            SubmitQuizRequest req = new SubmitQuizRequest();
            assertThrows(AppException.class,
                    () -> studentQuizService.submitQuiz(userId, courseId, lessonId, req));

            verify(userRepository).findById(userId);
            verifyNoInteractions(enrollmentRepository);
        }

        /**
         * CASE 2
         * NOTE – Enrollment không tồn tại -> ENROLLMENT_NOT_FOUND
         */
        @Test
        @DisplayName("Enrollment không tồn tại -> throw AppException")
        void submitQuiz_enrollmentNotFound_shouldThrow() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.empty());

            SubmitQuizRequest req = new SubmitQuizRequest();
            assertThrows(AppException.class,
                    () -> studentQuizService.submitQuiz(userId, courseId, lessonId, req));
        }

        /**
         * CASE 3
         * NOTE – Lesson không tồn tại
         */
        @Test
        @DisplayName("Lesson không tồn tại -> throw AppException")
        void submitQuiz_lessonNotFound_shouldThrow() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            Course course = buildCourse(courseId);
            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.of(enrollment));
            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.empty());

            SubmitQuizRequest req = new SubmitQuizRequest();
            assertThrows(AppException.class,
                    () -> studentQuizService.submitQuiz(userId, courseId, lessonId, req));
        }

        /**
         * CASE 4
         * NOTE – Lesson không thuộc course -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Lesson không thuộc course -> throw AppException")
        void submitQuiz_lessonNotBelongToCourse_shouldThrow() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            Course course = buildCourse(courseId);
            Course otherCourse = buildCourse(99L); // course khác
            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            CourseSection sectionOther = buildSection(1000L, otherCourse, "Section other");
            Lesson lesson = buildLesson(lessonId, sectionOther, "Quiz", LessonType.Quiz);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.of(enrollment));
            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));

            SubmitQuizRequest req = new SubmitQuizRequest();
            assertThrows(AppException.class,
                    () -> studentQuizService.submitQuiz(userId, courseId, lessonId, req));
        }

        /**
         * CASE 5
         * NOTE – Lesson không phải Quiz -> INVALID_STATE
         */
        @Test
        @DisplayName("Lesson không phải Quiz -> throw AppException")
        void submitQuiz_lessonNotQuiz_shouldThrow() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            Course course = buildCourse(courseId);
            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            CourseSection section = buildSection(1000L, course, "Section 1");
            Lesson lesson = buildLesson(lessonId, section, "Video", LessonType.Video);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.of(enrollment));
            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));

            SubmitQuizRequest req = new SubmitQuizRequest();
            assertThrows(AppException.class,
                    () -> studentQuizService.submitQuiz(userId, courseId, lessonId, req));
        }

        /**
         * CASE 6
         * NOTE – Quiz không có câu hỏi -> QUIZ_NO_QUESTION
         */
        @Test
        @DisplayName("Quiz không có câu hỏi -> throw AppException")
        void submitQuiz_quizNoQuestion_shouldThrow() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            Course course = buildCourse(courseId);
            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            CourseSection section = buildSection(1000L, course, "Section 1");
            Lesson lesson = buildLesson(lessonId, section, "Quiz", LessonType.Quiz);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.of(enrollment));
            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));
            when(quizQuestionRepository.findByLessonOrderByOrderIndexAsc(lesson))
                    .thenReturn(List.of());

            SubmitQuizRequest req = new SubmitQuizRequest();
            assertThrows(AppException.class,
                    () -> studentQuizService.submitQuiz(userId, courseId, lessonId, req));
        }

        /**
         * CASE 7 – HAPPY PATH 1
         * NOTE – Có 2 câu hỏi:
         *  - Q1: đúng
         *  - Q2: sai
         *  => totalQuestions = 2
         *     correctQuestions = 1
         *     maxScore = 5 (Q1=2, Q2=3)
         *     totalScore = 2
         *     percentage = 40% -> passed=false
         *
         * Đồng thời:
         *  - Xoá QuizAnswer cũ -> deleteByUserAndQuestionIn
         *  - Lưu QuizAnswer mới
         *  - UserLesson: isDone=true, completedAt != null
         *  - Cập nhật UserCourseSection progress
         *  - Lưu UserQuizResult
         */
        @Test
        @DisplayName("submitQuiz với 1 câu đúng, 1 câu sai -> pass=false")
        void submitQuiz_partialCorrect_shouldCalculateScoreAndSave() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            Course course = buildCourse(courseId);
            CourseSection section = buildSection(1000L, course, "Section 1");
            course.setSections(List.of(section));

            Lesson lesson = buildLesson(lessonId, section, "Quiz", LessonType.Quiz);
            section.setLessons(List.of(lesson));

            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            // Q1: 2 điểm, 1 đáp án đúng
            QuizQuestion q1 = buildQuestion(1L, lesson, "Q1", 1, BigDecimal.valueOf(2));
            QuizOption q1o1 = buildOption(11L, q1, "Q1 A", true, 1);
            QuizOption q1o2 = buildOption(12L, q1, "Q1 B", false, 2);
            q1.setOptions(List.of(q1o1, q1o2));

            // Q2: 3 điểm, 2 đáp án đúng (multi-select)
            QuizQuestion q2 = buildQuestion(2L, lesson, "Q2", 2, BigDecimal.valueOf(3));
            QuizOption q2o1 = buildOption(21L, q2, "Q2 A", true, 1);
            QuizOption q2o2 = buildOption(22L, q2, "Q2 B", true, 2);
            QuizOption q2o3 = buildOption(23L, q2, "Q2 C", false, 3);
            q2.setOptions(List.of(q2o1, q2o2, q2o3));

            List<QuizQuestion> questions = List.of(q1, q2);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.of(enrollment));
            when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
            when(quizQuestionRepository.findByLessonOrderByOrderIndexAsc(lesson))
                    .thenReturn(questions);

            // Mock tìm UserLesson lần đầu: chưa có -> Optional.empty => tạo mới
            when(userLessonRepository.findByUser_UserIDAndLesson_LessonID(userId, lessonId))
                    .thenReturn(Optional.empty());

            // updateUserCourseSectionProgress sẽ gọi lại findByUser_UserIDAndLesson_LessonID cho từng lesson
            when(userLessonRepository.findByUser_UserIDAndLesson_LessonID(userId, lessonId))
                    .thenReturn(Optional.of(buildUserLesson(999L, user, lesson, enrollment, true)));

            // userCourseSectionRepository.findByUser_UserIDAndSection_SectionID -> chưa có -> Optional.empty
            when(userCourseSectionRepository.findByUser_UserIDAndSection_SectionID(userId, section.getSectionID()))
                    .thenReturn(Optional.empty());

            // updateEnrollmentStatusIfCourseCompleted: giả sử userSections.size() < allSections -> không completed
            when(userCourseSectionRepository.findByUser_UserIDAndEnrollment_EnrollmentID(userId, enrollment.getEnrollmentID()))
                    .thenReturn(List.of(
                            buildUserCourseSection(1L, user, section, enrollment, BigDecimal.valueOf(50))
                    ));

            // quizOptionRepository.findById cho các option được gửi lên
            when(quizOptionRepository.findById(11L)).thenReturn(Optional.of(q1o1));
            when(quizOptionRepository.findById(21L)).thenReturn(Optional.of(q2o1));

            // Request:
            // - Q1: chọn 11 (đúng)
            // - Q2: chỉ chọn 21 (thiếu 22 -> sai)
            SubmitQuizQuestionAnswer ans1 = new SubmitQuizQuestionAnswer();
            ans1.setQuestionId(1L);
            ans1.setSelectedOptionIds(List.of(11L));

            SubmitQuizQuestionAnswer ans2 = new SubmitQuizQuestionAnswer();
            ans2.setQuestionId(2L);
            ans2.setSelectedOptionIds(List.of(21L));

            SubmitQuizRequest req = new SubmitQuizRequest();
            req.setAnswers(List.of(ans1, ans2));

            SubmitQuizResultResponse res =
                    studentQuizService.submitQuiz(userId, courseId, lessonId, req);

            // Tổng quan
            assertEquals(2, res.getTotalQuestions());
            assertEquals(1, res.getCorrectQuestions());
            assertBigDecimalEquals(5.0, res.getMaxScore());    // 2 + 3
            assertBigDecimalEquals(2.0, res.getTotalScore());  // chỉ Q1 đúng
            assertBigDecimalEquals(40.0, res.getPercentage()); // 2/5 * 100
            assertEquals(2, res.getQuestions().size());

            // Q1 result
            SubmitQuizQuestionResultResponse r1 = res.getQuestions().get(0);
            assertEquals(1L, r1.getQuestionID());
            assertTrue(r1.getIsCorrect());
            assertBigDecimalEquals(2.0, r1.getQuestionScore());
            assertEquals(List.of(11L), r1.getSelectedOptionIds());
            assertEquals(Set.of(11L),
                    new HashSet<>(r1.getCorrectOptionIds()));

            // Q2 result
            SubmitQuizQuestionResultResponse r2 = res.getQuestions().get(1);
            assertEquals(2L, r2.getQuestionID());
            assertFalse(r2.getIsCorrect());
            assertBigDecimalEquals(0.0, r2.getQuestionScore());
            assertEquals(List.of(21L), r2.getSelectedOptionIds());
            assertEquals(Set.of(21L, 22L),
                    new HashSet<>(r2.getCorrectOptionIds()));

            // verify xóa đáp án cũ
            verify(quizAnswerRepository).deleteByUserAndQuestionIn(user, questions);
            // verify save QuizAnswer mới (Q1 chọn 11, Q2 chọn 21)
            verify(quizAnswerRepository, times(2)).save(any(QuizAnswer.class));

            // verify UserLesson được set Done
            verify(userLessonRepository, atLeastOnce()).save(argThat(ul ->
                    ul.getLesson().getLessonID().equals(lessonId)
                            && Boolean.TRUE.equals(ul.getIsDone())
                            && ul.getCompletedAt() != null
            ));

            // verify cập nhật UserCourseSection
            verify(userCourseSectionRepository).save(ucsCaptor.capture());
            UserCourseSection savedUcs = ucsCaptor.getValue();
            assertEquals(userId, savedUcs.getUser().getUserID());
            assertEquals(section.getSectionID(), savedUcs.getSection().getSectionID());
            // do chỉ có 1 lesson và đã done -> progress ~100
            assertTrue(savedUcs.getProgress().doubleValue() > 0);

            // verify có lưu UserQuizResult
            verify(userQuizResultRepository).save(any(UserQuizResult.class));
            // vì percentage=40 < 60 => passed=false (không assert trực tiếp vì không expose ra response)
        }

        /**
         * CASE 8 – HAPPY PATH 2
         * NOTE – Tất cả câu đều đúng -> percentage >= 60 -> passed=true
         *  Đồng thời:
         *   - Giả lập tất cả section 100% -> Enrollment Completed
         */
        @Test
        @DisplayName("submitQuiz tất cả câu đúng -> passed=true & Enrollment Completed")
        void submitQuiz_allCorrect_shouldPassAndCompleteEnrollment() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            Course course = buildCourse(courseId);
            CourseSection section = buildSection(1000L, course, "Section 1");
            course.setSections(List.of(section));

            Lesson lesson = buildLesson(lessonId, section, "Quiz", LessonType.Quiz);
            section.setLessons(List.of(lesson));

            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            // Một câu hỏi duy nhất, 10 điểm
            QuizQuestion q1 = buildQuestion(1L, lesson, "Q1", 1, BigDecimal.TEN);
            QuizOption q1o1 = buildOption(11L, q1, "Q1 A", true, 1);
            QuizOption q1o2 = buildOption(12L, q1, "Q1 B", false, 2);
            q1.setOptions(List.of(q1o1, q1o2));

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.of(enrollment));
            when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
            when(quizQuestionRepository.findByLessonOrderByOrderIndexAsc(lesson))
                    .thenReturn(List.of(q1));

            // UserLesson cũ đã tồn tại (có thể isDone hoặc chưa, cuối cùng phải true)
            when(userLessonRepository.findByUser_UserIDAndLesson_LessonID(userId, lessonId))
                    .thenReturn(Optional.of(buildUserLesson(1000L, user, lesson, enrollment, false)));

            // updateUserCourseSectionProgress: sau khi quiz done, lesson done -> progress = 100
            when(userLessonRepository.findByUser_UserIDAndLesson_LessonID(userId, lessonId))
                    .thenReturn(Optional.of(buildUserLesson(1000L, user, lesson, enrollment, true)));

            when(userCourseSectionRepository.findByUser_UserIDAndSection_SectionID(userId, section.getSectionID()))
                    .thenReturn(Optional.of(buildUserCourseSection(2000L, user, section, enrollment, BigDecimal.valueOf(100))));

            // updateEnrollmentStatusIfCourseCompleted:
            //  giả lập userSections có 1 section, progress=100 -> Completed
            when(userCourseSectionRepository.findByUser_UserIDAndEnrollment_EnrollmentID(userId, enrollment.getEnrollmentID()))
                    .thenReturn(List.of(
                            buildUserCourseSection(2000L, user, section, enrollment, BigDecimal.valueOf(100))
                    ));

            when(quizOptionRepository.findById(11L)).thenReturn(Optional.of(q1o1));

            SubmitQuizQuestionAnswer ans1 = new SubmitQuizQuestionAnswer();
            ans1.setQuestionId(1L);
            ans1.setSelectedOptionIds(List.of(11L)); // chọn đúng

            SubmitQuizRequest req = new SubmitQuizRequest();
            req.setAnswers(List.of(ans1));

            SubmitQuizResultResponse res =
                    studentQuizService.submitQuiz(userId, courseId, lessonId, req);

            assertEquals(1, res.getTotalQuestions());
            assertEquals(1, res.getCorrectQuestions());
            assertBigDecimalEquals(10.0, res.getMaxScore());
            assertBigDecimalEquals(10.0, res.getTotalScore());
            assertBigDecimalEquals(100.0, res.getPercentage());

            // verify Enrollment status được set Completed
            verify(enrollmentRepository).save(enrollmentCaptor.capture());
            Enrollment savedEnrollment = enrollmentCaptor.getValue();
            assertEquals(EnrollmentStatus.Completed, savedEnrollment.getStatus());
        }
    }

    // =====================================================================
    // getLatestQuizResult
    // =====================================================================
    @Nested
    @DisplayName("StudentQuizService.getLatestQuizResult")
    class GetLatestQuizResultTests {

        /**
         * CASE 1
         * NOTE – User không tồn tại -> USER_NOT_EXIST
         */
        @Test
        @DisplayName("USER_NOT_EXIST -> throw AppException")
        void getLatestQuizResult_userNotFound_shouldThrow() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            when(userRepository.findById(userId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> studentQuizService.getLatestQuizResult(userId, courseId, lessonId));

            verify(userRepository).findById(userId);
        }

        /**
         * CASE 2
         * NOTE – Không tìm thấy UserQuizResult mới nhất -> QUIZ_RESULT_NOT_FOUND
         */
        @Test
        @DisplayName("Không có UserQuizResult -> throw AppException")
        void getLatestQuizResult_resultNotFound_shouldThrow() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            Course course = buildCourse(courseId);
            CourseSection section = buildSection(1000L, course, "Section 1");
            Lesson lesson = buildLesson(lessonId, section, "Quiz", LessonType.Quiz);
            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.of(enrollment));
            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));
            when(userQuizResultRepository.findTopByUser_UserIDAndLesson_LessonIDOrderBySubmittedAtDesc(userId, lessonId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> studentQuizService.getLatestQuizResult(userId, courseId, lessonId));
        }

        /**
         * CASE 3 – HAPPY PATH
         * NOTE –
         *  - Có UserQuizResult mới nhất với:
         *      totalQuestions = 2
         *      correctQuestions = 1
         *      totalScore = 2
         *      maxScore = 5
         *      percentage = 40
         *  - Quiz có 2 câu:
         *      Q1: user chọn đúng
         *      Q2: user chọn sai
         *  => Trả SubmitQuizResultResponse với:
         *      + top-level lấy từ latest UserQuizResult
         *      + chi tiết từng câu dựa trên QuizAnswer
         */
        @Test
        @DisplayName("Happy path -> trả result mới nhất + chi tiết từng câu")
        void getLatestQuizResult_success() {
            Long userId = 1L;
            Long courseId = 10L;
            Long lessonId = 100L;

            User user = buildUser(userId, "Student A");
            Course course = buildCourse(courseId);
            CourseSection section = buildSection(1000L, course, "Section 1");
            Lesson lesson = buildLesson(lessonId, section, "Quiz", LessonType.Quiz);
            Enrollment enrollment = buildEnrollment(1L, user, course, EnrollmentStatus.Active);

            // Q1 + Q2 giống case submitQuiz partial
            QuizQuestion q1 = buildQuestion(1L, lesson, "Q1", 1, BigDecimal.valueOf(2));
            QuizOption q1o1 = buildOption(11L, q1, "Q1 A", true, 1);
            QuizOption q1o2 = buildOption(12L, q1, "Q1 B", false, 2);
            q1.setOptions(List.of(q1o1, q1o2));

            QuizQuestion q2 = buildQuestion(2L, lesson, "Q2", 2, BigDecimal.valueOf(3));
            QuizOption q2o1 = buildOption(21L, q2, "Q2 A", true, 1);
            QuizOption q2o2 = buildOption(22L, q2, "Q2 B", true, 2);
            QuizOption q2o3 = buildOption(23L, q2, "Q2 C", false, 3);
            q2.setOptions(List.of(q2o1, q2o2, q2o3));

            List<QuizQuestion> questions = List.of(q1, q2);

            // latest UserQuizResult (giả sử từ lần submit trước)
            UserQuizResult latest = buildUserQuizResult(
                    5000L, user, lesson,
                    2, 1,
                    BigDecimal.valueOf(2),
                    BigDecimal.valueOf(5),
                    BigDecimal.valueOf(40),
                    false
            );

            // QuizAnswer: Q1 chọn 11 (đúng), Q2 chọn 21 (sai)
            QuizAnswer a1 = new QuizAnswer();
            a1.setQuestion(q1);
            a1.setUser(user);
            a1.setSelectedOption(q1o1);

            QuizAnswer a2 = new QuizAnswer();
            a2.setQuestion(q2);
            a2.setUser(user);
            a2.setSelectedOption(q2o1);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(userId, courseId))
                    .thenReturn(Optional.of(enrollment));
            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));
            when(userQuizResultRepository.findTopByUser_UserIDAndLesson_LessonIDOrderBySubmittedAtDesc(userId, lessonId))
                    .thenReturn(Optional.of(latest));
            when(quizQuestionRepository.findByLessonOrderByOrderIndexAsc(lesson))
                    .thenReturn(questions);
            when(quizAnswerRepository.findByUserAndQuestion_Lesson(user, lesson))
                    .thenReturn(List.of(a1, a2));

            SubmitQuizResultResponse res =
                    studentQuizService.getLatestQuizResult(userId, courseId, lessonId);

            // Top-level lấy đúng từ latest
            assertEquals(2, res.getTotalQuestions());
            assertEquals(1, res.getCorrectQuestions());
            assertBigDecimalEquals(2.0, res.getTotalScore());
            assertBigDecimalEquals(5.0, res.getMaxScore());
            assertBigDecimalEquals(40.0, res.getPercentage());

            assertEquals(2, res.getQuestions().size());

            SubmitQuizQuestionResultResponse r1 = res.getQuestions().get(0);
            assertEquals(1L, r1.getQuestionID());
            assertTrue(r1.getIsCorrect());
            assertEquals(List.of(11L), r1.getSelectedOptionIds());
            assertEquals(Set.of(11L),
                    new HashSet<>(r1.getCorrectOptionIds()));

            SubmitQuizQuestionResultResponse r2 = res.getQuestions().get(1);
            assertEquals(2L, r2.getQuestionID());
            assertFalse(r2.getIsCorrect());
            assertEquals(List.of(21L), r2.getSelectedOptionIds());
            assertEquals(Set.of(21L, 22L),
                    new HashSet<>(r2.getCorrectOptionIds()));
        }
    }
}
