package edu.lms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseObjectiveRequest {

    @NotBlank(message = "Objective text cannot be blank")
    String objectiveText;

    @Builder.Default
    Integer orderIndex = 1;
}





