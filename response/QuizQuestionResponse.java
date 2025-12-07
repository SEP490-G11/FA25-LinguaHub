package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizQuestionResponse {

    Long questionID;
    String questionText;
    Integer orderIndex;
    String explanation;
    BigDecimal score;
    List<QuizOptionResponse> options;
}
