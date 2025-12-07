package edu.lms.service;

import edu.lms.entity.BookingPlanSlot;
import edu.lms.entity.Tutor;
import edu.lms.enums.NotificationType;
import edu.lms.enums.SlotStatus;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingReminderService {

    private final BookingPlanSlotRepository bookingPlanSlotRepository;
    private final TutorRepository tutorRepository;
    private final NotificationService notificationService;

    /**
     * Chạy mỗi 1 phút, tìm các slot:
     *  - ĐÃ PAID
     *  - Còn ~15 phút nữa bắt đầu
     *  - CHƯA gửi reminder
     */
    @Scheduled(fixedRate = 60_000) // mỗi 60s
    @Transactional
    public void sendTutorRemindersForUpcomingSlots() {
        LocalDateTime now = LocalDateTime.now();

        // Ví dụ: gửi reminder trước 15 phút
        LocalDateTime from = now.plusMinutes(15);
        LocalDateTime to = now.plusMinutes(16); // window 1 phút để tránh gửi trùng

        List<BookingPlanSlot> slots = bookingPlanSlotRepository
                .findByStatusAndStartTimeBetweenAndReminderSentFalse(
                        SlotStatus.Paid,
                        from,
                        to
                );

        if (slots.isEmpty()) {
            return;
        }

        log.info("[REMINDER] Found {} upcoming slots for tutor/learner reminder", slots.size());

        for (BookingPlanSlot slot : slots) {
            try {
                Tutor tutor = tutorRepository.findById(slot.getTutorID())
                        .orElse(null);
                if (tutor == null || tutor.getUser() == null) {
                    log.warn("[REMINDER] Tutor or tutor user not found for slot {}", slot.getSlotID());
                    continue;
                }

                Long tutorUserId = tutor.getUser().getUserID();
                Long learnerUserId = slot.getUserID(); //  ID user (learner) đã đặt slot

                String tutorName = tutor.getUser().getFullName() != null
                        ? tutor.getUser().getFullName()
                        : "Tutor";

                // ===== Notification cho TUTOR =====
                String tutorTitle = "Sắp đến giờ buổi học 1-1";
                String tutorContent = String.format(
                        "Bạn có buổi học 1-1 sắp diễn ra lúc %s – %s.",
                        slot.getStartTime(),
                        slot.getEndTime()
                );

                String tutorPrimaryUrl = "/booked-slots";

                notificationService.sendNotification(
                        tutorUserId,
                        tutorTitle,
                        tutorContent,
                        NotificationType.BOOKING_REMINDER,
                        tutorPrimaryUrl
                );

                // ===== Notification cho LEARNER =====
                String learnerTitle = "Sắp đến giờ buổi học 1-1";
                String learnerContent = String.format(
                        "Bạn có buổi học 1-1 với %s lúc %s – %s.",
                        tutorName,
                        slot.getStartTime(),
                        slot.getEndTime()
                );

                String learnerPrimaryUrl = "/my-bookings";

                notificationService.sendNotification(
                        learnerUserId,
                        learnerTitle,
                        learnerContent,
                        NotificationType.BOOKING_REMINDER,
                        learnerPrimaryUrl
                );

                // Đánh dấu slot đã gửi reminder (cho cả tutor & learner)
                slot.setReminderSent(true);

                log.info("[REMINDER] Sent reminder to tutorUserId={} and learnerUserId={} for slot={}",
                        tutorUserId, learnerUserId, slot.getSlotID());

            } catch (Exception e) {
                log.error("[REMINDER] Failed to send reminder for slot {}: {}",
                        slot.getSlotID(), e.getMessage());
            }
        }
    }
}
