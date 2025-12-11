package edu.lms.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseReviewRequest {

    @NotNull(message = "Rating is required")
    @DecimalMin(value = "1.0", inclusive = true, message = "Rating must be at least 1.0")
    @DecimalMax(value = "5.0", inclusive = true, message = "Rating must be at most 5.0")
    Double rating;

    @NotBlank(message = "Comment is required")
    @Size(min = 1, max = 255, message = "Comment must be 1-255 characters")
    String comment;

    LocalDateTime createdAt;
}

