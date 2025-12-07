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
public class SubmitQuizQuestionResultResponse {

    Long questionID;
    Boolean isCorrect;               // câu này đúng / sai
    BigDecimal questionScore;        // điểm đạt được cho câu này
    BigDecimal maxScore;             // điểm tối đa cho câu này

    List<Long> selectedOptionIds;    // option user đã chọn
    List<Long> correctOptionIds;     // option đúng

    String explanation;              // giải thích cho câu hỏi (nếu có)
}
