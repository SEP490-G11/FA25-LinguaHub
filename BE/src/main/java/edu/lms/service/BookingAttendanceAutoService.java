package edu.lms.service;

import edu.lms.entity.BookingPlanSlot;
import edu.lms.enums.RefundStatus;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.RefundRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingAttendanceAutoService {

    private final BookingPlanSlotRepository bookingPlanSlotRepository;
    private final RefundRequestRepository refundRequestRepository;

    /**
     * Cron: mỗi 10 phút kiểm tra:
     *  - slot.status = Paid
     *  - tutorJoin = true
     *  - learnerJoin = false
     *  - endTime < now
     *  - KHÔNG có refund complaint đang PENDING / SUBMITTED
     *
     *  => auto set learnerJoin = true (coi như learner có tham gia buổi học).
     */
    @Scheduled(cron = "0 */10 * * * *") // mỗi 10 phút
    @Transactional
    public void autoMarkLearnerJoinAfterLessonEnd() {
        LocalDateTime now = LocalDateTime.now();

        List<BookingPlanSlot> candidates =
                bookingPlanSlotRepository.findSlotsForAutoMarkLearnerJoin(now);

        if (candidates.isEmpty()) {
            return;
        }

        int updated = 0;

        for (BookingPlanSlot slot : candidates) {
            // Nếu có complaint PENDING / SUBMITTED → không auto-set learnerJoin
            boolean hasOpenComplaint = refundRequestRepository.existsBySlotIdAndStatusIn(
                    slot.getSlotID(),
                    EnumSet.of(RefundStatus.PENDING, RefundStatus.SUBMITTED)
            );

            if (hasOpenComplaint) {
                continue;
            }

            slot.setLearnerJoin(true);
            bookingPlanSlotRepository.save(slot);
            updated++;

            log.info("[AUTO ATTEND] Slot {} auto-set learnerJoin=true (tutorJoin=true, endTime passed, no complaint)",
                    slot.getSlotID());
        }

        if (updated > 0) {
            log.info("[AUTO ATTEND] Updated {} slots learnerJoin=true", updated);
        }
    }
}
