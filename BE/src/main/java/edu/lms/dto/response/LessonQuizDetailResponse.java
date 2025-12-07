package edu.lms.dto.response;

import edu.lms.enums.LessonType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LessonQuizDetailResponse {

    Long lessonID;
    String lessonTitle;
    LessonType lessonType;

    // true = lesson live, false = lessonDraft
    Boolean isLive;

    List<QuizQuestionResponse> questions;
}
