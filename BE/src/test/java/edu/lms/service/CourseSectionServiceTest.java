package edu.lms.service;

import edu.lms.dto.request.CourseSectionRequest;
import edu.lms.dto.response.CourseSectionResponse;
import edu.lms.entity.Course;
import edu.lms.entity.CourseSection;
import edu.lms.entity.Enrollment;
import edu.lms.entity.Tutor;
import edu.lms.entity.User;
import edu.lms.exception.AppException;
import edu.lms.mapper.CourseSectionMapper;
import edu.lms.repository.CourseRepository;
import edu.lms.repository.CourseSectionRepository;
import edu.lms.repository.EnrollmentRepository;
import edu.lms.repository.LessonRepository;
import edu.lms.repository.LessonResourceRepository;
import edu.lms.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho CourseSectionService
 *
 * Cover:
 *  - createSection
 *  - getSectionsByCourse
 *  - getSectionById
 *  - updateSection
 *  - deleteSection
 *
 * Lưu ý:
 *  - Chỉ assert AppException (không check ErrorCode cụ thể).
 *  - NOTE cho từng case rõ ràng (Not found, Unauthorized, Happy path, ...).
 */
@ExtendWith(MockitoExtension.class)
class CourseSectionServiceTest {

    @Mock
    CourseRepository courseRepository;
    @Mock
    CourseSectionRepository courseSectionRepository;
    @Mock
    CourseSectionMapper courseSectionMapper;
    @Mock
    UserRepository userRepository;
    @Mock
    EnrollmentRepository enrollmentRepository;
    @Mock
    LessonRepository lessonRepository;
    @Mock
    LessonResourceRepository lessonResourceRepository;

    @InjectMocks
    CourseSectionService courseSectionService;

    // =======================
    // HELPER METHODS
    // =======================

    private User buildUser(Long id, String email) {
        User u = new User();
        u.setUserID(id);
        u.setEmail(email);
        return u;
    }

    private Tutor buildTutor(Long tutorId, String email) {
        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setUser(buildUser(1000L + tutorId, email));
        return t;
    }

    private Course buildCourseOwnedByTutor(Long courseId, Tutor tutor) {
        Course c = new Course();
        c.setCourseID(courseId);
        c.setTutor(tutor);
        return c;
    }

    private CourseSection buildSection(Long sectionId, Course course) {
        CourseSection s = new CourseSection();
        s.setSectionID(sectionId);
        s.setCourse(course);
        s.setTitle("Section " + sectionId);
        s.setDescription("Desc " + sectionId);
        s.setOrderIndex(1);
        return s;
    }

    private CourseSectionRequest buildRequest(String title, String description, Integer orderIndex) {
        return CourseSectionRequest.builder()
                .title(title)
                .description(description)
                .orderIndex(orderIndex)
                .build();
    }

    // =====================================================================
    // createSection
    // =====================================================================

    @Nested
    @DisplayName("CourseSectionService.createSection")
    class CreateSectionTests {

        /**
         * NOTE – Case 1: Course không tồn tại -> COURSE_NOT_FOUND
         */
        @Test
        @DisplayName("createSection - Course không tồn tại -> AppException")
        void createSection_courseNotFound_shouldThrow() {
            Long courseId = 99L;
            String email = "tutor@mail.com";

            when(courseRepository.findById(courseId))
                    .thenReturn(Optional.empty());

            CourseSectionRequest req = buildRequest("Title", "Desc", 1);

            assertThrows(AppException.class,
                    () -> courseSectionService.createSection(courseId, req, email));

            verify(courseRepository).findById(courseId);
            verifyNoMoreInteractions(courseSectionRepository, courseSectionMapper);
        }

        /**
         * NOTE – Case 2: Course tồn tại nhưng tutor owner != email -> UNAUTHORIZED
         */
        @Test
        @DisplayName("createSection - Không phải tutor owner -> AppException UNAUTHORIZED")
        void createSection_notOwner_shouldThrowUnauthorized() {
            Long courseId = 1L;
            Tutor tutor = buildTutor(1L, "owner@mail.com");
            Course course = buildCourseOwnedByTutor(courseId, tutor);

            String callerEmail = "other@mail.com";

            when(courseRepository.findById(courseId))
                    .thenReturn(Optional.of(course));

            CourseSectionRequest req = buildRequest("Title", "Desc", 1);

            assertThrows(AppException.class,
                    () -> courseSectionService.createSection(courseId, req, callerEmail));

            verify(courseRepository).findById(courseId);
            verifyNoMoreInteractions(courseSectionRepository, courseSectionMapper);
        }

        /**
         * NOTE – Case 3: Happy path – Tutor owner tạo section thành công
         */
        @Test
        @DisplayName("createSection - Happy path tutor owner tạo section")
        void createSection_success() {
            Long courseId = 1L;
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            Course course = buildCourseOwnedByTutor(courseId, tutor);

            when(courseRepository.findById(courseId))
                    .thenReturn(Optional.of(course));

            CourseSectionRequest req = buildRequest("Intro", "Desc", 1);

            CourseSection sectionEntity = new CourseSection();
            sectionEntity.setTitle("Intro");
            sectionEntity.setDescription("Desc");
            sectionEntity.setOrderIndex(1);

            CourseSection savedSection = new CourseSection();
            savedSection.setSectionID(10L);
            savedSection.setCourse(course);
            savedSection.setTitle("Intro");
            savedSection.setDescription("Desc");
            savedSection.setOrderIndex(1);

            CourseSectionResponse response = CourseSectionResponse.builder()
                    .sectionID(10L)
                    .courseID(courseId)
                    .title("Intro")
                    .description("Desc")
                    .orderIndex(1)
                    .build();

            when(courseSectionMapper.toEntity(req)).thenReturn(sectionEntity);
            when(courseSectionRepository.save(sectionEntity)).thenReturn(savedSection);
            when(courseSectionMapper.toResponse(savedSection)).thenReturn(response);

            CourseSectionResponse res =
                    courseSectionService.createSection(courseId, req, email);

            assertEquals(10L, res.getSectionID());
            assertEquals(courseId, res.getCourseID());
            assertEquals("Intro", res.getTitle());
            assertEquals(1, res.getOrderIndex());

            verify(courseRepository).findById(courseId);
            verify(courseSectionMapper).toEntity(req);
            verify(courseSectionRepository).save(sectionEntity);
            verify(courseSectionMapper).toResponse(savedSection);
        }
    }

    // =====================================================================
    // getSectionsByCourse
    // =====================================================================

    @Nested
    @DisplayName("CourseSectionService.getSectionsByCourse")
    class GetSectionsByCourseTests {

        /**
         * NOTE – Case 1: Course không tồn tại -> COURSE_NOT_FOUND
         */
        @Test
        @DisplayName("getSectionsByCourse - Course không tồn tại -> AppException")
        void getSectionsByCourse_courseNotFound_shouldThrow() {
            Long courseId = 99L;
            String email = "user@mail.com";

            when(courseRepository.findById(courseId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> courseSectionService.getSectionsByCourse(courseId, email));

            verify(courseRepository).findById(courseId);
            verifyNoMoreInteractions(courseSectionRepository);
        }

        /**
         * NOTE – Case 2: Caller là tutor owner của course -> xem được list sections
         */
        @Test
        @DisplayName("getSectionsByCourse - Tutor owner xem được sections")
        void getSectionsByCourse_owner_success() {
            Long courseId = 1L;
            String email = "tutor@mail.com";
            Tutor tutor = buildTutor(1L, email);
            Course course = buildCourseOwnedByTutor(courseId, tutor);

            when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));

            CourseSection s1 = buildSection(10L, course);
            CourseSection s2 = buildSection(11L, course);

            CourseSectionResponse r1 = CourseSectionResponse.builder()
                    .sectionID(10L).courseID(courseId).title("S1").orderIndex(1).build();
            CourseSectionResponse r2 = CourseSectionResponse.builder()
                    .sectionID(11L).courseID(courseId).title("S2").orderIndex(2).build();

            when(courseSectionRepository.findByCourse_CourseID(courseId))
                    .thenReturn(List.of(s1, s2));
            when(courseSectionMapper.toResponse(s1)).thenReturn(r1);
            when(courseSectionMapper.toResponse(s2)).thenReturn(r2);

            var res = courseSectionService.getSectionsByCourse(courseId, email);

            assertEquals(2, res.size());
            assertEquals(10L, res.get(0).getSectionID());
            assertEquals(11L, res.get(1).getSectionID());

            verify(courseRepository).findById(courseId);
            verify(courseSectionRepository).findByCourse_CourseID(courseId);
            verify(courseSectionMapper).toResponse(s1);
            verify(courseSectionMapper).toResponse(s2);
        }

        /**
         * NOTE – Case 3: Caller là learner đã enroll course -> xem được list sections
         *  - owner = false => check isEnrolled = true
         */
        @Test
        @DisplayName("getSectionsByCourse - Learner đã enroll xem được sections")
        void getSectionsByCourse_enrolledLearner_success() {
            Long courseId = 1L;

            Tutor tutor = buildTutor(1L, "tutor@mail.com");
            Course course = buildCourseOwnedByTutor(courseId, tutor);

            String learnerEmail = "learner@mail.com";
            User learner = buildUser(200L, learnerEmail);

            when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));

            // isEnrolled(email, courseId)
            when(userRepository.findByEmail(learnerEmail))
                    .thenReturn(Optional.of(learner));
            when(enrollmentRepository
                    .findByUser_UserIDAndCourse_CourseID(learner.getUserID(), courseId))
                    .thenReturn(Optional.of(new Enrollment()));

            CourseSection s1 = buildSection(10L, course);
            when(courseSectionRepository.findByCourse_CourseID(courseId))
                    .thenReturn(List.of(s1));

            CourseSectionResponse r1 = CourseSectionResponse.builder()
                    .sectionID(10L).courseID(courseId).title("S1").orderIndex(1).build();
            when(courseSectionMapper.toResponse(s1)).thenReturn(r1);

            var res = courseSectionService.getSectionsByCourse(courseId, learnerEmail);

            assertEquals(1, res.size());
            assertEquals(10L, res.get(0).getSectionID());

            verify(courseRepository).findById(courseId);
            verify(userRepository).findByEmail(learnerEmail);
            verify(enrollmentRepository)
                    .findByUser_UserIDAndCourse_CourseID(learner.getUserID(), courseId);
            verify(courseSectionRepository).findByCourse_CourseID(courseId);
            verify(courseSectionMapper).toResponse(s1);
        }

        /**
         * NOTE – Case 4: Caller không phải owner và cũng không enroll -> UNAUTHORIZED
         */
        @Test
        @DisplayName("getSectionsByCourse - Không owner, không enroll -> UNAUTHORIZED")
        void getSectionsByCourse_notOwnerNotEnrolled_shouldThrowUnauthorized() {
            Long courseId = 1L;

            Tutor tutor = buildTutor(1L, "tutor@mail.com");
            Course course = buildCourseOwnedByTutor(courseId, tutor);

            String strangerEmail = "stranger@mail.com";
            User stranger = buildUser(300L, strangerEmail);

            when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));

            when(userRepository.findByEmail(strangerEmail))
                    .thenReturn(Optional.of(stranger));
            when(enrollmentRepository
                    .findByUser_UserIDAndCourse_CourseID(stranger.getUserID(), courseId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> courseSectionService.getSectionsByCourse(courseId, strangerEmail));

            verify(courseRepository).findById(courseId);
            verify(userRepository).findByEmail(strangerEmail);
            verify(enrollmentRepository)
                    .findByUser_UserIDAndCourse_CourseID(stranger.getUserID(), courseId);
            verifyNoMoreInteractions(courseSectionRepository);
        }

        /**
         * NOTE – Case 5: Caller không phải owner, user chưa login trong DB -> UNAUTHENTICATED
         *  - userRepository.findByEmail(...) -> empty => AppException(UNAUTHENTICATED) trong isEnrolled
         */
        @Test
        @DisplayName("getSectionsByCourse - User email không tồn tại -> AppException UNAUTHENTICATED")
        void getSectionsByCourse_userNotFound_shouldThrowUnauthenticated() {
            Long courseId = 1L;

            Tutor tutor = buildTutor(1L, "tutor@mail.com");
            Course course = buildCourseOwnedByTutor(courseId, tutor);

            String email = "unknown@mail.com";

            when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> courseSectionService.getSectionsByCourse(courseId, email));

            verify(courseRepository).findById(courseId);
            verify(userRepository).findByEmail(email);
            verifyNoMoreInteractions(courseSectionRepository);
        }
    }

    // =====================================================================
    // getSectionById
    // =====================================================================

    @Nested
    @DisplayName("CourseSectionService.getSectionById")
    class GetSectionByIdTests {

        /**
         * NOTE – Case 1: Section không tồn tại -> SECTION_NOT_FOUND
         */
        @Test
        @DisplayName("getSectionById - Section không tồn tại -> AppException")
        void getSection_sectionNotFound_shouldThrow() {
            Long sectionId = 99L;
            String email = "user@mail.com";

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> courseSectionService.getSectionById(sectionId, email));

            verify(courseSectionRepository).findById(sectionId);
        }

        /**
         * NOTE – Case 2: Caller là tutor owner course -> xem được section
         */
        @Test
        @DisplayName("getSectionById - Tutor owner xem section")
        void getSection_owner_success() {
            Long sectionId = 10L;
            String email = "tutor@mail.com";

            Tutor tutor = buildTutor(1L, email);
            Course course = buildCourseOwnedByTutor(1L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));

            CourseSectionResponse resp = CourseSectionResponse.builder()
                    .sectionID(sectionId)
                    .courseID(course.getCourseID())
                    .title("S title")
                    .orderIndex(1)
                    .build();
            when(courseSectionMapper.toResponse(section)).thenReturn(resp);

            CourseSectionResponse res =
                    courseSectionService.getSectionById(sectionId, email);

            assertEquals(sectionId, res.getSectionID());
            assertEquals(course.getCourseID(), res.getCourseID());

            verify(courseSectionRepository).findById(sectionId);
            verify(courseSectionMapper).toResponse(section);
        }

        /**
         * NOTE – Case 3: Caller là learner đã enroll -> xem được section
         */
        @Test
        @DisplayName("getSectionById - Learner đã enroll xem section")
        void getSection_enrolledLearner_success() {
            Long sectionId = 10L;

            Tutor tutor = buildTutor(1L, "tutor@mail.com");
            Course course = buildCourseOwnedByTutor(1L, tutor);
            CourseSection section = buildSection(sectionId, course);

            String learnerEmail = "learner@mail.com";
            User learner = buildUser(200L, learnerEmail);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));
            when(userRepository.findByEmail(learnerEmail))
                    .thenReturn(Optional.of(learner));
            when(enrollmentRepository
                    .findByUser_UserIDAndCourse_CourseID(learner.getUserID(), course.getCourseID()))
                    .thenReturn(Optional.of(new Enrollment()));

            CourseSectionResponse resp = CourseSectionResponse.builder()
                    .sectionID(sectionId)
                    .courseID(course.getCourseID())
                    .title("S title")
                    .orderIndex(1)
                    .build();
            when(courseSectionMapper.toResponse(section)).thenReturn(resp);

            CourseSectionResponse res =
                    courseSectionService.getSectionById(sectionId, learnerEmail);

            assertEquals(sectionId, res.getSectionID());

            verify(courseSectionRepository).findById(sectionId);
            verify(userRepository).findByEmail(learnerEmail);
            verify(enrollmentRepository)
                    .findByUser_UserIDAndCourse_CourseID(learner.getUserID(), course.getCourseID());
            verify(courseSectionMapper).toResponse(section);
        }

        /**
         * NOTE – Case 4: Caller không phải owner và không enroll -> UNAUTHORIZED
         */
        @Test
        @DisplayName("getSectionById - Không owner, không enroll -> UNAUTHORIZED")
        void getSection_notOwnerNotEnrolled_shouldThrowUnauthorized() {
            Long sectionId = 10L;

            Tutor tutor = buildTutor(1L, "tutor@mail.com");
            Course course = buildCourseOwnedByTutor(1L, tutor);
            CourseSection section = buildSection(sectionId, course);

            String strangerEmail = "stranger@mail.com";
            User stranger = buildUser(300L, strangerEmail);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));
            when(userRepository.findByEmail(strangerEmail))
                    .thenReturn(Optional.of(stranger));
            when(enrollmentRepository
                    .findByUser_UserIDAndCourse_CourseID(stranger.getUserID(), course.getCourseID()))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> courseSectionService.getSectionById(sectionId, strangerEmail));

            verify(courseSectionRepository).findById(sectionId);
            verify(userRepository).findByEmail(strangerEmail);
            verify(enrollmentRepository)
                    .findByUser_UserIDAndCourse_CourseID(stranger.getUserID(), course.getCourseID());
        }
    }

    // =====================================================================
    // updateSection
    // =====================================================================

    @Nested
    @DisplayName("CourseSectionService.updateSection")
    class UpdateSectionTests {

        /**
         * NOTE – Case 1: Section không tồn tại -> INVALID_KEY
         */
        @Test
        @DisplayName("updateSection - Section không tồn tại -> AppException")
        void updateSection_sectionNotFound_shouldThrow() {
            Long sectionId = 99L;
            String email = "tutor@mail.com";

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.empty());

            CourseSectionRequest req = buildRequest("New title", "New desc", 2);

            assertThrows(AppException.class,
                    () -> courseSectionService.updateSection(sectionId, req, email));

            verify(courseSectionRepository).findById(sectionId);
        }

        /**
         * NOTE – Case 2: Caller không phải tutor owner -> UNAUTHORIZED
         */
        @Test
        @DisplayName("updateSection - Không phải tutor owner -> UNAUTHORIZED")
        void updateSection_notOwner_shouldThrowUnauthorized() {
            Long sectionId = 10L;

            Tutor tutorOwner = buildTutor(1L, "owner@mail.com");
            Course course = buildCourseOwnedByTutor(1L, tutorOwner);
            CourseSection section = buildSection(sectionId, course);

            String callerEmail = "other@mail.com";

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));

            CourseSectionRequest req = buildRequest("New title", "New desc", 2);

            assertThrows(AppException.class,
                    () -> courseSectionService.updateSection(sectionId, req, callerEmail));

            verify(courseSectionRepository).findById(sectionId);
        }

        /**
         * NOTE – Case 3: Happy path – Tutor owner update section thành công
         */
        @Test
        @DisplayName("updateSection - Tutor owner update thành công")
        void updateSection_success() {
            Long sectionId = 10L;
            String email = "tutor@mail.com";

            Tutor tutor = buildTutor(1L, email);
            Course course = buildCourseOwnedByTutor(1L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));

            CourseSectionRequest req = buildRequest("Updated title", "Updated desc", 5);

            CourseSection saved = new CourseSection();
            saved.setSectionID(sectionId);
            saved.setCourse(course);
            saved.setTitle("Updated title");
            saved.setDescription("Updated desc");
            saved.setOrderIndex(5);

            CourseSectionResponse resp = CourseSectionResponse.builder()
                    .sectionID(sectionId)
                    .courseID(course.getCourseID())
                    .title("Updated title")
                    .description("Updated desc")
                    .orderIndex(5)
                    .build();

            when(courseSectionRepository.save(section)).thenReturn(saved);
            when(courseSectionMapper.toResponse(saved)).thenReturn(resp);

            CourseSectionResponse res =
                    courseSectionService.updateSection(sectionId, req, email);

            assertEquals("Updated title", res.getTitle());
            assertEquals("Updated desc", res.getDescription());
            assertEquals(5, res.getOrderIndex());

            verify(courseSectionRepository).findById(sectionId);
            verify(courseSectionRepository).save(section);
            verify(courseSectionMapper).toResponse(saved);
        }
    }

    // =====================================================================
    // deleteSection
    // =====================================================================

    @Nested
    @DisplayName("CourseSectionService.deleteSection")
    class DeleteSectionTests {

        /**
         * NOTE – Case 1: Section không tồn tại -> INVALID_KEY
         */
        @Test
        @DisplayName("deleteSection - Section không tồn tại -> AppException")
        void deleteSection_sectionNotFound_shouldThrow() {
            Long sectionId = 99L;
            String email = "tutor@mail.com";

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> courseSectionService.deleteSection(sectionId, email));

            verify(courseSectionRepository).findById(sectionId);
        }

        /**
         * NOTE – Case 2: Caller không phải tutor owner -> UNAUTHORIZED
         */
        @Test
        @DisplayName("deleteSection - Không phải tutor owner -> UNAUTHORIZED")
        void deleteSection_notOwner_shouldThrowUnauthorized() {
            Long sectionId = 10L;

            Tutor tutorOwner = buildTutor(1L, "owner@mail.com");
            Course course = buildCourseOwnedByTutor(1L, tutorOwner);
            CourseSection section = buildSection(sectionId, course);

            String callerEmail = "other@mail.com";

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));

            assertThrows(AppException.class,
                    () -> courseSectionService.deleteSection(sectionId, callerEmail));

            verify(courseSectionRepository).findById(sectionId);
            verify(courseSectionRepository, never()).delete(any());
        }

        /**
         * NOTE – Case 3: Happy path – Tutor owner delete section thành công
         */
        @Test
        @DisplayName("deleteSection - Tutor owner delete thành công")
        void deleteSection_success() {
            Long sectionId = 10L;
            String email = "tutor@mail.com";

            Tutor tutor = buildTutor(1L, email);
            Course course = buildCourseOwnedByTutor(1L, tutor);
            CourseSection section = buildSection(sectionId, course);

            when(courseSectionRepository.findById(sectionId))
                    .thenReturn(Optional.of(section));

            courseSectionService.deleteSection(sectionId, email);

            verify(courseSectionRepository).findById(sectionId);
            verify(courseSectionRepository).delete(section);
        }
    }
}
