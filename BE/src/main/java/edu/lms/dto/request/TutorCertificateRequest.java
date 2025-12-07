package edu.lms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorCertificateRequest {

    @NotBlank(message = "Certificate name is required")
    @Size(min = 2, max = 255, message = "Certificate Name must be between 2 and 255 characters")
    @Pattern(regexp = "^[\\p{L}0-9\\s,.-]+$", message = "Certificate Name contains invalid characters. Only letters (including Vietnamese), numbers, spaces, commas, dots, and hyphens are allowed")
    String certificateName;

    @NotBlank(message = "Document URL is required")
    @Size(max = 255, message = "Document URL must be <= 255 characters")
    @Pattern(regexp = "^(https?://|/).*", message = "Document URL must start with http://, https://, or /")
    String documentUrl;
}


