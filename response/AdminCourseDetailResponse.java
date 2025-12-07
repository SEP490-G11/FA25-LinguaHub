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
public class AdminCourseDetailResponse {

    Long id;        // courseID (live) hoặc draftID (draft)
    Long courseID;  // luôn là course gốc

    Boolean draft;  // true = course draft, false = course live

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

    String status;      // CourseStatus hoặc CourseDraftStatus
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    String adminReviewNote;

    Integer totalRatings;
    Double avgRating;
    Long learnerCount;

    List<CourseSectionResponse> sections; // Section + Lesson + Resource
    List<String> objectives;              // Danh sách mục tiêu (text)
}
