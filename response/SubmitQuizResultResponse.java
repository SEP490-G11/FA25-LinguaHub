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
public class SubmitQuizResultResponse {

    Integer totalQuestions;
    Integer correctQuestions;
    BigDecimal totalScore;   // tổng điểm đạt được
    BigDecimal maxScore;     // tổng điểm tối đa
    BigDecimal percentage;   // % điểm (0–100)

    // kèm chi tiết từng câu + giải thích + đáp án
    List<SubmitQuizQuestionResultResponse> questions;
}
