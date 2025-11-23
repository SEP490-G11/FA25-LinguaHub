package edu.lms.service;

import edu.lms.dto.response.TutorStudentCourseProgressResponse;
import edu.lms.dto.response.TutorStudentDetailResponse;
import edu.lms.dto.response.TutorStudentSummaryResponse;
import edu.lms.entity.*;
import edu.lms.enums.EnrollmentStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.EnrollmentRepository;
import edu.lms.repository.TutorRepository;
import edu.lms.repository.UserCourseSectionRepository;
import edu.lms.repository.UserLessonRepository;
import edu.lms.repository.UserRepository;
import lombok.AccessLevel;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TutorStudentService {

    TutorRepository tutorRepository;
    EnrollmentRepository enrollmentRepository;
    UserCourseSectionRepository userCourseSectionRepository;
    UserLessonRepository userLessonRepository;
    UserRepository userRepository;

    /**
     * Lấy danh sách học viên cho tutor đang login (qua email trong token)
     */
    public List<TutorStudentSummaryResponse> getStudentsForTutorByTutorEmail(String email) {
        Tutor tutor = tutorRepository.findByUser_Email(email)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        return getStudentsForTutor(tutor.getTutorID());
    }

    /**
     * Lấy danh sách học viên đã enroll các khóa của 1 tutor
     */
    public List<TutorStudentSummaryResponse> getStudentsForTutor(Long tutorId) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        // Tất cả enrollment vào các khóa thuộc tutor này
        List<Enrollment> enrollments =
                enrollmentRepository.findByCourse_Tutor_TutorID(tutor.getTutorID());

        if (enrollments.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, StudentAggregate> aggregateByUser = new LinkedHashMap<>();

        for (Enrollment e : enrollments) {
            User user = e.getUser();
            Long userId = user.getUserID();

            StudentAggregate agg = aggregateByUser.computeIfAbsent(
                    userId,
                    id -> new StudentAggregate(user)
            );

            // Mỗi enrollment = 1 course của tutor
            agg.totalCourses++;

            // Số khóa đã hoàn thành (theo status Enrollment)
            if (e.getStatus() == EnrollmentStatus.Completed) {
                agg.completedCourses++;
            }

            // Tiến độ 1 khóa = trung bình % tất cả section (section chưa có record = 0)
            BigDecimal courseProgress = calculateCourseProgressForEnrollment(e);

            agg.sumProgress = agg.sumProgress.add(courseProgress);
        }

        // Map sang DTO cho FE
        return aggregateByUser.values().stream()
                .map(agg -> TutorStudentSummaryResponse.builder()
                        .userId(agg.user.getUserID())
                        .fullName(agg.user.getFullName())
                        .email(agg.user.getEmail())
                        .avatarURL(agg.user.getAvatarURL())
                        .totalCourses(agg.totalCourses)
                        .completedCourses(agg.completedCourses)
                        .averageProgress(
                                agg.totalCourses == 0
                                        ? BigDecimal.ZERO
                                        : agg.sumProgress
                                        .divide(BigDecimal.valueOf(agg.totalCourses), 2, RoundingMode.HALF_UP)
                        )
                        .build())
                .toList();
    }

    /**
     * Detail 1 học viên cho tutor hiện tại:
     * - Thông tin profile
     * - Ngày tham gia đầu tiên (joinedAt)
     * - Hoạt động gần nhất (lastActivity)
     * - Tiến độ trung bình các khóa với tutor này
     * - Danh sách từng khóa + progress riêng
     */
    public TutorStudentDetailResponse getStudentDetailForTutorByEmail(String tutorEmail, Long studentId) {
        // 1. Lấy tutor từ email
        Tutor tutor = tutorRepository.findByUser_Email(tutorEmail)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        // 2. Lấy user (student)
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        Long tutorId = tutor.getTutorID();

        // 3. Các enrollment của học viên này vào KHÓA của tutor
        List<Enrollment> enrollments =
                enrollmentRepository.findByUser_UserIDAndCourse_Tutor_TutorID(studentId, tutorId);

        //  Nếu không có enrollment nào => không phải học sinh của tutor này
        if (enrollments.isEmpty()) {
            // Bạn có thể tạo ErrorCode riêng, ví dụ: STUDENT_NOT_IN_TUTOR_COURSE
            throw new AppException(ErrorCode.ENROLLMENT_NOT_FOUND);
        }

        List<TutorStudentCourseProgressResponse> courseDtos = new ArrayList<>();
        BigDecimal sumProgress = BigDecimal.ZERO;
        LocalDateTime joinedAt = null;

        for (Enrollment e : enrollments) {
            BigDecimal courseProgress = calculateCourseProgressForEnrollment(e);
            sumProgress = sumProgress.add(courseProgress);

            LocalDateTime created = e.getCreatedAt();
            if (created != null && (joinedAt == null || created.isBefore(joinedAt))) {
                joinedAt = created; // ngày tham gia đầu tiên
            }

            courseDtos.add(
                    TutorStudentCourseProgressResponse.builder()
                            .courseId(e.getCourse().getCourseID())
                            .courseTitle(e.getCourse().getTitle())
                            .enrolledAt(e.getCreatedAt())
                            .status(e.getStatus())
                            .progress(courseProgress)
                            .build()
            );
        }

        BigDecimal averageProgress = sumProgress.divide(
                BigDecimal.valueOf(courseDtos.size()),
                2,
                RoundingMode.HALF_UP
        );

        // 4. Hoạt động gần nhất
        LocalDateTime lastActivity =
                userLessonRepository.findLastActivityForStudentAndTutor(studentId, tutorId);

        // 5. Build response
        return TutorStudentDetailResponse.builder()
                .studentId(student.getUserID())
                .fullName(student.getFullName())
                .email(student.getEmail())
                .phone(student.getPhone())
                .avatarURL(student.getAvatarURL())
                .joinedAt(joinedAt)
                .lastActivity(lastActivity)
                .averageProgress(averageProgress)
                .courses(courseDtos)
                .build();
    }


    /**
     * Tính % tiến độ cho 1 enrollment:
     * - Lấy tất cả section của course
     * - Section nào chưa có UserCourseSection thì coi như 0%
     * - CourseProgress = trung bình % các section
     */
    private BigDecimal calculateCourseProgressForEnrollment(Enrollment enrollment) {
        User user = enrollment.getUser();
        Course course = enrollment.getCourse();
        List<CourseSection> sections = course.getSections();

        if (sections == null || sections.isEmpty()) {
            return BigDecimal.ZERO;
        }

        // Tất cả record user_course_section của user trong enrollment này
        List<UserCourseSection> userSections =
                userCourseSectionRepository.findByUser_UserIDAndEnrollment_EnrollmentID(
                        user.getUserID(),
                        enrollment.getEnrollmentID()
                );

        // Map sectionId -> progress (0–100)
        Map<Long, BigDecimal> progressBySectionId = userSections.stream()
                .collect(Collectors.toMap(
                        ucs -> ucs.getSection().getSectionID(),
                        ucs -> ucs.getProgress() == null ? BigDecimal.ZERO : ucs.getProgress()
                ));

        BigDecimal sum = BigDecimal.ZERO;

        // Với mỗi section của course, nếu chưa có record thì tính 0
        for (CourseSection s : sections) {
            BigDecimal p = progressBySectionId.getOrDefault(s.getSectionID(), BigDecimal.ZERO);
            sum = sum.add(p);
        }

        // Trung bình % các section
        return sum.divide(
                BigDecimal.valueOf(sections.size()),
                2,
                RoundingMode.HALF_UP
        );
    }

    @Data
    @FieldDefaults(level = AccessLevel.PRIVATE)
    private static class StudentAggregate {
        final User user;
        int totalCourses = 0;
        int completedCourses = 0;
        BigDecimal sumProgress = BigDecimal.ZERO;

        public StudentAggregate(User user) {
            this.user = user;
        }
    }
}
