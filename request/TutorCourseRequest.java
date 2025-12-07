package edu.lms.dto.request;

import edu.lms.enums.CourseLevel;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorCourseRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 255, message = "Title must be 3-255 characters")
    String title;

    @NotBlank(message = "Short description is required")
    @Size(max = 500, message = "Short description must be <= 500 characters")
    String shortDescription;

    @NotBlank(message = "Description is required")
    @Size(max = 5000, message = "Description must be <= 5000 characters")
    String description;

    @Size(max = 1000, message = "Requirement must be <= 1000 characters")
    String requirement;

    @NotNull(message = "Level is required")
    CourseLevel level;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1")
    @Max(value = 1000, message = "Duration must be <= 1000")
    Integer duration;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", inclusive = true, message = "Price must be >= 0.01")
    @Digits(integer = 8, fraction = 2, message = "Price must have up to 8 digits and 2 decimals")
    BigDecimal price;

    @NotBlank(message = "Language is required")
    @Size(max = 50, message = "Language must be <= 50 characters")
    @Pattern(regexp = "^[A-Za-z ]{2,50}$", message = "Language must contain only letters/spaces")
    String language;

    @NotBlank(message = "Thumbnail URL is required")
    @Size(max = 500, message = "Thumbnail URL must be <= 500 characters")
    @Pattern(regexp = "^(http|https)://.+$", message = "Thumbnail URL must start with http:// or https://")
    String thumbnailURL;

    @NotNull(message = "Category ID is required")
    @Positive(message = "Category ID must be a positive number")
    Long categoryID;
}
