package edu.lms.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseSectionRequest {

    @NotBlank(message = "Section title is required")
    @Size(min = 1, max = 255, message = "Section title must be 1-255 characters")
    String title;

    @Size(max = 2000, message = "Section description must be <= 2000 characters")
    String description;

    @Min(value = 0, message = "orderIndex must be >= 0")
    Integer orderIndex;
}
