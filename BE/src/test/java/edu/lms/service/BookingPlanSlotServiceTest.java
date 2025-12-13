package edu.lms.service;

import edu.lms.dto.response.BookingPlanSlotResponse;
import edu.lms.entity.BookingPlan;
import edu.lms.entity.BookingPlanSlot;
import edu.lms.entity.Tutor;
import edu.lms.entity.User;
import edu.lms.enums.SlotStatus;
import edu.lms.exception.AppException;
import edu.lms.repository.BookingPlanRepository;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.TutorRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho BookingPlanSlotService
 *
 * Cover:
 *  - getSlotsForUser(Long userId)
 *      + user không có slot -> trả về list rỗng
 *      + có slot nhưng tất cả bookingPlanID = null -> không gọi bookingPlanRepository, meetingUrl luôn null
 *      + mixed:
 *          * slot Paid + có bookingPlanId + plan.meetingUrl != null -> meetingUrl set đúng
 *          * slot Paid + có bookingPlanId + plan.meetingUrl == null -> meetingUrl null (thông qua "" -> null)
 *          * slot không phải Paid -> meetingUrl luôn null dù có mapping
 *          * tutorFullName lấy từ tutorNameMap
 *
 *  - getPaidSlotsByTutor(Long tutorId)
 *      + không có slot Paid -> list rỗng
 *      + có slot Paid -> mapping đầy đủ meetingUrl + tutorFullName
 *
 *  - getSlotsForTutor(Long userId)
 *      + tutor không tồn tại -> AppException (TUTOR_NOT_FOUND)
 *      + tutor tồn tại nhưng không có slot -> list rỗng
 *      + tutor tồn tại + có slot -> mapping đầy đủ meetingUrl + tutorFullName
 *
 * Lưu ý:
 *  - Chỉ assertThrows(AppException.class), KHÔNG check ErrorCode bên trong.
 *  - Các hàm private (buildMeetingUrlMap, buildTutorNameMap, toSlotResponse) được cover gián tiếp qua các public method.
 */
@ExtendWith(MockitoExtension.class)
class BookingPlanSlotServiceTest {

    @Mock
    BookingPlanSlotRepository bookingPlanSlotRepository;
    @Mock
    BookingPlanRepository bookingPlanRepository;
    @Mock
    TutorRepository tutorRepository;

    @InjectMocks
    BookingPlanSlotService bookingPlanSlotService;

    // =========================
    // HELPER ENTITY BUILDER
    // =========================

    private BookingPlanSlot buildSlot(
            Long slotId,
            Long bookingPlanId,
            Long tutorId,
            Long userId,
            SlotStatus status
    ) {
        BookingPlanSlot slot = new BookingPlanSlot();
        slot.setSlotID(slotId);
        slot.setBookingPlanID(bookingPlanId);
        slot.setTutorID(tutorId);
        slot.setUserID(userId);
        slot.setStatus(status);
        slot.setStartTime(LocalDateTime.of(2025, 1, 1, 10, 0));
        slot.setEndTime(LocalDateTime.of(2025, 1, 1, 11, 0));
        slot.setPaymentID(123L);
        slot.setLockedAt(LocalDateTime.of(2024, 12, 1, 10, 0));
        slot.setExpiresAt(LocalDateTime.of(2024, 12, 1, 10, 30));
        slot.setLearnerJoin(false);
        slot.setTutorJoin(false);
        slot.setLearnerEvidence(null);
        slot.setTutorEvidence(null);
        return slot;
    }

    private BookingPlan buildPlan(Long planId, String meetingUrl) {
        BookingPlan plan = new BookingPlan();
        plan.setBookingPlanID(planId);
        plan.setMeetingUrl(meetingUrl);
        return plan;
    }

    private Tutor buildTutorWithUser(Long tutorId, Long userId, String fullName) {
        User u = new User();
        u.setUserID(userId);
        u.setFullName(fullName);

        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setUser(u);
        return t;
    }

    // =====================================================================
    // getSlotsForUser
    // =====================================================================

    @Nested
    @DisplayName("BookingPlanSlotService.getSlotsForUser")
    class GetSlotsForUserTests {

        /**
         * NOTE – Case: user không có bất kỳ slot nào -> trả về list rỗng
         */
        @Test
        @DisplayName("getSlotsForUser - không có slot -> list rỗng")
        void getSlotsForUser_noSlots_returnEmptyList() {
            Long userId = 10L;

            when(bookingPlanSlotRepository.findByUserID(userId))
                    .thenReturn(List.of());

            List<BookingPlanSlotResponse> result =
                    bookingPlanSlotService.getSlotsForUser(userId);

            assertNotNull(result);
            assertTrue(result.isEmpty());

            verify(bookingPlanSlotRepository).findByUserID(userId);
            // Không cần gọi repo khác vì không có slot
            verifyNoInteractions(bookingPlanRepository, tutorRepository);
        }

        /**
         * NOTE – Case: có slot nhưng tất cả bookingPlanID = null -> buildMeetingUrlMap trả Map.of()
         *  - Kỳ vọng:
         *      + không gọi bookingPlanRepository.findAllById(...)
         *      + meetingUrl trong response luôn null
         */
        @Test
        @DisplayName("getSlotsForUser - slot không có bookingPlanId -> không gọi bookingPlanRepository, meetingUrl luôn null")
        void getSlotsForUser_slotsWithoutBookingPlanId_meetingUrlAlwaysNull() {
            Long userId = 10L;

            BookingPlanSlot s1 = buildSlot(1L, null, 100L, userId, SlotStatus.Paid);
            BookingPlanSlot s2 = buildSlot(2L, null, 101L, userId, SlotStatus.Available);

            when(bookingPlanSlotRepository.findByUserID(userId))
                    .thenReturn(List.of(s1, s2));

            // tutorRepository vẫn được gọi để build map tên
            Tutor t1 = buildTutorWithUser(100L, 1000L, "Tutor A");
            Tutor t2 = buildTutorWithUser(101L, 1001L, "Tutor B");
            when(tutorRepository.findAllById(List.of(100L, 101L)))
                    .thenReturn(List.of(t1, t2));

            List<BookingPlanSlotResponse> result =
                    bookingPlanSlotService.getSlotsForUser(userId);

            assertEquals(2, result.size());

            // meetingUrl luôn null vì không có bookingPlanId
            assertNull(result.get(0).getMeetingUrl());
            assertNull(result.get(1).getMeetingUrl());

            // Tutor full name mapping
            assertEquals("Tutor A", result.get(0).getTutorFullName());
            assertEquals("Tutor B", result.get(1).getTutorFullName());

            verify(bookingPlanRepository, never()).findAllById(any());
        }

        /**
         * NOTE – Case: mixed
         *  - slot1: Paid + có bookingPlanId + plan.meetingUrl != null -> meetingUrl set đúng
         *  - slot2: Paid + bookingPlanId + plan.meetingUrl == null -> meetingUrl null ("" -> null)
         *  - slot3: Available + bookingPlanId + plan.meetingUrl != null -> meetingUrl vẫn null (vì không Paid)
         *  - tutorFullName mapping từ tutorNameMap
         */
        @Test
        @DisplayName("getSlotsForUser - mixed status + meetingUrl mapping đúng")
        void getSlotsForUser_mixedSlots_mappingCorrect() {
            Long userId = 10L;

            // slot1: Paid + planId = 100
            BookingPlanSlot slot1 = buildSlot(1L, 100L, 200L, userId, SlotStatus.Paid);
            // slot2: Paid + planId = 101 (meetingUrl null)
            BookingPlanSlot slot2 = buildSlot(2L, 101L, 201L, userId, SlotStatus.Paid);
            // slot3: Available + planId = 100 (same plan, nhưng không Paid)
            BookingPlanSlot slot3 = buildSlot(3L, 100L, 200L, userId, SlotStatus.Available);

            when(bookingPlanSlotRepository.findByUserID(userId))
                    .thenReturn(List.of(slot1, slot2, slot3));

            // buildMeetingUrlMap: 2 planId 100 & 101
            BookingPlan plan100 = buildPlan(100L, "https://meet.com/room100");
            BookingPlan plan101 = buildPlan(101L, null); // -> map value = ""
            when(bookingPlanRepository.findAllById(List.of(100L, 101L)))
                    .thenReturn(List.of(plan100, plan101));

            // buildTutorNameMap: 200 & 201
            Tutor tutor200 = buildTutorWithUser(200L, 1000L, "Tutor A");
            Tutor tutor201 = buildTutorWithUser(201L, 1001L, null); // fullName null -> ""
            when(tutorRepository.findAllById(List.of(200L, 201L)))
                    .thenReturn(List.of(tutor200, tutor201));

            List<BookingPlanSlotResponse> res =
                    bookingPlanSlotService.getSlotsForUser(userId);

            assertEquals(3, res.size());

            BookingPlanSlotResponse r1 = res.get(0);
            BookingPlanSlotResponse r2 = res.get(1);
            BookingPlanSlotResponse r3 = res.get(2);

            // slot1: Paid + plan100.meetingUrl != null -> set đúng
            assertEquals(1L, r1.getSlotID());
            assertEquals("https://meet.com/room100", r1.getMeetingUrl());
            assertEquals("Tutor A", r1.getTutorFullName());

            // slot2: Paid + plan101.meetingUrl = null -> map store "", sau đó toSlotResponse -> null
            assertEquals(2L, r2.getSlotID());
            assertNull(r2.getMeetingUrl());
            // tutor201.fullName null -> map store "" -> trả về ""
            assertEquals("", r2.getTutorFullName());

            // slot3: Available + plan100.meetingUrl có, nhưng vì không Paid -> meetingUrl vẫn null
            assertEquals(3L, r3.getSlotID());
            assertNull(r3.getMeetingUrl());
            assertEquals("Tutor A", r3.getTutorFullName());
        }
    }

    // =====================================================================
    // getPaidSlotsByTutor
    // =====================================================================

    @Nested
    @DisplayName("BookingPlanSlotService.getPaidSlotsByTutor")
    class GetPaidSlotsByTutorTests {

        /**
         * NOTE – Case: Tutor không có slot Paid nào -> list rỗng
         */
        @Test
        @DisplayName("getPaidSlotsByTutor - không có slot Paid -> list rỗng")
        void getPaidSlotsByTutor_noSlots_returnEmptyList() {
            Long tutorId = 200L;

            when(bookingPlanSlotRepository.findByTutorIDAndStatus(tutorId, SlotStatus.Paid))
                    .thenReturn(List.of());

            List<BookingPlanSlotResponse> result =
                    bookingPlanSlotService.getPaidSlotsByTutor(tutorId);

            assertNotNull(result);
            assertTrue(result.isEmpty());

            verify(bookingPlanSlotRepository).findByTutorIDAndStatus(tutorId, SlotStatus.Paid);
            verifyNoInteractions(bookingPlanRepository, tutorRepository);
        }

        /**
         * NOTE – Case: Có slot Paid -> mapping meetingUrl + tutorFullName
         *  - 2 slot Paid cùng tutorId, 2 bookingPlanId khác nhau
         *  - Kỳ vọng:
         *      + meetingUrl lấy theo plan.meetingUrl (non-null)
         *      + tutorFullName lấy từ tutorNameMap
         */
        @Test
        @DisplayName("getPaidSlotsByTutor - có slot Paid -> mapping đầy đủ")
        void getPaidSlotsByTutor_withSlots_mappingCorrect() {
            Long tutorId = 200L;

            BookingPlanSlot s1 = buildSlot(1L, 100L, tutorId, 10L, SlotStatus.Paid);
            BookingPlanSlot s2 = buildSlot(2L, 101L, tutorId, 11L, SlotStatus.Paid);

            when(bookingPlanSlotRepository.findByTutorIDAndStatus(tutorId, SlotStatus.Paid))
                    .thenReturn(List.of(s1, s2));

            // bookingPlan map
            BookingPlan p100 = buildPlan(100L, "https://meet.com/room100");
            BookingPlan p101 = buildPlan(101L, "https://meet.com/room101");
            when(bookingPlanRepository.findAllById(List.of(100L, 101L)))
                    .thenReturn(List.of(p100, p101));

            // tutor map (chỉ 1 tutor)
            Tutor tutor = buildTutorWithUser(tutorId, 999L, "Tutor Main");
            when(tutorRepository.findAllById(List.of(tutorId)))
                    .thenReturn(List.of(tutor));

            List<BookingPlanSlotResponse> res =
                    bookingPlanSlotService.getPaidSlotsByTutor(tutorId);

            assertEquals(2, res.size());

            BookingPlanSlotResponse r1 = res.get(0);
            BookingPlanSlotResponse r2 = res.get(1);

            assertEquals(1L, r1.getSlotID());
            assertEquals("https://meet.com/room100", r1.getMeetingUrl());
            assertEquals("Tutor Main", r1.getTutorFullName());

            assertEquals(2L, r2.getSlotID());
            assertEquals("https://meet.com/room101", r2.getMeetingUrl());
            assertEquals("Tutor Main", r2.getTutorFullName());
        }
    }

    // =====================================================================
    // getSlotsForTutor
    // =====================================================================

    @Nested
    @DisplayName("BookingPlanSlotService.getSlotsForTutor")
    class GetSlotsForTutorTests {

        /**
         * NOTE – Case: Tutor không tồn tại (findByUser_UserID trả empty) -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("getSlotsForTutor - tutor không tồn tại -> AppException")
        void getSlotsForTutor_tutorNotFound_shouldThrow() {
            Long userId = 999L;

            when(tutorRepository.findByUser_UserID(userId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> bookingPlanSlotService.getSlotsForTutor(userId));

            verify(tutorRepository).findByUser_UserID(userId);
            verifyNoInteractions(bookingPlanSlotRepository, bookingPlanRepository);
        }

        /**
         * NOTE – Case: Tutor tồn tại nhưng không có slot nào -> list rỗng
         */
        @Test
        @DisplayName("getSlotsForTutor - tutor có nhưng không có slot -> list rỗng")
        void getSlotsForTutor_noSlots_returnEmptyList() {
            Long userId = 1000L;
            Long tutorId = 200L;
            Tutor tutor = buildTutorWithUser(tutorId, userId, "Tutor A");

            when(tutorRepository.findByUser_UserID(userId))
                    .thenReturn(Optional.of(tutor));

            when(bookingPlanSlotRepository.findByTutorID(tutorId))
                    .thenReturn(List.of());

            List<BookingPlanSlotResponse> res =
                    bookingPlanSlotService.getSlotsForTutor(userId);

            assertNotNull(res);
            assertTrue(res.isEmpty());

            verify(tutorRepository).findByUser_UserID(userId);
            verify(bookingPlanSlotRepository).findByTutorID(tutorId);
            verifyNoInteractions(bookingPlanRepository);
        }

        /**
         * NOTE – Case: Tutor tồn tại + có slot -> mapping đầy đủ
         *  - 2 slot:
         *      * slot1: Paid + có plan.meetingUrl
         *      * slot2: Available + cùng plan -> meetingUrl null (vì không Paid)
         *  - TutorFullName: lấy từ tutorNameMap
         */
        @Test
        @DisplayName("getSlotsForTutor - tutor có slot -> mapping meetingUrl + tutorFullName")
        void getSlotsForTutor_withSlots_mappingCorrect() {
            Long userId = 1000L;
            Long tutorId = 200L;
            Tutor tutor = buildTutorWithUser(tutorId, userId, "Tutor A");

            when(tutorRepository.findByUser_UserID(userId))
                    .thenReturn(Optional.of(tutor));

            BookingPlanSlot s1 = buildSlot(1L, 100L, tutorId, 10L, SlotStatus.Paid);
            BookingPlanSlot s2 = buildSlot(2L, 100L, tutorId, 11L, SlotStatus.Available);

            when(bookingPlanSlotRepository.findByTutorID(tutorId))
                    .thenReturn(List.of(s1, s2));

            // booking plan map
            BookingPlan plan100 = buildPlan(100L, "https://meet.com/room100");
            when(bookingPlanRepository.findAllById(List.of(100L)))
                    .thenReturn(List.of(plan100));

            // tutor map (chỉ 1 tutor)
            when(tutorRepository.findAllById(List.of(tutorId)))
                    .thenReturn(List.of(tutor));

            List<BookingPlanSlotResponse> res =
                    bookingPlanSlotService.getSlotsForTutor(userId);

            assertEquals(2, res.size());

            BookingPlanSlotResponse r1 = res.get(0);
            BookingPlanSlotResponse r2 = res.get(1);

            // slot1: Paid -> có meetingUrl
            assertEquals(1L, r1.getSlotID());
            assertEquals("https://meet.com/room100", r1.getMeetingUrl());
            assertEquals("Tutor A", r1.getTutorFullName());

            // slot2: Available -> meetingUrl null
            assertEquals(2L, r2.getSlotID());
            assertNull(r2.getMeetingUrl());
            assertEquals("Tutor A", r2.getTutorFullName());
        }
    }
}
