package edu.lms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseReviewRequest {


    Double rating;

    @NotBlank(message = "Comment is required")
    @Size(min = 1, max = 255, message = "Comment must be 1-255 characters")
    String comment;

    LocalDateTime createdAt;
}

