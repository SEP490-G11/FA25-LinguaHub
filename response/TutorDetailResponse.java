package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorDetailResponse {
    Long tutorId;
    Long userId;
    String userName;
    String userEmail;
    String avatarURL;
    String country;
    String phone;
    String bio;

    Short experience;
    String specialization;
    String teachingLanguage;
    BigDecimal rating; // Rating từ learner feedback booking
    String status;

    List<TutorCourseResponse> courses;
    Double pricePerHour; // Giá booking tối thiểu mỗi giờ (từ các booking plans active)
    List<TutorFeedbackItemResponse> feedbacks; // Danh sách feedback từ learner booking
    List<TutorCertificateResponse> certificates; // Danh sách chứng chỉ của tutor
}

