package edu.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CourseSectionResponse {
    Long sectionID;
    Long courseID;
    String title;
    String description;
    Integer orderIndex;
    List<LessonResponse> lessons;
}