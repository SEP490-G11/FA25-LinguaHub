package edu.lms.service;

import edu.lms.dto.request.LessonRequest;
import edu.lms.dto.response.LessonResourceResponse;
import edu.lms.dto.response.LessonResponse;
import edu.lms.entity.*;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import edu.lms.service.LessonService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
@Transactional
public class LessonServiceImpl implements LessonService {

        LessonRepository lessonRepository;
        CourseSectionRepository courseSectionRepository;
        EnrollmentRepository enrollmentRepository;
        UserRepository userRepository;
        LessonResourceRepository lessonResourceRepository;

        // ===================== Helpers =====================

        private User findUserByEmailOr401(String email) {
                return userRepository.findByEmail(email)
                        .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        }

        private boolean isTutorOwner(User user, Course course) {
                String tutorEmail = course.getTutor().getUser().getEmail();
                return tutorEmail.equalsIgnoreCase(user.getEmail());
        }

        private boolean isEnrolled(User user, Long courseId) {
                return enrollmentRepository
                        .findByUser_UserIDAndCourse_CourseID(user.getUserID(), courseId)
                        .isPresent();
        }

        /** Cho phép xem nếu là tutor owner hoặc learner đã enroll */
        private void ensureCanView(User user, Course course) {
                if (isTutorOwner(user, course)) return;
                if (isEnrolled(user, course.getCourseID())) return;
                throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        /** Chỉ tutor owner mới được chỉnh sửa */
        private void ensureOwner(User user, Course course) {
                if (!isTutorOwner(user, course)) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }
        }

        private LessonResourceResponse mapRes(LessonResource r) {
                return LessonResourceResponse.builder()
                        .resourceID(r.getResourceID())
                        .resourceType(r.getResourceType())
                        .resourceTitle(r.getResourceTitle())
                        .resourceURL(r.getResourceURL())
                        .uploadedAt(r.getUploadedAt())
                        .build();
        }

        private LessonResponse toResponse(Lesson l) {
                return LessonResponse.builder()
                        .lessonID(l.getLessonID())
                        .title(l.getTitle())
                        .duration(l.getDuration())              // <-- dùng duration (Short)
                        .lessonType(l.getLessonType())
                        .videoURL(l.getVideoURL())
                        .content(l.getContent())
                        .orderIndex(l.getOrderIndex())
                        .createdAt(l.getCreatedAt())
                        .resources(l.getResources() == null
                                ? List.of()
                                : l.getResources().stream().map(this::mapRes).toList())
                        .build();
        }

        // Create / Update / Delete

        @Override
        public LessonResponse createLesson(Long sectionID, LessonRequest request, String email) {
                CourseSection section = courseSectionRepository.findById(sectionID)
                        .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
                Course course = section.getCourse();

                User user = findUserByEmailOr401(email);
                ensureOwner(user, course);

                Lesson lesson = Lesson.builder()
                        .section(section)
                        .title(request.getTitle())
                        .content(request.getContent())
                        .orderIndex(request.getOrderIndex())
                        .duration(request.getDuration())
                        .lessonType(request.getLessonType())
                        .videoURL(request.getVideoURL())
                        .createdAt(LocalDateTime.now())
                        .build();

                return toResponse(lessonRepository.save(lesson));
        }

        @Override
        public LessonResponse updateLesson(Long lessonId, LessonRequest request, String email) {
                Lesson lesson = lessonRepository.findById(lessonId)
                        .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
                Course course = lesson.getSection().getCourse();

                User user = findUserByEmailOr401(email);
                ensureOwner(user, course);

                lesson.setTitle(request.getTitle());
                lesson.setContent(request.getContent());
                lesson.setOrderIndex(request.getOrderIndex());
                lesson.setDuration(request.getDuration());
                lesson.setLessonType(request.getLessonType());
                lesson.setVideoURL(request.getVideoURL());

                return toResponse(lessonRepository.save(lesson));
        }


        @Override
        @Transactional
        public void deleteLesson(Long lessonId, String email) {
                Lesson lesson = lessonRepository.findById(lessonId)
                        .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));

                Course course = lesson.getSection().getCourse();

                User user = findUserByEmailOr401(email);
                ensureOwner(user, course);

                // KHÔNG xoá resource thủ công nữa,
                // orphanRemoval = true sẽ tự xoá LessonResource khi xoá Lesson
                lessonRepository.delete(lesson);
        }


        //Read

        @Override
        public List<LessonResponse> getLessonsBySection(Long sectionID, String email) {
                CourseSection section = courseSectionRepository.findById(sectionID)
                        .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
                Course course = section.getCourse();

                User user = findUserByEmailOr401(email);
                ensureCanView(user, course);

                return lessonRepository.findBySectionSectionID(sectionID)
                        .stream().map(this::toResponse).toList();
        }

        @Override
        public List<LessonResponse> getLessonsBySectionWithFilters(Long sectionID, String email,
                                                                   String keyword, String sortBy, String order) {
                List<LessonResponse> base = getLessonsBySection(sectionID, email);
                if (keyword != null && !keyword.isBlank()) {
                        String kw = keyword.toLowerCase(Locale.ROOT);
                        base = base.stream()
                                .filter(l -> (l.getTitle() != null && l.getTitle().toLowerCase(Locale.ROOT).contains(kw))
                                        || (l.getContent() != null && l.getContent().toLowerCase(Locale.ROOT).contains(kw)))
                                .collect(Collectors.toList());
                }

                Comparator<LessonResponse> cmp = Comparator.comparing(
                        LessonResponse::getOrderIndex, Comparator.nullsLast(Integer::compareTo));

                if ("title".equalsIgnoreCase(sortBy)) {
                        cmp = Comparator.comparing(LessonResponse::getTitle,
                                Comparator.nullsLast(String::compareToIgnoreCase));
                } else if ("duration".equalsIgnoreCase(sortBy)) {
                        cmp = Comparator.comparing(LessonResponse::getDuration,
                                Comparator.nullsLast(Short::compareTo));
                } else if ("createdAt".equalsIgnoreCase(sortBy)) {
                        cmp = Comparator.comparing(LessonResponse::getCreatedAt,
                                Comparator.nullsLast((a, b) -> a.compareTo(b)));
                }

                if ("DESC".equalsIgnoreCase(order)) {
                        cmp = cmp.reversed();
                }

                return base.stream().sorted(cmp).toList();
        }

        @Override
        public LessonResponse getLessonDetail(Long lessonId, String email) {
                Lesson lesson = lessonRepository.findById(lessonId)
                        .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
                Course course = lesson.getSection().getCourse();

                User user = findUserByEmailOr401(email);
                ensureCanView(user, course);

                return toResponse(lesson);
        }
}
