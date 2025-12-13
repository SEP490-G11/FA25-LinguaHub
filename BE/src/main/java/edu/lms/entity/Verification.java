package edu.lms.entity;

import edu.lms.enums.Gender;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Verification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "verificationID")
    private Long verificationID;

    private String email;
    private String username;
    private String fullName;
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private LocalDate dob;
    private String phone;
    private String country;
    private String address;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String otp;
    private LocalDateTime expiresAt;
}
