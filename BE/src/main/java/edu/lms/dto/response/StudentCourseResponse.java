package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentCourseResponse {
    Long courseID;
    String courseTitle;
    String tutorName;
    BigDecimal price;
    String language;
    String thumbnailURL;
    String status; // EnrollmentStatus
    LocalDateTime enrolledAt;

    BigDecimal progressPercent;
    Boolean isCompleted;

    List<SectionProgressResponse> sectionProgress;
}
