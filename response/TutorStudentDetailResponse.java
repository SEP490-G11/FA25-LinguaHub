package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorStudentDetailResponse {

    Long studentId;
    String fullName;
    String email;
    String phone;
    String avatarURL;

    LocalDateTime joinedAt;       // Ngày tham gia đầu tiên vào khóa của tutor
    LocalDateTime lastActivity;   // Hoạt động gần nhất với tutor
    BigDecimal averageProgress;   // Tiến độ TB tất cả khóa của tutor

    List<TutorStudentCourseProgressResponse> courses;  // Danh sách khóa học
}
