package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorStudentSummaryResponse {

    Long userId;
    String fullName;
    String email;
    String avatarURL;

    Integer totalCourses;      // Số khóa học của tutor mà student này đã enroll
    Integer completedCourses;  // Số khóa học đã hoàn thành trong số đó
    BigDecimal averageProgress; // Tiến độ TB (%) của các khóa học đó
}
