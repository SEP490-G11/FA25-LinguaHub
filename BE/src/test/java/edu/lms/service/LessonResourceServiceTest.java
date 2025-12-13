package edu.lms.service;

import edu.lms.dto.request.LessonResourceRequest;
import edu.lms.dto.response.LessonResourceResponse;
import edu.lms.entity.*;
import edu.lms.enums.ResourceType;
import edu.lms.exception.ResourceNotFoundException;
import edu.lms.repository.LessonRepository;
import edu.lms.repository.LessonResourceRepository;
import edu.lms.repository.TutorRepository;
import edu.lms.repository.UserRepository;
import edu.lms.security.UserPrincipal;
import jakarta.validation.ValidationException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho LessonResourceServiceImpl
 * Cover đủ 4 method:
 *  - addResource (9 case – map với UTCID01–UTCID09)
 *  - getResourcesByLesson (6 case – UTCID01–UTCID06)
 *  - updateResource (11 case – UTCID01–UTCID11)
 *  - deleteResource (10 case – UTCID01–UTCID10)
 *
 * Lưu ý:
 *  - Không dựa vào validation @NotNull/@Pattern của DTO (vì test service tầng trong),
 *    nên vẫn test được các case resourceTitle/resourceURL = null, invalid.
 *  - getCurrentTutorId() đọc từ SecurityContextHolder,
 *    nên trong mỗi test cần setup Authentication + User + Tutor tương ứng.
 */
@ExtendWith(MockitoExtension.class)
class LessonResourceServiceTest {

    @Mock
    LessonResourceRepository resourceRepository;
    @Mock
    LessonRepository lessonRepository;
    @Mock
    TutorRepository tutorRepository;
    @Mock
    UserRepository userRepository;

    @InjectMocks
    LessonResourceServiceImpl lessonResourceService;

    // =======================
    // HELPER ENTITIES
    // =======================

    /**
     * Helper: tạo Lesson có CourseSection + Course + Tutor đầy đủ,
     * đúng với kiểu setter: Lesson.setSection(CourseSection)
     */
    private Lesson buildLessonWithTutor(Long lessonId, Long tutorId) {
        // Tutor
        Tutor tutor = new Tutor();
        tutor.setTutorID(tutorId);

        // Course
        Course course = new Course();
        course.setTutor(tutor);

        // CourseSection
        CourseSection courseSection = new CourseSection();
        courseSection.setCourse(course);

        // Lesson
        Lesson lesson = new Lesson();
        lesson.setLessonID(lessonId);
        lesson.setSection(courseSection);

        return lesson;
    }

    private LessonResource buildResource(Long id, Lesson lesson) {
        LessonResource r = new LessonResource();
        r.setResourceID(id);
        r.setLesson(lesson);
        r.setResourceType(ResourceType.PDF);
        r.setResourceTitle("Old title");
        r.setResourceURL("https://old-url.com/file.pdf");
        r.setUploadedAt(LocalDateTime.now().minusDays(1));
        return r;
    }

    private void setSecurityContextWithJwt(String email, Long userId, Long tutorId) {
        // Mock Authentication + Jwt principal
        Authentication authentication = mock(Authentication.class);
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(email);
        when(authentication.getPrincipal()).thenReturn(jwt);

        // Set vào SecurityContextHolder
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // User & Tutor mapping
        User user = new User();
        user.setUserID(userId);
        user.setEmail(email);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        Tutor tutor = new Tutor();
        tutor.setTutorID(tutorId);
        tutor.setUser(user);

        when(tutorRepository.findByUser_UserID(userId)).thenReturn(Optional.of(tutor));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // =====================================================================
    // addResource – UTCID01–UTCID09
    // =====================================================================

    @Nested
    @DisplayName("LessonResourceService.addResource")
    class AddResourceTests {

        /**
         * UTCID01 – Normal
         * - Lesson tồn tại, thuộc tutor hiện tại
         * - request.resourceType = PDF
         * - resourceTitle = "My PDF"
         * - resourceURL hợp lệ "https://example.com/resource.pdf"
         * => Tạo resource thành công, trả về LessonResourceResponse đúng field.
         */
        @Test
        @DisplayName("UTCID01 - Thêm resource PDF hợp lệ, lesson thuộc tutor hiện tại")
        void UTCID01_addResource_validPdf_success() {
            Long tutorId = 100L;
            Long userId = 10L;
            String email = "tutor@mail.com";
            setSecurityContextWithJwt(email, userId, tutorId);

            Long lessonId = 1L;
            Lesson lesson = buildLessonWithTutor(lessonId, tutorId);
            when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceType(ResourceType.PDF)
                    .resourceTitle("My PDF")
                    .resourceURL("https://example.com/resource.pdf")
                    .build();

            // Khi save thì trả về đối tượng đã set id, uploadedAt
            when(resourceRepository.save(any(LessonResource.class)))
                    .thenAnswer(inv -> {
                        LessonResource r = inv.getArgument(0);
                        r.setResourceID(1L);
                        if (r.getUploadedAt() == null) {
                            r.setUploadedAt(LocalDateTime.now());
                        }
                        return r;
                    });

            LessonResourceResponse response = lessonResourceService.addResource(lessonId, request);

            assertNotNull(response);
            assertEquals(1L, response.getResourceID());
            assertEquals(ResourceType.PDF, response.getResourceType());
            assertEquals("My PDF", response.getResourceTitle());
            assertEquals("https://example.com/resource.pdf", response.getResourceURL());
        }

        /**
         * UTCID02 – Abnormal
         * - Lesson không tồn tại
         * => ResourceNotFoundException("Lesson not found")
         */
        @Test
        @DisplayName("UTCID02 - Lesson không tồn tại -> ResourceNotFoundException")
        void UTCID02_addResource_lessonNotFound_shouldThrow() {
            Long tutorId = 100L;
            Long userId = 10L;
            setSecurityContextWithJwt("tutor@mail.com", userId, tutorId);

            when(lessonRepository.findById(999L)).thenReturn(Optional.empty());

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceType(ResourceType.PDF)
                    .resourceTitle("My PDF")
                    .resourceURL("https://example.com/resource.pdf")
                    .build();

            assertThrows(ResourceNotFoundException.class,
                    () -> lessonResourceService.addResource(999L, request));
        }

        /**
         * UTCID03 – Abnormal
         * - URL = null
         * => validateURL() -> ValidationException("Invalid resource URL format")
         */
        @Test
        @DisplayName("UTCID03 - URL = null -> ValidationException")
        void UTCID03_addResource_nullUrl_shouldThrowValidationException() {
            Long tutorId = 100L;
            Long userId = 10L;
            setSecurityContextWithJwt("tutor@mail.com", userId, tutorId);

            Long lessonId = 1L;
            Lesson lesson = buildLessonWithTutor(lessonId, tutorId);
            when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceType(ResourceType.PDF)
                    .resourceTitle("My PDF")
                    .resourceURL(null)
                    .build();

            assertThrows(ValidationException.class,
                    () -> lessonResourceService.addResource(lessonId, request));
        }

        /**
         * UTCID04 – Abnormal
         * - URL không match pattern (vd: "ftp://invalid-url")
         * => ValidationException
         */
        @Test
        @DisplayName("UTCID04 - URL không đúng pattern (ftp://...) -> ValidationException")
        void UTCID04_addResource_invalidUrl_shouldThrowValidationException() {
            Long tutorId = 100L;
            Long userId = 10L;
            setSecurityContextWithJwt("tutor@mail.com", userId, tutorId);

            Long lessonId = 1L;
            Lesson lesson = buildLessonWithTutor(lessonId, tutorId);
            when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceType(ResourceType.PDF)
                    .resourceTitle("My PDF")
                    .resourceURL("ftp://invalid-url")
                    .build();

            assertThrows(ValidationException.class,
                    () -> lessonResourceService.addResource(lessonId, request));
        }

        /**
         * UTCID05 – Boundary / Normal
         * - resourceType = null -> service default là PDF
         * - URL hợp lệ
         * => Resource được tạo với resourceType = PDF (default)
         */
        @Test
        @DisplayName("UTCID05 - resourceType=null -> default PDF")
        void UTCID05_addResource_nullType_shouldDefaultToPdf() {
            Long tutorId = 100L;
            Long userId = 10L;
            setSecurityContextWithJwt("tutor@mail.com", userId, tutorId);

            Long lessonId = 1L;
            Lesson lesson = buildLessonWithTutor(lessonId, tutorId);
            when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceType(null)
                    .resourceTitle("Default type")
                    .resourceURL("https://valid.com")
                    .build();

            when(resourceRepository.save(any(LessonResource.class)))
                    .thenAnswer(inv -> {
                        LessonResource r = inv.getArgument(0);
                        r.setResourceID(2L);
                        r.setUploadedAt(LocalDateTime.now());
                        return r;
                    });

            LessonResourceResponse response = lessonResourceService.addResource(lessonId, request);

            assertEquals(ResourceType.PDF, response.getResourceType());
            assertEquals("Default type", response.getResourceTitle());
            assertEquals("https://valid.com", response.getResourceURL());
        }

        /**
         * UTCID06 – Abnormal
         * - lesson thuộc tutor khác (tutorID không bằng tutor hiện tại)
         * => AccessDeniedException("You are not allowed to add resources to this lesson")
         */
        @Test
        @DisplayName("UTCID06 - Lesson thuộc tutor khác -> AccessDeniedException")
        void UTCID06_addResource_notOwnerLesson_shouldThrowAccessDenied() {
            Long currentTutorId = 100L;
            Long userId = 10L;
            setSecurityContextWithJwt("tutor@mail.com", userId, currentTutorId);

            Long lessonId = 1L;
            Long otherTutorId = 200L;
            Lesson lesson = buildLessonWithTutor(lessonId, otherTutorId); // tutor khác
            when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceType(ResourceType.PDF)
                    .resourceTitle("My PDF")
                    .resourceURL("https://example.com/resource.pdf")
                    .build();

            assertThrows(AccessDeniedException.class,
                    () -> lessonResourceService.addResource(lessonId, request));
        }

        /**
         * UTCID07 – Abnormal
         * - Trong getCurrentTutorId, user không tồn tại trong DB
         * => AccessDeniedException("User not found with email: ...")
         */
        @Test
        @DisplayName("UTCID07 - User không tồn tại trong DB -> AccessDeniedException")
        void UTCID07_addResource_userNotFound_shouldThrowAccessDenied() {
            // Mock Authentication nhưng userRepository trả empty
            Authentication authentication = mock(Authentication.class);
            Jwt jwt = mock(Jwt.class);
            when(jwt.getSubject()).thenReturn("notfound@mail.com");
            when(authentication.getPrincipal()).thenReturn(jwt);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            when(userRepository.findByEmail("notfound@mail.com"))
                    .thenReturn(Optional.empty());

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceType(ResourceType.PDF)
                    .resourceTitle("My PDF")
                    .resourceURL("https://example.com/resource.pdf")
                    .build();

            assertThrows(AccessDeniedException.class,
                    () -> lessonResourceService.addResource(1L, request));
        }

        /**
         * UTCID08 – Abnormal
         * - Trong getCurrentTutorId, user không phải tutor
         * => AccessDeniedException("Current user is not a tutor")
         */
        @Test
        @DisplayName("UTCID08 - User không phải tutor -> AccessDeniedException")
        void UTCID08_addResource_currentUserNotTutor_shouldThrowAccessDenied() {
            Authentication authentication = mock(Authentication.class);
            Jwt jwt = mock(Jwt.class);
            when(jwt.getSubject()).thenReturn("user@mail.com");
            when(authentication.getPrincipal()).thenReturn(jwt);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = new User();
            user.setUserID(10L);
            user.setEmail("user@mail.com");
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            // tutorRepository trả empty -> không phải tutor
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.empty());

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceType(ResourceType.PDF)
                    .resourceTitle("My PDF")
                    .resourceURL("https://example.com/resource.pdf")
                    .build();

            assertThrows(AccessDeniedException.class,
                    () -> lessonResourceService.addResource(1L, request));
        }

        /**
         * UTCID09 – Boundary
         * - resourceTitle = null (bỏ qua annotation, test service)
         * - URL hợp lệ
         * => Service vẫn tạo resource với resourceTitle = null
         */
        @Test
        @DisplayName("UTCID09 - resourceTitle=null, URL hợp lệ -> tạo thành công với title=null")
        void UTCID09_addResource_nullTitle_shouldCreateWithNullTitle() {
            Long tutorId = 100L;
            Long userId = 10L;
            setSecurityContextWithJwt("tutor@mail.com", userId, tutorId);

            Long lessonId = 1L;
            Lesson lesson = buildLessonWithTutor(lessonId, tutorId);
            when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceType(ResourceType.PDF)
                    .resourceTitle(null)
                    .resourceURL("https://valid.com")
                    .build();

            when(resourceRepository.save(any(LessonResource.class)))
                    .thenAnswer(inv -> {
                        LessonResource r = inv.getArgument(0);
                        r.setResourceID(3L);
                        r.setUploadedAt(LocalDateTime.now());
                        return r;
                    });

            LessonResourceResponse response = lessonResourceService.addResource(lessonId, request);

            assertNull(response.getResourceTitle());
            assertEquals(ResourceType.PDF, response.getResourceType());
        }
    }

    // =====================================================================
    // getResourcesByLesson – UTCID01–UTCID06
    // =====================================================================

    @Nested
    @DisplayName("LessonResourceService.getResourcesByLesson")
    class GetResourcesByLessonTests {

        /**
         * UTCID01 – Normal
         * - Lesson tồn tại, thuộc tutor hiện tại
         * - Có 2 resource (1 cái field null để test mapping không lỗi)
         * => Trả List<LessonResourceResponse> size=2, đúng lessonId.
         */
        @Test
        @DisplayName("UTCID01 - Lấy danh sách resource hợp lệ theo lessonId")
        void UTCID01_getResourcesByLesson_valid_shouldReturnList() {
            Long tutorId = 100L;
            Long userId = 10L;
            setSecurityContextWithJwt("tutor@mail.com", userId, tutorId);

            Long lessonId = 1L;
            Lesson lesson = buildLessonWithTutor(lessonId, tutorId);
            when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));

            LessonResource r1 = buildResource(1L, lesson);
            LessonResource r2 = buildResource(2L, lesson);
            r2.setResourceTitle(null); // field null để test mapping

            when(resourceRepository.findByLessonLessonID(lessonId))
                    .thenReturn(List.of(r1, r2));

            List<LessonResourceResponse> responses =
                    lessonResourceService.getResourcesByLesson(lessonId);

            assertEquals(2, responses.size());
            assertEquals(1L, responses.get(0).getResourceID());
            assertEquals(2L, responses.get(1).getResourceID());
            assertNull(responses.get(1).getResourceTitle());
        }

        /**
         * UTCID02 – Abnormal
         * - Lesson không tồn tại
         * => ResourceNotFoundException("Lesson not found")
         */
        @Test
        @DisplayName("UTCID02 - Lesson không tồn tại -> ResourceNotFoundException")
        void UTCID02_getResourcesByLesson_lessonNotFound_shouldThrow() {
            Long tutorId = 100L;
            Long userId = 10L;
            setSecurityContextWithJwt("tutor@mail.com", userId, tutorId);

            when(lessonRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> lessonResourceService.getResourcesByLesson(999L));
        }

        /**
         * UTCID03 – Abnormal
         * - Lesson thuộc tutor khác
         * => AccessDeniedException("You are not allowed to view these resources")
         */
        @Test
        @DisplayName("UTCID03 - Lesson thuộc tutor khác -> AccessDeniedException")
        void UTCID03_getResourcesByLesson_notOwner_shouldThrowAccessDenied() {
            Long tutorId = 100L;
            Long userId = 10L;
            setSecurityContextWithJwt("tutor@mail.com", userId, tutorId);

            Long lessonId = 1L;
            Lesson lesson = buildLessonWithTutor(lessonId, 200L); // tutor khác
            when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));

            assertThrows(AccessDeniedException.class,
                    () -> lessonResourceService.getResourcesByLesson(lessonId));
        }

        /**
         * UTCID04 – Abnormal
         * - getCurrentTutorId: user không tồn tại
         * => AccessDeniedException("User not found")
         */
        @Test
        @DisplayName("UTCID04 - User không tồn tại trong DB -> AccessDeniedException")
        void UTCID04_getResourcesByLesson_userNotFound_shouldThrow() {
            Authentication authentication = mock(Authentication.class);
            Jwt jwt = mock(Jwt.class);
            when(jwt.getSubject()).thenReturn("notfound@mail.com");
            when(authentication.getPrincipal()).thenReturn(jwt);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            when(userRepository.findByEmail("notfound@mail.com"))
                    .thenReturn(Optional.empty());

            assertThrows(AccessDeniedException.class,
                    () -> lessonResourceService.getResourcesByLesson(1L));
        }

        /**
         * UTCID05 – Abnormal
         * - getCurrentTutorId: user không phải tutor
         * => AccessDeniedException("Current user is not a tutor")
         */
        @Test
        @DisplayName("UTCID05 - User không phải tutor -> AccessDeniedException")
        void UTCID05_getResourcesByLesson_currentUserNotTutor_shouldThrow() {
            Authentication authentication = mock(Authentication.class);
            Jwt jwt = mock(Jwt.class);
            when(jwt.getSubject()).thenReturn("user@mail.com");
            when(authentication.getPrincipal()).thenReturn(jwt);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = new User();
            user.setUserID(10L);
            user.setEmail("user@mail.com");
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.empty());

            assertThrows(AccessDeniedException.class,
                    () -> lessonResourceService.getResourcesByLesson(1L));
        }

        /**
         * UTCID06 – Boundary
         * - lessonId = -1 (id bất thường)
         * - repo trả empty -> ResourceNotFoundException
         */
        @Test
        @DisplayName("UTCID06 - lessonId=-1 (boundary) -> ResourceNotFoundException")
        void UTCID06_getResourcesByLesson_negativeId_shouldThrow() {
            Long tutorId = 100L;
            Long userId = 10L;
            setSecurityContextWithJwt("tutor@mail.com", userId, tutorId);

            when(lessonRepository.findById(-1L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> lessonResourceService.getResourcesByLesson(-1L));
        }
    }

    // =====================================================================
    // updateResource – UTCID01–UTCID11
    // =====================================================================

    @Nested
    @DisplayName("LessonResourceService.updateResource")
    class UpdateResourceTests {

        private void commonSecurityForTutor(Long tutorId, Long userId) {
            setSecurityContextWithJwt("tutor@mail.com", userId, tutorId);
        }

        /**
         * UTCID01 – Normal
         * - Resource tồn tại, thuộc tutor hiện tại
         * - Update resourceTitle
         * => Thành công, title mới được set, các field khác giữ nguyên.
         */
        @Test
        @DisplayName("UTCID01 - Update title hợp lệ")
        void UTCID01_updateResource_updateTitle_success() {
            Long tutorId = 100L;
            Long userId = 10L;
            commonSecurityForTutor(tutorId, userId);

            Lesson lesson = buildLessonWithTutor(1L, tutorId);
            LessonResource resource = buildResource(10L, lesson);

            when(resourceRepository.findByResourceIdAndTutorId(10L, tutorId))
                    .thenReturn(Optional.of(resource));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceTitle("Updated Title")
                    .build(); // không set URL/type

            when(resourceRepository.save(any(LessonResource.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            LessonResourceResponse resp =
                    lessonResourceService.updateResource(10L, request);

            assertEquals("Updated Title", resp.getResourceTitle());
            assertEquals(resource.getResourceURL(), resp.getResourceURL());
            assertEquals(resource.getResourceType(), resp.getResourceType());
        }

        /**
         * UTCID02 – Boundary
         * - resourceTitle = null (không update title)
         * - URL valid
         * => Title giữ nguyên, URL update thành công.
         */
        @Test
        @DisplayName("UTCID02 - resourceTitle=null -> không đổi title, chỉ update URL")
        void UTCID02_updateResource_nullTitle_updateUrlOnly() {
            Long tutorId = 100L;
            Long userId = 10L;
            commonSecurityForTutor(tutorId, userId);

            Lesson lesson = buildLessonWithTutor(1L, tutorId);
            LessonResource resource = buildResource(10L, lesson);
            resource.setResourceTitle("Old title");

            when(resourceRepository.findByResourceIdAndTutorId(10L, tutorId))
                    .thenReturn(Optional.of(resource));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceTitle(null)
                    .resourceURL("https://example.com/new.pdf")
                    .build();

            when(resourceRepository.save(any(LessonResource.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            LessonResourceResponse resp =
                    lessonResourceService.updateResource(10L, request);

            assertEquals("Old title", resp.getResourceTitle()); // không đổi
            assertEquals("https://example.com/new.pdf", resp.getResourceURL());
        }

        /**
         * UTCID03 – Normal
         * - Update resourceURL hợp lệ
         * => URL mới, các field khác giữ nguyên.
         */
        @Test
        @DisplayName("UTCID03 - Update URL hợp lệ")
        void UTCID03_updateResource_updateUrl_success() {
            Long tutorId = 100L;
            Long userId = 10L;
            commonSecurityForTutor(tutorId, userId);

            LessonResource resource = buildResource(10L,
                    buildLessonWithTutor(1L, tutorId));

            when(resourceRepository.findByResourceIdAndTutorId(10L, tutorId))
                    .thenReturn(Optional.of(resource));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceURL("https://valid.com/a.pdf")
                    .build();

            when(resourceRepository.save(any(LessonResource.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            LessonResourceResponse resp =
                    lessonResourceService.updateResource(10L, request);

            assertEquals("https://valid.com/a.pdf", resp.getResourceURL());
        }

        /**
         * UTCID04 – Normal
         * - Update resourceType (ví dụ từ PDF sang ExternalLink)
         * => Type update thành công.
         */
        @Test
        @DisplayName("UTCID04 - Update resourceType")
        void UTCID04_updateResource_updateType_success() {
            Long tutorId = 100L;
            Long userId = 10L;
            commonSecurityForTutor(tutorId, userId);

            LessonResource resource = buildResource(10L,
                    buildLessonWithTutor(1L, tutorId));

            when(resourceRepository.findByResourceIdAndTutorId(10L, tutorId))
                    .thenReturn(Optional.of(resource));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceType(ResourceType.ExternalLink)
                    .build();

            when(resourceRepository.save(any(LessonResource.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            LessonResourceResponse resp =
                    lessonResourceService.updateResource(10L, request);

            assertEquals(ResourceType.ExternalLink, resp.getResourceType());
        }

        /**
         * UTCID05 – Abnormal
         * - Resource không tồn tại/hoặc không thuộc tutor (repo trả Optional.empty)
         * => ResourceNotFoundException("Resource not found or you don't have permission")
         */
        @Test
        @DisplayName("UTCID05 - Resource không tồn tại -> ResourceNotFoundException")
        void UTCID05_updateResource_notFound_shouldThrow() {
            Long tutorId = 100L;
            Long userId = 10L;
            commonSecurityForTutor(tutorId, userId);

            when(resourceRepository.findByResourceIdAndTutorId(999L, tutorId))
                    .thenReturn(Optional.empty());

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceTitle("Updated")
                    .build();

            assertThrows(ResourceNotFoundException.class,
                    () -> lessonResourceService.updateResource(999L, request));
        }

        /**
         * UTCID06 – Abnormal
         * - request.resourceURL = "invalid-url"
         * => ValidationException("Invalid resource URL format")
         */
        @Test
        @DisplayName("UTCID06 - URL không hợp lệ -> ValidationException")
        void UTCID06_updateResource_invalidUrl_shouldThrow() {
            Long tutorId = 100L;
            Long userId = 10L;
            commonSecurityForTutor(tutorId, userId);

            LessonResource resource = buildResource(10L,
                    buildLessonWithTutor(1L, tutorId));

            when(resourceRepository.findByResourceIdAndTutorId(10L, tutorId))
                    .thenReturn(Optional.of(resource));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceURL("invalid-url")
                    .build();

            assertThrows(ValidationException.class,
                    () -> lessonResourceService.updateResource(10L, request));
        }

        /**
         * UTCID07 – Abnormal
         * - request.resourceURL = "" (chuỗi rỗng, không match pattern)
         * => ValidationException
         */
        @Test
        @DisplayName("UTCID07 - URL rỗng -> ValidationException")
        void UTCID07_updateResource_emptyUrl_shouldThrow() {
            Long tutorId = 100L;
            Long userId = 10L;
            commonSecurityForTutor(tutorId, userId);

            LessonResource resource = buildResource(10L,
                    buildLessonWithTutor(1L, tutorId));

            when(resourceRepository.findByResourceIdAndTutorId(10L, tutorId))
                    .thenReturn(Optional.of(resource));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceURL("")
                    .build();

            assertThrows(ValidationException.class,
                    () -> lessonResourceService.updateResource(10L, request));
        }

        /**
         * UTCID08 – Normal
         * - Update nhiều field hợp lệ (title + type + url)
         */
        @Test
        @DisplayName("UTCID08 - Update nhiều field hợp lệ (title + type + url)")
        void UTCID08_updateResource_multipleFields_success() {
            Long tutorId = 100L;
            Long userId = 10L;
            commonSecurityForTutor(tutorId, userId);

            LessonResource resource = buildResource(10L,
                    buildLessonWithTutor(1L, tutorId));

            when(resourceRepository.findByResourceIdAndTutorId(10L, tutorId))
                    .thenReturn(Optional.of(resource));

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceTitle("Updated Title")
                    .resourceURL("https://example.com/new.pdf")
                    .resourceType(ResourceType.ExternalLink)
                    .build();

            when(resourceRepository.save(any(LessonResource.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            LessonResourceResponse resp =
                    lessonResourceService.updateResource(10L, request);

            assertEquals("Updated Title", resp.getResourceTitle());
            assertEquals("https://example.com/new.pdf", resp.getResourceURL());
            assertEquals(ResourceType.ExternalLink, resp.getResourceType());
        }

        /**
         * UTCID09 – Boundary
         * - request không set gì (tất cả field null)
         * => Không thay đổi gì, vẫn save (theo code). Đây là boundary.
         */
        @Test
        @DisplayName("UTCID09 - Không update field nào -> resource giữ nguyên")
        void UTCID09_updateResource_noFieldChanged_shouldKeepResource() {
            Long tutorId = 100L;
            Long userId = 10L;
            commonSecurityForTutor(tutorId, userId);

            LessonResource resource = buildResource(10L,
                    buildLessonWithTutor(1L, tutorId));

            when(resourceRepository.findByResourceIdAndTutorId(10L, tutorId))
                    .thenReturn(Optional.of(resource));

            LessonResourceRequest request = LessonResourceRequest.builder().build();

            when(resourceRepository.save(any(LessonResource.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            LessonResourceResponse resp =
                    lessonResourceService.updateResource(10L, request);

            assertEquals(resource.getResourceTitle(), resp.getResourceTitle());
            assertEquals(resource.getResourceURL(), resp.getResourceURL());
            assertEquals(resource.getResourceType(), resp.getResourceType());
        }

        /**
         * UTCID10 – Abnormal
         * - getCurrentTutorId: user không tồn tại
         * => AccessDeniedException("User not found with email: ...")
         */
        @Test
        @DisplayName("UTCID10 - User không tồn tại trong DB -> AccessDeniedException")
        void UTCID10_updateResource_userNotFound_shouldThrow() {
            Authentication authentication = mock(Authentication.class);
            Jwt jwt = mock(Jwt.class);
            when(jwt.getSubject()).thenReturn("notfound@mail.com");
            when(authentication.getPrincipal()).thenReturn(jwt);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            when(userRepository.findByEmail("notfound@mail.com"))
                    .thenReturn(Optional.empty());

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceTitle("Updated")
                    .build();

            assertThrows(AccessDeniedException.class,
                    () -> lessonResourceService.updateResource(10L, request));
        }

        /**
         * UTCID11 – Abnormal
         * - getCurrentTutorId: user không phải tutor
         * => AccessDeniedException("Current user is not a tutor")
         */
        @Test
        @DisplayName("UTCID11 - User không phải tutor -> AccessDeniedException")
        void UTCID11_updateResource_currentUserNotTutor_shouldThrow() {
            Authentication authentication = mock(Authentication.class);
            Jwt jwt = mock(Jwt.class);
            when(jwt.getSubject()).thenReturn("user@mail.com");
            when(authentication.getPrincipal()).thenReturn(jwt);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = new User();
            user.setUserID(10L);
            user.setEmail("user@mail.com");
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.empty());

            LessonResourceRequest request = LessonResourceRequest.builder()
                    .resourceTitle("Updated")
                    .build();

            assertThrows(AccessDeniedException.class,
                    () -> lessonResourceService.updateResource(10L, request));
        }
    }

    // =====================================================================
    // deleteResource – UTCID01–UTCID10
    // =====================================================================

    @Nested
    @DisplayName("LessonResourceService.deleteResource")
    class DeleteResourceTests {

        private void securityForTutor(Long tutorId, Long userId) {
            setSecurityContextWithJwt("tutor@mail.com", userId, tutorId);
        }

        /**
         * UTCID01 – Normal
         * - Resource tồn tại, thuộc tutor hiện tại
         * => Xóa thành công, gọi resourceRepository.delete(resource)
         */
        @Test
        @DisplayName("UTCID01 - Xóa resource hợp lệ")
        void UTCID01_deleteResource_valid_shouldDelete() {
            Long tutorId = 100L;
            Long userId = 10L;
            securityForTutor(tutorId, userId);

            Lesson lesson = buildLessonWithTutor(1L, tutorId);
            LessonResource resource = buildResource(10L, lesson);

            when(resourceRepository.findByResourceIdAndTutorId(10L, tutorId))
                    .thenReturn(Optional.of(resource));

            lessonResourceService.deleteResource(10L);

            verify(resourceRepository, times(1)).delete(resource);
        }

        /**
         * UTCID02 – Abnormal
         * - Resource không tồn tại/không thuộc tutor
         * => ResourceNotFoundException
         */
        @Test
        @DisplayName("UTCID02 - Resource không tồn tại -> ResourceNotFoundException")
        void UTCID02_deleteResource_notFound_shouldThrow() {
            Long tutorId = 100L;
            Long userId = 10L;
            securityForTutor(tutorId, userId);

            when(resourceRepository.findByResourceIdAndTutorId(999L, tutorId))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> lessonResourceService.deleteResource(999L));
        }

        /**
         * UTCID03 – Abnormal (Boundary)
         * - resourceId = null
         * - repo trả Optional.empty() cho null id
         * => orElseThrow(...) -> ResourceNotFoundException
         *
         * NOTE: Thiết kế service hiện tại ưu tiên domain exception ResourceNotFoundException
         *       thay vì NullPointerException raw, nên test expect ResourceNotFoundException.
         */
        @Test
        @DisplayName("UTCID03 - resourceId=null -> ResourceNotFoundException (boundary)")
        void UTCID03_deleteResource_nullId_shouldThrowResourceNotFound() {
            Long tutorId = 100L;
            Long userId = 10L;
            securityForTutor(tutorId, userId);

            // có thể stub rõ ràng, đảm bảo null -> Optional.empty()
            when(resourceRepository.findByResourceIdAndTutorId(isNull(), eq(tutorId)))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> lessonResourceService.deleteResource(null));
        }

        /**
         * UTCID04 – Boundary
         * - resourceId = -1
         * - Repo trả empty -> ResourceNotFoundException
         */
        @Test
        @DisplayName("UTCID04 - resourceId=-1 -> ResourceNotFoundException")
        void UTCID04_deleteResource_negativeId_shouldThrow() {
            Long tutorId = 100L;
            Long userId = 10L;
            securityForTutor(tutorId, userId);

            when(resourceRepository.findByResourceIdAndTutorId(-1L, tutorId))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> lessonResourceService.deleteResource(-1L));
        }

        /**
         * UTCID05 – Abnormal
         * - getCurrentTutorId: authentication = null
         * => AccessDeniedException("User not authenticated")
         */
        @Test
        @DisplayName("UTCID05 - User chưa authenticated -> AccessDeniedException")
        void UTCID05_deleteResource_userNotAuthenticated_shouldThrow() {
            SecurityContextHolder.clearContext(); // authentication null

            assertThrows(AccessDeniedException.class,
                    () -> lessonResourceService.deleteResource(10L));
        }

        /**
         * UTCID06 – Abnormal
         * - getCurrentTutorId: user không tồn tại
         * => AccessDeniedException("User not found with email: ...")
         */
        @Test
        @DisplayName("UTCID06 - User không tồn tại trong DB -> AccessDeniedException")
        void UTCID06_deleteResource_userNotFound_shouldThrow() {
            Authentication authentication = mock(Authentication.class);
            Jwt jwt = mock(Jwt.class);
            when(jwt.getSubject()).thenReturn("notfound@mail.com");
            when(authentication.getPrincipal()).thenReturn(jwt);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            when(userRepository.findByEmail("notfound@mail.com"))
                    .thenReturn(Optional.empty());

            assertThrows(AccessDeniedException.class,
                    () -> lessonResourceService.deleteResource(10L));
        }

        /**
         * UTCID07 – Abnormal
         * - getCurrentTutorId: user không phải tutor
         * => AccessDeniedException("Current user is not a tutor")
         */
        @Test
        @DisplayName("UTCID07 - User không phải tutor -> AccessDeniedException")
        void UTCID07_deleteResource_currentUserNotTutor_shouldThrow() {
            Authentication authentication = mock(Authentication.class);
            Jwt jwt = mock(Jwt.class);
            when(jwt.getSubject()).thenReturn("user@mail.com");
            when(authentication.getPrincipal()).thenReturn(jwt);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = new User();
            user.setUserID(10L);
            user.setEmail("user@mail.com");
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.empty());

            assertThrows(AccessDeniedException.class,
                    () -> lessonResourceService.deleteResource(10L));
        }

        /**
         * UTCID08 – Abnormal
         * - repo.delete(resource) ném RuntimeException (VD: lỗi DB)
         * => RuntimeException propagate
         */
        @Test
        @DisplayName("UTCID08 - Lỗi runtime trong delete -> RuntimeException propagate")
        void UTCID08_deleteResource_deleteThrowsRuntime_shouldPropagate() {
            Long tutorId = 100L;
            Long userId = 10L;
            securityForTutor(tutorId, userId);

            LessonResource resource = buildResource(10L,
                    buildLessonWithTutor(1L, tutorId));

            when(resourceRepository.findByResourceIdAndTutorId(10L, tutorId))
                    .thenReturn(Optional.of(resource));

            doThrow(new RuntimeException("DB error"))
                    .when(resourceRepository).delete(resource);

            assertThrows(RuntimeException.class,
                    () -> lessonResourceService.deleteResource(10L));
        }

        /**
         * UTCID09 – Boundary
         * - resourceId=0, repo trả empty
         * => ResourceNotFoundException
         */
        @Test
        @DisplayName("UTCID09 - resourceId=0 -> ResourceNotFoundException")
        void UTCID09_deleteResource_zeroId_shouldThrow() {
            Long tutorId = 100L;
            Long userId = 10L;
            securityForTutor(tutorId, userId);

            when(resourceRepository.findByResourceIdAndTutorId(0L, tutorId))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> lessonResourceService.deleteResource(0L));
        }

        /**
         * UTCID10 – Boundary
         * - resourceId lớn nhưng tồn tại, vẫn xóa bình thường
         * => delete thành công (another normal case)
         */
        @Test
        @DisplayName("UTCID10 - resourceId lớn nhưng tồn tại -> delete OK")
        void UTCID10_deleteResource_largeIdExists_shouldDelete() {
            Long tutorId = 100L;
            Long userId = 10L;
            securityForTutor(tutorId, userId);

            LessonResource resource = buildResource(999L,
                    buildLessonWithTutor(1L, tutorId));

            when(resourceRepository.findByResourceIdAndTutorId(999L, tutorId))
                    .thenReturn(Optional.of(resource));

            lessonResourceService.deleteResource(999L);

            verify(resourceRepository, times(1)).delete(resource);
        }
    }
}
