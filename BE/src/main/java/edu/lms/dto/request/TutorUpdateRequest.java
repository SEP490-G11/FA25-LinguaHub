package edu.lms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TutorUpdateRequest {
    
    @Min(value = 0, message = "Experience must be non-negative")
    @Max(value = 32767, message = "Experience exceeds maximum value")
    private Short experience;
    
    @Size(max = 255, message = "Specialization must not exceed 255 characters")
    private String specialization;
    
    @Size(max = 100, message = "Teaching language must not exceed 100 characters")
    private String teachingLanguage;
    
    @Size(max = 1000, message = "Bio must not exceed 1000 characters")
    private String bio;
    
    @DecimalMin(value = "0.0", message = "Rating must be non-negative")
    @DecimalMax(value = "5.0", message = "Rating must not exceed 5.0")
    private BigDecimal rating;
}
