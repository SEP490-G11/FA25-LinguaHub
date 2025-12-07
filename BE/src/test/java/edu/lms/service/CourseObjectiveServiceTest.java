package edu.lms.service;

import edu.lms.dto.request.CourseObjectiveRequest;
import edu.lms.dto.response.CourseObjectiveResponse;
import edu.lms.entity.Course;
import edu.lms.entity.CourseObjective;
import edu.lms.exception.AppException;
import edu.lms.repository.CourseObjectiveRepository;
import edu.lms.repository.CourseRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho CourseObjectiveService
 *
 * Cover đầy đủ cho:
 *  - getByCourse()
 *  - create()
 *  - update()
 *  - delete()
 *
 * Lưu ý: Chỉ assert throw AppException, không phụ thuộc ErrorCode cụ thể
 */
@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class CourseObjectiveServiceTest {

    @Mock
    CourseObjectiveRepository courseObjectiveRepository;
    @Mock
    CourseRepository courseRepository;

    @InjectMocks
    CourseObjectiveService courseObjectiveService;

    // =========================
    // HELPER
    // =========================

    private Course buildCourse(Long id) {
        Course c = new Course();
        c.setCourseID(id);
        return c;
    }

    private CourseObjective buildObjective(Long id, Course course, String text, Integer orderIndex) {
        CourseObjective o = new CourseObjective();
        o.setObjectiveID(id);
        o.setCourse(course);
        o.setObjectiveText(text);
        o.setOrderIndex(orderIndex);
        return o;
    }

    private CourseObjectiveRequest buildRequest(String text, Integer orderIndex) {
        CourseObjectiveRequest req = new CourseObjectiveRequest();
        req.setObjectiveText(text);
        req.setOrderIndex(orderIndex);
        return req;
    }

    // =====================================================================
    // getByCourse
    // =====================================================================
    @Nested
    @DisplayName("CourseObjectiveService.getByCourse")
    class GetByCourseTests {

        /**
         * CASE 1
         * NOTE – Không có objective nào cho course -> trả về list rỗng
         */
        @Test
        @DisplayName("Course không có objective -> trả về list rỗng")
        void getByCourse_emptyList() {
            Long courseId = 1L;

            when(courseObjectiveRepository
                    .findByCourse_CourseIDOrderByOrderIndexAsc(courseId))
                    .thenReturn(List.of());

            List<CourseObjectiveResponse> res =
                    courseObjectiveService.getByCourse(courseId);

            assertNotNull(res);
            assertTrue(res.isEmpty());

            verify(courseObjectiveRepository)
                    .findByCourse_CourseIDOrderByOrderIndexAsc(courseId);
        }

        /**
         * CASE 2
         * NOTE – Có nhiều objective -> map đúng dữ liệu sang response
         */
        @Test
        @DisplayName("Course có nhiều objective -> map đúng sang response")
        void getByCourse_withObjectives() {
            Long courseId = 10L;
            Course course = buildCourse(courseId);

            CourseObjective o1 = buildObjective(1L, course, "Objective 1", 1);
            CourseObjective o2 = buildObjective(2L, course, "Objective 2", 2);

            when(courseObjectiveRepository
                    .findByCourse_CourseIDOrderByOrderIndexAsc(courseId))
                    .thenReturn(List.of(o1, o2));

            List<CourseObjectiveResponse> res =
                    courseObjectiveService.getByCourse(courseId);

            assertEquals(2, res.size());

            CourseObjectiveResponse r1 = res.get(0);
            assertEquals(1L, r1.getObjectiveID());
            assertEquals(courseId, r1.getCourseID());
            assertEquals("Objective 1", r1.getObjectiveText());
            assertEquals(1, r1.getOrderIndex());

            CourseObjectiveResponse r2 = res.get(1);
            assertEquals(2L, r2.getObjectiveID());
            assertEquals(courseId, r2.getCourseID());
            assertEquals("Objective 2", r2.getObjectiveText());
            assertEquals(2, r2.getOrderIndex());
        }
    }

    // =====================================================================
    // create
    // =====================================================================
    @Nested
    @DisplayName("CourseObjectiveService.create")
    class CreateTests {

        /**
         * CASE 1
         * NOTE – Course không tồn tại -> COURSE_NOT_FOUND -> AppException
         */
        @Test
        @DisplayName("Course không tồn tại -> throw AppException")
        void create_courseNotFound_shouldThrow() {
            Long courseId = 99L;
            CourseObjectiveRequest req = buildRequest("Learn basic grammar", 1);

            when(courseRepository.findById(courseId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> courseObjectiveService.create(courseId, req));

            verify(courseRepository).findById(courseId);
            verifyNoInteractions(courseObjectiveRepository);
        }

        /**
         * CASE 2 – HAPPY PATH
         * NOTE – Course tồn tại, tạo objective mới
         *  - Kỳ vọng:
         *      + repository.save được gọi với course đúng, text & orderIndex đúng
         *      + response trả về đúng dữ liệu
         */
        @Test
        @DisplayName("Happy path - tạo objective thành công")
        void create_success() {
            Long courseId = 10L;
            Course course = buildCourse(courseId);

            CourseObjectiveRequest req = buildRequest("Understand basic grammar", 1);

            when(courseRepository.findById(courseId))
                    .thenReturn(Optional.of(course));

            when(courseObjectiveRepository.save(any(CourseObjective.class)))
                    .thenAnswer(inv -> {
                        CourseObjective o = inv.getArgument(0);
                        o.setObjectiveID(100L);
                        return o;
                    });

            CourseObjectiveResponse res =
                    courseObjectiveService.create(courseId, req);

            // Verify response
            assertEquals(100L, res.getObjectiveID());
            assertEquals(courseId, res.getCourseID());
            assertEquals("Understand basic grammar", res.getObjectiveText());
            assertEquals(1, res.getOrderIndex());

            // Capture entity để verify
            ArgumentCaptor<CourseObjective> captor = ArgumentCaptor.forClass(CourseObjective.class);
            verify(courseObjectiveRepository).save(captor.capture());
            CourseObjective saved = captor.getValue();

            assertEquals(course, saved.getCourse());
            assertEquals("Understand basic grammar", saved.getObjectiveText());
            assertEquals(1, saved.getOrderIndex());
        }
    }

    // =====================================================================
    // update
    // =====================================================================
    @Nested
    @DisplayName("CourseObjectiveService.update")
    class UpdateTests {

        /**
         * CASE 1
         * NOTE – Objective không tồn tại -> OBJECTIVE_NOT_FOUND -> AppException
         */
        @Test
        @DisplayName("Objective không tồn tại -> throw AppException")
        void update_objectiveNotFound_shouldThrow() {
            Long objectiveId = 99L;
            CourseObjectiveRequest req = buildRequest("New text", 2);

            when(courseObjectiveRepository.findById(objectiveId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> courseObjectiveService.update(objectiveId, req));

            verify(courseObjectiveRepository).findById(objectiveId);
            verify(courseObjectiveRepository, never()).save(any());
        }

        /**
         * CASE 2 – HAPPY PATH
         * NOTE – Update đầy đủ cả objectiveText và orderIndex
         */
        @Test
        @DisplayName("Happy path - update text + orderIndex")
        void update_fullUpdate_success() {
            Long courseId = 10L;
            Long objectiveId = 5L;
            Course course = buildCourse(courseId);

            CourseObjective existing = buildObjective(objectiveId, course,
                    "Old objective", 1);

            when(courseObjectiveRepository.findById(objectiveId))
                    .thenReturn(Optional.of(existing));

            when(courseObjectiveRepository.save(any(CourseObjective.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            CourseObjectiveRequest req = buildRequest("New objective text", 3);

            CourseObjectiveResponse res =
                    courseObjectiveService.update(objectiveId, req);

            assertEquals(objectiveId, res.getObjectiveID());
            assertEquals(courseId, res.getCourseID());
            assertEquals("New objective text", res.getObjectiveText());
            assertEquals(3, res.getOrderIndex());
        }

        /**
         * CASE 3
         * NOTE – Partial update:
         *  - objectiveText = null => giữ nguyên text cũ
         *  - orderIndex != null => update orderIndex
         */
        @Test
        @DisplayName("Partial update - giữ nguyên text nếu request.objectiveText = null")
        void update_partial_keepOldText_whenTextNull() {
            Long courseId = 10L;
            Long objectiveId = 5L;
            Course course = buildCourse(courseId);

            CourseObjective existing = buildObjective(objectiveId, course,
                    "Old objective", 1);

            when(courseObjectiveRepository.findById(objectiveId))
                    .thenReturn(Optional.of(existing));

            when(courseObjectiveRepository.save(any(CourseObjective.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            CourseObjectiveRequest req = buildRequest(null, 2);

            CourseObjectiveResponse res =
                    courseObjectiveService.update(objectiveId, req);

            // Text giữ nguyên
            assertEquals("Old objective", res.getObjectiveText());
            // orderIndex được update
            assertEquals(2, res.getOrderIndex());
        }
    }

    // =====================================================================
    // delete
    // =====================================================================
    @Nested
    @DisplayName("CourseObjectiveService.delete")
    class DeleteTests {

        /**
         * CASE 1
         * NOTE – objectiveID không tồn tại -> OBJECTIVE_NOT_FOUND
         *  - Kỳ vọng:
         *      + throw AppException
         *      + không gọi deleteById
         */
        @Test
        @DisplayName("Objective không tồn tại -> throw AppException, không delete")
        void delete_objectiveNotFound_shouldThrow() {
            Long objectiveId = 99L;

            when(courseObjectiveRepository.existsById(objectiveId))
                    .thenReturn(false);

            assertThrows(AppException.class,
                    () -> courseObjectiveService.delete(objectiveId));

            verify(courseObjectiveRepository).existsById(objectiveId);
            verify(courseObjectiveRepository, never()).deleteById(anyLong());
        }

        /**
         * CASE 2 – HAPPY PATH
         * NOTE – objectiveID tồn tại -> delete thành công
         */
        @Test
        @DisplayName("Happy path - delete objective thành công")
        void delete_success() {
            Long objectiveId = 5L;

            when(courseObjectiveRepository.existsById(objectiveId))
                    .thenReturn(true);

            courseObjectiveService.delete(objectiveId);

            verify(courseObjectiveRepository).existsById(objectiveId);
            verify(courseObjectiveRepository).deleteById(objectiveId);
        }
    }
}
