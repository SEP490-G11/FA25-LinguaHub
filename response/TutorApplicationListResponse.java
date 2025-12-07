
package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorApplicationListResponse {
    Long verificationId;
    Long tutorId;
    Long userId;
    String userEmail;
    String userName;
    String avatarURL;
    String country;
    String specialization;
    String teachingLanguage;
    Double pricePerHour; // Giá booking/slot mỗi giờ (giá tối thiểu từ các booking plans active)
    BigDecimal rating; // Rating từ learner feedback booking
    String status;
    LocalDateTime submittedAt;
    LocalDateTime reviewedAt;
}
