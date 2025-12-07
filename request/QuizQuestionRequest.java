package edu.lms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizQuestionRequest {

    @NotBlank
    String questionText;

    Integer orderIndex;

    String explanation;

    BigDecimal score;

    List<QuizOptionRequest> options;
}
