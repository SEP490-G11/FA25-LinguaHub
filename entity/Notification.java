package edu.lms.entity;

import edu.lms.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "notifications")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long notificationId;

    @Column(nullable = false)
    Long userId; // learner hoặc tutor nhận notify

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    NotificationType type;

    @Column(nullable = false, length = 200)
    String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    String content;

    // Link cho action chính, ví dụ: mở trang refund
    @Column(nullable = true, length = 500)
    String primaryActionUrl;

    // Link phụ, tùy trường hợp dùng hoặc không
    @Column(nullable = true, length = 500)
    String secondaryActionUrl;

    @Builder.Default
    @Column(nullable = false)
    Boolean isRead = false;

    @Builder.Default
    @Column(nullable = false)
    LocalDateTime createdAt = LocalDateTime.now();
}
