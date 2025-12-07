package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SectionProgressResponse {
    Long sectionId;
    String sectionTitle;
    BigDecimal progress;
    Boolean isCompleted;
    List<LessonInSectionResponse> lessons;
}
