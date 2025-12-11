package edu.lms.dto.request;

import edu.lms.enums.LessonType;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LessonRequest {

    @NotBlank(message = "Lesson title must not be blank")
    @Size(max = 255, message = "Lesson title must be <= 255 characters")
    String title;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Max(value = 600, message = "Duration cannot exceed 600 minutes")
    Short duration;

    @NotNull(message = "Lesson type is required")
    LessonType lessonType;

    @Size(max = 500, message = "Video URL is too long (<= 500)")
    @Pattern(
            regexp = "^(|http://.+|https://.+)$",
            message = "Video URL must be empty or start with http(s)://"
    )
    String videoURL;

    @Size(max = 10000, message = "Lesson content too long (max 10000 chars)")
    String content;

    @Min(value = 0, message = "orderIndex must be >= 0")
    Integer orderIndex;

    // --- Conditional validations ---

    @AssertTrue(message = "Video URL is required when lessonType is Video")
    private boolean isVideoUrlRequiredWhenTypeIsVideo() {
        if (lessonType == null) return true;

        if (lessonType == LessonType.Video) {
            return videoURL != null && !videoURL.isBlank();
        }
        return true;
    }

    @AssertTrue(message = "Content is required when lessonType is Reading")
    private boolean isContentRequiredWhenTypeIsReading() {
        if (lessonType == null) return true;

        if (lessonType == LessonType.Reading) {
            return content != null && !content.isBlank();
        }
        return true;
    }
}
