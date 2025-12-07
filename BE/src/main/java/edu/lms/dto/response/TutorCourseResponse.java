package edu.lms.dto.response;

import edu.lms.enums.CourseLevel;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorCourseResponse {
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
    String status;
}
