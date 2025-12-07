package edu.lms.dto.response;

import edu.lms.enums.NotificationType;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    Long notificationId;
    Long userId;

    String title;
    String content;

    NotificationType type;

    String primaryActionUrl;

    Boolean isRead;

    LocalDateTime createdAt;
}
