package edu.lms.service;

import edu.lms.entity.Notification;
import edu.lms.enums.NotificationType;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void send(Long userId, String title, String content, NotificationType type, String url) {
        Notification n = Notification.builder()
                .userId(userId)
                .title(title)
                .content(content)
                .type(type)
                .primaryActionUrl(url)
                .build();

        notificationRepository.save(n);
    }

    public void sendNotification(
            Long userId,
            String title,
            String content,
            NotificationType type,
            String primaryUrl
    ) {
        Notification n = Notification.builder()
                .userId(userId)
                .title(title)
                .content(content)
                .type(type)
                .primaryActionUrl(primaryUrl)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(n);
    }

    // Lấy tất cả thông báo của 1 user, sort mới nhất trước
    public List<Notification> getNotificationByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    // Lấy tất cả thông báo trong hệ thống (cho Admin)
    public List<Notification> getAll() {
        return notificationRepository.findAll();
    }

    //Update status của note
    public Notification updateNotificationStatus(Long notificationId, boolean isRead) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

        notification.setIsRead(isRead);
        // nếu bạn có field updatedAt thì có thể set thêm:
        // notification.setUpdatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }
}
