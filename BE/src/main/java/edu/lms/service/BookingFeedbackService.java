package edu.lms.service;

import edu.lms.dto.request.BookingFeedbackRequest;
import edu.lms.dto.response.BookingFeedbackResponse;
import edu.lms.entity.*;
import edu.lms.enums.PaymentStatus;
import edu.lms.enums.PaymentType;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class BookingFeedbackService {

    BookingPlanRepository bookingPlanRepository;
    PaymentRepository paymentRepository;
    FeedbackRepository feedbackRepository;
    UserRepository userRepository;
    TutorRepository tutorRepository;
    CourseRepository courseRepository;
    CourseReviewRepository courseReviewRepository;
    TutorRatingService tutorRatingService;

    @Transactional
    public BookingFeedbackResponse createFeedback(Long bookingPlanId, BookingFeedbackRequest request) {

        // 1. Lấy user hiện tại
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // 2. Check BookingPlan tồn tại
        BookingPlan bookingPlan = bookingPlanRepository.findById(bookingPlanId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_PLAN_NOT_FOUND));

        // 3. Tìm payment booking đã SUCCESS của user cho plan này
        Payment payment = paymentRepository
                .findFirstByTargetIdAndUserIdAndPaymentTypeAndStatusOrderByPaidAtDesc(
                        bookingPlanId,
                        user.getUserID(),
                        PaymentType.Booking,
                        PaymentStatus.PAID
                )
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_PAID));

        // 4. Kiểm tra đã feedback payment này chưa
        boolean alreadyFeedback = feedbackRepository
                .findByPayment_PaymentIDAndUser_UserID(payment.getPaymentID(), user.getUserID())
                .isPresent();

        if (alreadyFeedback) {
            throw new AppException(ErrorCode.ALREADY_FEEDBACK);
        }

        // 5. Validate rating (0.5 step)
        validateRating(request.getRating());

        // 6. Tạo Feedback
        Feedback feedback = Feedback.builder()
                .user(user)
                .payment(payment)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        feedbackRepository.save(feedback);

        // 7. Cập nhật lại rating của Tutor (CourseReview + Booking Feedback)
        Tutor tutor = tutorRepository.findById(payment.getTutorId())
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        tutorRatingService.recalculateTutorRating(tutor.getTutorID());

        // 8. Trả về response
        return BookingFeedbackResponse.builder()
                .feedbackID(feedback.getFeedbackID())
                .tutorId(tutor.getTutorID())
                .tutorName(tutor.getUser() != null ? tutor.getUser().getFullName() : null)
                .rating(feedback.getRating())
                .comment(feedback.getComment())
                .createdAt(LocalDateTime.now())
                .userFullName(user.getFullName())
                .userAvatarURL(user.getAvatarURL())
                .build();
    }

    @Transactional
    public BookingFeedbackResponse updateFeedback(Long feedbackId, BookingFeedbackRequest request) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

        if (!feedback.getUser().getUserID().equals(user.getUserID())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        validateRating(request.getRating());

        feedback.setRating(request.getRating());
        feedback.setComment(request.getComment());

        feedbackRepository.save(feedback);

        Tutor tutor = tutorRepository.findById(feedback.getPayment().getTutorId())
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        tutorRatingService.recalculateTutorRating(tutor.getTutorID());

        return BookingFeedbackResponse.builder()
                .feedbackID(feedback.getFeedbackID())
                .tutorId(tutor.getTutorID())
                .tutorName(tutor.getUser() != null ? tutor.getUser().getFullName() : null)
                .rating(feedback.getRating())
                .comment(feedback.getComment())
                .createdAt(feedback.getPayment().getPaidAt())
                .userFullName(user.getFullName())
                .userAvatarURL(user.getAvatarURL())
                .build();
    }

    @Transactional
    public void deleteFeedback(Long feedbackId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

        if (!feedback.getUser().getUserID().equals(user.getUserID())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        Tutor tutor = tutorRepository.findById(feedback.getPayment().getTutorId())
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        feedbackRepository.delete(feedback);

        tutorRatingService.recalculateTutorRating(tutor.getTutorID());
    }

    // ====================== HELPER =========================

    private void validateRating(BigDecimal rating) {
        if (rating == null) {
            throw new AppException(ErrorCode.INVALID_RATING);
        }

        // 0 <= rating <= 5
        if (rating.compareTo(BigDecimal.ZERO) < 0 || rating.compareTo(BigDecimal.valueOf(5)) > 0) {
            throw new AppException(ErrorCode.INVALID_RATING);
        }

        // bước 0.5 -> rating * 2 là số nguyên
        BigDecimal doubled = rating.multiply(BigDecimal.valueOf(2));
        if (doubled.stripTrailingZeros().scale() > 0) {
            throw new AppException(ErrorCode.INVALID_RATING);
        }
    }
}
