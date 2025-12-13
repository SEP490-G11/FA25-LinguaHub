package edu.lms.dto.response;

import edu.lms.enums.ResourceType;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LessonResourceResponse {
    Long resourceID;
    ResourceType resourceType;
    String resourceTitle;
    String resourceURL;
    LocalDateTime uploadedAt;
}
