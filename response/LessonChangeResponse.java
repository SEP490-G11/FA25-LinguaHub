// src/main/java/edu/lms/dto/response/LessonChangeResponse.java
package edu.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class LessonChangeResponse {
    Long originalLessonId;    // null nếu lesson mới
    Long draftLessonId;
    String title;
    String lessonType;        // VIDEO / READING / ...
    String changeType;        // "ADDED", "UPDATED", "DELETED"
    List<FieldChangeResponse> fieldChanges;

    // flag để Admin dễ thấy bài này có ảnh hưởng tới tiến trình học
    Boolean resetUserProgressRequired;
}
