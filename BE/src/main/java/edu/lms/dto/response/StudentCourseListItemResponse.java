// src/main/java/edu/lms/dto/response/StudentCourseListItemResponse.java
package edu.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static lombok.AccessLevel.PRIVATE;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = PRIVATE)
public class StudentCourseListItemResponse {
    Long courseID;
    String courseTitle;
    String tutorName;

    BigDecimal price;
    String language;
    String thumbnailURL;

    String status;              // Enrollment status
    LocalDateTime enrolledAt;

    BigDecimal progressPercent; // tổng quan
    Boolean isCompleted;        // ≥ 100% (hoặc 99.9%)
}
