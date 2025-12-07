package edu.lms.dto.response;

import edu.lms.enums.CourseLevel;
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
public class CourseDetailResponse {
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
    String tutorName;
    String status;

    List<CourseSectionResponse> section;
    List<String> objectives;

    CourseContentSummaryResponse contentSummary;

    Boolean isWishListed;
    Boolean isPurchased;

    Long learnerCount;
    Long tutorID;
    String tutorAvatarURL;
    String tutorAddress;
    Double avgRating;
    Integer totalRatings;
    LocalDateTime createdAt;

    List<CourseReviewResponse> review;
}
