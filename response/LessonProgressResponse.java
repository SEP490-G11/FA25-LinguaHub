package edu.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class LessonProgressResponse {
    private Long lessonId;
    private Long userId;
    private Boolean isDone;
    private Integer watchedDuration;
    private LocalDateTime completedAt;
}
