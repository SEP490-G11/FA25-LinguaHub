package edu.lms.service;

import edu.lms.dto.request.TutorCourseRequest;
import edu.lms.dto.response.TutorCourseDetailResponse;
import edu.lms.dto.response.TutorCourseResponse;
import edu.lms.dto.response.TutorCourseStudentResponse;
import edu.lms.entity.*;
import edu.lms.enums.CourseDraftStatus;
import edu.lms.enums.CourseLevel;
import edu.lms.enums.CourseStatus;
import edu.lms.enums.TutorStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.mapper.TutorCourseMapper;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho TutorCourseService.
 *
 * NOTE CHUNG:
 * - Test đủ tất cả public method:
 *   + startEditCourseDirect
 *   + createCourseForCurrentTutor
 *   + getMyCourses
 *   + getMyCoursesByStatus
 *   + updateCourseForCurrentTutor
 *   + deleteCourseForCurrentTutor
 *   + disableCourse
 *   + enableCourse
 *   + getStudentsByCourse
 *   + getMyCourseDetail
 *   + submitCourseForReview
 *   + startEditCourseDraft
 *   + getMyCourseDraftDetail
 *   + updateCourseDraftInfo
 *   + submitCourseDraftForReview
 *   + deleteCourseDraftForCurrentTutor
 *
 * - Các test case đều có NOTE giải thích rõ:
 *   + Với startEditCourseDirect: mapping trực tiếp tới bảng UTCID01–UTCID06.
 *   + Các method khác: note theo dạng "Test case: ...".
 *
 * - Khi assert exception, luôn check ex.getErrorcode().
 */
@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class TutorCourseServiceTest {

    @Mock TutorRepository tutorRepository;
    @Mock CourseRepository courseRepository;
    @Mock CourseCategoryRepository courseCategoryRepository;
    @Mock EnrollmentRepository enrollmentRepository;
    @Mock CourseSectionRepository courseSectionRepository;
    @Mock LessonRepository lessonRepository;
    @Mock LessonResourceRepository lessonResourceRepository;
    @Mock TutorCourseMapper tutorCourseMapper;
    @Mock CourseObjectiveRepository courseObjectiveRepository;
    @Mock CourseObjectiveDraftRepository courseObjectiveDraftRepository;
    @Mock CourseDraftRepository courseDraftRepository;
    @Mock CourseSectionDraftRepository courseSectionDraftRepository;
    @Mock LessonDraftRepository lessonDraftRepository;
    @Mock LessonResourceDraftRepository lessonResourceDraftRepository;
    @Mock QuizQuestionRepository quizQuestionRepository;
    @Mock QuizOptionRepository quizOptionRepository;
    @Mock QuizQuestionDraftRepository quizQuestionDraftRepository;
    @Mock QuizOptionDraftRepository quizOptionDraftRepository;
    @Mock CourseReviewRepository courseReviewRepository;

    @InjectMocks
    TutorCourseService tutorCourseService;

    // ======= Helper dựng entity/dto đơn giản, tránh phụ thuộc DB thực =======

    private Tutor buildTutor(Long tutorId, TutorStatus status) {
        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setStatus(status);
        return t;
    }

    private Course buildCourse(Long id, Tutor tutor, CourseStatus status) {
        Course c = new Course();
        c.setCourseID(id);
        c.setTutor(tutor);
        c.setStatus(status);
        c.setTitle("Course " + id);
        c.setLevel(CourseLevel.BEGINNER);
        c.setPrice(BigDecimal.TEN);
        c.setCreatedAt(LocalDateTime.now().minusDays(1));
        c.setUpdatedAt(LocalDateTime.now());
        return c;
    }

    private CourseDraft buildCourseDraft(Long draftId, Tutor tutor, Course course, CourseDraftStatus status) {
        CourseDraft d = new CourseDraft();
        d.setDraftID(draftId);
        d.setTutor(tutor);
        d.setCourse(course);
        d.setStatus(status);
        d.setTitle("Draft " + draftId);
        d.setLevel(CourseLevel.BEGINNER);
        d.setPrice(BigDecimal.TEN);
        d.setUpdatedAt(LocalDateTime.now());
        return d;
    }

    private TutorCourseRequest buildCourseRequest() {
        TutorCourseRequest req = new TutorCourseRequest();
        req.setTitle("New Course");
        req.setShortDescription("Short");
        req.setDescription("Desc");
        req.setRequirement("Req");
        req.setLevel(CourseLevel.BEGINNER);
        req.setDuration(120);
        req.setPrice(BigDecimal.TEN);
        req.setLanguage("EN");
        req.setThumbnailURL("thumb");
        req.setCategoryID(1L);
        return req;
    }

    @BeforeEach
    void commonMocks() {
        // NOTE: 2 stub này không phải test nào cũng dùng
        // -> nếu để when(...) bình thường trong @BeforeEach sẽ bị UnnecessaryStubbing
        // -> dùng lenient() để Mockito bỏ qua check "unnecessary" cho chúng.

        lenient().when(courseReviewRepository.findByCourse_CourseID(anyLong()))
                .thenReturn(List.of());

        lenient().when(enrollmentRepository.countByCourse_CourseID(anyLong()))
                .thenReturn(0L);
    }

    // ========================================================================
    // startEditCourseDirect
    // ========================================================================
    @Nested
    @DisplayName("startEditCourseDirect")
    class StartEditCourseDirectTests {

        /**
         * [UTCID03]
         * Test case: Tutor không tồn tại trong database
         * Điều kiện:
         *  - tutorRepository.findByUser_Email trả về Optional.empty()
         * Kết quả mong đợi:
         *  - Ném AppException với ErrorCode.TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND (UTCID03)")
        void tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("hoa@gmail.com"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.startEditCourseDirect("hoa@gmail.com", 1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * [UTCID04]
         * Test case: Course không tồn tại trong database
         * Điều kiện:
         *  - Tutor tồn tại
         *  - courseRepository.findById trả về Optional.empty()
         * Kết quả mong đợi:
         *  - Ném AppException với ErrorCode.COURSE_NOT_FOUND
         */
        @Test
        @DisplayName("Course không tồn tại -> COURSE_NOT_FOUND (UTCID04)")
        void courseNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("hoa@gmail.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.startEditCourseDirect("hoa@gmail.com", 1L)
            );
            assertEquals(ErrorCode.COURSE_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * [UTCID05]
         * Test case: Tutor tồn tại nhưng không phải owner của course
         * Điều kiện:
         *  - Tutor A đăng nhập
         *  - Course thuộc Tutor B
         * Kết quả mong đợi:
         *  - Ném AppException với ErrorCode.UNAUTHORIZED
         */
        @Test
        @DisplayName("Không phải owner course -> UNAUTHORIZED (UTCID05)")
        void notOwner_shouldThrowUnauthorized() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Tutor otherTutor = buildTutor(2L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, otherTutor, CourseStatus.Approved);

            when(tutorRepository.findByUser_Email("hoa@gmail.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L))
                    .thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.startEditCourseDirect("hoa@gmail.com", 1L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * [UTCID06]
         * Test case: Course đã có enrollment -> không cho sửa trực tiếp
         * Điều kiện:
         *  - Tutor là owner course
         *  - enrollmentRepository.existsByCourse(course) = true
         * Kết quả mong đợi:
         *  - Ném AppException với ErrorCode.COURSE_HAS_ENROLLMENT
         */
        @Test
        @DisplayName("Course đã có enrollment -> COURSE_HAS_ENROLLMENT (UTCID06)")
        void courseHasEnrollment_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);

            when(tutorRepository.findByUser_Email("hoa@gmail.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L))
                    .thenReturn(Optional.of(course));
            when(enrollmentRepository.existsByCourse(course))
                    .thenReturn(true);

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.startEditCourseDirect("hoa@gmail.com", 1L)
            );
            assertEquals(ErrorCode.COURSE_HAS_ENROLLMENT, ex.getErrorcode());
        }

        /**
         * [UTCID01]
         * Test case: Tutor tồn tại, course tồn tại, status = Approved, không có enrollment
         * Điều kiện:
         *  - Course.status = Approved
         *  - existsByCourse = false
         * Kết quả mong đợi:
         *  - Course chuyển sang Draft
         *  - Trả về TutorCourseDetailResponse với status = "Draft"
         */
        @Test
        @DisplayName("Course status=Approved -> đổi sang Draft (UTCID01)")
        void approvedCourse_shouldBeSwitchedToDraft() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);

            when(tutorRepository.findByUser_Email("hoa@gmail.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L))
                    .thenReturn(Optional.of(course));
            when(enrollmentRepository.existsByCourse(course))
                    .thenReturn(false);

            TutorCourseDetailResponse res = tutorCourseService.startEditCourseDirect("hoa@gmail.com", 1L);

            assertEquals("Course 1", res.getTitle());
            assertEquals("Draft", res.getStatus());
            verify(courseRepository).save(course);
        }

        /**
         * [UTCID02]
         * Test case: Course đã ở trạng thái Draft, không có enrollment
         * Điều kiện:
         *  - Course.status = Draft
         *  - existsByCourse = false
         * Kết quả mong đợi:
         *  - Không thay đổi status (giữ Draft)
         *  - Không save lại course (theo code hiện tại)
         */
        @Test
        @DisplayName("Course status=Draft -> giữ nguyên Draft (UTCID02)")
        void draftCourse_shouldRemainDraft() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Draft);

            when(tutorRepository.findByUser_Email("hoa@gmail.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L))
                    .thenReturn(Optional.of(course));
            when(enrollmentRepository.existsByCourse(course))
                    .thenReturn(false);

            TutorCourseDetailResponse res = tutorCourseService.startEditCourseDirect("hoa@gmail.com", 1L);

            assertEquals("Draft", res.getStatus());
            // Code chỉ save khi từ Approved -> Draft, nên ở đây không save
            verify(courseRepository, never()).save(course);
        }
    }

    // ========================================================================
    // createCourseForCurrentTutor
    // ========================================================================
    @Nested
    @DisplayName("createCourseForCurrentTutor")
    class CreateCourseForCurrentTutorTests {

        /**
         * Test case: Tutor không tồn tại -> Error TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("a@b.com"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.createCourseForCurrentTutor("a@b.com", buildCourseRequest())
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Tutor tồn tại nhưng status != APPROVED (PENDING/SUSPENDED)
         * -> TUTOR_NOT_APPROVED
         */
        @Test
        @DisplayName("Tutor chưa APPROVED -> TUTOR_NOT_APPROVED")
        void tutorNotApproved_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.PENDING);
            when(tutorRepository.findByUser_Email("a@b.com"))
                    .thenReturn(Optional.of(tutor));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.createCourseForCurrentTutor("a@b.com", buildCourseRequest())
            );
            assertEquals(ErrorCode.TUTOR_NOT_APPROVED, ex.getErrorcode());
        }

        /**
         * Test case: Category của course không tồn tại -> COURSE_CATEGORY_NOT_FOUND
         */
        @Test
        @DisplayName("Category không tồn tại -> COURSE_CATEGORY_NOT_FOUND")
        void categoryNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("a@b.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseCategoryRepository.findById(1L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.createCourseForCurrentTutor("a@b.com", buildCourseRequest())
            );
            assertEquals(ErrorCode.COURSE_CATEGORY_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Happy path – Tutor APPROVED, category tồn tại
         * -> tạo course Draft mới
         */
        @Test
        @DisplayName("Happy path – Tạo course Draft cho tutor APPROVED")
        void happyPath_shouldCreateCourse() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            CourseCategory category = new CourseCategory();
            category.setCategoryID(1L);
            category.setName("Cat");

            when(tutorRepository.findByUser_Email("a@b.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseCategoryRepository.findById(1L))
                    .thenReturn(Optional.of(category));

            when(tutorCourseMapper.toCourse(any(TutorCourseRequest.class)))
                    .thenAnswer(invocation -> new Course());

            Course saved = buildCourse(1L, tutor, CourseStatus.Draft);
            when(courseRepository.save(any(Course.class)))
                    .thenReturn(saved);

            TutorCourseResponse mappedResponse = TutorCourseResponse.builder()
                    .id(1L)
                    .title("New Course")
                    .status("Draft")
                    .build();
            when(tutorCourseMapper.toTutorCourseResponse(any(Course.class)))
                    .thenReturn(mappedResponse);

            TutorCourseResponse res =
                    tutorCourseService.createCourseForCurrentTutor("a@b.com", buildCourseRequest());

            assertEquals(1L, res.getId());
            assertEquals("Draft", res.getStatus());
            verify(courseRepository).save(any(Course.class));
        }
    }

    // ========================================================================
    // getMyCourses & getMyCoursesByStatus
    // ========================================================================
    @Nested
    @DisplayName("getMyCourses & getMyCoursesByStatus")
    class GetMyCoursesTests {

        /**
         * Test case: getMyCourses – Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("getMyCourses - Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void getMyCourses_tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("x@y.com"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.getMyCourses("x@y.com")
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: getMyCourses – Tutor tồn tại, có nhiều course với các status khác nhau
         * -> trả list tất cả course của tutor
         */
        @Test
        @DisplayName("getMyCourses - Happy path")
        void getMyCourses_happyPath() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("x@y.com"))
                    .thenReturn(Optional.of(tutor));

            Course c1 = buildCourse(1L, tutor, CourseStatus.Draft);
            Course c2 = buildCourse(2L, tutor, CourseStatus.Approved);
            when(courseRepository.findByTutor(tutor))
                    .thenReturn(List.of(c1, c2));

            when(tutorCourseMapper.toTutorCourseResponse(c1))
                    .thenReturn(TutorCourseResponse.builder().id(1L).build());
            when(tutorCourseMapper.toTutorCourseResponse(c2))
                    .thenReturn(TutorCourseResponse.builder().id(2L).build());

            List<TutorCourseResponse> res = tutorCourseService.getMyCourses("x@y.com");
            assertEquals(2, res.size());
        }

        /**
         * Test case: getMyCoursesByStatus – status = null
         * -> dùng findByTutor (lấy tất cả course)
         */
        @Test
        @DisplayName("getMyCoursesByStatus - status null -> dùng findByTutor")
        void getMyCoursesByStatus_nullStatus() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("x@y.com"))
                    .thenReturn(Optional.of(tutor));

            Course c1 = buildCourse(1L, tutor, CourseStatus.Draft);
            when(courseRepository.findByTutor(tutor))
                    .thenReturn(List.of(c1));
            when(tutorCourseMapper.toTutorCourseResponse(c1))
                    .thenReturn(TutorCourseResponse.builder().id(1L).build());

            List<TutorCourseResponse> res = tutorCourseService.getMyCoursesByStatus("x@y.com", null);
            assertEquals(1, res.size());
            verify(courseRepository).findByTutor(tutor);
        }

        /**
         * Test case: getMyCoursesByStatus – status cụ thể (VD: Approved)
         * -> dùng findByTutorAndStatus
         */
        @Test
        @DisplayName("getMyCoursesByStatus - status cụ thể -> dùng findByTutorAndStatus")
        void getMyCoursesByStatus_specificStatus() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("x@y.com"))
                    .thenReturn(Optional.of(tutor));

            Course c1 = buildCourse(1L, tutor, CourseStatus.Approved);
            when(courseRepository.findByTutorAndStatus(tutor, CourseStatus.Approved))
                    .thenReturn(List.of(c1));
            when(tutorCourseMapper.toTutorCourseResponse(c1))
                    .thenReturn(TutorCourseResponse.builder().id(1L).status("Approved").build());

            List<TutorCourseResponse> res =
                    tutorCourseService.getMyCoursesByStatus("x@y.com", CourseStatus.Approved);
            assertEquals(1, res.size());
            assertEquals("Approved", res.get(0).getStatus());
        }
    }

    // ========================================================================
    // updateCourseForCurrentTutor
    // ========================================================================
    @Nested
    @DisplayName("updateCourseForCurrentTutor")
    class UpdateCourseForCurrentTutorTests {

        /**
         * Test case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("x@y.com"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.updateCourseForCurrentTutor("x@y.com", 1L, buildCourseRequest())
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Course không tồn tại -> COURSE_NOT_FOUND
         */
        @Test
        @DisplayName("Course không tồn tại -> COURSE_NOT_FOUND")
        void courseNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("x@y.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.updateCourseForCurrentTutor("x@y.com", 1L, buildCourseRequest())
            );
            assertEquals(ErrorCode.COURSE_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Tutor không phải owner của course -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Không phải owner -> UNAUTHORIZED")
        void notOwner_shouldThrowUnauthorized() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Tutor otherTutor = buildTutor(2L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, otherTutor, CourseStatus.Draft);

            when(tutorRepository.findByUser_Email("x@y.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L))
                    .thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.updateCourseForCurrentTutor("x@y.com", 1L, buildCourseRequest())
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * Test case: Course đã có enrollment -> COURSE_HAS_ENROLLMENT
         */
        @Test
        @DisplayName("Course đã có enrollment -> COURSE_HAS_ENROLLMENT")
        void hasEnrollment_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Draft);

            when(tutorRepository.findByUser_Email("x@y.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L))
                    .thenReturn(Optional.of(course));
            when(enrollmentRepository.existsByCourse(course))
                    .thenReturn(true);

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.updateCourseForCurrentTutor("x@y.com", 1L, buildCourseRequest())
            );
            assertEquals(ErrorCode.COURSE_HAS_ENROLLMENT, ex.getErrorcode());
        }

        /**
         * Test case: Category mới không tồn tại -> COURSE_CATEGORY_NOT_FOUND
         */
        @Test
        @DisplayName("Category không tồn tại -> COURSE_CATEGORY_NOT_FOUND")
        void categoryNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Draft);

            when(tutorRepository.findByUser_Email("x@y.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L))
                    .thenReturn(Optional.of(course));
            when(enrollmentRepository.existsByCourse(course))
                    .thenReturn(false);
            when(courseCategoryRepository.findById(1L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.updateCourseForCurrentTutor("x@y.com", 1L, buildCourseRequest())
            );
            assertEquals(ErrorCode.COURSE_CATEGORY_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Course đang Approved, chưa có enrollment
         * -> status chuyển sang Pending sau khi update
         */
        @Test
        @DisplayName("Course Approved, không enrollment -> status chuyển Pending & update dữ liệu")
        void approvedCourse_shouldBecomePending() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            CourseCategory category = new CourseCategory();
            category.setCategoryID(1L);

            when(tutorRepository.findByUser_Email("x@y.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L))
                    .thenReturn(Optional.of(course));
            when(enrollmentRepository.existsByCourse(course))
                    .thenReturn(false);
            when(courseCategoryRepository.findById(1L))
                    .thenReturn(Optional.of(category));

            when(tutorCourseMapper.toTutorCourseResponse(any(Course.class)))
                    .thenAnswer(invocation -> {
                        Course c = invocation.getArgument(0);
                        return TutorCourseResponse.builder()
                                .id(c.getCourseID())
                                .status(c.getStatus().name())
                                .title(c.getTitle())
                                .build();
                    });

            TutorCourseRequest req = buildCourseRequest();
            req.setTitle("Updated");
            req.setDuration(180);

            TutorCourseResponse res =
                    tutorCourseService.updateCourseForCurrentTutor("x@y.com", 1L, req);

            assertEquals("Updated", res.getTitle());
            assertEquals("Pending", res.getStatus());
            verify(courseRepository).save(course);
        }
    }

    // ========================================================================
    // deleteCourseForCurrentTutor
    // ========================================================================
    @Nested
    @DisplayName("deleteCourseForCurrentTutor")
    class DeleteCourseForCurrentTutorTests {

        /**
         * Test case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("x@y.com"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.deleteCourseForCurrentTutor("x@y.com", 1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Course không tồn tại -> COURSE_NOT_FOUND
         */
        @Test
        @DisplayName("Course không tồn tại -> COURSE_NOT_FOUND")
        void courseNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("x@y.com"))
                    .thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.deleteCourseForCurrentTutor("x@y.com", 1L)
            );
            assertEquals(ErrorCode.COURSE_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Tutor không phải owner -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Không phải owner -> UNAUTHORIZED")
        void notOwner_shouldThrowUnauthorized() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Tutor other = buildTutor(2L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, other, CourseStatus.Draft);

            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.deleteCourseForCurrentTutor("x@y.com", 1L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * Test case: Course status không phải Draft/Rejected
         * (ví dụ Approved, Pending) -> COURSE_DELETE_ONLY_DRAFT_OR_REJECTED
         */
        @Test
        @DisplayName("Status không phải Draft/Rejected -> COURSE_DELETE_ONLY_DRAFT_OR_REJECTED")
        void invalidStatus_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);

            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.deleteCourseForCurrentTutor("x@y.com", 1L)
            );
            assertEquals(ErrorCode.COURSE_DELETE_ONLY_DRAFT_OR_REJECTED, ex.getErrorcode());
        }

        /**
         * Test case: Course status Draft/Rejected nhưng đã có enrollment
         * -> COURSE_HAS_ENROLLMENT
         */
        @Test
        @DisplayName("Đã có enrollment -> COURSE_HAS_ENROLLMENT")
        void hasEnrollment_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Draft);

            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
            when(enrollmentRepository.existsByCourse(course)).thenReturn(true);

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.deleteCourseForCurrentTutor("x@y.com", 1L)
            );
            assertEquals(ErrorCode.COURSE_HAS_ENROLLMENT, ex.getErrorcode());
        }

        /**
         * Test case: Happy path – Course status Draft, không enrollment
         * -> Xoá course + xoá tất cả draft liên quan
         */
        @Test
        @DisplayName("Happy path – status Draft, không enrollment -> xoá course & drafts liên quan")
        void happyPath_deleteDraftCourse() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Draft);

            CourseDraft draft1 = buildCourseDraft(10L, tutor, course, CourseDraftStatus.EDITING);
            CourseDraft draft2 = buildCourseDraft(11L, tutor, course, CourseDraftStatus.REJECTED);

            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
            when(enrollmentRepository.existsByCourse(course)).thenReturn(false);
            when(courseDraftRepository.findByCourse_CourseID(1L))
                    .thenReturn(List.of(draft1, draft2));

            tutorCourseService.deleteCourseForCurrentTutor("x@y.com", 1L);

            verify(courseDraftRepository).deleteAll(List.of(draft1, draft2));
            verify(courseRepository).delete(course);
        }
    }

    // ========================================================================
    // disableCourse / enableCourse
    // ========================================================================
    @Nested
    @DisplayName("disableCourse / enableCourse")
    class EnableDisableCourseTests {

        /**
         * Test case: disableCourse – Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("disableCourse - Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void disable_tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.empty());
            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.disableCourse("x@y.com", 1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: disableCourse – Tutor chưa APPROVED -> TUTOR_NOT_APPROVED
         */
        @Test
        @DisplayName("disableCourse - Tutor chưa APPROVED -> TUTOR_NOT_APPROVED")
        void disable_tutorNotApproved_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.PENDING);
            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.of(tutor));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.disableCourse("x@y.com", 1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_APPROVED, ex.getErrorcode());
        }

        /**
         * Test case: disableCourse – Course không tồn tại -> COURSE_NOT_FOUND
         */
        @Test
        @DisplayName("disableCourse - Course không tồn tại -> COURSE_NOT_FOUND")
        void disable_courseNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.disableCourse("x@y.com", 1L)
            );
            assertEquals(ErrorCode.COURSE_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: disableCourse – Tutor không phải owner -> UNAUTHORIZED
         */
        @Test
        @DisplayName("disableCourse - Không phải owner -> UNAUTHORIZED")
        void disable_notOwner_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Tutor other = buildTutor(2L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, other, CourseStatus.Approved);

            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.disableCourse("x@y.com", 1L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * Test case: disableCourse – Course status != Approved -> INVALID_STATE
         */
        @Test
        @DisplayName("disableCourse - Course status != Approved -> INVALID_STATE")
        void disable_invalidStatus_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Draft);

            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.disableCourse("x@y.com", 1L)
            );
            assertEquals(ErrorCode.INVALID_STATE, ex.getErrorcode());
        }

        /**
         * Test case: disableCourse – Happy path:
         *  - Tutor APPROVED, owner course
         *  - Course status = Approved
         *  => set status = Disabled, save, trả response
         */
        @Test
        @DisplayName("disableCourse - Happy path: Approved -> Disabled")
        void disable_happyPath() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);

            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
            when(tutorCourseMapper.toTutorCourseResponse(course))
                    .thenReturn(TutorCourseResponse.builder().id(1L).status("Disabled").build());

            TutorCourseResponse res = tutorCourseService.disableCourse("x@y.com", 1L);

            assertEquals("Disabled", res.getStatus());
            assertEquals(CourseStatus.Disabled, course.getStatus());
            verify(courseRepository).save(course);
        }

        /**
         * Test case: enableCourse – Tutor chưa APPROVED -> TUTOR_NOT_APPROVED
         */
        @Test
        @DisplayName("enableCourse - Tutor chưa APPROVED -> TUTOR_NOT_APPROVED")
        void enable_tutorNotApproved_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.PENDING);
            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.of(tutor));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.enableCourse("x@y.com", 1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_APPROVED, ex.getErrorcode());
        }

        /**
         * Test case: enableCourse – Course status != Disabled -> INVALID_STATE
         */
        @Test
        @DisplayName("enableCourse - Course status != Disabled -> INVALID_STATE")
        void enable_invalidStatus_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);

            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.enableCourse("x@y.com", 1L)
            );
            assertEquals(ErrorCode.INVALID_STATE, ex.getErrorcode());
        }

        /**
         * Test case: enableCourse – Happy path:
         *  - Tutor APPROVED, owner course
         *  - Course status = Disabled
         *  => set status = Approved, save, trả response
         */
        @Test
        @DisplayName("enableCourse - Happy path: Disabled -> Approved")
        void enable_happyPath() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Disabled);

            when(tutorRepository.findByUser_Email("x@y.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
            when(tutorCourseMapper.toTutorCourseResponse(course))
                    .thenReturn(TutorCourseResponse.builder().id(1L).status("Approved").build());

            TutorCourseResponse res = tutorCourseService.enableCourse("x@y.com", 1L);

            assertEquals("Approved", res.getStatus());
            assertEquals(CourseStatus.Approved, course.getStatus());
            verify(courseRepository).save(course);
        }
    }

    // ========================================================================
    // getStudentsByCourse
    // ========================================================================
    @Nested
    @DisplayName("getStudentsByCourse")
    class GetStudentsByCourseTests {

        /**
         * Test case: Course không tồn tại -> COURSE_NOT_FOUND
         */
        @Test
        @DisplayName("Course không tồn tại -> COURSE_NOT_FOUND")
        void courseNotFound_shouldThrow() {
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.getStudentsByCourse(1L, 1L)
            );
            assertEquals(ErrorCode.COURSE_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
            when(tutorRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.getStudentsByCourse(1L, 1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Tutor không phải owner course -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Không phải owner -> UNAUTHORIZED")
        void notOwner_shouldThrowUnauthorized() {
            Tutor owner = buildTutor(1L, TutorStatus.APPROVED);
            Tutor other = buildTutor(2L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, owner, CourseStatus.Approved);

            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
            when(tutorRepository.findById(2L)).thenReturn(Optional.of(other));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.getStudentsByCourse(1L, 2L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * Test case: Happy path – Tutor là owner, course tồn tại,
         * enrollmentRepository trả về list 1 Enrollment => map sang response
         */
        @Test
        @DisplayName("Happy path – trả list students")
        void happyPath_shouldReturnStudents() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
            when(tutorRepository.findById(1L)).thenReturn(Optional.of(tutor));

            User u = new User();
            u.setUserID(100L);
            u.setFullName("Student");
            u.setEmail("stu@x.com");
            u.setPhone("0123");
            u.setCountry("VN");

            Enrollment e = new Enrollment();
            e.setUser(u);
            e.setCreatedAt(LocalDateTime.now().minusDays(2));

            when(enrollmentRepository.findAllByCourseId(1L))
                    .thenReturn(List.of(e));

            List<TutorCourseStudentResponse> res =
                    tutorCourseService.getStudentsByCourse(1L, 1L);

            assertEquals(1, res.size());
            assertEquals("Student", res.get(0).getFullName());
        }
    }

    // ========================================================================
    // getMyCourseDetail
    // ========================================================================
    @Nested
    @DisplayName("getMyCourseDetail")
    class GetMyCourseDetailTests {

        /**
         * Test case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("a@b.com"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.getMyCourseDetail("a@b.com", 1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Course không tồn tại -> COURSE_NOT_FOUND
         */
        @Test
        @DisplayName("Course không tồn tại -> COURSE_NOT_FOUND")
        void courseNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.getMyCourseDetail("a@b.com", 1L)
            );
            assertEquals(ErrorCode.COURSE_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Tutor không phải owner -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Không phải owner -> UNAUTHORIZED")
        void notOwner_shouldThrowUnauthorized() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Tutor owner = buildTutor(2L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, owner, CourseStatus.Approved);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.getMyCourseDetail("a@b.com", 1L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * Test case: Happy path – Tutor là owner, course tồn tại
         * -> trả TutorCourseDetailResponse
         */
        @Test
        @DisplayName("Happy path – trả TutorCourseDetailResponse")
        void happyPath_shouldReturnDetail() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

            TutorCourseDetailResponse res =
                    tutorCourseService.getMyCourseDetail("a@b.com", 1L);

            assertEquals(1L, res.getId());
            assertEquals("Course 1", res.getTitle());
        }
    }

    // ========================================================================
    // submitCourseForReview
    // ========================================================================
    @Nested
    @DisplayName("submitCourseForReview")
    class SubmitCourseForReviewTests {

        /**
         * [UTCID01]
         * Test case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND (UTCID01)")
        void tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("a@b.com"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.submitCourseForReview("a@b.com", 1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * [UTCID02]
         * Test case: Course không tồn tại -> COURSE_NOT_FOUND
         */
        @Test
        @DisplayName("Course không tồn tại -> COURSE_NOT_FOUND (UTCID02)")
        void courseNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.submitCourseForReview("a@b.com", 1L)
            );
            assertEquals(ErrorCode.COURSE_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * [UTCID03]
         * Test case: Tutor không phải owner -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Không phải owner -> UNAUTHORIZED (UTCID03)")
        void notOwner_shouldThrowUnauthorized() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Tutor owner = buildTutor(2L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, owner, CourseStatus.Draft);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.submitCourseForReview("a@b.com", 1L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * [UTCID04]
         * Test case: Course status = Approved -> CAN_NOT_CHANGE_STATUS
         */
        @Test
        @DisplayName("Course status=Approved -> CAN_NOT_CHANGE_STATUS (UTCID04)")
        void approvedCourse_shouldThrowCannotChangeStatus() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.submitCourseForReview("a@b.com", 1L)
            );
            assertEquals(ErrorCode.CAN_NOT_CHANGE_STATUS, ex.getErrorcode());
        }

        /**
         * [UTCID05]
         * Test case: Course status = Pending -> gọi lại API nhưng giữ nguyên,
         * không đổi trạng thái, không save
         */
        @Test
        @DisplayName("Course status=Pending -> return luôn, không đổi (UTCID05)")
        void pendingCourse_shouldReturnWithoutChange() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Pending);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
            when(tutorCourseMapper.toTutorCourseResponse(course))
                    .thenReturn(TutorCourseResponse.builder().id(1L).status("Pending").build());

            TutorCourseResponse res =
                    tutorCourseService.submitCourseForReview("a@b.com", 1L);

            assertEquals("Pending", res.getStatus());
            verify(courseRepository, never()).save(course);
        }

        /**
         * [UTCID06]
         * Test case: Course status = Draft -> chuyển sang Pending
         */
        @Test
        @DisplayName("Course status=Draft -> chuyển sang Pending (UTCID06)")
        void draftCourse_shouldBecomePending() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(10L, tutor, CourseStatus.Draft);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
            when(tutorCourseMapper.toTutorCourseResponse(course))
                    .thenReturn(TutorCourseResponse.builder().id(10L).status("Pending").build());

            TutorCourseResponse res =
                    tutorCourseService.submitCourseForReview("a@b.com", 10L);

            assertEquals("Pending", res.getStatus());
            assertEquals(CourseStatus.Pending, course.getStatus());
            verify(courseRepository).save(course);
        }

        /**
         * [UTCID07]
         * Test case: Course status = Disabled -> INVALID_STATE
         */
        @Test
        @DisplayName("Course status=Disabled -> INVALID_STATE (UTCID07)")
        void disabledCourse_shouldThrowInvalidState() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(8L, tutor, CourseStatus.Disabled);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(8L)).thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.submitCourseForReview("a@b.com", 8L)
            );
            assertEquals(ErrorCode.INVALID_STATE, ex.getErrorcode());
        }

        /**
         * [UTCID08 - Boundary]
         * Test case: Course status = Rejected -> chuyển sang Pending
         */
        @Test
        @DisplayName("Course status=Rejected -> chuyển sang Pending (UTCID08)")
        void rejectedCourse_shouldBecomePending() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(5L, tutor, CourseStatus.Rejected);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(5L)).thenReturn(Optional.of(course));
            when(tutorCourseMapper.toTutorCourseResponse(course))
                    .thenReturn(TutorCourseResponse.builder().id(5L).status("Pending").build());

            TutorCourseResponse res =
                    tutorCourseService.submitCourseForReview("a@b.com", 5L);

            assertEquals("Pending", res.getStatus());
            assertEquals(CourseStatus.Pending, course.getStatus());
            verify(courseRepository).save(course);
        }
    }

    // ========================================================================
    // startEditCourseDraft
    // ========================================================================
    @Nested
    @DisplayName("startEditCourseDraft")
    class StartEditCourseDraftTests {

        /**
         * Test case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.startEditCourseDraft("a@b.com", 1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Course không tồn tại -> COURSE_NOT_FOUND
         */
        @Test
        @DisplayName("Course không tồn tại -> COURSE_NOT_FOUND")
        void courseNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.startEditCourseDraft("a@b.com", 1L)
            );
            assertEquals(ErrorCode.COURSE_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Course không ở trạng thái Approved
         * -> CAN_ONLY_EDIT_DRAFT_FOR_APPROVED_COURSE
         */
        @Test
        @DisplayName("Course không Approved -> CAN_ONLY_EDIT_DRAFT_FOR_APPROVED_COURSE")
        void notApprovedCourse_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Draft);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.startEditCourseDraft("a@b.com", 1L)
            );
            assertEquals(ErrorCode.CAN_ONLY_EDIT_DRAFT_FOR_APPROVED_COURSE, ex.getErrorcode());
        }

        /**
         * Test case: Đã tồn tại CourseDraft với status EDITING / PENDING_REVIEW
         * -> dùng lại draft đó, không tạo mới
         */
        @Test
        @DisplayName("Đã tồn tại draft EDITING/PENDING_REVIEW -> dùng lại draft đó")
        void existingDraft_shouldReuse() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, tutor, course, CourseDraftStatus.EDITING);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
            when(courseDraftRepository.findByCourse_CourseIDAndStatusIn(
                    eq(1L), anyList()))
                    .thenReturn(Optional.of(draft));

            TutorCourseDetailResponse res =
                    tutorCourseService.startEditCourseDraft("a@b.com", 1L);

            assertEquals(10L, res.getId());
            assertEquals("Draft 10", res.getTitle());
            verify(courseDraftRepository, never()).save(any());
        }

        /**
         * Test case: Không có draft nào -> tạo draft mới từ course Approved
         * (Ở đây mock đơn giản, không clone section/objective để tránh phức tạp)
         */
        @Test
        @DisplayName("Không có draft -> tạo draft mới từ course Approved")
        void noDraft_shouldCreateNewDraft() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            course.setSections(null);
            course.setObjectives(null);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
            when(courseDraftRepository.findByCourse_CourseIDAndStatusIn(eq(1L), anyList()))
                    .thenReturn(Optional.empty());

            when(courseDraftRepository.save(any(CourseDraft.class)))
                    .thenAnswer(invocation -> {
                        CourseDraft d = invocation.getArgument(0);
                        d.setDraftID(20L);
                        return d;
                    });

            TutorCourseDetailResponse res =
                    tutorCourseService.startEditCourseDraft("a@b.com", 1L);

            assertEquals(20L, res.getId());
            assertEquals("Course 1", res.getTitle());
            verify(courseDraftRepository).save(any(CourseDraft.class));
        }
    }

    // ========================================================================
    // getMyCourseDraftDetail
    // ========================================================================
    @Nested
    @DisplayName("getMyCourseDraftDetail")
    class GetMyCourseDraftDetailTests {

        /**
         * Test case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.getMyCourseDraftDetail("a@b.com", 10L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Draft không tồn tại -> DRAFT_NOT_FOUND
         */
        @Test
        @DisplayName("Draft không tồn tại -> DRAFT_NOT_FOUND")
        void draftNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.getMyCourseDraftDetail("a@b.com", 10L)
            );
            assertEquals(ErrorCode.DRAFT_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Tutor không phải owner draft -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Không phải owner draft -> UNAUTHORIZED")
        void notOwner_shouldThrowUnauthorized() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Tutor owner = buildTutor(2L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, owner, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, owner, course, CourseDraftStatus.EDITING);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.of(draft));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.getMyCourseDraftDetail("a@b.com", 10L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * Test case: Happy path – Tutor là owner draft, draft tồn tại
         */
        @Test
        @DisplayName("Happy path – trả detail draft")
        void happyPath_shouldReturnDetail() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, tutor, course, CourseDraftStatus.EDITING);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.of(draft));

            TutorCourseDetailResponse res =
                    tutorCourseService.getMyCourseDraftDetail("a@b.com", 10L);

            assertEquals(10L, res.getId());
            assertEquals("Draft 10", res.getTitle());
        }
    }

    // ========================================================================
    // updateCourseDraftInfo
    // ========================================================================
    @Nested
    @DisplayName("updateCourseDraftInfo")
    class UpdateCourseDraftInfoTests {

        /**
         * Test case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.updateCourseDraftInfo("a@b.com", 10L, buildCourseRequest())
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Draft không tồn tại -> DRAFT_NOT_FOUND
         */
        @Test
        @DisplayName("Draft không tồn tại -> DRAFT_NOT_FOUND")
        void draftNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.updateCourseDraftInfo("a@b.com", 10L, buildCourseRequest())
            );
            assertEquals(ErrorCode.DRAFT_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Tutor không phải owner draft -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Không phải owner -> UNAUTHORIZED")
        void notOwner_shouldThrowUnauthorized() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Tutor owner = buildTutor(2L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, owner, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, owner, course, CourseDraftStatus.EDITING);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.of(draft));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.updateCourseDraftInfo("a@b.com", 10L, buildCourseRequest())
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * Test case: Draft status != EDITING (ví dụ PENDING_REVIEW) -> INVALID_STATE
         */
        @Test
        @DisplayName("Draft status != EDITING -> INVALID_STATE")
        void draftNotEditing_shouldThrowInvalidState() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, tutor, course, CourseDraftStatus.PENDING_REVIEW);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.of(draft));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.updateCourseDraftInfo("a@b.com", 10L, buildCourseRequest())
            );
            assertEquals(ErrorCode.INVALID_STATE, ex.getErrorcode());
        }

        /**
         * Test case: Category mới không tồn tại -> COURSE_CATEGORY_NOT_FOUND
         */
        @Test
        @DisplayName("Category không tồn tại -> COURSE_CATEGORY_NOT_FOUND")
        void categoryNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, tutor, course, CourseDraftStatus.EDITING);
            CourseCategory category = new CourseCategory();
            category.setCategoryID(1L);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.of(draft));
            when(courseCategoryRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.updateCourseDraftInfo("a@b.com", 10L, buildCourseRequest())
            );
            assertEquals(ErrorCode.COURSE_CATEGORY_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Happy path – Draft EDITING, category tồn tại
         * -> update metadata (title, description, ...) và trả detail
         */
        @Test
        @DisplayName("Happy path – update metadata draft")
        void happyPath_shouldUpdateDraft() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, tutor, course, CourseDraftStatus.EDITING);
            CourseCategory category = new CourseCategory();
            category.setCategoryID(1L);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.of(draft));
            when(courseCategoryRepository.findById(1L)).thenReturn(Optional.of(category));

            TutorCourseRequest req = buildCourseRequest();
            req.setTitle("Updated Draft");

            TutorCourseDetailResponse res =
                    tutorCourseService.updateCourseDraftInfo("a@b.com", 10L, req);

            assertEquals("Updated Draft", res.getTitle());
            assertEquals(10L, res.getId());
        }
    }

    // ========================================================================
    // submitCourseDraftForReview
    // ========================================================================
    @Nested
    @DisplayName("submitCourseDraftForReview")
    class SubmitCourseDraftForReviewTests {

        /**
         * Test case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.submitCourseDraftForReview("a@b.com", 10L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Draft không tồn tại -> DRAFT_NOT_FOUND
         */
        @Test
        @DisplayName("Draft không tồn tại -> DRAFT_NOT_FOUND")
        void draftNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.submitCourseDraftForReview("a@b.com", 10L)
            );
            assertEquals(ErrorCode.DRAFT_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Tutor không phải owner draft -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Không phải owner -> UNAUTHORIZED")
        void notOwner_shouldThrowUnauthorized() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Tutor owner = buildTutor(2L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, owner, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, owner, course, CourseDraftStatus.EDITING);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.of(draft));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.submitCourseDraftForReview("a@b.com", 10L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * Test case: Draft đã ở trạng thái PENDING_REVIEW
         * -> gọi lại API nhưng giữ nguyên, không đổi trạng thái
         */
        @Test
        @DisplayName("Draft đã PENDING_REVIEW -> trả về luôn, không đổi")
        void pendingDraft_shouldReturnWithoutChange() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, tutor, course, CourseDraftStatus.PENDING_REVIEW);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.of(draft));

            TutorCourseDetailResponse res =
                    tutorCourseService.submitCourseDraftForReview("a@b.com", 10L);

            assertEquals("Draft 10", res.getTitle());
            assertEquals("PENDING_REVIEW", res.getStatus());
        }

        /**
         * Test case: Draft status = EDITING / REJECTED
         * -> chuyển sang PENDING_REVIEW, update updatedAt
         */
        @Test
        @DisplayName("Draft EDITING/REJECTED -> set PENDING_REVIEW")
        void editingOrRejectedDraft_shouldBecomePendingReview() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, tutor, course, CourseDraftStatus.EDITING);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.of(draft));

            TutorCourseDetailResponse res =
                    tutorCourseService.submitCourseDraftForReview("a@b.com", 10L);

            assertEquals("PENDING_REVIEW", res.getStatus());
            assertEquals(CourseDraftStatus.PENDING_REVIEW, draft.getStatus());
        }
    }

    // ========================================================================
    // deleteCourseDraftForCurrentTutor
    // ========================================================================
    @Nested
    @DisplayName("deleteCourseDraftForCurrentTutor")
    class DeleteCourseDraftForCurrentTutorTests {

        /**
         * Test case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.deleteCourseDraftForCurrentTutor("a@b.com", 10L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Draft không tồn tại -> DRAFT_NOT_FOUND
         */
        @Test
        @DisplayName("Draft không tồn tại -> DRAFT_NOT_FOUND")
        void draftNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.deleteCourseDraftForCurrentTutor("a@b.com", 10L)
            );
            assertEquals(ErrorCode.DRAFT_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * Test case: Tutor không phải owner draft -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Không phải owner -> UNAUTHORIZED")
        void notOwner_shouldThrowUnauthorized() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Tutor owner = buildTutor(2L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, owner, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, owner, course, CourseDraftStatus.EDITING);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.of(draft));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.deleteCourseDraftForCurrentTutor("a@b.com", 10L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * Test case: Draft status != EDITING -> INVALID_STATE
         */
        @Test
        @DisplayName("Draft status != EDITING -> INVALID_STATE")
        void draftNotEditing_shouldThrowInvalidState() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, tutor, course, CourseDraftStatus.PENDING_REVIEW);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.of(draft));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorCourseService.deleteCourseDraftForCurrentTutor("a@b.com", 10L)
            );
            assertEquals(ErrorCode.INVALID_STATE, ex.getErrorcode());
        }

        /**
         * Test case: Happy path – Draft status = EDITING
         * -> delete draft
         */
        @Test
        @DisplayName("Happy path – status EDITING -> delete draft")
        void happyPath_shouldDeleteDraft() {
            Tutor tutor = buildTutor(1L, TutorStatus.APPROVED);
            Course course = buildCourse(1L, tutor, CourseStatus.Approved);
            CourseDraft draft = buildCourseDraft(10L, tutor, course, CourseDraftStatus.EDITING);

            when(tutorRepository.findByUser_Email("a@b.com")).thenReturn(Optional.of(tutor));
            when(courseDraftRepository.findById(10L)).thenReturn(Optional.of(draft));

            tutorCourseService.deleteCourseDraftForCurrentTutor("a@b.com", 10L);

            verify(courseDraftRepository).delete(draft);
        }
    }
}
