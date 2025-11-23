package edu.lms.dto.response;

import edu.lms.enums.EnrollmentStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorStudentCourseProgressResponse {

    Long courseId;
    String courseTitle;

    LocalDateTime enrolledAt;          // Ngày ghi danh
    EnrollmentStatus status;           // Đang học / Hoàn thành ...

    BigDecimal progress;               // % tiến độ khóa học (0–100)
}
