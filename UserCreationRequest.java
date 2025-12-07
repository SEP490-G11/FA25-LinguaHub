package edu.lms.dto.request;

import edu.lms.enums.Gender;
import edu.lms.validator.DobConstraint;
import jakarta.persistence.Column;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {

    // ===== Thông tin tài khoản =====
    @NotBlank(message = "Email is required")
    @Email(message = "INVALID_EMAIL_FORMAT")
    String email;

    @NotBlank(message = "Username is required")
    @Size(min = 3, message = "USERNAME_INVALID")
    String username;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "INVALID_PASSWORD")
    String password;

    @NotBlank(message = "Full name is required")
    String fullName;

    // ===== Thông tin cá nhân =====
    @NotNull(message = "Gender is required")
    Gender gender;

    @NotNull(message = "Date of birth is required")
    @DobConstraint(min = 10, message = "INVALID_DOB")
    LocalDate dob;

    @NotBlank(message = "Phone number is required")
    String phone;

    @NotBlank(message = "Country is required")
    String country;

    @NotBlank(message = "Address is required")
    String address;

    @NotBlank(message = "Bio is required")
    @Column(columnDefinition = "TEXT")
    String bio;
}
