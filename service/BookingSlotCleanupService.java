package edu.lms.service;

import edu.lms.entity.BookingPlanSlot;
import edu.lms.repository.BookingPlanSlotRepository;
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
public class BookingSlotCleanupService {

    private final BookingPlanSlotRepository bookingPlanSlotRepository;

    @Transactional
    @Scheduled(fixedRate = 60000) // mỗi 1 phút
    public void cleanupExpiredSlots() {
        List<BookingPlanSlot> expired = bookingPlanSlotRepository.findAllExpiredSlots(LocalDateTime.now());
        expired.forEach(slot -> {
            bookingPlanSlotRepository.delete(slot);
            log.warn("[CLEANUP] Deleted expired slot {} ({} - {})", slot.getSlotID(), slot.getStartTime(), slot.getEndTime());
        });
    }
}
