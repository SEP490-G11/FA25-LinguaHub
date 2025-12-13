package edu.lms.service;

import edu.lms.dto.response.CourseDetailResponse;
import edu.lms.dto.response.CourseResponse;
import edu.lms.entity.*;
import edu.lms.enums.CourseLevel;
import edu.lms.enums.CourseStatus;
import edu.lms.enums.EnrollmentStatus;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Unit test cho CourseService:
 *  - getAllApproved
 *  - getApprovedByTutor
 *  - getCourseById
 *  - getAllByStatus
 *
 * Dùng @MockitoSettings(strictness = LENIENT) để tránh UnnecessaryStubbingException
 * do một số stub dùng gián tiếp trong các mapper bên trong service.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@FieldDefaults(level = AccessLevel.PRIVATE)
class CourseServiceTest {

    @Mock
    CourseRepository courseRepository;
    @Mock
    TutorRepository tutorRepository;
    @Mock
    WishlistRepository wishlistRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    EnrollmentRepository enrollmentRepository;
    @Mock
    CourseReviewRepository courseReviewRepository;

    @InjectMocks
    CourseService courseService;

    // ============================================================
    // Helpers dựng data
    // ============================================================

    private User buildUser(Long id, String email, String fullName) {
        User u = new User();
        u.setUserID(id);
        u.setEmail(email);
        u.setFullName(fullName);
        u.setAvatarURL("avatar-" + id + ".png");
        u.setAddress("Hanoi");
        u.setCountry("Vietnam");
        return u;
    }

    private Tutor buildTutor(Long tutorId, User user) {
        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setUser(user);
        return t;
    }

    private Course buildCourse(Long id, Tutor tutor, CourseStatus status) {
        Course c = new Course();
        c.setCourseID(id);
        c.setTitle("Course " + id);
        c.setShortDescription("Short " + id);
        c.setDescription("Desc " + id);
        c.setRequirement("Req " + id);
        c.setLevel(CourseLevel.BEGINNER);
        c.setDuration(120);
        c.setPrice(BigDecimal.valueOf(100_000));
        c.setLanguage("English");
        c.setThumbnailURL("thumb-" + id + ".png");
        c.setStatus(status);
        c.setTutor(tutor);
        c.setCreatedAt(LocalDateTime.now().minusDays(1));

        CourseCategory category = new CourseCategory();
        category.setName("Category " + id);
        c.setCategory(category);

        return c;
    }

    private Enrollment buildEnrollment(User user, Course course, EnrollmentStatus status) {
        Enrollment e = new Enrollment();
        e.setUser(user);
        e.setCourse(course);
        e.setStatus(status);
        return e;
    }

    private CourseReview buildReview(Long id, Course course, User user, double rating) {
        CourseReview r = new CourseReview();
        r.setReviewID(id);
        r.setCourse(course);
        r.setUser(user);
        r.setRating(rating); // Double -> truyền double
        r.setComment("Good");
        r.setCreatedAt(LocalDateTime.now().minusDays(2));
        return r;
    }

    // ============================================================
    // getAllApproved(String email)
    // ============================================================

    @Nested
    @DisplayName("CourseService.getAllApproved")
    class GetAllApprovedTests {

        @Test
        @DisplayName("Guest (anonymousUser) -> trả về list các khóa Approved, không wishlist/purchased")
        void getAllApproved_anonymousUser_shouldReturnCoursesWithoutWishlistOrPurchased() {
            // Arrange
            User tutorUser = buildUser(10L, "tutor@mail.com", "Tutor Name");
            Tutor tutor = buildTutor(1L, tutorUser);

            Course c1 = buildCourse(1L, tutor, CourseStatus.Approved);
            Course c2 = buildCourse(2L, tutor, CourseStatus.Approved);

            when(courseRepository.findByStatus(CourseStatus.Approved))
                    .thenReturn(List.of(c1, c2));
            when(enrollmentRepository.countByCourse_CourseID(anyLong()))
                    .thenReturn(0L);
            when(courseReviewRepository.findByCourse_CourseID(anyLong()))
                    .thenReturn(List.of());

            // Act
            List<CourseResponse> result =
                    courseService.getAllApproved("anonymousUser");

            // Assert
            assertEquals(2, result.size());
            CourseResponse r1 = result.get(0);
            CourseResponse r2 = result.get(1);

            assertEquals(1L, r1.getId());
            assertEquals(2L, r2.getId());

            // Guest => isWishListed = null, isPurchased = false
            assertNull(r1.getIsWishListed());
            assertNull(r2.getIsWishListed());
            assertFalse(r1.getIsPurchased());
            assertFalse(r2.getIsPurchased());
        }

        @Test
        @DisplayName("User login -> set đúng isWishListed & isPurchased")
        void getAllApproved_loggedInUser_shouldSetWishlistAndPurchased() {
            // Arrange
            User user = buildUser(100L, "user@mail.com", "User Name");
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            User tutorUser = buildUser(10L, "tutor@mail.com", "Tutor Name");
            Tutor tutor = buildTutor(1L, tutorUser);

            Course c1 = buildCourse(1L, tutor, CourseStatus.Approved);
            Course c2 = buildCourse(2L, tutor, CourseStatus.Approved);

            when(courseRepository.findByStatus(CourseStatus.Approved))
                    .thenReturn(List.of(c1, c2));

            // Wishlist
            when(wishlistRepository.existsByUserAndCourse(user, c1)).thenReturn(true);
            when(wishlistRepository.existsByUserAndCourse(user, c2)).thenReturn(false);

            // Enrollment: user đã mua course1, chưa mua course2
            Enrollment e1 = buildEnrollment(user, c1, EnrollmentStatus.Active);
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(
                    user.getUserID(), c1.getCourseID()))
                    .thenReturn(Optional.of(e1));
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(
                    user.getUserID(), c2.getCourseID()))
                    .thenReturn(Optional.empty());

            when(enrollmentRepository.countByCourse_CourseID(anyLong()))
                    .thenReturn(10L);
            when(courseReviewRepository.findByCourse_CourseID(anyLong()))
                    .thenReturn(List.of());

            // Act
            List<CourseResponse> result =
                    courseService.getAllApproved("user@mail.com");

            // Assert
            assertEquals(2, result.size());
            CourseResponse r1 = result.get(0);
            CourseResponse r2 = result.get(1);

            assertTrue(r1.getIsWishListed());
            assertTrue(r1.getIsPurchased());

            assertFalse(r2.getIsWishListed());
            assertFalse(r2.getIsPurchased());
        }
    }

    // ============================================================
    // getApprovedByTutor(Long tutorId, String email)
    // ============================================================

    @Nested
    @DisplayName("CourseService.getApprovedByTutor")
    class GetApprovedByTutorTests {

        /**
         * UTCID01:
         *  - tutorId không tồn tại
         *  - Kỳ vọng: ném AppException(TUTOR_NOT_FOUND)
         *  - Lưu ý: hiện AppException không expose ErrorCode/message -> chỉ assertThrows
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND (AppException)")
        void getApprovedByTutor_tutorNotFound_shouldThrow() {
            when(tutorRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> courseService.getApprovedByTutor(1L, "any@mail.com")
            );
            assertNotNull(ex); // TODO: sau này có getErrorCode() thì assert cụ thể hơn
        }

        @Test
        @DisplayName("Tutor tồn tại, guest -> trả về list khóa Approved, không wishlist/purchased")
        void getApprovedByTutor_guest_shouldReturnCoursesWithoutWishlistOrPurchased() {
            // Arrange
            User tutorUser = buildUser(10L, "tutor@mail.com", "Tutor Name");
            Tutor tutor = buildTutor(2L, tutorUser);

            when(tutorRepository.findById(2L))
                    .thenReturn(Optional.of(tutor));

            Course c1 = buildCourse(1L, tutor, CourseStatus.Approved);
            Course c2 = buildCourse(2L, tutor, CourseStatus.Approved);

            when(courseRepository.findByTutorAndStatus(tutor, CourseStatus.Approved))
                    .thenReturn(List.of(c1, c2));

            when(enrollmentRepository.countByCourse_CourseID(anyLong()))
                    .thenReturn(0L);
            when(courseReviewRepository.findByCourse_CourseID(anyLong()))
                    .thenReturn(List.of());

            // Act
            List<CourseResponse> result =
                    courseService.getApprovedByTutor(2L, null);

            // Assert
            assertEquals(2, result.size());
            CourseResponse r1 = result.get(0);
            CourseResponse r2 = result.get(1);

            assertEquals("Tutor Name", r1.getTutorName());
            assertEquals("Tutor Name", r2.getTutorName());

            assertNull(r1.getIsWishListed());
            assertFalse(r1.getIsPurchased());
        }

        @Test
        @DisplayName("Tutor tồn tại, user login -> set đúng wishlist & purchased")
        void getApprovedByTutor_loggedInUser_shouldSetWishlistAndPurchased() {
            // Arrange
            User tutorUser = buildUser(10L, "tutor@mail.com", "Tutor Name");
            Tutor tutor = buildTutor(2L, tutorUser);

            when(tutorRepository.findById(2L))
                    .thenReturn(Optional.of(tutor));

            User user = buildUser(100L, "user@mail.com", "User Name");
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Course c1 = buildCourse(1L, tutor, CourseStatus.Approved);
            Course c2 = buildCourse(2L, tutor, CourseStatus.Approved);

            when(courseRepository.findByTutorAndStatus(tutor, CourseStatus.Approved))
                    .thenReturn(List.of(c1, c2));

            // Wishlist
            when(wishlistRepository.existsByUserAndCourse(user, c1)).thenReturn(true);
            when(wishlistRepository.existsByUserAndCourse(user, c2)).thenReturn(false);

            // Enrollment
            Enrollment e1 = buildEnrollment(user, c1, EnrollmentStatus.Completed);
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(
                    user.getUserID(), c1.getCourseID()))
                    .thenReturn(Optional.of(e1));
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(
                    user.getUserID(), c2.getCourseID()))
                    .thenReturn(Optional.empty());

            when(enrollmentRepository.countByCourse_CourseID(anyLong()))
                    .thenReturn(5L);
            when(courseReviewRepository.findByCourse_CourseID(anyLong()))
                    .thenReturn(List.of());

            // Act
            List<CourseResponse> result =
                    courseService.getApprovedByTutor(2L, "user@mail.com");

            // Assert
            assertEquals(2, result.size());
            CourseResponse r1 = result.get(0);
            CourseResponse r2 = result.get(1);

            assertTrue(r1.getIsWishListed());
            assertTrue(r1.getIsPurchased());

            assertFalse(r2.getIsWishListed());
            assertFalse(r2.getIsPurchased());
        }
    }

    // ============================================================
    // getCourseById(Long courseID, String email)
    // ============================================================

    @Nested
    @DisplayName("CourseService.getCourseById")
    class GetCourseByIdTests {

        /**
         * UTCID01:
         *  - Course ID không tồn tại
         *  - Kỳ vọng: AppException(COURSE_NOT_FOUND)
         *  - Hiện tại không check message vì AppException.getMessage() = null
         */
        @Test
        @DisplayName("Course không tồn tại -> COURSE_NOT_FOUND (AppException)")
        void getCourseById_courseNotFound_shouldThrow() {
            when(courseRepository.findById(1L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> courseService.getCourseById(1L, "user@mail.com")
            );
            assertNotNull(ex);
        }

        /**
         * UTCID04:
         *  - Course tồn tại nhưng status != Approved (Pending/Draft)
         *  - Kỳ vọng: AppException(COURSE_NOT_APPROVED)
         */
        @Test
        @DisplayName("Course tồn tại nhưng chưa Approved -> COURSE_NOT_APPROVED (AppException)")
        void getCourseById_courseNotApproved_shouldThrow() {
            User tutorUser = buildUser(10L, "tutor@mail.com", "Tutor Name");
            Tutor tutor = buildTutor(2L, tutorUser);
            Course course = buildCourse(2L, tutor, CourseStatus.Pending);

            when(courseRepository.findById(2L))
                    .thenReturn(Optional.of(course));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> courseService.getCourseById(2L, null)
            );
            assertNotNull(ex);
        }

        /**
         * UTCID02:
         *  - Course tồn tại, status = Approved, user guest
         *  - Kỳ vọng:
         *      + trả về detail với status="Approved"
         *      + isWishListed = null, isPurchased = false
         */
        @Test
        @DisplayName("Course Approved, guest -> xem được detail, không wishlist/purchased")
        void getCourseById_approvedGuest_shouldReturnDetail() {
            // Arrange
            User tutorUser = buildUser(10L, "tutor@mail.com", "Tutor Name");
            Tutor tutor = buildTutor(2L, tutorUser);
            Course course = buildCourse(2L, tutor, CourseStatus.Approved);

            when(courseRepository.findById(2L))
                    .thenReturn(Optional.of(course));

            when(enrollmentRepository.countByCourse_CourseID(2L))
                    .thenReturn(3L);
            when(courseReviewRepository.findByCourse_CourseID(2L))
                    .thenReturn(List.of());

            // Act
            CourseDetailResponse result =
                    courseService.getCourseById(2L, null);

            // Assert
            assertEquals(2L, result.getId());
            assertEquals("Course 2", result.getTitle());
            assertEquals("Approved", result.getStatus());
            assertEquals(3L, result.getLearnerCount());

            assertNull(result.getIsWishListed());
            assertFalse(result.getIsPurchased());
        }

        /**
         * UTCID03:
         *  - Course Approved, user login và đã mua course
         *  - Kỳ vọng:
         *      + isWishListed = true (nếu nằm trong wishlist)
         *      + isPurchased = true
         *      + rating avg/total lấy từ CourseReviewRepository
         */
        @Test
        @DisplayName("Course Approved, user đã mua -> isPurchased = true, có rating")
        void getCourseById_approvedUserPurchased_shouldReturnDetailWithPurchasedAndRating() {
            // Arrange
            User tutorUser = buildUser(10L, "tutor@mail.com", "Tutor Name");
            Tutor tutor = buildTutor(2L, tutorUser);
            Course course = buildCourse(2L, tutor, CourseStatus.Approved);

            when(courseRepository.findById(2L))
                    .thenReturn(Optional.of(course));

            User user = buildUser(100L, "user@mail.com", "User Name");
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            when(wishlistRepository.existsByUserAndCourse(user, course))
                    .thenReturn(true);

            Enrollment enrollment =
                    buildEnrollment(user, course, EnrollmentStatus.Completed);
            when(enrollmentRepository.findByUser_UserIDAndCourse_CourseID(
                    user.getUserID(), course.getCourseID()))
                    .thenReturn(Optional.of(enrollment));

            when(enrollmentRepository.countByCourse_CourseID(course.getCourseID()))
                    .thenReturn(10L);

            CourseReview r1 = buildReview(1L, course, user, 5.0);
            CourseReview r2 = buildReview(2L, course, user, 4.0);
            when(courseReviewRepository.findByCourse_CourseID(course.getCourseID()))
                    .thenReturn(List.of(r1, r2));

            // Act
            CourseDetailResponse result =
                    courseService.getCourseById(2L, "user@mail.com");

            // Assert
            assertEquals(2L, result.getId());
            assertTrue(result.getIsWishListed());
            assertTrue(result.getIsPurchased());
            assertEquals(10L, result.getLearnerCount());
            assertEquals(4.5, result.getAvgRating());
            assertEquals(2, result.getTotalRatings());
        }
    }

    // ============================================================
    // getAllByStatus(CourseStatus status)
    // ============================================================

    @Nested
    @DisplayName("CourseService.getAllByStatus")
    class GetAllByStatusTests {

        @Test
        @DisplayName("status = null -> dùng findAll()")
        void getAllByStatus_null_shouldUseFindAll() {
            User tutorUser = buildUser(10L, "tutor@mail.com", "Tutor Name");
            Tutor tutor = buildTutor(2L, tutorUser);

            Course c1 = buildCourse(1L, tutor, CourseStatus.Approved);
            Course c2 = buildCourse(2L, tutor, CourseStatus.Pending);

            when(courseRepository.findAll()).thenReturn(List.of(c1, c2));
            when(enrollmentRepository.countByCourse_CourseID(anyLong()))
                    .thenReturn(0L);
            when(courseReviewRepository.findByCourse_CourseID(anyLong()))
                    .thenReturn(List.of());

            var result = courseService.getAllByStatus(null);

            assertEquals(2, result.size());
            verify(courseRepository, times(1)).findAll();
            verify(courseRepository, never()).findByStatus(any());
        }

        @Test
        @DisplayName("status cụ thể -> dùng findByStatus()")
        void getAllByStatus_specific_shouldUseFindByStatus() {
            User tutorUser = buildUser(10L, "tutor@mail.com", "Tutor Name");
            Tutor tutor = buildTutor(2L, tutorUser);

            Course c1 = buildCourse(1L, tutor, CourseStatus.Approved);

            when(courseRepository.findByStatus(CourseStatus.Approved))
                    .thenReturn(List.of(c1));
            when(enrollmentRepository.countByCourse_CourseID(anyLong()))
                    .thenReturn(0L);
            when(courseReviewRepository.findByCourse_CourseID(anyLong()))
                    .thenReturn(List.of());

            var result = courseService.getAllByStatus(CourseStatus.Approved);

            assertEquals(1, result.size());
            assertEquals("Approved", result.get(0).getStatus());

            verify(courseRepository, times(1))
                    .findByStatus(CourseStatus.Approved);
            verify(courseRepository, never()).findAll();
        }
    }
}
