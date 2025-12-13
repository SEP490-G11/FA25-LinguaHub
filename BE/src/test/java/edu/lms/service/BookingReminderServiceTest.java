package edu.lms.service;

import edu.lms.entity.BookingPlanSlot;
import edu.lms.entity.Tutor;
import edu.lms.entity.User;
import edu.lms.enums.NotificationType;
import edu.lms.enums.SlotStatus;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.TutorRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho BookingReminderService
 *
 * Cover cho method:
 *  - sendTutorRemindersForUpcomingSlots()
 *
 * Các case:
 *  1. Không tìm thấy slot nào thỏa điều kiện -> return sớm, không gửi notification
 *  2. Có slot, nhưng:
 *     2.1 Tutor không tồn tại -> skip slot, không gửi notification
 *     2.2 Tutor tồn tại nhưng user null -> skip slot, không gửi notification
 *  3. Happy path:
 *     - Slot Paid, tutor + user đầy đủ
 *     - Gửi 2 notification (tutor + learner)
 *     - slot.reminderSent = true
 *  4. notificationService ném exception -> bị catch, method không throw ra ngoài
 *     - Không set reminderSent (vì exception giữa chừng)
 */
@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class BookingReminderServiceTest {

    @Mock
    BookingPlanSlotRepository bookingPlanSlotRepository;
    @Mock
    TutorRepository tutorRepository;
    @Mock
    NotificationService notificationService;

    @InjectMocks
    BookingReminderService bookingReminderService;

    // =========================
    // HELPER
    // =========================

    private BookingPlanSlot buildSlot(Long slotId, Long tutorId, Long learnerUserId) {
        BookingPlanSlot slot = new BookingPlanSlot();
        slot.setSlotID(slotId);
        slot.setTutorID(tutorId);
        slot.setUserID(learnerUserId);
        slot.setStatus(SlotStatus.Paid); // chỉ reminder cho Paid
        slot.setStartTime(LocalDateTime.of(2025, 1, 1, 10, 0));
        slot.setEndTime(LocalDateTime.of(2025, 1, 1, 11, 0));
        slot.setReminderSent(false);
        return slot;
    }

    private Tutor buildTutor(Long tutorId, Long userId, String fullName) {
        User u = new User();
        u.setUserID(userId);
        u.setFullName(fullName);

        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setUser(u);
        return t;
    }

    // =====================================================================
    // sendTutorRemindersForUpcomingSlots
    // =====================================================================

    @Nested
    @DisplayName("BookingReminderService.sendTutorRemindersForUpcomingSlots")
    class SendTutorRemindersForUpcomingSlotsTests {

        @Test
        @DisplayName("Không có slot -> không gửi notification")
        void noSlots_found_noNotifications() {
            when(bookingPlanSlotRepository
                    .findByStatusAndStartTimeBetweenAndReminderSentFalse(
                            eq(SlotStatus.Paid),
                            any(LocalDateTime.class),
                            any(LocalDateTime.class)
                    ))
                    .thenReturn(List.of());

            bookingReminderService.sendTutorRemindersForUpcomingSlots();

            verify(bookingPlanSlotRepository)
                    .findByStatusAndStartTimeBetweenAndReminderSentFalse(
                            eq(SlotStatus.Paid),
                            any(LocalDateTime.class),
                            any(LocalDateTime.class)
                    );
            verifyNoInteractions(tutorRepository, notificationService);
        }

        @Test
        @DisplayName("Tutor không tồn tại -> skip, không gửi notification")
        void tutorNotFound_skipSlot_noNotifications() {
            BookingPlanSlot slot = buildSlot(1L, 100L, 1000L);

            when(bookingPlanSlotRepository
                    .findByStatusAndStartTimeBetweenAndReminderSentFalse(
                            eq(SlotStatus.Paid),
                            any(LocalDateTime.class),
                            any(LocalDateTime.class)
                    ))
                    .thenReturn(List.of(slot));

            when(tutorRepository.findById(100L))
                    .thenReturn(Optional.empty());

            bookingReminderService.sendTutorRemindersForUpcomingSlots();

            verify(tutorRepository).findById(100L);
            verifyNoInteractions(notificationService);

            assertFalse(slot.getReminderSent());
        }

        @Test
        @DisplayName("Tutor user = null -> skip, không gửi notification")
        void tutorUserNull_skipSlot_noNotifications() {
            BookingPlanSlot slot = buildSlot(1L, 100L, 1000L);

            when(bookingPlanSlotRepository
                    .findByStatusAndStartTimeBetweenAndReminderSentFalse(
                            eq(SlotStatus.Paid),
                            any(LocalDateTime.class),
                            any(LocalDateTime.class)
                    ))
                    .thenReturn(List.of(slot));

            Tutor tutor = new Tutor();
            tutor.setTutorID(100L);
            tutor.setUser(null);

            when(tutorRepository.findById(100L))
                    .thenReturn(Optional.of(tutor));

            bookingReminderService.sendTutorRemindersForUpcomingSlots();

            verify(tutorRepository).findById(100L);
            verifyNoInteractions(notificationService);
            assertFalse(slot.getReminderSent());
        }

        /**
         * CASE 3 – HAPPY PATH
         * NOTE – Có 1 slot hợp lệ:
         *  - Slot Paid, tutor + user đầy đủ
         *  - fullName != null
         *  - Kỳ vọng:
         *      + Gửi 2 notification: cho Tutor + Learner
         *      + NotificationType = BOOKING_REMINDER
         *      + Tutor URL = "/booked-slots"
         *      + Learner URL = "/my-bookings"
         *      + slot.reminderSent = true
         */
        @Test
        @DisplayName("Happy path - gửi reminder cho tutor & learner, set reminderSent = true")
        void happyPath_sendNotificationsAndSetReminderSent() {
            Long slotId = 1L;
            Long tutorId = 200L;
            Long tutorUserId = 3000L;
            Long learnerUserId = 4000L;

            BookingPlanSlot slot = buildSlot(slotId, tutorId, learnerUserId);

            when(bookingPlanSlotRepository
                    .findByStatusAndStartTimeBetweenAndReminderSentFalse(
                            eq(SlotStatus.Paid),
                            any(LocalDateTime.class),
                            any(LocalDateTime.class)
                    ))
                    .thenReturn(List.of(slot));

            Tutor tutor = buildTutor(tutorId, tutorUserId, "Tutor A");
            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.of(tutor));

            bookingReminderService.sendTutorRemindersForUpcomingSlots();

            ArgumentCaptor<Long> userIdCaptor = ArgumentCaptor.forClass(Long.class);
            ArgumentCaptor<String> titleCaptor = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<String> contentCaptor = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<NotificationType> typeCaptor = ArgumentCaptor.forClass(NotificationType.class);
            ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);

            verify(notificationService, times(2)).sendNotification(
                    userIdCaptor.capture(),
                    titleCaptor.capture(),
                    contentCaptor.capture(),
                    typeCaptor.capture(),
                    urlCaptor.capture()
            );

            List<Long> sentUserIds = userIdCaptor.getAllValues();
            List<NotificationType> sentTypes = typeCaptor.getAllValues();
            List<String> urls = urlCaptor.getAllValues();

            // Tutor + learner đều nhận được
            assertTrue(sentUserIds.contains(tutorUserId));
            assertTrue(sentUserIds.contains(learnerUserId));

            // Tất cả đều là BOOKING_REMINDER
            sentTypes.forEach(t -> assertTrue(t == NotificationType.BOOKING_REMINDER));

            // 🔧 URL theo implementation hiện tại trong BookingReminderService
            // Tutor: "/booked-slots"
            // Learner: "/my-bookings"
            assertTrue(urls.contains("/booked-slots"));
            assertTrue(urls.contains("/my-bookings"));

            // Đã set reminderSent = true sau khi gửi xong
            assertTrue(slot.getReminderSent());
        }

        @Test
        @DisplayName("notificationService throw exception -> bị catch, không crash, không set reminderSent")
        void notificationThrows_exceptionIsCaught_noCrash() {
            Long slotId = 1L;
            Long tutorId = 200L;
            Long tutorUserId = 3000L;
            Long learnerUserId = 4000L;

            BookingPlanSlot slot = buildSlot(slotId, tutorId, learnerUserId);

            when(bookingPlanSlotRepository
                    .findByStatusAndStartTimeBetweenAndReminderSentFalse(
                            eq(SlotStatus.Paid),
                            any(LocalDateTime.class),
                            any(LocalDateTime.class)
                    ))
                    .thenReturn(List.of(slot));

            Tutor tutor = buildTutor(tutorId, tutorUserId, "Tutor A");
            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.of(tutor));

            doThrow(new RuntimeException("Send failed"))
                    .when(notificationService)
                    .sendNotification(
                            eq(tutorUserId),
                            anyString(),
                            anyString(),
                            eq(NotificationType.BOOKING_REMINDER),
                            anyString()
                    );

            bookingReminderService.sendTutorRemindersForUpcomingSlots();

            verify(notificationService, atMostOnce()).sendNotification(
                    anyLong(), anyString(), anyString(), any(), anyString()
            );

            assertFalse(slot.getReminderSent());
        }
    }
}
