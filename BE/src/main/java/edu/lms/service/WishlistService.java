package edu.lms.service;

import edu.lms.dto.response.CourseResponse;
import edu.lms.entity.Course;
import edu.lms.entity.Enrollment;
import edu.lms.entity.Tutor;
import edu.lms.entity.User;
import edu.lms.entity.Wishlist;
import edu.lms.enums.EnrollmentStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.CourseRepository;
import edu.lms.repository.CourseReviewRepository;
import edu.lms.repository.EnrollmentRepository;
import edu.lms.repository.UserRepository;
import edu.lms.repository.WishlistRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.stereotype.Service;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@Transactional
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class WishlistService {

    WishlistRepository wishlistRepository;
    UserRepository userRepository;
    CourseRepository courseRepository;
    EnrollmentRepository enrollmentRepository;
    CourseReviewRepository courseReviewRepository;

    // ============== Helper: Aggregated Rating ==============

    private record RatingAgg(double avg, int total) {}

    private RatingAgg aggregateRating(Long courseId) {
        var reviews = courseReviewRepository.findByCourse_CourseID(courseId);
        if (reviews == null || reviews.isEmpty()) return new RatingAgg(0.0, 0);

        int total = reviews.size();
        double sum = reviews.stream()
                .mapToDouble(r -> r.getRating() == null ? 0 : r.getRating())
                .sum();
        double avg = total == 0 ? 0.0 : sum / total;
        avg = Math.round(avg * 10.0) / 10.0; // làm tròn 1 chữ số
        return new RatingAgg(avg, total);
    }

    // ============== Public APIs ==============

    public void addToWishlist(String email, Long courseId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        wishlistRepository.findByUserAndCourse(user, course)
                .ifPresent(w -> { throw new AppException(ErrorCode.ALREADY_IN_WISHLIST); });

        wishlistRepository.save(Wishlist.builder()
                .user(user)
                .course(course)
                .build());
    }

    public void removeFromWishlist(String email, Long courseId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        wishlistRepository.deleteByUserAndCourse(user, course);
    }

    public List<CourseResponse> getMyWishlist(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return wishlistRepository.findByUser(user).stream()
                .map(w -> toCourseResponse(w.getCourse(), user))
                .toList();
    }

    // ============== Mapper: Course -> CourseResponse (FULL) ==============

    private CourseResponse toCourseResponse(Course c, User user) {
        Long courseId = c.getCourseID();

        // Trong wishlist thì chắc chắn đã được wishlist
        boolean isWishListed = true;

        // Check purchased
        boolean isPurchased = false;
        if (user != null) {
            var enrollmentOpt = enrollmentRepository
                    .findByUser_UserIDAndCourse_CourseID(user.getUserID(), courseId);
            if (enrollmentOpt.isPresent()) {
                Enrollment e = enrollmentOpt.get();
                EnrollmentStatus st = e.getStatus();
                isPurchased = (st == EnrollmentStatus.Active || st == EnrollmentStatus.Completed);
            }
        }

        long learnerCount = enrollmentRepository.countByCourse_CourseID(courseId);
        RatingAgg rating = aggregateRating(courseId);

        Tutor tutor = c.getTutor();
        User tutorUser = (tutor != null) ? tutor.getUser() : null;

        String categoryName = c.getCategory() != null ? c.getCategory().getName() : null;
        String tutorName = tutorUser != null ? tutorUser.getFullName() : null;
        String tutorAvatarURL = tutorUser != null ? tutorUser.getAvatarURL() : null;

        String tutorAddress = null;
        if (tutorUser != null) {
            String addr = tutorUser.getAddress();
            String country = tutorUser.getCountry();
            if (addr != null && country != null) {
                tutorAddress = addr + ", " + country;
            } else if (addr != null) {
                tutorAddress = addr;
            } else {
                tutorAddress = country;
            }
        }

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
                .categoryName(categoryName)
                .tutorName(tutorName)
                .status(c.getStatus() != null ? c.getStatus().name() : null)

                .isWishListed(isWishListed)
                .isPurchased(isPurchased)
                .learnerCount(learnerCount)

                .tutorAvatarURL(tutorAvatarURL)
                .tutorAddress(tutorAddress)
                .avgRating(rating.avg())
                .totalRatings(rating.total())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
