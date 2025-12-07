package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorApplicationDetailResponse {
    Long verificationId;
    Long tutorId;
    Long userId;
    String userEmail;
    String userName;
    String userPhone;

    Short experience;
    String specialization;
    String teachingLanguage;
    String bio;
    List<TutorCertificateResponse> certificates;

    String status;
    LocalDateTime submittedAt;
    String reviewedBy;
    LocalDateTime reviewedAt;
    String reasonForReject;
}