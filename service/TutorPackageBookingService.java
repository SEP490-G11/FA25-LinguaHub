package edu.lms.service;

import edu.lms.dto.request.PackageSlotRequest;
import edu.lms.dto.response.OperationStatusResponse;
import edu.lms.entity.BookingPlanSlot;
import edu.lms.entity.Tutor;
import edu.lms.entity.UserPackage;
import edu.lms.enums.SlotStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.UserPackageRepository;
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
public class TutorPackageBookingService {

    BookingPlanSlotRepository bookingPlanSlotRepository;
    UserPackageRepository userPackageRepository;

    public OperationStatusResponse lockSlots(Long currentUserId, PackageSlotRequest request) {
        UserPackage userPackage = getUserPackage(currentUserId, request.getUserPackageId());

        ensureUniqueSlotIds(request.getSlotIds());
        validateSlotQuota(userPackage, request.getSlotIds().size());

        List<BookingPlanSlot> slots = getSlotsOrThrow(request.getSlotIds());
        validateSlotsBelongToTutor(slots, userPackage.getTutorPackage().getTutor());

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
            slot.setExpiresAt(now.plusMinutes(10));
        }

        bookingPlanSlotRepository.saveAll(slots);
        return OperationStatusResponse.success("Slots locked successfully.");
    }

    public OperationStatusResponse confirmSlots(Long currentUserId, PackageSlotRequest request) {
        UserPackage userPackage = getUserPackage(currentUserId, request.getUserPackageId());

        ensureUniqueSlotIds(request.getSlotIds());
        List<BookingPlanSlot> slots = getSlotsOrThrow(request.getSlotIds());
        validateSlotsBelongToTutor(slots, userPackage.getTutorPackage().getTutor());

        if (slots.isEmpty()) {
            throw new AppException(ErrorCode.BOOKING_SLOT_NOT_AVAILABLE);
        }

        validateSlotQuota(userPackage, slots.size());

        LocalDateTime now = LocalDateTime.now();

        for (BookingPlanSlot slot : slots) {
            releaseIfExpired(slot);

            if (slot.getStatus() != SlotStatus.Locked ||
                    slot.getUserID() == null ||
                    !slot.getUserID().equals(currentUserId)) {
                throw new AppException(ErrorCode.BOOKING_SLOT_NOT_AVAILABLE);
            }

            if (slot.getExpiresAt() != null && slot.getExpiresAt().isBefore(now)) {
                throw new AppException(ErrorCode.BOOKING_SLOT_EXPIRED);
            }

            slot.setStatus(SlotStatus.Paid);
            slot.setExpiresAt(null);
            slot.setLockedAt(null);
            slot.setUserPackage(userPackage);
        }

        userPackage.setSlotsRemaining(userPackage.getSlotsRemaining() - slots.size());
        userPackageRepository.save(userPackage);
        bookingPlanSlotRepository.saveAll(slots);

        return OperationStatusResponse.success("Slots booked successfully.");
    }

    private UserPackage getUserPackage(Long userId, Long userPackageId) {
        return userPackageRepository.findByUserPackageIDAndUser_UserID(userPackageId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_PACKAGE_NOT_FOUND));
    }

    private List<BookingPlanSlot> getSlotsOrThrow(List<Long> slotIds) {
        List<BookingPlanSlot> slots = bookingPlanSlotRepository.findAllById(slotIds);
        if (slots.size() != slotIds.size()) {
            throw new AppException(ErrorCode.BOOKING_SLOT_NOT_FOUND);
        }
        return slots;
    }

    private void validateSlotsBelongToTutor(List<BookingPlanSlot> slots, Tutor tutor) {
        Long tutorId = tutor.getTutorID();
        boolean mismatch = slots.stream()
                .anyMatch(slot -> !slot.getTutorID().equals(tutorId));
        if (mismatch) {
            throw new AppException(ErrorCode.BOOKING_NOT_FOUND);
        }
    }

    private void validateSlotQuota(UserPackage userPackage, int requestedSlots) {
        if (requestedSlots <= 0) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        if (userPackage.getSlotsRemaining() < requestedSlots) {
            throw new AppException(ErrorCode.USER_PACKAGE_SLOT_NOT_ENOUGH);
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
            slot.setUserPackage(null);
        }
    }

    private void ensureUniqueSlotIds(List<Long> slotIds) {
        if (slotIds == null || slotIds.isEmpty()) {
            throw new AppException(ErrorCode.BOOKING_SLOT_NOT_FOUND);
        }
        long distinct = slotIds.stream().distinct().count();
        if (distinct != slotIds.size()) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
    }
}


