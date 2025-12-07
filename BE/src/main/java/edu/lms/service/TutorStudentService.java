package edu.lms.service;

import edu.lms.dto.response.TutorStudentBookingSummaryResponse;
import edu.lms.dto.response.TutorStudentCourseProgressResponse;
import edu.lms.dto.response.TutorStudentDetailResponse;
import edu.lms.dto.response.TutorStudentSummaryResponse;
import edu.lms.entity.*;
import edu.lms.enums.EnrollmentStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
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
    BookingPlanSlotRepository bookingPlanSlotRepository;

    /**
     * Lấy danh sách học viên cho tutor đang login (qua email trong token)
     * => VẪN dùng cho COURSE (enrollment) như cũ
     */
    public List<TutorStudentSummaryResponse> getStudentsForTutorByTutorEmail(String email) {
        Tutor tutor = tutorRepository.findByUser_Email(email)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        return getStudentsForTutor(tutor.getTutorID());
    }

    /**
     * Lấy danh sách học viên đã enroll các khóa của 1 tutor (CHỈ COURSE)
     * => Logic gốc
     */
    public List<TutorStudentSummaryResponse> getStudentsForTutor(Long tutorId) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

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

            agg.totalCourses++;

            if (e.getStatus() == EnrollmentStatus.Completed) {
                agg.completedCourses++;
            }

            BigDecimal courseProgress = calculateCourseProgressForEnrollment(e);
            agg.sumProgress = agg.sumProgress.add(courseProgress);
        }

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
     * NEW: Lấy danh sách học viên theo BOOKING (slot 1-1) cho tutor đang login (qua email)
     */
    public List<TutorStudentBookingSummaryResponse> getBookingStudentsForTutorByTutorEmail(String email) {
        Tutor tutor = tutorRepository.findByUser_Email(email)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        return getBookingStudentsForTutor(tutor.getTutorID());
    }

    /**
     * NEW: Lấy danh sách học viên theo BOOKING (slot 1-1) của 1 tutor
     *  - Dựa trên BookingPlanSlot, status = Paid
     *  - Group theo userId
     */
    public List<TutorStudentBookingSummaryResponse> getBookingStudentsForTutor(Long tutorId) {

        List<BookingPlanSlot> slots = bookingPlanSlotRepository.findBookedSlotsByTutorID(tutorId);

        if (slots.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, BookingStudentAggregate> aggregateByUser = new LinkedHashMap<>();

        for (BookingPlanSlot slot : slots) {
            Long userId = slot.getUserID();
            if (userId == null) continue;

            BookingStudentAggregate agg = aggregateByUser.computeIfAbsent(userId, id -> {
                User user = userRepository.findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
                return new BookingStudentAggregate(user);
            });

            agg.totalPaidSlots++;

            LocalDateTime start = slot.getStartTime();
            if (start != null && (agg.lastSlotTime == null || start.isAfter(agg.lastSlotTime))) {
                agg.lastSlotTime = start;
            }
        }

        return aggregateByUser.values().stream()
                .map(agg -> TutorStudentBookingSummaryResponse.builder()
                        .userId(agg.user.getUserID())
                        .fullName(agg.user.getFullName())
                        .email(agg.user.getEmail())
                        .avatarURL(agg.user.getAvatarURL())
                        .totalPaidSlots(agg.totalPaidSlots)
                        .lastSlotTime(agg.lastSlotTime)
                        .build())
                .toList();
    }

    /**
     * Detail 1 học viên cho tutor hiện tại (theo COURSE)
     */
    public TutorStudentDetailResponse getStudentDetailForTutorByEmail(String tutorEmail, Long studentId) {
        Tutor tutor = tutorRepository.findByUser_Email(tutorEmail)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        Long tutorId = tutor.getTutorID();

        List<Enrollment> enrollments =
                enrollmentRepository.findByUser_UserIDAndCourse_Tutor_TutorID(studentId, tutorId);

        if (enrollments.isEmpty()) {
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
                joinedAt = created;
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

        LocalDateTime lastActivity =
                userLessonRepository.findLastActivityForStudentAndTutor(studentId, tutorId);

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

    // =============== COURSE PROGRESS ===============

    private BigDecimal calculateCourseProgressForEnrollment(Enrollment enrollment) {
        User user = enrollment.getUser();
        Course course = enrollment.getCourse();
        List<CourseSection> sections = course.getSections();

        if (sections == null || sections.isEmpty()) {
            return BigDecimal.ZERO;
        }

        List<UserCourseSection> userSections =
                userCourseSectionRepository.findByUser_UserIDAndEnrollment_EnrollmentID(
                        user.getUserID(),
                        enrollment.getEnrollmentID()
                );

        Map<Long, BigDecimal> progressBySectionId = userSections.stream()
                .collect(Collectors.toMap(
                        ucs -> ucs.getSection().getSectionID(),
                        ucs -> ucs.getProgress() == null ? BigDecimal.ZERO : ucs.getProgress()
                ));

        BigDecimal sum = BigDecimal.ZERO;

        for (CourseSection s : sections) {
            BigDecimal p = progressBySectionId.getOrDefault(s.getSectionID(), BigDecimal.ZERO);
            sum = sum.add(p);
        }

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

    @Data
    @FieldDefaults(level = AccessLevel.PRIVATE)
    private static class BookingStudentAggregate {
        final User user;
        int totalPaidSlots = 0;
        LocalDateTime lastSlotTime;
    }
}
