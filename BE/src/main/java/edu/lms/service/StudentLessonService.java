package edu.lms.service;

import edu.lms.dto.request.LessonProgressRequest;
import edu.lms.dto.response.LessonProgressResponse;
import edu.lms.entity.*;
import edu.lms.enums.EnrollmentStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentLessonService {

    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final UserLessonRepository userLessonRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserCourseSectionRepository userCourseSectionRepository;

    @Transactional
    public LessonProgressResponse saveLessonProgress(String email, Long lessonId, LessonProgressRequest request) {
        // 1. Lấy user từ email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        // 2. Lấy lesson
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // 3. Lấy courseId
        Long courseId = lesson.getSection().getCourse().getCourseID();

        // 4. Kiểm tra learner đã enroll chưa
        Enrollment enrollment = enrollmentRepository
                .findByUser_UserIDAndCourse_CourseID(user.getUserID(), courseId)
                .orElseThrow(() -> new AppException(ErrorCode.ENROLLMENT_NOT_FOUND));

        // 5. Tìm hoặc tạo UserLesson
        UserLesson userLesson = userLessonRepository
                .findByUser_UserIDAndLesson_LessonID(user.getUserID(), lessonId)
                .orElseGet(() -> UserLesson.builder()
                        .user(user)
                        .lesson(lesson)
                        .enrollment(enrollment)
                        .isDone(false)
                        .watchedDuration(0)
                        .build());

        // 6. Cập nhật tiến độ bài học
        userLesson.setWatchedDuration(request.getWatchedDuration());
        userLesson.setIsDone(request.getIsDone());

        if (Boolean.TRUE.equals(request.getIsDone())) {
            userLesson.setCompletedAt(LocalDateTime.now());
        }

        userLessonRepository.save(userLesson);

        // 7. Cập nhật tiến độ section
        updateUserCourseSectionProgress(user, lesson.getSection(), enrollment);

        // 8. Sau khi cập nhật section, kiểm tra xem course đã hoàn thành chưa
        updateEnrollmentStatusIfCourseCompleted(user, lesson.getSection(), enrollment);

        return LessonProgressResponse.builder()
                .lessonId(lesson.getLessonID())
                .userId(user.getUserID())
                .isDone(userLesson.getIsDone())
                .watchedDuration(userLesson.getWatchedDuration())
                .completedAt(userLesson.getCompletedAt())
                .build();
    }

    private void updateUserCourseSectionProgress(User user, CourseSection section, Enrollment enrollment) {
        List<Lesson> lessons = section.getLessons();
        if (lessons == null || lessons.isEmpty()) return;

        long totalLessons = lessons.size();

        long completedLessons = lessons.stream()
                .filter(lesson -> userLessonRepository
                        .findByUser_UserIDAndLesson_LessonID(user.getUserID(), lesson.getLessonID())
                        .map(UserLesson::getIsDone)
                        .orElse(false))
                .count();

        double progressPercent = ((double) completedLessons / totalLessons) * 100;

        UserCourseSection userCourseSection = userCourseSectionRepository
                .findByUser_UserIDAndSection_SectionID(user.getUserID(), section.getSectionID())
                .orElseGet(() -> UserCourseSection.builder()
                        .user(user)
                        .section(section)
                        .enrollment(enrollment)
                        .progress(BigDecimal.ZERO)
                        .build());

        userCourseSection.setProgress(BigDecimal.valueOf(progressPercent));
        userCourseSectionRepository.save(userCourseSection);
    }

    // 👇 HÀM MỚI: nếu tất cả section của course đều >=100% thì set Completed
    private void updateEnrollmentStatusIfCourseCompleted(
            User user,
            CourseSection currentSection,
            Enrollment enrollment
    ) {
        Course course = currentSection.getCourse();
        List<CourseSection> allSections = course.getSections();
        if (allSections == null || allSections.isEmpty()) {
            return;
        }

        // Lấy toàn bộ progress section của user trong enrollment này
        List<UserCourseSection> userSections =
                userCourseSectionRepository.findByUser_UserIDAndEnrollment_EnrollmentID(
                        user.getUserID(),
                        enrollment.getEnrollmentID()
                );

        // Nếu số record progress < số section -> chắc chắn chưa hoàn thành
        if (userSections.size() < allSections.size()) {
            return;
        }

        boolean allCompleted = userSections.stream()
                .allMatch(ucs ->
                        ucs.getProgress() != null &&
                                ucs.getProgress().compareTo(BigDecimal.valueOf(100)) >= 0
                );

        if (allCompleted && enrollment.getStatus() != EnrollmentStatus.Completed) {
            enrollment.setStatus(EnrollmentStatus.Completed);
            enrollmentRepository.save(enrollment);
        }
    }
}
