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
public class AdminCourseDraftResponse {

    Long draftID;
    Long courseID;

    String title;
    String shortDescription;
    String description;
    String requirement;
    String level;

    Integer duration;
    BigDecimal price;
    String language;
    String thumbnailURL;

    String categoryName;
    String tutorEmail;
    String tutorName;

    String status; // CourseDraftStatus
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    String adminReviewNote;
}
