package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    Long userID;
    String username;
    String email;
    String fullName;
    String avatarURL;
    String gender;
    LocalDate dob;
    String phone;
    String country;
    String address;
    String bio;
    Boolean isActive;
    String role;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
