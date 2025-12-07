package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorStudentBookingSummaryResponse {

    Long userId;
    String fullName;
    String email;
    String avatarURL;

    Integer totalPaidSlots;      // Tổng số slot 1-1 đã Paid với tutor này
    LocalDateTime lastSlotTime;  // Thời gian buổi học gần nhất
}
