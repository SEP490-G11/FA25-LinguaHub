package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorCourseStudentResponse {
    Long userId;
    String fullName;
    String email;
    String phone;
    String country;
    LocalDateTime enrolledAt;
}
