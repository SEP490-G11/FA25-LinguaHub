package edu.lms.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import static lombok.AccessLevel.PRIVATE;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = PRIVATE)
public class AdminCourseReviewNoteRequest {
    String note;   // nội dung lý do / ghi chú
}
