package edu.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "RefreshTokens")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false, unique = true, length = 500)
    String token; // chuỗi JWT refresh token

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user; // liên kết user sở hữu token này

    @Column(nullable = false)
    Instant expiryDate; // ngày hết hạn token

    @Column(nullable = false)
    boolean revoked = false; // nếu true -> không thể dùng token này nữa
}
