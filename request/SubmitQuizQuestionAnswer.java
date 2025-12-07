package edu.lms.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmitQuizQuestionAnswer {
    Long questionId;
    List<Long> selectedOptionIds;   // hỗ trợ multi-select, nếu single-select thì chỉ truyền 1 phần tử
}
