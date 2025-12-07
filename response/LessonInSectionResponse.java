package edu.lms.dto.response;

import edu.lms.enums.LessonType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LessonInSectionResponse {
    Long lessonId;
    String lessonTitle;
    LessonType lessonType;
    Boolean isDone;

    Integer totalQuizQuestions;   // tổng số câu quiz (nullable nếu không phải Quiz)
    Integer correctAnswers;       // số câu đúng lần gần nhất (nullable nếu chưa làm)
    Double  scorePercent;         // điểm % lần gần nhất
    Boolean passed;               // true/false nếu có set pass rule, null nếu chưa làm
}
