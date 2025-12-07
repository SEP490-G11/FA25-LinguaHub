package edu.lms.dto.response;

import edu.lms.enums.LessonType;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LessonResponse {
    Long lessonID;
    String title;
    Short duration;
    LessonType lessonType;
    String videoURL;
    String content;
    Integer orderIndex;
    LocalDateTime createdAt;
    List<LessonResourceResponse> resources;
    List<QuizQuestionResponse> quizQuestions;
}
