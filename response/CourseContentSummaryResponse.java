package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseContentSummaryResponse {
    Double totalVideoHours;
    Integer totalPracticeTests;
    Integer totalArticles;
    Integer totalDownloadableResources;
}

