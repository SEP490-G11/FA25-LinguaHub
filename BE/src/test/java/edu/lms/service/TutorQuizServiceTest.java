package edu.lms.service;

import edu.lms.dto.request.QuizOptionRequest;
import edu.lms.dto.request.QuizQuestionRequest;
import edu.lms.dto.response.LessonQuizDetailResponse;
import edu.lms.dto.response.QuizQuestionResponse;
import edu.lms.entity.*;
import edu.lms.enums.LessonType;
import edu.lms.exception.AppException;
import edu.lms.repository.LessonDraftRepository;
import edu.lms.repository.LessonRepository;
import edu.lms.repository.QuizQuestionDraftRepository;
import edu.lms.repository.QuizQuestionRepository;
import edu.lms.repository.TutorRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho TutorQuizService
 *
 * Cover:
 *  - getLiveLessonQuiz
 *  - createLiveQuestion (9 case UTCID01–UTCID09)
 *  - updateLiveQuestion (9 case UTCID01–UTCID09)
 *  - deleteLiveQuestion
 *  - getDraftLessonQuiz
 *  - createDraftQuestion
 *  - updateDraftQuestion
 *  - deleteDraftQuestion
 *
 * Lưu ý:
 *  - Chỉ assert AppException, không dùng getErrorCode().
 *  - Các UTCID trong comment bám sát bảng test case bạn gửi.
 */
@ExtendWith(MockitoExtension.class)
class TutorQuizServiceTest {

    @Mock
    TutorRepository tutorRepository;
    @Mock
    LessonRepository lessonRepository;
    @Mock
    LessonDraftRepository lessonDraftRepository;
    @Mock
    QuizQuestionRepository quizQuestionRepository;
    @Mock
    QuizQuestionDraftRepository quizQuestionDraftRepository;

    @InjectMocks
    TutorQuizService tutorQuizService;

    // =======================
    // HELPER ENTITIES
    // =======================

    private Tutor buildTutor(Long tutorId, String email) {
        User u = new User();
        u.setUserID(1000L + tutorId);
        u.setEmail(email);

        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setUser(u);
        return t;
    }

    private Lesson buildLessonQuizOwnedByTutor(Long lessonId, Tutor tutor) {
        Course course = new Course();
        course.setTutor(tutor);

        CourseSection section = new CourseSection();
        section.setCourse(course);

        Lesson lesson = new Lesson();
        lesson.setLessonID(lessonId);
        lesson.setTitle("Quiz Lesson " + lessonId);
        lesson.setLessonType(LessonType.Quiz);
        lesson.setSection(section);
        return lesson;
    }

    private Lesson buildLessonNonQuizOwnedByTutor(Long lessonId, Tutor tutor, LessonType type) {
        Course course = new Course();
        course.setTutor(tutor);

        CourseSection section = new CourseSection();
        section.setCourse(course);

        Lesson lesson = new Lesson();
        lesson.setLessonID(lessonId);
        lesson.setTitle("Non Quiz Lesson " + lessonId);
        lesson.setLessonType(type);
        lesson.setSection(section);
        return lesson;
    }

    private LessonDraft buildLessonDraftQuizOwnedByTutor(Long lessonDraftId, Tutor tutor) {
        CourseDraft courseDraft = new CourseDraft();
        courseDraft.setTutor(tutor);

        CourseSectionDraft sectionDraft = new CourseSectionDraft();
        sectionDraft.setDraft(courseDraft);

        LessonDraft lessonDraft = new LessonDraft();
        lessonDraft.setLessonDraftID(lessonDraftId);
        lessonDraft.setTitle("Draft Quiz Lesson " + lessonDraftId);
        lessonDraft.setLessonType(LessonType.Quiz);
        lessonDraft.setSectionDraft(sectionDraft);
        return lessonDraft;
    }

    private LessonDraft buildLessonDraftNonQuizOwnedByTutor(Long lessonDraftId, Tutor tutor, LessonType type) {
        CourseDraft courseDraft = new CourseDraft();
        courseDraft.setTutor(tutor);

        CourseSectionDraft sectionDraft = new CourseSectionDraft();
        sectionDraft.setDraft(courseDraft);

        LessonDraft lessonDraft = new LessonDraft();
        lessonDraft.setLessonDraftID(lessonDraftId);
        lessonDraft.setTitle("Draft Non Quiz Lesson " + lessonDraftId);
        lessonDraft.setLessonType(type);
        lessonDraft.setSectionDraft(sectionDraft);
        return lessonDraft;
    }

    private QuizQuestion buildQuizQuestion(Long questionId, Lesson lesson) {
        QuizQuestion q = new QuizQuestion();
        q.setQuestionID(questionId);
        q.setLesson(lesson);
        q.setQuestionText("What is Java?");
        q.setOrderIndex(1);
        q.setExplanation("Explain Java");
        q.setScore(BigDecimal.valueOf(3.0));
        q.setOptions(new ArrayList<>());
        return q;
    }

    private QuizQuestionDraft buildQuizQuestionDraft(Long qId, LessonDraft lessonDraft) {
        QuizQuestionDraft q = new QuizQuestionDraft();
        q.setQuestionDraftID(qId);
        q.setLessonDraft(lessonDraft);
        q.setQuestionText("Draft Question");
        q.setOrderIndex(1);
        q.setExplanation("Draft explain");
        q.setScore(BigDecimal.valueOf(3.0));
        q.setOptions(new ArrayList<>());
        return q;
    }

    private QuizOptionRequest buildOptionReq(String text, Boolean correct, Integer order) {
        return QuizOptionRequest.builder()
                .optionText(text)
                .isCorrect(correct)
                .orderIndex(order)
                .build();
    }

    // =====================================================================
    // getLiveLessonQuiz
    // =====================================================================

    @Nested
    @DisplayName("TutorQuizService.getLiveLessonQuiz")
    class GetLiveLessonQuizTests {

        /**
         * NOTE – Case: Tutor không tồn tại trong DB -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> AppException")
        void tutorNotFound_shouldThrow() {
            String email = "tutor@mail.com";
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> tutorQuizService.getLiveLessonQuiz(email, 1L));
        }

        /**
         * NOTE – Case: Lesson không tồn tại -> LESSON_NOT_FOUND
         */
        @Test
        @DisplayName("Lesson không tồn tại -> AppException")
        void lessonNotFound_shouldThrow() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            when(lessonRepository.findById(99L)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> tutorQuizService.getLiveLessonQuiz(email, 99L));
        }

        /**
         * NOTE – Case: Lesson thuộc tutor khác -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Lesson thuộc tutor khác -> AppException UNAUTHORIZED")
        void lessonOwnedByOtherTutor_shouldThrowUnauthorized() {
            String email = "tutor1@mail.com";
            Tutor tutor1 = buildTutor(1L, email);
            Tutor tutor2 = buildTutor(2L, "tutor2@mail.com");

            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor1));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor2); // lesson owner khác
            when(lessonRepository.findById(1L)).thenReturn(Optional.of(lesson));

            assertThrows(AppException.class,
                    () -> tutorQuizService.getLiveLessonQuiz(email, 1L));
        }

        /**
         * NOTE – Case: Lesson không phải Quiz (Video/Reading) -> INVALID_STATE
         */
        @Test
        @DisplayName("Lesson không phải Quiz -> AppException INVALID_STATE")
        void lessonNotQuiz_shouldThrowInvalidState() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonNonQuizOwnedByTutor(1L, tutor, LessonType.Video);
            when(lessonRepository.findById(1L)).thenReturn(Optional.of(lesson));

            assertThrows(AppException.class,
                    () -> tutorQuizService.getLiveLessonQuiz(email, 1L));
        }

        /**
         * NOTE – Case: Happy path – Lấy quiz detail thành công
         */
        @Test
        @DisplayName("Happy path - Lấy quiz lesson thành công")
        void getLiveLessonQuiz_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor);
            when(lessonRepository.findById(1L)).thenReturn(Optional.of(lesson));

            QuizQuestion q1 = buildQuizQuestion(10L, lesson);
            QuizQuestion q2 = buildQuizQuestion(11L, lesson);
            q2.setOrderIndex(2);
            when(quizQuestionRepository.findByLessonOrderByOrderIndexAsc(lesson))
                    .thenReturn(List.of(q1, q2));

            LessonQuizDetailResponse res =
                    tutorQuizService.getLiveLessonQuiz(email, 1L);

            assertEquals(1L, res.getLessonID());
            assertEquals(2, res.getQuestions().size());
            assertTrue(res.getIsLive());
        }
    }

    // =====================================================================
    // createLiveQuestion – UTCID01–UTCID09
    // =====================================================================

    @Nested
    @DisplayName("TutorQuizService.createLiveQuestion")
    class CreateLiveQuestionTests {

        /**
         * UTCID01 – A
         * NOTE – Tutor không tồn tại trong DB -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("UTCID01 - Tutor không tồn tại -> AppException")
        void UTCID01_tutorNotFound_shouldThrow() {
            String email = "notfound@mail.com";
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.empty());

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Sample?")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(1.0))
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.createLiveQuestion(email, 1L, req));
        }

        /**
         * UTCID02 – A
         * NOTE – Lesson không tồn tại -> LESSON_NOT_FOUND
         */
        @Test
        @DisplayName("UTCID02 - Lesson không tồn tại -> AppException")
        void UTCID02_lessonNotFound_shouldThrow() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            when(lessonRepository.findById(99L)).thenReturn(Optional.empty());

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("What is JAVA?")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(3.0))
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.createLiveQuestion(email, 99L, req));
        }

        /**
         * UTCID03 – A
         * NOTE – Lesson Quiz nhưng thuộc tutor khác -> UNAUTHORIZED
         */
        @Test
        @DisplayName("UTCID03 - Lesson thuộc tutor khác -> AppException UNAUTHORIZED")
        void UTCID03_lessonOwnedByOtherTutor_shouldThrow() {
            String email = "tutor1@mail.com";
            Tutor tutor1 = buildTutor(1L, email);
            Tutor tutor2 = buildTutor(2L, "tutor2@mail.com");
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor1));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor2);
            when(lessonRepository.findById(1L)).thenReturn(Optional.of(lesson));

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("What is JAVA?")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(3.0))
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.createLiveQuestion(email, 1L, req));
        }

        /**
         * UTCID04 – A
         * NOTE – Lesson tồn tại nhưng LessonType != Quiz (Video/Reading) -> INVALID_STATE
         */
        @Test
        @DisplayName("UTCID04 - Lesson không phải Quiz -> AppException INVALID_STATE")
        void UTCID04_lessonNotQuiz_shouldThrowInvalidState() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonNonQuizOwnedByTutor(1L, tutor, LessonType.Video);
            when(lessonRepository.findById(1L)).thenReturn(Optional.of(lesson));

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("What is JAVA?")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(3.0))
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.createLiveQuestion(email, 1L, req));
        }

        /**
         * UTCID05 – N
         * NOTE – Normal: lesson Quiz, không có options (options = null), score = null -> default 1.0
         * Kỳ vọng: score default 1.0, options rỗng.
         */
        @Test
        @DisplayName("UTCID05 - Tạo question không có options, score null -> default 1.0")
        void UTCID05_createQuestion_noOptions_scoreDefault() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor);
            when(lessonRepository.findById(1L)).thenReturn(Optional.of(lesson));

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Sample?")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(null) // để test default 1.0
                    .options(null) // không có options
                    .build();

            // NOTE: simulate save: set questionID=1
            when(quizQuestionRepository.save(any(QuizQuestion.class)))
                    .thenAnswer(inv -> {
                        QuizQuestion q = inv.getArgument(0);
                        q.setQuestionID(1L);
                        return q;
                    });

            QuizQuestionResponse res =
                    tutorQuizService.createLiveQuestion(email, 1L, req);

            assertEquals(1L, res.getQuestionID());
            assertEquals("Sample?", res.getQuestionText());
            assertEquals(1, res.getOrderIndex());
            assertEquals("Explain", res.getExplanation());
            assertEquals(BigDecimal.valueOf(1.0), res.getScore());
            assertNotNull(res.getOptions());
            assertTrue(res.getOptions().isEmpty());
        }

        /**
         * UTCID06 – B
         * NOTE – Boundary: orderIndex = 2, explanation null, options = [] (rỗng)
         */
        @Test
        @DisplayName("UTCID06 - orderIndex=2, explanation=null, options rỗng")
        void UTCID06_createQuestion_emptyOptions_boundary() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor);
            when(lessonRepository.findById(1L)).thenReturn(Optional.of(lesson));

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Sample?")
                    .orderIndex(2)
                    .explanation(null)
                    .score(BigDecimal.valueOf(1.0))
                    .options(new ArrayList<>()) // empty list
                    .build();

            when(quizQuestionRepository.save(any(QuizQuestion.class)))
                    .thenAnswer(inv -> {
                        QuizQuestion q = inv.getArgument(0);
                        q.setQuestionID(1L);
                        return q;
                    });

            QuizQuestionResponse res =
                    tutorQuizService.createLiveQuestion(email, 1L, req);

            assertEquals(2, res.getOrderIndex());
            assertNull(res.getExplanation());
            assertTrue(res.getOptions().isEmpty());
        }

        /**
         * UTCID07 – N
         * NOTE – Normal: 2 options [Apple(đúng,1), Option B(sai,2)], score=3.0
         */
        @Test
        @DisplayName("UTCID07 - 2 options Apple/OptionB, score=3.0")
        void UTCID07_createQuestion_twoOptions_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor);
            when(lessonRepository.findById(1L)).thenReturn(Optional.of(lesson));

            List<QuizOptionRequest> optReqs = List.of(
                    buildOptionReq("Apple", true, 1),
                    buildOptionReq("Option B", false, 2)
            );

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("What is JAVA?")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(3.0))
                    .options(optReqs)
                    .build();

            when(quizQuestionRepository.save(any(QuizQuestion.class)))
                    .thenAnswer(inv -> {
                        QuizQuestion q = inv.getArgument(0);
                        q.setQuestionID(1L);
                        return q;
                    });

            QuizQuestionResponse res =
                    tutorQuizService.createLiveQuestion(email, 1L, req);

            assertEquals(1L, res.getQuestionID());
            assertEquals("What is JAVA?", res.getQuestionText());
            assertEquals(BigDecimal.valueOf(3.0), res.getScore());
            assertEquals(2, res.getOptions().size());
            assertEquals("Apple", res.getOptions().get(0).getOptionText());
            assertTrue(res.getOptions().get(0).getIsCorrect());
            assertEquals("Option B", res.getOptions().get(1).getOptionText());
            assertFalse(res.getOptions().get(1).getIsCorrect());
        }

        /**
         * UTCID08 – B
         * NOTE – Boundary: options = [] nhưng giữ score=3.0, question "What is JAVA?"
         */
        @Test
        @DisplayName("UTCID08 - options rỗng, score=3.0 vẫn OK")
        void UTCID08_createQuestion_emptyOptionsWithScore_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor);
            when(lessonRepository.findById(1L)).thenReturn(Optional.of(lesson));

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("What is JAVA?")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(3.0))
                    .options(new ArrayList<>()) // empty
                    .build();

            when(quizQuestionRepository.save(any(QuizQuestion.class)))
                    .thenAnswer(inv -> {
                        QuizQuestion q = inv.getArgument(0);
                        q.setQuestionID(1L);
                        return q;
                    });

            QuizQuestionResponse res =
                    tutorQuizService.createLiveQuestion(email, 1L, req);

            assertEquals("What is JAVA?", res.getQuestionText());
            assertEquals(BigDecimal.valueOf(3.0), res.getScore());
            assertTrue(res.getOptions().isEmpty());
        }

        /**
         * UTCID09 – N
         * NOTE – Normal: case confirm đầy đủ (giống dòng cuối bảng)
         */
        @Test
        @DisplayName("UTCID09 - Happy path full confirm")
        void UTCID09_createQuestion_fullConfirm_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor);
            when(lessonRepository.findById(1L)).thenReturn(Optional.of(lesson));

            List<QuizOptionRequest> opts = List.of(
                    buildOptionReq("Apple", true, 1),
                    buildOptionReq("Car", false, 2)
            );

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("What is JAVA?")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(3.0))
                    .options(opts)
                    .build();

            when(quizQuestionRepository.save(any(QuizQuestion.class)))
                    .thenAnswer(inv -> {
                        QuizQuestion q = inv.getArgument(0);
                        q.setQuestionID(1L);
                        return q;
                    });

            QuizQuestionResponse res =
                    tutorQuizService.createLiveQuestion(email, 1L, req);

            assertEquals(1L, res.getQuestionID());
            assertEquals("What is JAVA?", res.getQuestionText());
            assertEquals(1, res.getOrderIndex());
            assertEquals("Explain", res.getExplanation());
            assertEquals(BigDecimal.valueOf(3.0), res.getScore());
            assertEquals(2, res.getOptions().size());
        }
    }

    // =====================================================================
    // updateLiveQuestion – UTCID01–UTCID09
    // =====================================================================

    @Nested
    @DisplayName("TutorQuizService.updateLiveQuestion")
    class UpdateLiveQuestionTests {

        /**
         * UTCID01 – A
         * NOTE – Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("UTCID01 - Tutor không tồn tại -> AppException")
        void UTCID01_tutorNotFound_shouldThrow() {
            String email = "notfound@mail.com";
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.empty());

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("updated text")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(3.0))
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.updateLiveQuestion(email, 1L, req));
        }

        /**
         * UTCID02 – A
         * NOTE – Quiz Question không tồn tại -> QUIZ_QUESTION_NOT_FOUND
         */
        @Test
        @DisplayName("UTCID02 - QuizQuestion không tồn tại -> AppException")
        void UTCID02_questionNotFound_shouldThrow() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            when(quizQuestionRepository.findById(99L)).thenReturn(Optional.empty());

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("updated text")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(3.0))
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.updateLiveQuestion(email, 99L, req));
        }

        /**
         * UTCID03 – A
         * NOTE – Lesson của question thuộc tutor khác -> UNAUTHORIZED
         */
        @Test
        @DisplayName("UTCID03 - Lesson thuộc tutor khác -> UNAUTHORIZED")
        void UTCID03_questionOwnedByOtherTutor_shouldThrowUnauthorized() {
            String email = "tutor1@mail.com";
            Tutor tutor1 = buildTutor(1L, email);
            Tutor tutor2 = buildTutor(2L, "tutor2@mail.com");
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor1));

            Lesson lessonOther = buildLessonQuizOwnedByTutor(1L, tutor2);
            QuizQuestion q = buildQuizQuestion(10L, lessonOther);
            q.setOptions(new ArrayList<>());

            when(quizQuestionRepository.findById(10L)).thenReturn(Optional.of(q));
            // NOTE: resolveQuizLessonOwnedByTutor sẽ đọc từ lessonRepository
            when(lessonRepository.findById(lessonOther.getLessonID()))
                    .thenReturn(Optional.of(lessonOther));

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("updated text")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(3.0))
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.updateLiveQuestion(email, 10L, req));
        }

        /**
         * UTCID04 – A
         * NOTE – Lesson của question không phải Quiz -> INVALID_STATE
         */
        @Test
        @DisplayName("UTCID04 - Lesson không phải Quiz -> INVALID_STATE")
        void UTCID04_questionLessonNotQuiz_shouldThrowInvalidState() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson nonQuizLesson = buildLessonNonQuizOwnedByTutor(1L, tutor, LessonType.Video);
            QuizQuestion q = buildQuizQuestion(10L, nonQuizLesson);
            q.setOptions(new ArrayList<>());

            when(quizQuestionRepository.findById(10L)).thenReturn(Optional.of(q));
            // NOTE: resolveQuizLessonOwnedByTutor đọc lesson từ lessonRepository
            when(lessonRepository.findById(nonQuizLesson.getLessonID()))
                    .thenReturn(Optional.of(nonQuizLesson));

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("updated text")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(3.0))
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.updateLiveQuestion(email, 10L, req));
        }

        /**
         * UTCID05 – N
         * NOTE – Normal: options = null -> clear hết options cũ, giữ score=3.0
         */
        @Test
        @DisplayName("UTCID05 - options=null -> options clear, score=3.0")
        void UTCID05_updateQuestion_nullOptions_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor);
            QuizQuestion q = buildQuizQuestion(10L, lesson);
            q.setOptions(new ArrayList<>());
            q.getOptions().add(new QuizOption()); // options cũ

            when(quizQuestionRepository.findById(10L))
                    .thenReturn(Optional.of(q));
            // NOTE: Quan trọng – để resolveQuizLessonOwnedByTutor không ném LESSON_NOT_FOUND
            when(lessonRepository.findById(lesson.getLessonID()))
                    .thenReturn(Optional.of(lesson));

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("updated text")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(3.0))
                    .options(null)
                    .build();

            when(quizQuestionRepository.save(any(QuizQuestion.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            QuizQuestionResponse res =
                    tutorQuizService.updateLiveQuestion(email, 10L, req);

            assertEquals("updated text", res.getQuestionText());
            assertEquals(BigDecimal.valueOf(3.0), res.getScore());
            assertTrue(res.getOptions().isEmpty());
        }

        /**
         * UTCID06 – B
         * NOTE – Boundary: score = null -> default 1.0, options = []
         */
        @Test
        @DisplayName("UTCID06 - score=null -> default 1.0, options rỗng")
        void UTCID06_updateQuestion_scoreNull_default1() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor);
            QuizQuestion q = buildQuizQuestion(10L, lesson);
            q.setOptions(new ArrayList<>()); // có list để clear

            when(quizQuestionRepository.findById(10L)).thenReturn(Optional.of(q));
            // NOTE: để resolveQuizLessonOwnedByTutor lấy được lesson từ DB giả lập
            when(lessonRepository.findById(lesson.getLessonID()))
                    .thenReturn(Optional.of(lesson));

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("updated text")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(null)
                    .options(new ArrayList<>())
                    .build();

            when(quizQuestionRepository.save(any(QuizQuestion.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            QuizQuestionResponse res =
                    tutorQuizService.updateLiveQuestion(email, 10L, req);

            assertEquals(BigDecimal.valueOf(1.0), res.getScore());
            assertTrue(res.getOptions().isEmpty());
        }

        /**
         * UTCID07 – B
         * NOTE – Normal: 2 options mới (Option A true, Option B false), score=4.0
         */
        @Test
        @DisplayName("UTCID07 - update với 2 options mới, score=4.0")
        void UTCID07_updateQuestion_twoOptions_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor);
            QuizQuestion q = buildQuizQuestion(10L, lesson);
            q.setOptions(new ArrayList<>());
            q.getOptions().add(new QuizOption()); // options cũ

            when(quizQuestionRepository.findById(10L)).thenReturn(Optional.of(q));
            // NOTE: phải mock lessonRepository để resolveQuizLessonOwnedByTutor không fail
            when(lessonRepository.findById(lesson.getLessonID()))
                    .thenReturn(Optional.of(lesson));

            List<QuizOptionRequest> optReqs = List.of(
                    buildOptionReq("Option A", true, 1),
                    buildOptionReq("Option B", false, 2)
            );

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("What is Java?")
                    .orderIndex(1)
                    .explanation("Explain Java")
                    .score(BigDecimal.valueOf(4.0))
                    .options(optReqs)
                    .build();

            when(quizQuestionRepository.save(any(QuizQuestion.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            QuizQuestionResponse res =
                    tutorQuizService.updateLiveQuestion(email, 10L, req);

            assertEquals("What is Java?", res.getQuestionText());
            assertEquals(BigDecimal.valueOf(4.0), res.getScore());
            assertEquals(2, res.getOptions().size());
            assertEquals("Option A", res.getOptions().get(0).getOptionText());
        }

        /**
         * UTCID08 – N
         * NOTE – Normal: orderIndex = 2, options null -> clear hết
         */
        @Test
        @DisplayName("UTCID08 - orderIndex=2, options=null")
        void UTCID08_updateQuestion_orderIndex2_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor);
            QuizQuestion q = buildQuizQuestion(10L, lesson);
            q.setOptions(new ArrayList<>());
            q.getOptions().add(new QuizOption());

            when(quizQuestionRepository.findById(10L)).thenReturn(Optional.of(q));
            // NOTE: mock lessonRepository cho happy path
            when(lessonRepository.findById(lesson.getLessonID()))
                    .thenReturn(Optional.of(lesson));

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Q updated")
                    .orderIndex(2)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(4.0))
                    .options(null)
                    .build();

            when(quizQuestionRepository.save(any(QuizQuestion.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            QuizQuestionResponse res =
                    tutorQuizService.updateLiveQuestion(email, 10L, req);

            assertEquals(2, res.getOrderIndex());
            assertTrue(res.getOptions().isEmpty());
        }

        /**
         * UTCID09 – N
         * NOTE – Happy path: tất cả field đầy đủ, 2 options
         */
        @Test
        @DisplayName("UTCID09 - Happy path update đầy đủ")
        void UTCID09_updateQuestion_full_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor);
            QuizQuestion q = buildQuizQuestion(10L, lesson);
            q.setOptions(new ArrayList<>());

            when(quizQuestionRepository.findById(10L)).thenReturn(Optional.of(q));
            // NOTE: mock lessonRepository để resolveQuizLessonOwnedByTutor ok
            when(lessonRepository.findById(lesson.getLessonID()))
                    .thenReturn(Optional.of(lesson));

            List<QuizOptionRequest> optReqs = List.of(
                    buildOptionReq("Option A", true, 1),
                    buildOptionReq("Option B", false, 2)
            );

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Multiple options")
                    .orderIndex(1)
                    .explanation("Explain")
                    .score(BigDecimal.valueOf(4.0))
                    .options(optReqs)
                    .build();

            when(quizQuestionRepository.save(any(QuizQuestion.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            QuizQuestionResponse res =
                    tutorQuizService.updateLiveQuestion(email, 10L, req);

            assertEquals("Multiple options", res.getQuestionText());
            assertEquals(2, res.getOptions().size());
        }
    }

    // =====================================================================
    // deleteLiveQuestion
    // =====================================================================

    @Nested
    @DisplayName("TutorQuizService.deleteLiveQuestion")
    class DeleteLiveQuestionTests {

        /**
         * NOTE – Case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> AppException")
        void deleteLiveQuestion_tutorNotFound_shouldThrow() {
            String email = "notfound@mail.com";
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> tutorQuizService.deleteLiveQuestion(email, 10L));
        }

        /**
         * NOTE – Case: QuizQuestion không tồn tại -> QUIZ_QUESTION_NOT_FOUND
         */
        @Test
        @DisplayName("QuizQuestion không tồn tại -> AppException")
        void deleteLiveQuestion_questionNotFound_shouldThrow() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            when(quizQuestionRepository.findById(99L))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> tutorQuizService.deleteLiveQuestion(email, 99L));
        }

        /**
         * NOTE – Case: QuizQuestion thuộc lesson của tutor khác -> UNAUTHORIZED
         */
        @Test
        @DisplayName("QuizQuestion thuộc tutor khác -> UNAUTHORIZED")
        void deleteLiveQuestion_questionOwnedByOtherTutor_shouldThrow() {
            String email = "tutor1@mail.com";
            Tutor tutor1 = buildTutor(1L, email);
            Tutor tutor2 = buildTutor(2L, "tutor2@mail.com");
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor1));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor2);
            QuizQuestion q = buildQuizQuestion(10L, lesson);
            when(quizQuestionRepository.findById(10L)).thenReturn(Optional.of(q));
            // NOTE: resolveQuizLessonOwnedByTutor đọc từ lessonRepository
            when(lessonRepository.findById(lesson.getLessonID()))
                    .thenReturn(Optional.of(lesson));

            assertThrows(AppException.class,
                    () -> tutorQuizService.deleteLiveQuestion(email, 10L));
        }

        /**
         * NOTE – Case: Happy path – deleteLiveQuestion thành công
         */
        @Test
        @DisplayName("Happy path - deleteLiveQuestion thành công")
        void deleteLiveQuestion_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            Lesson lesson = buildLessonQuizOwnedByTutor(1L, tutor);
            QuizQuestion q = buildQuizQuestion(10L, lesson);
            when(quizQuestionRepository.findById(10L)).thenReturn(Optional.of(q));
            // NOTE: Quan trọng – để resolveQuizLessonOwnedByTutor không ném LESSON_NOT_FOUND
            when(lessonRepository.findById(lesson.getLessonID()))
                    .thenReturn(Optional.of(lesson));

            tutorQuizService.deleteLiveQuestion(email, 10L);

            verify(quizQuestionRepository).delete(q);
        }
    }

    // =====================================================================
    // getDraftLessonQuiz
    // =====================================================================

    @Nested
    @DisplayName("TutorQuizService.getDraftLessonQuiz")
    class GetDraftLessonQuizTests {

        /**
         * NOTE – Case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Draft - Tutor không tồn tại -> AppException")
        void tutorNotFound_shouldThrow() {
            String email = "notfound@mail.com";
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> tutorQuizService.getDraftLessonQuiz(email, 1L));
        }

        /**
         * NOTE – Case: LessonDraft không tồn tại -> LESSON_NOT_FOUND
         */
        @Test
        @DisplayName("Draft - LessonDraft không tồn tại -> AppException")
        void lessonDraftNotFound_shouldThrow() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            when(lessonDraftRepository.findById(99L))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> tutorQuizService.getDraftLessonQuiz(email, 99L));
        }

        /**
         * NOTE – Case: LessonDraft thuộc tutor khác -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Draft - LessonDraft thuộc tutor khác -> UNAUTHORIZED")
        void lessonDraftOwnedByOtherTutor_shouldThrowUnauthorized() {
            String email = "tutor1@mail.com";
            Tutor tutor1 = buildTutor(1L, email);
            Tutor tutor2 = buildTutor(2L, "tutor2@mail.com");
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor1));

            LessonDraft lessonDraft = buildLessonDraftQuizOwnedByTutor(1L, tutor2);
            when(lessonDraftRepository.findById(1L)).thenReturn(Optional.of(lessonDraft));

            assertThrows(AppException.class,
                    () -> tutorQuizService.getDraftLessonQuiz(email, 1L));
        }

        /**
         * NOTE – Case: LessonDraft không phải Quiz -> INVALID_STATE
         */
        @Test
        @DisplayName("Draft - LessonDraft không phải Quiz -> INVALID_STATE")
        void lessonDraftNotQuiz_shouldThrowInvalidState() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            LessonDraft nonQuiz = buildLessonDraftNonQuizOwnedByTutor(1L, tutor, LessonType.Video);
            when(lessonDraftRepository.findById(1L)).thenReturn(Optional.of(nonQuiz));

            assertThrows(AppException.class,
                    () -> tutorQuizService.getDraftLessonQuiz(email, 1L));
        }

        /**
         * NOTE – Case: Happy path – lấy quiz draft detail thành công
         */
        @Test
        @DisplayName("Draft - Happy path lấy quiz detail")
        void getDraftLessonQuiz_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            LessonDraft lessonDraft = buildLessonDraftQuizOwnedByTutor(1L, tutor);
            when(lessonDraftRepository.findById(1L)).thenReturn(Optional.of(lessonDraft));

            QuizQuestionDraft q1 = buildQuizQuestionDraft(10L, lessonDraft);
            QuizQuestionDraft q2 = buildQuizQuestionDraft(11L, lessonDraft);
            when(quizQuestionDraftRepository.findByLessonDraftOrderByOrderIndexAsc(lessonDraft))
                    .thenReturn(List.of(q1, q2));

            LessonQuizDetailResponse res =
                    tutorQuizService.getDraftLessonQuiz(email, 1L);

            assertEquals(1L, res.getLessonID());
            assertFalse(res.getIsLive());
            assertEquals(2, res.getQuestions().size());
        }
    }

    // =====================================================================
    // createDraftQuestion
    // =====================================================================

    @Nested
    @DisplayName("TutorQuizService.createDraftQuestion")
    class CreateDraftQuestionTests {

        /**
         * NOTE – Case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Draft - Tutor không tồn tại -> AppException")
        void createDraft_tutorNotFound_shouldThrow() {
            String email = "notfound@mail.com";
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.empty());

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Draft Q")
                    .orderIndex(1)
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.createDraftQuestion(email, 1L, req));
        }

        /**
         * NOTE – Case: LessonDraft không tồn tại -> LESSON_NOT_FOUND
         */
        @Test
        @DisplayName("Draft - LessonDraft không tồn tại -> AppException")
        void createDraft_lessonDraftNotFound_shouldThrow() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            when(lessonDraftRepository.findById(99L))
                    .thenReturn(Optional.empty());

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Draft Q")
                    .orderIndex(1)
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.createDraftQuestion(email, 99L, req));
        }

        /**
         * NOTE – Case: LessonDraft thuộc tutor khác -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Draft - LessonDraft thuộc tutor khác -> UNAUTHORIZED")
        void createDraft_lessonDraftOtherTutor_shouldThrow() {
            String email = "tutor1@mail.com";
            Tutor tutor1 = buildTutor(1L, email);
            Tutor tutor2 = buildTutor(2L, "tutor2@mail.com");
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor1));

            LessonDraft lessonDraft = buildLessonDraftQuizOwnedByTutor(1L, tutor2);
            when(lessonDraftRepository.findById(1L))
                    .thenReturn(Optional.of(lessonDraft));

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Draft Q")
                    .orderIndex(1)
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.createDraftQuestion(email, 1L, req));
        }

        /**
         * NOTE – Case: Happy path – tạo Draft question với 2 options
         */
        @Test
        @DisplayName("Draft - Happy path tạo question với options")
        void createDraft_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            LessonDraft lessonDraft = buildLessonDraftQuizOwnedByTutor(1L, tutor);
            when(lessonDraftRepository.findById(1L))
                    .thenReturn(Optional.of(lessonDraft));

            List<QuizOptionRequest> opts = List.of(
                    buildOptionReq("Option A", true, 1),
                    buildOptionReq("Option B", false, 2)
            );

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Draft Q")
                    .orderIndex(1)
                    .explanation("Explain draft")
                    .score(BigDecimal.valueOf(3.0))
                    .options(opts)
                    .build();

            when(quizQuestionDraftRepository.save(any(QuizQuestionDraft.class)))
                    .thenAnswer(inv -> {
                        QuizQuestionDraft q = inv.getArgument(0);
                        q.setQuestionDraftID(10L);
                        return q;
                    });

            QuizQuestionResponse res =
                    tutorQuizService.createDraftQuestion(email, 1L, req);

            assertEquals(10L, res.getQuestionID());
            assertEquals("Draft Q", res.getQuestionText());
            assertEquals(2, res.getOptions().size());
        }
    }

    // =====================================================================
    // updateDraftQuestion
    // =====================================================================

    @Nested
    @DisplayName("TutorQuizService.updateDraftQuestion")
    class UpdateDraftQuestionTests {

        /**
         * NOTE – Case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Draft - Tutor không tồn tại -> AppException")
        void updateDraft_tutorNotFound_shouldThrow() {
            String email = "notfound@mail.com";
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.empty());

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Update draft")
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.updateDraftQuestion(email, 1L, req));
        }

        /**
         * NOTE – Case: QuizQuestionDraft không tồn tại -> QUIZ_QUESTION_NOT_FOUND
         */
        @Test
        @DisplayName("Draft - QuizQuestionDraft không tồn tại -> AppException")
        void updateDraft_questionNotFound_shouldThrow() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            when(quizQuestionDraftRepository.findById(99L))
                    .thenReturn(Optional.empty());

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Update draft")
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.updateDraftQuestion(email, 99L, req));
        }

        /**
         * NOTE – Case: LessonDraft của question thuộc tutor khác -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Draft - LessonDraft thuộc tutor khác -> UNAUTHORIZED")
        void updateDraft_questionOwnedByOtherTutor_shouldThrow() {
            String email = "tutor1@mail.com";
            Tutor tutor1 = buildTutor(1L, email);
            Tutor tutor2 = buildTutor(2L, "tutor2@mail.com");
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor1));

            LessonDraft lessonDraftOther = buildLessonDraftQuizOwnedByTutor(1L, tutor2);
            QuizQuestionDraft q = buildQuizQuestionDraft(10L, lessonDraftOther);
            q.setOptions(new ArrayList<>());

            when(quizQuestionDraftRepository.findById(10L))
                    .thenReturn(Optional.of(q));
            // NOTE: resolveQuizLessonDraftOwnedByTutor sẽ đọc từ lessonDraftRepository
            when(lessonDraftRepository.findById(lessonDraftOther.getLessonDraftID()))
                    .thenReturn(Optional.of(lessonDraftOther));

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Update draft")
                    .build();

            assertThrows(AppException.class,
                    () -> tutorQuizService.updateDraftQuestion(email, 10L, req));
        }

        /**
         * NOTE – Case: Happy path – updateDraftQuestion với 2 options
         */
        @Test
        @DisplayName("Draft - Happy path updateDraftQuestion")
        void updateDraft_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            LessonDraft lessonDraft = buildLessonDraftQuizOwnedByTutor(1L, tutor);
            QuizQuestionDraft q = buildQuizQuestionDraft(10L, lessonDraft);
            q.setOptions(new ArrayList<>());

            when(quizQuestionDraftRepository.findById(10L))
                    .thenReturn(Optional.of(q));
            // NOTE: Quan trọng – resolveQuizLessonDraftOwnedByTutor dùng lessonDraftRepository
            when(lessonDraftRepository.findById(lessonDraft.getLessonDraftID()))
                    .thenReturn(Optional.of(lessonDraft));

            List<QuizOptionRequest> opts = List.of(
                    buildOptionReq("Option A", true, 1),
                    buildOptionReq("Option B", false, 2)
            );

            QuizQuestionRequest req = QuizQuestionRequest.builder()
                    .questionText("Updated draft Q")
                    .orderIndex(2)
                    .explanation("Updated explain")
                    .score(BigDecimal.valueOf(4.0))
                    .options(opts)
                    .build();

            when(quizQuestionDraftRepository.save(any(QuizQuestionDraft.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            QuizQuestionResponse res =
                    tutorQuizService.updateDraftQuestion(email, 10L, req);

            assertEquals("Updated draft Q", res.getQuestionText());
            assertEquals(2, res.getOrderIndex());
            assertEquals(2, res.getOptions().size());
        }
    }

    // =====================================================================
    // deleteDraftQuestion
    // =====================================================================

    @Nested
    @DisplayName("TutorQuizService.deleteDraftQuestion")
    class DeleteDraftQuestionTests {

        /**
         * NOTE – Case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Draft - Tutor không tồn tại -> AppException")
        void deleteDraft_tutorNotFound_shouldThrow() {
            String email = "notfound@mail.com";
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> tutorQuizService.deleteDraftQuestion(email, 10L));
        }

        /**
         * NOTE – Case: QuizQuestionDraft không tồn tại -> QUIZ_QUESTION_NOT_FOUND
         */
        @Test
        @DisplayName("Draft - QuizQuestionDraft không tồn tại -> AppException")
        void deleteDraft_questionNotFound_shouldThrow() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            when(quizQuestionDraftRepository.findById(99L))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> tutorQuizService.deleteDraftQuestion(email, 99L));
        }

        /**
         * NOTE – Case: QuizQuestionDraft của lessonDraft thuộc tutor khác -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Draft - Question thuộc tutor khác -> UNAUTHORIZED")
        void deleteDraft_questionOwnedByOtherTutor_shouldThrow() {
            String email = "tutor1@mail.com";
            Tutor tutor1 = buildTutor(1L, email);
            Tutor tutor2 = buildTutor(2L, "tutor2@mail.com");
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor1));

            LessonDraft lessonDraftOther = buildLessonDraftQuizOwnedByTutor(1L, tutor2);
            QuizQuestionDraft q = buildQuizQuestionDraft(10L, lessonDraftOther);

            when(quizQuestionDraftRepository.findById(10L))
                    .thenReturn(Optional.of(q));
            // NOTE: resolveQuizLessonDraftOwnedByTutor dùng lessonDraftRepository
            when(lessonDraftRepository.findById(lessonDraftOther.getLessonDraftID()))
                    .thenReturn(Optional.of(lessonDraftOther));

            assertThrows(AppException.class,
                    () -> tutorQuizService.deleteDraftQuestion(email, 10L));
        }

        /**
         * NOTE – Case: Happy path – deleteDraftQuestion thành công
         */
        @Test
        @DisplayName("Draft - Happy path deleteDraftQuestion")
        void deleteDraft_success() {
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            when(tutorRepository.findByUser_Email(email)).thenReturn(Optional.of(tutor));

            LessonDraft lessonDraft = buildLessonDraftQuizOwnedByTutor(1L, tutor);
            QuizQuestionDraft q = buildQuizQuestionDraft(10L, lessonDraft);

            when(quizQuestionDraftRepository.findById(10L))
                    .thenReturn(Optional.of(q));
            // NOTE: Quan trọng – resolveQuizLessonDraftOwnedByTutor cần lấy lessonDraft từ repository
            when(lessonDraftRepository.findById(lessonDraft.getLessonDraftID()))
                    .thenReturn(Optional.of(lessonDraft));

            tutorQuizService.deleteDraftQuestion(email, 10L);

            verify(quizQuestionDraftRepository).delete(q);
        }
    }
}
