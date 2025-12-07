package edu.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class BookingFeedbackResponse {
    Long feedbackID;
    Long tutorId;
    String tutorName;

    BigDecimal rating;
    String comment;
    LocalDateTime createdAt;

    String userFullName;
    String userAvatarURL;
}
