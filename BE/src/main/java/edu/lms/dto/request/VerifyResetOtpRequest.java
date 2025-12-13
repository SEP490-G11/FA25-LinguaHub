package edu.lms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyResetOtpRequest {
    @NotBlank(message = "OTP is required")
    private String otp;
}
