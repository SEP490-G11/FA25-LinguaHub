package edu.lms.dto.response;

import edu.lms.enums.CourseLevel;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminCourseResponse {
    Long id;
    String title;
    String shortDescription;
    String description;
    String requirement;
    CourseLevel level;

    Integer duration;
    BigDecimal price;
    String language;
    String thumbnailURL;
    String categoryName;

    String tutorEmail;
    String tutorName;
    String status;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    String adminReviewNote;
}
