package edu.lms.service;

import edu.lms.dto.response.BookingPlanSlotResponse;
import edu.lms.entity.BookingPlan;
import edu.lms.entity.BookingPlanSlot;
import edu.lms.entity.Tutor;
import edu.lms.enums.SlotStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.BookingPlanRepository;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingPlanSlotService {

    private final BookingPlanSlotRepository bookingPlanSlotRepository;
    private final BookingPlanRepository bookingPlanRepository;
    private final TutorRepository tutorRepository;

    /* ============================================================
       GET ALL SLOTS FOR USER
       ============================================================ */
    public List<BookingPlanSlotResponse> getSlotsForUser(Long userId) {
        List<BookingPlanSlot> slots = bookingPlanSlotRepository.findByUserID(userId);

        if (slots.isEmpty()) {
            return List.of();
        }

        // Meeting URL Map
        Map<Long, String> meetingUrlMap = buildMeetingUrlMap(slots);

        // Tutor Fullname Map
        Map<Long, String> tutorNameMap = buildTutorNameMap(slots);

        // Convert to DTO
        return slots.stream()
                .map(slot -> toSlotResponse(slot, meetingUrlMap, tutorNameMap))
                .collect(Collectors.toList());
    }

    /* ============================================================
       GET ALL PAID SLOTS BY TUTOR
       ============================================================ */
    public List<BookingPlanSlotResponse> getPaidSlotsByTutor(Long tutorId) {

        List<BookingPlanSlot> slots = bookingPlanSlotRepository
                .findByTutorIDAndStatus(tutorId, SlotStatus.Paid);

        if (slots.isEmpty()) {
            return List.of();
        }

        Map<Long, String> meetingUrlMap = buildMeetingUrlMap(slots);
        Map<Long, String> tutorNameMap = buildTutorNameMap(slots);

        return slots.stream()
                .map(slot -> toSlotResponse(slot, meetingUrlMap, tutorNameMap))
                .collect(Collectors.toList());
    }

    /* ============================================================
       GET ALL SLOTS FOR TUTOR (ANY STATUS)
       ============================================================ */
    public List<BookingPlanSlotResponse> getSlotsForTutor(Long userId) {
        Tutor tutor = tutorRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        List<BookingPlanSlot> slots = bookingPlanSlotRepository.findByTutorID(tutor.getTutorID());

        if (slots.isEmpty()) {
            return List.of();
        }

        Map<Long, String> meetingUrlMap = buildMeetingUrlMap(slots);
        Map<Long, String> tutorNameMap = buildTutorNameMap(slots);

        return slots.stream()
                .map(slot -> toSlotResponse(slot, meetingUrlMap, tutorNameMap))
                .collect(Collectors.toList());
    }

    /* ============================================================
       COMMON METHODS
       ============================================================ */

    /** Build Meeting URL Map */
    private Map<Long, String> buildMeetingUrlMap(List<BookingPlanSlot> slots) {
        List<Long> bookingPlanIds = slots.stream()
                .map(BookingPlanSlot::getBookingPlanID)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());

        return bookingPlanIds.isEmpty()
                ? Map.of()
                : bookingPlanRepository.findAllById(bookingPlanIds).stream()
                .filter(plan -> plan != null && plan.getBookingPlanID() != null)
                .collect(Collectors.toMap(
                        BookingPlan::getBookingPlanID,
                        plan -> plan.getMeetingUrl() != null ? plan.getMeetingUrl() : "",
                        (existing, replacement) -> existing
                ));
    }

    /** Build Tutor Fullname Map */
    private Map<Long, String> buildTutorNameMap(List<BookingPlanSlot> slots) {
        List<Long> tutorIds = slots.stream()
                .map(BookingPlanSlot::getTutorID)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());

        return tutorIds.isEmpty()
                ? Map.of()
                : tutorRepository.findAllById(tutorIds).stream()
                .filter(tutor -> tutor.getUser() != null)
                .collect(Collectors.toMap(
                        Tutor::getTutorID,
                        tutor -> tutor.getUser().getFullName() != null
                                ? tutor.getUser().getFullName()
                                : "",
                        (existing, replacement) -> existing
                ));
    }

    /** Convert Entity -> Response DTO */
    private BookingPlanSlotResponse toSlotResponse(
            BookingPlanSlot slot,
            Map<Long, String> meetingUrlMap,
            Map<Long, String> tutorNameMap
    ) {

        String meetingUrl = null;
        if (slot.getStatus() == SlotStatus.Paid && slot.getBookingPlanID() != null) {
            meetingUrl = meetingUrlMap.get(slot.getBookingPlanID());
            if (meetingUrl != null && meetingUrl.isEmpty()) {
                meetingUrl = null;
            }
        }

        return BookingPlanSlotResponse.builder()
                .slotID(slot.getSlotID())
                .bookingPlanID(slot.getBookingPlanID())
                .tutorID(slot.getTutorID())
                .userID(slot.getUserID())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .paymentID(slot.getPaymentID())
                .status(slot.getStatus())
                .lockedAt(slot.getLockedAt())
                .expiresAt(slot.getExpiresAt())
                .meetingUrl(meetingUrl)
                .tutorFullName(tutorNameMap.get(slot.getTutorID()))
                .learnerJoin(slot.getLearnerJoin())
                .tutorJoin(slot.getTutorJoin())
                .learnerEvidence(slot.getLearnerEvidence())
                .tutorEvidence(slot.getTutorEvidence())
                .build();
    }
}
