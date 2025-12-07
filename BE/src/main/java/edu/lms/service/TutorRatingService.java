package edu.lms.service;

import edu.lms.entity.Feedback;
import edu.lms.entity.Tutor;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.FeedbackRepository;
import edu.lms.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class TutorRatingService {

    TutorRepository tutorRepository;
    FeedbackRepository feedbackRepository;

    /**
     * Tính lại rating của tutor dựa trên:
     *  - Tất cả Booking Feedback (Feedback) có payment.tutorId = tutorId
     *  (KHÔNG còn tính CourseReview nữa)
     */
    @Transactional
    public void recalculateTutorRating(Long tutorId) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        // Lấy tất cả feedback booking của tutor
        List<Feedback> bookingFeedbacks = feedbackRepository.findByPayment_TutorId(tutorId);

        double avgRating = bookingFeedbacks.stream()
                .map(f -> f.getRating().doubleValue()) // BigDecimal -> double
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        tutor.setRating(BigDecimal.valueOf(avgRating));
        tutorRepository.save(tutor);
    }
}
