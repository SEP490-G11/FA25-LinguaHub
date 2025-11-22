package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorStudentSummaryResponse {

    Long userId;           // id học viên
    String fullName;
    String email;
    String avatarUrl;
    String country;
    String phone;

    Long totalBookedSlots; // tổng số slot Paid với tutor này
    LocalDateTime lastSlotTime; // thời gian buổi học gần nhất (startTime)
}
