package edu.lms.service;

import edu.lms.dto.request.SlotBookingRequest;
import edu.lms.dto.response.OperationStatusResponse;
import edu.lms.entity.BookingPlanSlot;
import edu.lms.enums.SlotStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.BookingPlanSlotRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Transactional
public class TutorSlotBookingService {

    BookingPlanSlotRepository bookingPlanSlotRepository;
    static final int LOCK_DURATION_MINUTES = 10;

    public OperationStatusResponse lockSlots(Long currentUserId, SlotBookingRequest request) {
        ensureUniqueSlotIds(request.getSlotIds());

        List<BookingPlanSlot> slots = bookingPlanSlotRepository.findAllById(request.getSlotIds());
        if (slots.size() != request.getSlotIds().size()) {
            throw new AppException(ErrorCode.BOOKING_SLOT_NOT_FOUND);
        }

        LocalDateTime now = LocalDateTime.now();
        for (BookingPlanSlot slot : slots) {
            releaseIfExpired(slot);

            if (slot.getStatus() != SlotStatus.Available || slot.getUserID() != null) {
                throw new AppException(ErrorCode.BOOKING_SLOT_NOT_AVAILABLE);
            }

            if (!slot.getStartTime().isAfter(now)) {
                throw new AppException(ErrorCode.BOOKING_SLOT_NOT_AVAILABLE);
            }

            slot.setUserID(currentUserId);
            slot.setStatus(SlotStatus.Locked);
            slot.setLockedAt(now);
            slot.setExpiresAt(now.plusMinutes(LOCK_DURATION_MINUTES));
            slot.setUserPackage(null);
            slot.setPaymentID(null);
        }

        bookingPlanSlotRepository.saveAll(slots);

        return OperationStatusResponse.success("Slots locked successfully.");
    }

    private void ensureUniqueSlotIds(List<Long> slotIds) {
        if (slotIds == null || slotIds.isEmpty()) {
            throw new AppException(ErrorCode.BOOKING_SLOT_NOT_AVAILABLE);
        }
        long distinct = slotIds.stream().distinct().count();
        if (distinct != slotIds.size()) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
    }

    private void releaseIfExpired(BookingPlanSlot slot) {
        if (slot.getStatus() == SlotStatus.Locked &&
                slot.getExpiresAt() != null &&
                slot.getExpiresAt().isBefore(LocalDateTime.now())) {
            slot.setStatus(SlotStatus.Available);
            slot.setUserID(null);
            slot.setLockedAt(null);
            slot.setExpiresAt(null);
            slot.setPaymentID(null);
            slot.setUserPackage(null);
        }
    }
}


