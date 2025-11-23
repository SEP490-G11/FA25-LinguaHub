package edu.lms.service;

import edu.lms.dto.response.*;
import edu.lms.entity.*;
import edu.lms.enums.CourseStatus;
import edu.lms.enums.EnrollmentStatus;
import edu.lms.enums.LessonType;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CourseService {

    CourseRepository courseRepository;
    TutorRepository tutorRepository;
    WishlistRepository wishlistRepository;
    UserRepository userRepository;
    EnrollmentRepository enrollmentRepository;
    CourseReviewRepository courseReviewRepository;

    private User findUserOrNull(String email) {
        if (email == null || "anonymousUser".equalsIgnoreCase(email)) return null;
        return userRepository.findByEmail(email).orElse(null);
    }

    // ================================================================
    // Public: Get All Approved Courses
    // ================================================================
    public List<CourseResponse> getAllApproved(String email) {
        User user = findUserOrNull(email);

        return courseRepository.findByStatus(CourseStatus.Approved)
                .stream()
                .map(c -> toOnlyCourseResponse(c, user))
                .toList();
    }

    // ================================================================
    // Public: Get Approved Courses By Tutor
    // ================================================================
    public List<CourseResponse> getApprovedByTutor(Long tutorId, String email) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        User user = findUserOrNull(email);

        return courseRepository.findByTutorAndStatus(tutor, CourseStatus.Approved)
                .stream()
                .map(c -> toOnlyCourseResponse(c, user))
                .toList();
    }

    // ================================================================
    // Public: Get Course Detail (Only Approved)
    // ================================================================
    public CourseDetailResponse getCourseById(Long courseID, String email) {
        Course c = courseRepository.findById(courseID)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        if (c.getStatus() != CourseStatus.Approved) {
            throw new AppException(ErrorCode.COURSE_NOT_APPROVED);
        }

        User user = findUserOrNull(email);
        return toCourseResponse(c, user);
    }

    // ================================================================
    // Optional: For Admin Internal Use
    // ================================================================
    public List<CourseDetailResponse> getAllByStatus(CourseStatus status) {
        List<Course> courses = (status == null)
                ? courseRepository.findAll()
                : courseRepository.findByStatus(status);
        return courses.stream().map(c -> toCourseResponse(c, null)).toList();
    }

    // ============================ MAPPERS ============================

    private LessonResourceResponse toLessonResourceResponse(LessonResource lr) {
        return LessonResourceResponse.builder()
                .resourceID(lr.getResourceID())
                .resourceType(lr.getResourceType())
                .resourceTitle(lr.getResourceTitle())
                .resourceURL(lr.getResourceURL())
                .uploadedAt(lr.getUploadedAt())
                .build();
    }

    private LessonResponse toLessonResponse(Lesson l) {
        return LessonResponse.builder()
                .lessonID(l.getLessonID())
                .title(l.getTitle())
                .duration(l.getDuration())
                .lessonType(l.getLessonType())
                .videoURL(l.getVideoURL())
                .content(l.getContent())
                .orderIndex(l.getOrderIndex())
                .createdAt(l.getCreatedAt())
                .resources(l.getResources() != null
                        ? l.getResources().stream().map(this::toLessonResourceResponse).toList()
                        : null)
                .build();
    }

    private CourseSectionResponse toCourseSectionResponse(CourseSection s) {
        return CourseSectionResponse.builder()
                .sectionID(s.getSectionID())
                .courseID(s.getCourse().getCourseID())
                .title(s.getTitle())
                .description(s.getDescription())
                .orderIndex(s.getOrderIndex())
                .lessons(s.getLessons() != null
                        ? s.getLessons().stream().map(this::toLessonResponse).toList()
                        : null)
                .build();
    }

    // ====================== Review (rating + list) ===================

    private record RatingAgg(double avg, int total) {}

    private RatingAgg aggregateRating(Long courseId) {
        var reviews = courseReviewRepository.findByCourse_CourseID(courseId);
        if (reviews == null || reviews.isEmpty()) return new RatingAgg(0.0, 0);

        int total = reviews.size();
        double sum = reviews.stream().mapToDouble(r -> r.getRating() == null ? 0 : r.getRating()).sum();
        double avg = total == 0 ? 0.0 : sum / total;
        avg = Math.round(avg * 10.0) / 10.0; // 1 chữ số
        return new RatingAgg(avg, total);
    }

    private List<CourseReviewResponse> mapReviews(Long courseId) {
        var reviews = courseReviewRepository.findByCourse_CourseID(courseId);
        if (reviews == null || reviews.isEmpty()) return List.of();

        return reviews.stream().map(r -> {
            var u = r.getUser();
            return CourseReviewResponse.builder()
                    .feedbackID(r.getReviewID())
                    .userFullName(u != null ? u.getFullName() : null)
                    .userAvatarURL(u != null ? u.getAvatarURL() : null)
                    .rating(r.getRating())
                    .comment(r.getComment())
                    .createdAt(r.getCreatedAt())
                    .build();
        }).toList();
    }

    // =================== Content Summary (Video/Test/Res) ============

    private CourseContentSummaryResponse summarizeCourseContent(Course c) {
        double totalVideoHours = 0.0;
        int totalPracticeTests = 0;
        int totalArticles = 0;
        int totalResources = 0;

        if (c.getSections() != null) {
            for (CourseSection section : c.getSections()) {
                if (section.getLessons() == null) continue;
                for (Lesson l : section.getLessons()) {
                    if (l.getLessonType() == LessonType.Video && l.getDuration() != null) {
                        totalVideoHours += l.getDuration() / 60.0; // phút → giờ
                    }
                    if (l.getLessonType() == LessonType.Test) totalPracticeTests++;
                    if (l.getLessonType() == LessonType.Reading) totalArticles++;
                    if (l.getResources() != null) totalResources += l.getResources().size();
                }
            }
        }
        totalVideoHours = Math.round(totalVideoHours * 10.0) / 10.0;

        return CourseContentSummaryResponse.builder()
                .totalVideoHours(totalVideoHours)
                .totalPracticeTests(totalPracticeTests)
                .totalArticles(totalArticles)
                .totalDownloadableResources(totalResources)
                .build();
    }

    // ========================= COURSE DETAIL DTO =====================

    private CourseDetailResponse toCourseResponse(Course c, User user) {
        boolean isWishListed = (user != null) && wishlistRepository.existsByUserAndCourse(user, c);

        boolean isPurchased = false;
        if (user != null) {
            var enrollmentOpt = enrollmentRepository
                    .findByUser_UserIDAndCourse_CourseID(user.getUserID(), c.getCourseID());
            if (enrollmentOpt.isPresent()) {
                var st = enrollmentOpt.get().getStatus();
                isPurchased = (st == EnrollmentStatus.Active || st == EnrollmentStatus.Completed);
            }
        }

        Long courseId = c.getCourseID();
        long learnerCount = enrollmentRepository.countByCourse_CourseID(courseId);
        var rating = aggregateRating(courseId);
        var tutorUser = (c.getTutor() != null) ? c.getTutor().getUser() : null;
        var tutor = c.getTutor();

        return CourseDetailResponse.builder()
                .id(courseId)
                .title(c.getTitle())
                .shortDescription(c.getShortDescription())
                .description(c.getDescription())
                .requirement(c.getRequirement())
                .level(c.getLevel())
                .duration(c.getDuration())
                .price(c.getPrice())
                .language(c.getLanguage())
                .thumbnailURL(c.getThumbnailURL())
                .categoryName(c.getCategory() != null ? c.getCategory().getName() : null)
                .tutorName(tutorUser != null ? tutorUser.getFullName() : null)
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .objectives(c.getObjectives() == null ? List.of() :
                        c.getObjectives().stream()
                                .sorted(Comparator.comparing(CourseObjective::getOrderIndex))
                                .map(CourseObjective::getObjectiveText)
                                .toList())
                .section(c.getSections() != null
                        ? c.getSections().stream().map(this::toCourseSectionResponse).toList()
                        : null)
                .contentSummary(summarizeCourseContent(c))
                .isWishListed(user != null ? isWishListed : null) // guest -> null
                .isPurchased(isPurchased)                        // luôn boolean
                .learnerCount(learnerCount)
                .tutorID(tutor != null ? tutor.getTutorID() : null)
                .tutorAvatarURL(tutorUser != null ? tutorUser.getAvatarURL() : null)
                .tutorAddress(tutorUser != null
                        ? ((tutorUser.getAddress() != null && tutorUser.getCountry() != null)
                        ? tutorUser.getAddress() + ", " + tutorUser.getCountry()
                        : (tutorUser.getAddress() != null ? tutorUser.getAddress() : tutorUser.getCountry()))
                        : null)
                .avgRating(rating.avg())
                .totalRatings(rating.total())
                .createdAt(c.getCreatedAt())
                .review(mapReviews(courseId))
                .build();
    }

    // ========================= COURSE LIST DTO =======================

    private CourseResponse toOnlyCourseResponse(Course c, User user) {
        boolean isWishListed = (user != null) && wishlistRepository.existsByUserAndCourse(user, c);

        boolean isPurchased = false;
        if (user != null) {
            var enrollmentOpt = enrollmentRepository
                    .findByUser_UserIDAndCourse_CourseID(user.getUserID(), c.getCourseID());
            if (enrollmentOpt.isPresent()) {
                var st = enrollmentOpt.get().getStatus();
                isPurchased = (st == EnrollmentStatus.Active || st == EnrollmentStatus.Completed);
            }
        }

        Long courseId = c.getCourseID();
        long learnerCount = enrollmentRepository.countByCourse_CourseID(courseId);
        var rating = aggregateRating(courseId);
        var tutorUser = (c.getTutor() != null) ? c.getTutor().getUser() : null;

        return CourseResponse.builder()
                .id(courseId)
                .title(c.getTitle())
                .shortDescription(c.getShortDescription())
                .description(c.getDescription())
                .requirement(c.getRequirement())
                .level(c.getLevel())
                .duration(c.getDuration())
                .price(c.getPrice())
                .language(c.getLanguage())
                .thumbnailURL(c.getThumbnailURL())
                .categoryName(c.getCategory() != null ? c.getCategory().getName() : null)
                .tutorName(tutorUser != null ? tutorUser.getFullName() : null)
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .isWishListed(user != null ? isWishListed : null) // guest -> null
                .isPurchased(isPurchased)                        // luôn boolean
                .learnerCount(learnerCount)
                .tutorAvatarURL(tutorUser != null ? tutorUser.getAvatarURL() : null)
                .tutorAddress(tutorUser != null
                        ? ((tutorUser.getAddress() != null && tutorUser.getCountry() != null)
                        ? tutorUser.getAddress() + ", " + tutorUser.getCountry()
                        : (tutorUser.getAddress() != null ? tutorUser.getAddress() : tutorUser.getCountry()))
                        : null)
                .avgRating(rating.avg())
                .totalRatings(rating.total())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
