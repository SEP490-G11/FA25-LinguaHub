package edu.lms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorApprovalRequest {

    @NotBlank(message = "Reason is required when rejecting application")
    @Size(max = 1000, message = "Reason must be <= 1000 characters")
    String reason;
}
