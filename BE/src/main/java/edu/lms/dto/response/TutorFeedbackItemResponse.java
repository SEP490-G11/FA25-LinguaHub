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
public class TutorFeedbackItemResponse {
    Long feedbackID;
    BigDecimal rating;
    String comment;
    LocalDateTime createdAt;
    String learnerName; // Tên của learner đã feedback
    String learnerAvatarURL; // Avatar của learner
}

