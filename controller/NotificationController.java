package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.NotificationStatusUpdateRequest;
import edu.lms.dto.response.NotificationResponse;
import edu.lms.entity.Notification;
import edu.lms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // ================================
    // GET ALL NOTIFICATIONS (ADMIN)
    // ================================
    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications() {
        List<Notification> notifications = notificationService.getAll();
        return ResponseEntity.ok(notifications);
    }

    // ==============================================
    // GET NOTIFICATIONS BY USER ID (ADMIN / FE)
    // ==============================/================
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getNotificationsByUserId(@PathVariable Long userId) {
        List<Notification> notifications = notificationService.getNotificationByUserId(userId);
        return ResponseEntity.ok(notifications);
    }
    @PatchMapping("/{notificationId}/read")
    public ApiRespond<NotificationResponse> updateStatus(
            @PathVariable Long notificationId,
            @RequestBody NotificationStatusUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long currentUserId = jwt.getClaim("userId");

        // bảo vệ: chỉ owner (hoặc admin) mới được sửa notification của mình
        Notification notification = notificationService
                .getNotificationByUserId(currentUserId).stream()
                .filter(n -> n.getNotificationId().equals(notificationId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Notification not found or access denied"));

        boolean isRead = request.getRead() != null ? request.getRead() : true;

        Notification updated = notificationService.updateNotificationStatus(notification.getNotificationId(), isRead);

        return ApiRespond.<NotificationResponse>builder()
                .result(toResponse(updated))
                .build();
    }
    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())   // chỉnh lại tên getter nếu khác
                .userId(n.getUserId())
                .title(n.getTitle())
                .content(n.getContent())
                .type(n.getType())
                .primaryActionUrl(n.getPrimaryActionUrl())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
