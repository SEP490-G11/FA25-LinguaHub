package edu.lms.entity;

import edu.lms.enums.Gender;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "Users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "userid")
    Long userID;

    @NotBlank(message = "Email is required")
    @Column(nullable = false, unique = true, length = 255)
    String email;

    @Column(unique = true, length = 100)
    String username;

    @Column(nullable = false, length = 255)
    String passwordHash;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_name", referencedColumnName = "name")
    Role role;

    String fullName;
    @Lob
    @Column(name = "avatarUrl", columnDefinition = "LONGTEXT")
    String avatarURL;

    @Enumerated(EnumType.STRING)
    Gender gender;

    LocalDate dob;
    String phone;
    String country;
    String address;

    @Column(columnDefinition = "TEXT")
    String bio;

    // Giữ mặc định true cả khi dùng Builder
    @Builder.Default
    @Column(nullable = false)
    Boolean isActive = true;

    // Tự set thời gian khi khởi tạo và cập nhật
    @Builder.Default
    @Column(nullable = false)
    LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(nullable = false)
    LocalDateTime updatedAt = LocalDateTime.now();

    //Auto update timestamps khi persist/update
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isActive == null) this.isActive = true;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
