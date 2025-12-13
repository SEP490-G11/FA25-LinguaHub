package edu.lms.service;

import edu.lms.dto.request.LessonRequest;
import edu.lms.dto.response.LessonResponse;
import edu.lms.entity.*;
import edu.lms.enums.LessonType;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.Mockito.*;

/**
 * NOTE:
 *  - createLesson(): section không tồn tại -> ErrorCode.INVALID_KEY (theo LessonServiceImpl hiện tại).
 *  - Các method đọc section khác (getLessonsBySection, getLessonsBySectionWithFilters) -> SECTION_NOT_FOUND.
 *  - lesson không tồn tại -> ErrorCode.LESSON_NOT_FOUND.
 */
@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class LessonServiceTest {

    @Mock LessonRepository lessonRepository;
    @Mock CourseSectionRepository courseSectionRepository;
    @Mock EnrollmentRepository enrollmentRepository;
    @Mock UserRepository userRepository;
    @Mock LessonResourceRepository lessonResourceRepository;

    @InjectMocks
    LessonServiceImpl lessonService;

    // ======================= Helpers =======================

    private User buildUser(Long id, String email) {
        User u = new User();
        u.setUserID(id);
        u.setEmail(email);
        return u;
    }

    private Tutor buildTutor(Long tutorId, User user) {
        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setUser(user);
        return t;
    }

    private Course buildCourse(Long id, Tutor tutor) {
        Course c = new Course();
        c.setCourseID(id);
        c.setTutor(tutor);
        return c;
    }

    private CourseSection buildSection(Long sectionId, Course course) {
        CourseSection s = new CourseSection();
        s.setSectionID(sectionId);
        s.setCourse(course);
        return s;
    }

    private Lesson buildLesson(Long id, CourseSection section,
                               String title, Short duration,
                               Integer orderIndex, LessonType type,
                               String videoUrl, String content,
                               LocalDateTime createdAt) {
        Lesson l = new Lesson();
        l.setLessonID(id);
        l.setSection(section);
        l.setTitle(title);
        l.setDuration(duration);
        l.setOrderIndex(orderIndex);
        l.setLessonType(type);
        l.setVideoURL(videoUrl);
        l.setContent(content);
        l.setCreatedAt(createdAt);
        return l;
    }

    private Enrollment buildEnrollment(User user, Course course) {
        Enrollment e = new Enrollment();
        e.setUser(user);
        e.setCourse(course);
        return e;
    }

    @BeforeEach
    void commonStubs() {
        // save() trả về chính entity để dễ assert field mapping
        lenient().when(lessonRepository.save(any(Lesson.class)))
                .then(returnsFirstArg());
    }

    // ======================================================
    // createLesson
    // ======================================================
    @Nested
    @DisplayName("createLesson")
    class CreateLessonTests {

        /**
         * NOTE CASE (CL01 - Normal):
         *  - sectionID tồn tại
         *  - user là tutor owner của course
         *  - request hợp lệ
         *  => Tạo lesson thành công, field được map đúng
         *
         *  Lưu ý: KHÔNG assert lessonID vì mock save() không generate ID.
         */
        @Test
        @DisplayName("CL01 - Happy path: tutor owner tạo lesson thành công")
        void createLesson_success_owner() {
            Long sectionId = 10L;
            String email = "hai@gmail.com";

            User tutorUser = buildUser(1L, email);
            Tutor tutor = buildTutor(100L, tutorUser);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(tutorUser));

            LessonRequest req = LessonRequest.builder()
                    .title("Intro Java")
                    .content("Content")
                    .duration((short) 30)
                    .orderIndex(1)
                    .lessonType(LessonType.Video)
                    .videoURL("http://video.com/a.mp4")
                    .build();

            LessonResponse res = lessonService.createLesson(sectionId, req, email);

            assertEquals("Intro Java", res.getTitle());
            assertEquals("Content", res.getContent());
            assertEquals((short) 30, res.getDuration());
            assertEquals(1, res.getOrderIndex());
            assertEquals(LessonType.Video, res.getLessonType());
            assertEquals("http://video.com/a.mp4", res.getVideoURL());
            assertNotNull(res.getCreatedAt());

            verify(lessonRepository).save(any(Lesson.class));
        }

        /**
         * NOTE CASE (CL02 - Abnormal):
         *  - sectionID không tồn tại
         *  => INVALID_KEY (theo LessonServiceImpl.createLesson hiện tại)
         */
        @Test
        @DisplayName("CL02 - Section không tồn tại -> INVALID_KEY")
        void createLesson_sectionNotFound() {
            when(courseSectionRepository.findById(10L))
                    .thenReturn(Optional.empty());

            LessonRequest req = LessonRequest.builder()
                    .title("X")
                    .duration((short) 10)
                    .lessonType(LessonType.Video)
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.createLesson(10L, req, "hai@gmail.com")
            );
            assertEquals(ErrorCode.INVALID_KEY, ex.getErrorcode());
        }

        /**
         * NOTE CASE (CL03 - Abnormal):
         *  - section tồn tại
         *  - user email không tồn tại trong DB
         *  => UNAUTHENTICATED
         */
        @Test
        @DisplayName("CL03 - User không tồn tại -> UNAUTHENTICATED")
        void createLesson_userNotFound() {
            Long sectionId = 10L;
            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));
            when(userRepository.findByEmail("unknown@gmail.com"))
                    .thenReturn(Optional.empty());

            LessonRequest req = LessonRequest.builder()
                    .title("X")
                    .duration((short) 10)
                    .lessonType(LessonType.Video)
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.createLesson(sectionId, req, "unknown@gmail.com")
            );
            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }

        /**
         * NOTE CASE (CL04 - Abnormal):
         *  - section tồn tại
         *  - user tồn tại nhưng không phải tutor owner course
         *  => UNAUTHORIZED
         */
        @Test
        @DisplayName("CL04 - User không phải owner course -> UNAUTHORIZED")
        void createLesson_notOwner() {
            Long sectionId = 10L;
            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));

            User otherUser = buildUser(2L, "other@gmail.com");
            when(userRepository.findByEmail("other@gmail.com"))
                    .thenReturn(Optional.of(otherUser));

            LessonRequest req = LessonRequest.builder()
                    .title("X")
                    .duration((short) 10)
                    .lessonType(LessonType.Video)
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.createLesson(sectionId, req, "other@gmail.com")
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }
    }

    // ======================================================
    // updateLesson
    // ======================================================
    @Nested
    @DisplayName("updateLesson")
    class UpdateLessonTests {

        /**
         * NOTE CASE (UL01 - Normal):
         *  - lessonId tồn tại
         *  - user là tutor owner
         *  - request hợp lệ
         *  => update thành công, field mapping đúng
         */
        @Test
        @DisplayName("UL01 - Happy path: owner update lesson thành công")
        void updateLesson_success_owner() {
            Long lessonId = 10L;
            String email = "hai@gmail.com";

            User tutorUser = buildUser(1L, email);
            Tutor tutor = buildTutor(100L, tutorUser);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(5L, course);
            Lesson lesson = buildLesson(
                    lessonId, section,
                    "Old title", (short) 10, 1,
                    LessonType.Video, "http://old.com", "Old content",
                    LocalDateTime.now().minusDays(1)
            );

            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(tutorUser));

            LessonRequest req = LessonRequest.builder()
                    .title("Updated title")
                    .content("Updated content")
                    .orderIndex(3)
                    .duration((short) 15)
                    .lessonType(LessonType.Video)
                    .videoURL("http://video.com/a.mp4")
                    .build();

            LessonResponse res = lessonService.updateLesson(lessonId, req, email);

            assertEquals("Updated title", res.getTitle());
            assertEquals("Updated content", res.getContent());
            assertEquals(3, res.getOrderIndex());
            assertEquals((short) 15, res.getDuration());
            assertEquals(LessonType.Video, res.getLessonType());
            assertEquals("http://video.com/a.mp4", res.getVideoURL());

            verify(lessonRepository).save(lesson);
        }

        /**
         * NOTE CASE (UL02 - Abnormal):
         *  - lessonId không tồn tại
         *  => LESSON_NOT_FOUND
         */
        @Test
        @DisplayName("UL02 - Lesson không tồn tại -> LESSON_NOT_FOUND")
        void updateLesson_lessonNotFound() {
            when(lessonRepository.findById(1L))
                    .thenReturn(Optional.empty());

            LessonRequest req = LessonRequest.builder()
                    .title("X")
                    .duration((short) 10)
                    .lessonType(LessonType.Video)
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.updateLesson(1L, req, "hai@gmail.com")
            );
            assertEquals(ErrorCode.LESSON_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * NOTE CASE (UL03 - Abnormal):
         *  - lesson tồn tại
         *  - user email không tồn tại trong DB
         *  => UNAUTHENTICATED
         */
        @Test
        @DisplayName("UL03 - User không tồn tại -> UNAUTHENTICATED")
        void updateLesson_userNotFound() {
            Long lessonId = 10L;

            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(5L, course);
            Lesson lesson = buildLesson(
                    lessonId, section,
                    "Title", (short) 10, 1,
                    LessonType.Video, "http://old.com", "Content",
                    LocalDateTime.now().minusDays(1)
            );

            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));
            when(userRepository.findByEmail("unknown@gmail.com"))
                    .thenReturn(Optional.empty());

            LessonRequest req = LessonRequest.builder()
                    .title("Updated")
                    .duration((short) 20)
                    .lessonType(LessonType.Video)
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.updateLesson(lessonId, req, "unknown@gmail.com")
            );
            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }

        /**
         * NOTE CASE (UL04 - Abnormal):
         *  - lesson tồn tại
         *  - user tồn tại nhưng không phải owner
         *  => UNAUTHORIZED
         */
        @Test
        @DisplayName("UL04 - User không phải owner -> UNAUTHORIZED")
        void updateLesson_notOwner() {
            Long lessonId = 10L;

            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(5L, course);
            Lesson lesson = buildLesson(
                    lessonId, section,
                    "Title", (short) 10, 1,
                    LessonType.Video, "http://old.com", "Content",
                    LocalDateTime.now().minusDays(1)
            );

            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));

            User other = buildUser(2L, "other@gmail.com");
            when(userRepository.findByEmail("other@gmail.com"))
                    .thenReturn(Optional.of(other));

            LessonRequest req = LessonRequest.builder()
                    .title("Updated")
                    .duration((short) 20)
                    .lessonType(LessonType.Video)
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.updateLesson(lessonId, req, "other@gmail.com")
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * NOTE CASE (UL05 - Boundary):
         *  - lesson tồn tại
         *  - user là owner
         *  - request = null
         *  => Ném NullPointerException (do code gọi request.get...)
         */
        @Test
        @DisplayName("UL05 - Request null -> NullPointerException")
        void updateLesson_requestNull() {
            Long lessonId = 10L;
            String email = "hai@gmail.com";

            User tutorUser = buildUser(1L, email);
            Tutor tutor = buildTutor(100L, tutorUser);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(5L, course);
            Lesson lesson = buildLesson(
                    lessonId, section,
                    "Title", (short) 10, 1,
                    LessonType.Video, "http://old.com", "Content",
                    LocalDateTime.now().minusDays(1)
            );

            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(tutorUser));

            assertThrows(NullPointerException.class,
                    () -> lessonService.updateLesson(lessonId, null, email));
        }

        /**
         * NOTE CASE (UL06 - Abnormal):
         *  - lesson tồn tại
         *  - user là owner
         *  - khi save() thì DB down (RuntimeException)
         *  => Ném RuntimeException("DB down")
         */
        @Test
        @DisplayName("UL06 - DB down khi save -> RuntimeException")
        void updateLesson_dbDown() {
            Long lessonId = 10L;
            String email = "hai@gmail.com";

            User tutorUser = buildUser(1L, email);
            Tutor tutor = buildTutor(100L, tutorUser);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(5L, course);
            Lesson lesson = buildLesson(
                    lessonId, section,
                    "Title", (short) 10, 1,
                    LessonType.Video, "http://old.com", "Content",
                    LocalDateTime.now().minusDays(1)
            );

            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(tutorUser));

            // Override stub save() để giả lập DB down
            when(lessonRepository.save(any(Lesson.class)))
                    .thenThrow(new RuntimeException("DB down"));

            LessonRequest req = LessonRequest.builder()
                    .title("Updated")
                    .duration((short) 20)
                    .lessonType(LessonType.Video)
                    .build();

            RuntimeException ex = assertThrows(
                    RuntimeException.class,
                    () -> lessonService.updateLesson(lessonId, req, email)
            );
            assertEquals("DB down", ex.getMessage());
        }
    }

    // ======================================================
    // deleteLesson
    // ======================================================
    @Nested
    @DisplayName("deleteLesson")
    class DeleteLessonTests {

        /**
         * NOTE CASE (DL01 - Normal):
         *  - lesson tồn tại
         *  - user là owner
         *  => delete thành công, repository.delete được gọi
         */
        @Test
        @DisplayName("DL01 - Owner delete lesson thành công")
        void deleteLesson_success_owner() {
            Long lessonId = 10L;
            String email = "hai@gmail.com";

            User tutorUser = buildUser(1L, email);
            Tutor tutor = buildTutor(100L, tutorUser);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(5L, course);
            Lesson lesson = buildLesson(
                    lessonId, section,
                    "Title", (short) 10, 1,
                    LessonType.Video, "http://url", "Content",
                    LocalDateTime.now()
            );

            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(tutorUser));

            lessonService.deleteLesson(lessonId, email);

            verify(lessonRepository).delete(lesson);
        }

        /**
         * NOTE CASE (DL02 - Abnormal):
         *  - lessonId không tồn tại
         *  => LESSON_NOT_FOUND
         */
        @Test
        @DisplayName("DL02 - Lesson không tồn tại -> LESSON_NOT_FOUND")
        void deleteLesson_notFound() {
            when(lessonRepository.findById(1L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.deleteLesson(1L, "hai@gmail.com")
            );
            assertEquals(ErrorCode.LESSON_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * NOTE CASE (DL03 - Abnormal):
         *  - lesson tồn tại
         *  - user không tồn tại
         *  => UNAUTHENTICATED
         */
        @Test
        @DisplayName("DL03 - User không tồn tại -> UNAUTHENTICATED")
        void deleteLesson_userNotFound() {
            Long lessonId = 10L;

            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(5L, course);
            Lesson lesson = buildLesson(
                    lessonId, section,
                    "Title", (short) 10, 1,
                    LessonType.Video, "http://url", "Content",
                    LocalDateTime.now()
            );

            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));
            when(userRepository.findByEmail("unknown@gmail.com"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.deleteLesson(lessonId, "unknown@gmail.com")
            );
            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }

        /**
         * NOTE CASE (DL04 - Abnormal):
         *  - lesson tồn tại
         *  - user không phải owner
         *  => UNAUTHORIZED
         */
        @Test
        @DisplayName("DL04 - User không phải owner -> UNAUTHORIZED")
        void deleteLesson_notOwner() {
            Long lessonId = 10L;

            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(5L, course);
            Lesson lesson = buildLesson(
                    lessonId, section,
                    "Title", (short) 10, 1,
                    LessonType.Video, "http://url", "Content",
                    LocalDateTime.now()
            );

            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));

            User other = buildUser(2L, "other@gmail.com");
            when(userRepository.findByEmail("other@gmail.com"))
                    .thenReturn(Optional.of(other));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.deleteLesson(lessonId, "other@gmail.com")
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }
    }

    // ======================================================
    // getLessonsBySection
    // ======================================================
    @Nested
    @DisplayName("getLessonsBySection")
    class GetLessonsBySectionTests {

        /**
         * NOTE:
         *  Theo LessonServiceImpl hiện tại:
         *  - getLessonsBySection() chỉ dùng ensureOwner() -> CHỈ tutor owner được xem.
         *  - Learner dù đã enroll vẫn không được vào đây (chỉ dùng cho màn quản lý của tutor).
         */

        /**
         * NOTE CASE (GL01 - Normal):
         *  - section tồn tại
         *  - user là tutor owner
         *  => xem được list lessons
         */
        @Test
        @DisplayName("GL01 - Owner xem lessons by section")
        void getLessonsBySection_owner() {
            Long sectionId = 10L;
            String email = "owner@gmail.com";

            User owner = buildUser(1L, email);
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(owner));

            Lesson l1 = buildLesson(
                    1L, section,
                    "Java Basic", (short) 30, 1,
                    LessonType.Video, "url1", "Content1",
                    LocalDateTime.now().minusDays(2)
            );
            Lesson l2 = buildLesson(
                    2L, section,
                    "Python", (short) 45, 2,
                    LessonType.Video, "url2", "Content2",
                    LocalDateTime.now().minusDays(1)
            );

            when(lessonRepository.findBySectionSectionID(sectionId))
                    .thenReturn(List.of(l1, l2));

            List<LessonResponse> res =
                    lessonService.getLessonsBySection(sectionId, email);

            assertEquals(2, res.size());
            assertEquals("Java Basic", res.get(0).getTitle());
            assertEquals("Python", res.get(1).getTitle());
        }

        /**
         * NOTE CASE (GL02 - Abnormal theo code hiện tại):
         *  - section tồn tại
         *  - user là learner đã enroll course
         *  => VẪN bị UNAUTHORIZED vì getLessonsBySection chỉ dành cho owner.
         */
        @Test
        @DisplayName("GL02 - Learner đã enroll nhưng gọi getLessonsBySection -> UNAUTHORIZED")
        void getLessonsBySection_enrolledLearner() {
            Long sectionId = 10L;
            String email = "learner@gmail.com";

            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));

            User learner = buildUser(2L, email);
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(learner));

            // KHÔNG stub enrollmentRepository ở đây vì ensureOwner() không dùng tới,
            // nếu stub sẽ bị UnnecessaryStubbingException.

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.getLessonsBySection(sectionId, email)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * NOTE CASE (GL03 - Abnormal):
         *  - section tồn tại
         *  - user không phải owner, không enroll
         *  => UNAUTHORIZED (vì không phải owner)
         */
        @Test
        @DisplayName("GL03 - User không phải owner -> UNAUTHORIZED")
        void getLessonsBySection_notEnrolledAndNotOwner() {
            Long sectionId = 10L;

            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));

            User stranger = buildUser(2L, "stranger@gmail.com");
            when(userRepository.findByEmail("stranger@gmail.com"))
                    .thenReturn(Optional.of(stranger));

            // KHÔNG stub enrollmentRepository ở đây (không dùng).

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.getLessonsBySection(sectionId, "stranger@gmail.com")
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * NOTE CASE (GL04 - Abnormal):
         *  - sectionID không tồn tại
         *  => SECTION_NOT_FOUND
         */
        @Test
        @DisplayName("GL04 - Section không tồn tại -> SECTION_NOT_FOUND")
        void getLessonsBySection_sectionNotFound() {
            when(courseSectionRepository.findById(10L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.getLessonsBySection(10L, "a@gmail.com")
            );
            assertEquals(ErrorCode.SECTION_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * NOTE CASE (GL05 - Abnormal):
         *  - user email không tồn tại
         *  => UNAUTHENTICATED
         */
        @Test
        @DisplayName("GL05 - User không tồn tại -> UNAUTHENTICATED")
        void getLessonsBySection_userNotFound() {
            Long sectionId = 10L;
            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));
            when(userRepository.findByEmail("unknown@gmail.com"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.getLessonsBySection(sectionId, "unknown@gmail.com")
            );
            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }
    }

    // ======================================================
    // getLessonsBySectionWithFilters
    // ======================================================
    @Nested
    @DisplayName("getLessonsBySectionWithFilters")
    class GetLessonsBySectionWithFiltersTests {

        /**
         * NOTE CASE (LF01 - Normal):
         *  - section tồn tại, user owner
         *  - keyword = null
         *  - sortBy = null, order = null
         *  => sort theo orderIndex ASC (mặc định)
         */
        @Test
        @DisplayName("LF01 - sort mặc định theo orderIndex ASC")
        void getLessonsBySectionWithFilters_defaultSort() {
            Long sectionId = 10L;
            String email = "owner@gmail.com";

            User owner = buildUser(1L, email);
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(owner));

            Lesson l1 = buildLesson(
                    1L, section,
                    "Java Basic", (short) 30, 2,
                    LessonType.Video, "url1", "Content1",
                    LocalDateTime.of(2024, 1, 1, 10, 0)
            );
            Lesson l2 = buildLesson(
                    2L, section,
                    "Python", (short) 45, 1,
                    LessonType.Video, "url2", "Content2",
                    LocalDateTime.of(2024, 1, 5, 10, 0)
            );
            Lesson l3 = buildLesson(
                    3L, section,
                    "C++", (short) 20, 3,
                    LessonType.Video, "url3", "Content3",
                    LocalDateTime.of(2023, 12, 30, 10, 0)
            );

            when(lessonRepository.findBySectionSectionID(sectionId))
                    .thenReturn(List.of(l1, l2, l3));

            List<LessonResponse> res =
                    lessonService.getLessonsBySectionWithFilters(sectionId, email, null, null, null);

            // OrderIndex: l2(1), l1(2), l3(3)
            assertEquals(List.of("Python", "Java Basic", "C++"),
                    res.stream().map(LessonResponse::getTitle).toList());
        }

        /**
         * NOTE CASE (LF02 - Normal):
         *  - keyword = "java"
         *  - lọc title/content chứa "java"
         *  => trả về đúng lesson match
         */
        @Test
        @DisplayName("LF02 - Lọc theo keyword 'java'")
        void getLessonsBySectionWithFilters_filterByKeyword() {
            Long sectionId = 10L;
            String email = "owner@gmail.com";

            User owner = buildUser(1L, email);
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(owner));

            Lesson l1 = buildLesson(
                    1L, section,
                    "Java Basic", (short) 30, 1,
                    LessonType.Video, "url1", "Content java",
                    LocalDateTime.now()
            );
            Lesson l2 = buildLesson(
                    2L, section,
                    "Python", (short) 45, 2,
                    LessonType.Video, "url2", "Content python",
                    LocalDateTime.now()
            );

            when(lessonRepository.findBySectionSectionID(sectionId))
                    .thenReturn(List.of(l1, l2));

            List<LessonResponse> res =
                    lessonService.getLessonsBySectionWithFilters(sectionId, email, "java", null, null);

            assertEquals(1, res.size());
            assertEquals("Java Basic", res.get(0).getTitle());
        }

        /**
         * NOTE CASE (LF03 - Normal):
         *  - keyword không match ("math")
         *  => trả về list rỗng
         */
        @Test
        @DisplayName("LF03 - Keyword không match -> []")
        void getLessonsBySectionWithFilters_keywordNoMatch() {
            Long sectionId = 10L;
            String email = "owner@gmail.com";

            User owner = buildUser(1L, email);
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(owner));

            Lesson l1 = buildLesson(
                    1L, section,
                    "Java Basic", (short) 30, 1,
                    LessonType.Video, "url1", "Content java",
                    LocalDateTime.now()
            );
            when(lessonRepository.findBySectionSectionID(sectionId))
                    .thenReturn(List.of(l1));

            List<LessonResponse> res =
                    lessonService.getLessonsBySectionWithFilters(sectionId, email, "math", null, null);

            assertTrue(res.isEmpty());
        }

        /**
         * NOTE CASE (LF04 - Normal):
         *  - sortBy = "createdAt"
         *  - order = "ASC"
         *  => sort theo createdAt tăng dần
         */
        @Test
        @DisplayName("LF04 - Sort createdAt ASC")
        void getLessonsBySectionWithFilters_sortByCreatedAtAsc() {
            Long sectionId = 10L;
            String email = "owner@gmail.com";

            User owner = buildUser(1L, email);
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(owner));

            Lesson l1 = buildLesson(
                    1L, section,
                    "Java Basic", (short) 30, 1,
                    LessonType.Video, "url1", "Content1",
                    LocalDateTime.of(2024, 1, 1, 10, 0)
            );
            Lesson l2 = buildLesson(
                    2L, section,
                    "Python", (short) 45, 2,
                    LessonType.Video, "url2", "Content2",
                    LocalDateTime.of(2024, 1, 5, 10, 0)
            );
            Lesson l3 = buildLesson(
                    3L, section,
                    "C++", (short) 20, 3,
                    LessonType.Video, "url3", "Content3",
                    LocalDateTime.of(2023, 12, 30, 10, 0)
            );

            when(lessonRepository.findBySectionSectionID(sectionId))
                    .thenReturn(List.of(l1, l2, l3));

            List<LessonResponse> res =
                    lessonService.getLessonsBySectionWithFilters(sectionId, email, null, "createdAt", "ASC");

            // createdAt: l3(2023-12-30), l1(2024-01-01), l2(2024-01-05)
            assertEquals(List.of("C++", "Java Basic", "Python"),
                    res.stream().map(LessonResponse::getTitle).toList());
        }

        /**
         * NOTE CASE (LF06 - Abnormal):
         *  - section không tồn tại
         *  => SECTION_NOT_FOUND (thông qua getLessonsBySection)
         */
        @Test
        @DisplayName("LF06 - Section không tồn tại -> SECTION_NOT_FOUND")
        void getLessonsBySectionWithFilters_sectionNotFound() {
            when(courseSectionRepository.findById(2L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.getLessonsBySectionWithFilters(2L, "a@gmail.com", null, null, null)
            );
            assertEquals(ErrorCode.SECTION_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * NOTE CASE (LF07 - Abnormal):
         *  - user không tồn tại
         *  => UNAUTHENTICATED (thông qua getLessonsBySection)
         */
        @Test
        @DisplayName("LF07 - User không tồn tại -> UNAUTHENTICATED")
        void getLessonsBySectionWithFilters_userNotFound() {
            Long sectionId = 10L;

            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);
            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));

            when(userRepository.findByEmail("unknown@gmail.com"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.getLessonsBySectionWithFilters(sectionId, "unknown@gmail.com", null, null, null)
            );
            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }

        /**
         * NOTE CASE (LF08 - Abnormal):
         *  - user không phải owner, không enroll
         *  => UNAUTHORIZED (thông qua getLessonsBySection)
         */
        @Test
        @DisplayName("LF08 - User không phải owner & không enroll -> UNAUTHORIZED")
        void getLessonsBySectionWithFilters_notAllowed() {
            Long sectionId = 10L;

            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(sectionId, course);
            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));

            User stranger = buildUser(2L, "stranger@gmail.com");
            when(userRepository.findByEmail("stranger@gmail.com"))
                    .thenReturn(Optional.of(stranger));

            // KHÔNG stub enrollmentRepository ở đây vì getLessonsBySection() không hề gọi isEnrolled().

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.getLessonsBySectionWithFilters(sectionId, "stranger@gmail.com", null, null, null)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }
    }

    // ======================================================
    // getLessonDetail
    // ======================================================
    @Nested
    @DisplayName("getLessonDetail")
    class GetLessonDetailTests {

        /**
         * NOTE CASE (LD01 - Abnormal):
         *  - lessonId không tồn tại
         *  => LESSON_NOT_FOUND
         */
        @Test
        @DisplayName("LD01 - Lesson không tồn tại -> LESSON_NOT_FOUND")
        void getLessonDetail_notFound() {
            when(lessonRepository.findById(10L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.getLessonDetail(10L, "a@gmail.com")
            );
            assertEquals(ErrorCode.LESSON_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * NOTE CASE (LD02 - Normal):
         *  - lesson tồn tại
         *  - user là owner
         *  => xem được detail
         */
        @Test
        @DisplayName("LD02 - Owner xem lesson detail")
        void getLessonDetail_owner() {
            Long lessonId = 10L;
            String email = "owner@gmail.com";

            User owner = buildUser(1L, email);
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(5L, course);
            Lesson lesson = buildLesson(
                    lessonId, section,
                    "Java Basic", (short) 30, 1,
                    LessonType.Video, "http://url", "Content",
                    LocalDateTime.now()
            );

            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(owner));

            LessonResponse res =
                    lessonService.getLessonDetail(lessonId, email);

            assertEquals("Java Basic", res.getTitle());
            assertEquals((short) 30, res.getDuration());
        }

        /**
         * NOTE CASE (LD03 - Normal):
         *  - lesson tồn tại
         *  - user là learner đã enroll
         *  => xem được detail (ensureCanView -> isEnrolled)
         */
        @Test
        @DisplayName("LD03 - Learner đã enroll xem lesson detail")
        void getLessonDetail_enrolledLearner() {
            Long lessonId = 10L;
            String email = "learner@gmail.com";

            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(5L, course);
            Lesson lesson = buildLesson(
                    lessonId, section,
                    "Java Basic", (short) 30, 1,
                    LessonType.Video, "http://url", "Content",
                    LocalDateTime.now()
            );

            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));

            User learner = buildUser(2L, email);
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(learner));

            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(
                    learner.getUserID(), course.getCourseID()
            )).thenReturn(Optional.of(buildEnrollment(learner, course)));

            LessonResponse res =
                    lessonService.getLessonDetail(lessonId, email);

            assertEquals("Java Basic", res.getTitle());
        }

        /**
         * NOTE CASE (LD04 - Abnormal):
         *  - lesson tồn tại
         *  - user không phải owner, không enroll
         *  => UNAUTHORIZED
         */
        @Test
        @DisplayName("LD04 - User không phải owner & không enroll -> UNAUTHORIZED")
        void getLessonDetail_notAllowed() {
            Long lessonId = 10L;

            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(5L, course);
            Lesson lesson = buildLesson(
                    lessonId, section,
                    "Java Basic", (short) 30, 1,
                    LessonType.Video, "http://url", "Content",
                    LocalDateTime.now()
            );

            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));

            User stranger = buildUser(2L, "stranger@gmail.com");
            when(userRepository.findByEmail("stranger@gmail.com"))
                    .thenReturn(Optional.of(stranger));

            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(
                    stranger.getUserID(), course.getCourseID()
            )).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.getLessonDetail(lessonId, "stranger@gmail.com")
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * NOTE CASE (LD05 - Abnormal):
         *  - lesson tồn tại
         *  - user email không tồn tại
         *  => UNAUTHENTICATED
         */
        @Test
        @DisplayName("LD05 - User không tồn tại -> UNAUTHENTICATED")
        void getLessonDetail_userNotFound() {
            Long lessonId = 10L;

            User owner = buildUser(1L, "owner@gmail.com");
            Tutor tutor = buildTutor(100L, owner);
            Course course = buildCourse(200L, tutor);
            CourseSection section = buildSection(5L, course);
            Lesson lesson = buildLesson(
                    lessonId, section,
                    "Java Basic", (short) 30, 1,
                    LessonType.Video, "http://url", "Content",
                    LocalDateTime.now()
            );

            when(lessonRepository.findById(lessonId))
                    .thenReturn(Optional.of(lesson));
            when(userRepository.findByEmail("unknown@gmail.com"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> lessonService.getLessonDetail(lessonId, "unknown@gmail.com")
            );
            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }
    }
}
