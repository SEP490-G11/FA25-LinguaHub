package edu.lms.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorApplyRequest {

    @NotNull(message = "Experience is required")
    @Min(value = 0, message = "Experience must be >= 0")
    @Max(value = 60, message = "Experience must be <= 60")
    Short experience;

    @NotBlank(message = "Specialization is required")
    @Size(min = 3, message = "Specialization must be at least 3 characters")
    @Pattern(regexp = "^[\\p{L}0-9\\s,.-]+$", message = "Specialization contains invalid characters. Only letters (including Vietnamese), numbers, spaces, commas, dots, and hyphens are allowed")
    String specialization;

    @NotBlank(message = "Teaching language is required")
    @Size(min = 2, message = "Teaching language must be at least 2 characters")
    @Pattern(regexp = "^[\\p{L}\\s-]+$", message = "Teaching language contains invalid characters. Only letters (including Vietnamese), spaces, and hyphens are allowed")
    String teachingLanguage;

    @NotBlank(message = "Bio is required")
    @Size(min = 50, message = "Bio must be at least 50 characters")
    String bio;

    @NotEmpty(message = "At least one certificate is required")
    @Valid
    List<TutorCertificateRequest> certificates;
}
