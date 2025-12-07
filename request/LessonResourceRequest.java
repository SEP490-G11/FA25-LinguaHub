package edu.lms.dto.request;

import edu.lms.enums.ResourceType;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LessonResourceRequest {

    @NotNull(message = "Resource type is required")
    ResourceType resourceType;

    @NotBlank(message = "Resource title must not be blank")
    @Size(max = 255, message = "Resource title must be <= 255 characters")
    String resourceTitle;

    @NotBlank(message = "Resource URL must not be empty")
    @Size(max = 500, message = "Resource URL must be <= 500 characters")
    @Pattern(regexp = "^(http|https)://.+$",
            message = "Resource URL must start with http:// or https://")
    String resourceURL;
}
