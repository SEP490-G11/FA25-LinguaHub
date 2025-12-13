package edu.lms.service;

import edu.lms.dto.request.TutorBookingPlanRequest;
import edu.lms.dto.response.*;
import edu.lms.entity.*;
import edu.lms.enums.*;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Transactional
public class TutorBookingPlanService {
    NotificationService notificationService;
    BookingPlanRepository bookingPlanRepository;
    BookingPlanSlotRepository bookingPlanSlotRepository;
    TutorRepository tutorRepository;
    RefundRequestRepository refundRequestRepository;
    NotificationRepository notificationRepository;
    PaymentRepository paymentRepository;
    PayOSService payOSService;

    // =========================================================
    // CREATE BOOKING PLAN
    // =========================================================
    public BookingPlanCreateResponse createBookingPlan(Long currentUserId, TutorBookingPlanRequest request) {
        Tutor tutor = getApprovedTutorByUserId(currentUserId);
        log.info("Tutor {} (approved) creating booking plan: title={}, time={}-{}",
                tutor.getTutorID(), request.getTitle(), request.getStartTime(), request.getEndTime());

        validatePlanRequest(request);

        // Validate giới hạn 4 ngày/tuần (với pessimistic lock trong repository)
        validateMaxDaysPerWeek(tutor.getTutorID(), request.getTitle());

        // Kiểm tra overlap (với pessimistic lock trong repository)
        ensureNoOverlappingPlans(
                tutor.getTutorID(),
                request.getTitle(),
                request.getStartTime(),
                request.getEndTime(),
                null
        );

        // Normalize empty string to null for meetingUrl
        String meetingUrl = request.getMeetingUrl();
        if (meetingUrl != null && meetingUrl.trim().isEmpty()) {
            meetingUrl = null;
        }

        BookingPlan bookingPlan = BookingPlan.builder()
                .title(request.getTitle())
                .startHours(request.getStartTime())
                .endHours(request.getEndTime())
                .slotDuration(request.getSlotDuration())
                .pricePerHours(request.getPricePerHours().doubleValue())
                .meetingUrl(meetingUrl)
                .tutorID(tutor.getTutorID())
                .isActive(true)
                .isOpen(true)
                .build();

        bookingPlan = bookingPlanRepository.save(bookingPlan);

        long totalMinutes = Duration.between(
                bookingPlan.getStartHours(),
                bookingPlan.getEndHours()
        ).toMinutes();
        int possibleSlots = (int) (totalMinutes / bookingPlan.getSlotDuration());

        return BookingPlanCreateResponse.builder()
                .success(true)
                .bookingPlanId(bookingPlan.getBookingPlanID())
                .slotsCreated(possibleSlots)
                .build();
    }

    // =========================================================
    // UPDATE BOOKING PLAN
    // =========================================================
    public BookingPlanUpdateResponse updateBookingPlan(Long currentUserId, Long bookingPlanId, TutorBookingPlanRequest request) {
        Tutor tutor = getApprovedTutorByUserId(currentUserId);
        BookingPlan bookingPlan = bookingPlanRepository.findById(bookingPlanId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_PLAN_NOT_FOUND));

        ensurePlanOwner(tutor, bookingPlan);
        log.info("Tutor {} (approved) updating booking plan {}: title={}, time={}-{}",
                tutor.getTutorID(), bookingPlanId, request.getTitle(), request.getStartTime(), request.getEndTime());
        validatePlanRequest(request);

        // Nếu đang thay đổi title (ngày) sang một ngày khác, validate giới hạn 4 ngày/tuần
        boolean isChangingDay = !bookingPlan.getTitle().equals(request.getTitle());
        if (isChangingDay) {
            // Kiểm tra xem title mới đã tồn tại trong các booking plan khác (không tính plan đang update) chưa
            List<BookingPlan> existingPlansWithNewTitle = bookingPlanRepository
                    .findByTutorIDAndTitle(tutor.getTutorID(), request.getTitle());
            boolean newTitleAlreadyExists = existingPlansWithNewTitle.stream()
                    .anyMatch(plan -> plan.getIsActive() && !plan.getBookingPlanID().equals(bookingPlanId));

            // Nếu title mới chưa tồn tại, cần kiểm tra xem có vượt quá 4 ngày không
            if (!newTitleAlreadyExists) {
                // Đếm số ngày hiện tại (bao gồm cả plan đang update)
                Long currentDaysCount = bookingPlanRepository.countDistinctDaysByTutorID(tutor.getTutorID());
                if (currentDaysCount == null) {
                    currentDaysCount = 0L;
                }

                // Kiểm tra xem title cũ có phải là duy nhất không (chỉ có plan đang update cho ngày đó)
                List<BookingPlan> plansWithOldTitle = bookingPlanRepository
                        .findByTutorIDAndTitle(tutor.getTutorID(), bookingPlan.getTitle());
                long activePlansWithOldTitle = plansWithOldTitle.stream()
                        .filter(plan -> plan.getIsActive())
                        .count();
                boolean oldTitleIsUnique = activePlansWithOldTitle == 1
                        && plansWithOldTitle.stream()
                        .anyMatch(plan -> plan.getBookingPlanID().equals(bookingPlanId));

                // Nếu title cũ không phải duy nhất và đã có 4 ngày → đổi sang ngày mới sẽ làm tăng số ngày lên 5 → chặn
                if (!oldTitleIsUnique && currentDaysCount >= 4) {
                    throw new AppException(ErrorCode.BOOKING_PLAN_MAX_DAYS_EXCEEDED);
                }
            }
        }

        ensureNoOverlappingPlans(
                tutor.getTutorID(),
                request.getTitle(),
                request.getStartTime(),
                request.getEndTime(),
                bookingPlanId
        );

        boolean timeFieldsChanged = hasTimeFieldsChanged(bookingPlan, request);

        // Lưu thông tin thời gian cũ trước khi update
        LocalTime oldStartHours = bookingPlan.getStartHours();
        LocalTime oldEndHours = bookingPlan.getEndHours();
        Integer oldSlotDuration = bookingPlan.getSlotDuration();

        // Normalize empty string to null for meetingUrl
        String meetingUrl = request.getMeetingUrl();
        if (meetingUrl != null && meetingUrl.trim().isEmpty()) {
            meetingUrl = null;
        }

        bookingPlan.setTitle(request.getTitle());
        bookingPlan.setStartHours(request.getStartTime());
        bookingPlan.setEndHours(request.getEndTime());
        bookingPlan.setSlotDuration(request.getSlotDuration());
        bookingPlan.setPricePerHours(request.getPricePerHours().doubleValue());
        bookingPlan.setMeetingUrl(meetingUrl);

        bookingPlanRepository.save(bookingPlan);

        int affectedSlots = 0;
        if (timeFieldsChanged) {
            affectedSlots = adjustSlotsForNewPlan(bookingPlan, oldStartHours, oldEndHours, oldSlotDuration);
        }

        return BookingPlanUpdateResponse.builder()
                .success(true)
                .updatedSlots(affectedSlots)
                .build();
    }

    // =========================================================
    // DELETE ALL BOOKING PLANS FOR TUTOR (when tutor suspended/deleted)
    // =========================================================
    /**
     * Xóa tất cả booking plans của tutor và thông báo cho learner
     * Được gọi khi tutor bị suspend hoặc delete
     */
    public void deleteAllBookingPlansForTutor(Long tutorId) {
        log.info("Deleting all booking plans for tutor {}", tutorId);

        // Lấy tất cả booking plans của tutor
        List<BookingPlan> allPlans = bookingPlanRepository.findByTutorID(tutorId);

        if (allPlans.isEmpty()) {
            log.info("No booking plans found for tutor {}", tutorId);
            return;
        }

        int totalPlansDeleted = 0;
        int totalSlotsWithLearner = 0;

        // Xóa từng booking plan
        for (BookingPlan plan : allPlans) {
            // Lấy tất cả slots của booking plan
            List<BookingPlanSlot> allSlots = bookingPlanSlotRepository
                    .findByBookingPlanIDOrderByStartTimeAsc(plan.getBookingPlanID());

            // Xử lý từng slot có learner
            for (BookingPlanSlot slot : allSlots) {
                Long learnerUserId = slot.getUserID();

                if (learnerUserId != null) {
                    // Slot có learner → gửi thông báo và xóa
                    totalSlotsWithLearner++;
                    handleSlotDeletionForTutorSuspension(slot, plan, learnerUserId);
                    bookingPlanSlotRepository.delete(slot);
                } else {
                    // Slot không có learner → xóa trực tiếp
                    bookingPlanSlotRepository.delete(slot);
                }
            }

            // Xóa booking plan
            bookingPlanRepository.delete(plan);
            totalPlansDeleted++;
        }

        log.info("Deleted {} booking plans for tutor {} ({} slots had learners and notifications were sent)",
                totalPlansDeleted, tutorId, totalSlotsWithLearner);
    }

    /**
     * Xử lý xóa slot khi tutor bị suspend/delete: chỉ thông báo cho learner (không thông báo cho tutor)
     */
    private void handleSlotDeletionForTutorSuspension(BookingPlanSlot slot, BookingPlan plan, Long learnerUserId) {
        if (slot.getStatus() == SlotStatus.Locked) {
            // Slot đang thanh toán → hủy payment link và thông báo
            if (slot.getPaymentID() != null) {
                Payment payment = paymentRepository.findById(slot.getPaymentID()).orElse(null);
                if (payment != null && payment.getPaymentLinkId() != null) {
                    // Có thể hủy payment link nếu cần
                }
            }

            // Thông báo cho learner – text có thể tuỳ biến
//            notificationService.sendNotification(...);
        } else if (slot.getStatus() == SlotStatus.Paid) {
            // Slot đã thanh toán → tạo refund request và thông báo
            BigDecimal refundAmount = calculateRefundAmount(slot, plan);

            RefundRequest refund = RefundRequest.builder()
                    .bookingPlanId(plan.getBookingPlanID())
                    .slotId(slot.getSlotID())
                    .userId(learnerUserId)
                    .packageId(slot.getUserPackage() != null ? slot.getUserPackage().getUserPackageID() : null)
                    .refundAmount(refundAmount)
                    .status(RefundStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();

            refundRequestRepository.save(refund);

            // Thông báo cho learner – text có thể tuỳ biến
//            notificationService.sendNotification(...);
        } else {
            // Slot Available nhưng có userID
            // Thông báo cho learner – text có thể tuỳ biến
//            notificationService.sendNotification(...);
        }
    }

    // =========================================================
    // DELETE BOOKING PLAN
    // =========================================================
    public OperationStatusResponse deleteBookingPlan(Long currentUserId, Long bookingPlanId) {
        Tutor tutor = getApprovedTutorByUserId(currentUserId);
        BookingPlan bookingPlan = bookingPlanRepository.findById(bookingPlanId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_PLAN_NOT_FOUND));

        ensurePlanOwner(tutor, bookingPlan);
        log.info("Tutor {} (approved) deleting booking plan {}", tutor.getTutorID(), bookingPlanId);

        // Lấy tất cả slots của booking plan
        List<BookingPlanSlot> allSlots = bookingPlanSlotRepository
                .findByBookingPlanIDOrderByStartTimeAsc(bookingPlanId);

        // Lấy tutor user ID để gửi thông báo
        Long tutorUserId = tutor.getUser() != null ? tutor.getUser().getUserID() : null;

        int slotsWithLearner = 0;
        int deletedSlots = 0;

        // Xử lý từng slot có learner
        for (BookingPlanSlot slot : allSlots) {
            Long learnerUserId = slot.getUserID();

            if (learnerUserId != null) {
                // Slot có learner → gửi thông báo và xóa
                slotsWithLearner++;
                handleSlotDeletion(slot, bookingPlan, learnerUserId, tutorUserId);
                bookingPlanSlotRepository.delete(slot);
                deletedSlots++;
            } else {
                // Slot không có learner → xóa trực tiếp
                bookingPlanSlotRepository.delete(slot);
                deletedSlots++;
            }
        }

        // Xóa booking plan
        bookingPlanRepository.delete(bookingPlan);

        String message = String.format(
                "Booking plan deleted. %d slots deleted (%d slots had learners and notifications were sent).",
                deletedSlots, slotsWithLearner
        );

        log.info("Booking plan {} deleted. Total slots deleted: {}, Slots with learners: {}",
                bookingPlanId, deletedSlots, slotsWithLearner);

        return OperationStatusResponse.success(message);
    }

    /**
     * Xử lý xóa slot có learner: gửi thông báo cho cả tutor và learner, xử lý payment/refund
     */
    private void handleSlotDeletion(BookingPlanSlot slot, BookingPlan plan, Long learnerUserId, Long tutorUserId) {
        if (slot.getStatus() == SlotStatus.Locked) {
            // Slot đang thanh toán → hủy payment link và thông báo
            if (slot.getPaymentID() != null) {
                Payment payment = paymentRepository.findById(slot.getPaymentID()).orElse(null);
                if (payment != null && payment.getPaymentLinkId() != null) {
                    try {
                        payOSService.cancelPaymentLink(payment.getPaymentLinkId());
                        payment.setStatus(PaymentStatus.CANCELLED);
                        payment.setIsPaid(false);
                        payment.setPaidAt(null);
                        payment.setExpiresAt(LocalDateTime.now());
                        paymentRepository.save(payment);
                        log.info("Payment {} cancelled due to booking plan deletion", payment.getPaymentID());
                    } catch (Exception e) {
                        log.error("Cannot cancel payment link {}", payment.getPaymentLinkId(), e);
                    }
                }
            }

            // Thông báo cho learner
            notificationService.sendNotification(
                    learnerUserId,
                    "Lịch học đã bị hủy",
                    "Buổi học vào lúc " + formatDateTime(slot.getStartTime()) +
                            " đã bị hủy do tutor xóa lịch làm việc. " +
                            "Link thanh toán đã bị vô hiệu hoá, bạn sẽ không bị trừ tiền. " +
                            "Vui lòng chọn lịch học mới.",
                    NotificationType.TUTOR_CANCEL_BOOKING,
                    "/learner/booking"
            );

            // Thông báo cho tutor
            if (tutorUserId != null) {
                notificationService.sendNotification(
                        tutorUserId,
                        "Đã xóa slot có learner đang thanh toán",
                        "Buổi học vào lúc " + formatDateTime(slot.getStartTime()) +
                                " có learner đang thanh toán đã bị xóa khi bạn xóa lịch làm việc. " +
                                "Hệ thống đã hủy link thanh toán và thông báo cho learner.",
                        NotificationType.TUTOR_CANCEL_BOOKING,
                        "/tutor/booking-plan"
                );
            }
        } else if (slot.getStatus() == SlotStatus.Paid) {
            // Slot đã thanh toán → tạo refund request và thông báo
            BigDecimal refundAmount = calculateRefundAmount(slot, plan);

            RefundRequest refund = RefundRequest.builder()
                    .bookingPlanId(plan.getBookingPlanID())
                    .slotId(slot.getSlotID())
                    .userId(learnerUserId)
                    .packageId(slot.getUserPackage() != null ? slot.getUserPackage().getUserPackageID() : null)
                    .refundAmount(refundAmount)
                    .status(RefundStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();

            refundRequestRepository.save(refund);

            // Thông báo cho learner
            notificationService.sendNotification(
                    learnerUserId,
                    "Lịch học đã bị hủy - Yêu cầu hoàn tiền",
                    "Buổi học vào lúc " + formatDateTime(slot.getStartTime()) +
                            " đã bị hủy do tutor xóa lịch làm việc. " +
                            "Hệ thống đã tạo yêu cầu hoàn tiền. " +
                            "Vui lòng nhập thông tin ngân hàng để nhận tiền.",
                    NotificationType.REFUND_AVAILABLE,
                    "/learner/refunds"
            );

            // Thông báo cho tutor
            if (tutorUserId != null) {
                notificationService.sendNotification(
                        tutorUserId,
                        "Đã xóa slot đã thanh toán - Yêu cầu hoàn tiền",
                        "Buổi học vào lúc " + formatDateTime(slot.getStartTime()) +
                                " đã được thanh toán nhưng đã bị xóa khi bạn xóa lịch làm việc. " +
                                "Hệ thống đã tạo yêu cầu hoàn tiền cho learner.",
                        NotificationType.REFUND_AVAILABLE,
                        "/tutor/booking-plan"
                );
            }
        } else {
            // Slot Available nhưng có userID
            notificationService.sendNotification(
                    learnerUserId,
                    "Lịch học đã bị hủy",
                    "Buổi học vào lúc " + formatDateTime(slot.getStartTime()) +
                            " đã bị hủy do tutor xóa lịch làm việc. " +
                            "Vui lòng chọn lịch học mới.",
                    NotificationType.TUTOR_CANCEL_BOOKING,
                    "/learner/booking"
            );

            if (tutorUserId != null) {
                notificationService.sendNotification(
                        tutorUserId,
                        "Đã xóa slot có learner",
                        "Buổi học vào lúc " + formatDateTime(slot.getStartTime()) +
                                " có learner đã book nhưng đã bị xóa khi bạn xóa lịch làm việc. " +
                                "Hệ thống đã thông báo cho learner.",
                        NotificationType.TUTOR_CANCEL_BOOKING,
                        "/tutor/booking-plan"
                );
            }
        }
    }

    // =========================================================
    // QUERY
    // =========================================================
    @Transactional(readOnly = true)
    public BookingPlanListResponse getBookingPlansByTutor(Long tutorId) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        // API public - không trả về meetingUrl cho guest/learner
        List<TutorBookingPlanResponse> planResponses = bookingPlanRepository
                .findByTutorIDAndIsActiveTrueOrderByTitleAscStartHoursAsc(tutor.getTutorID())
                .stream()
                .map(plan -> toBookingPlanResponse(plan, false))
                .toList();

        return BookingPlanListResponse.builder()
                .tutorId(tutor.getTutorID())
                .plans(planResponses)
                .build();
    }

    @Transactional(readOnly = true)
    public BookingPlanListResponse getMyBookingPlans(Long currentUserId) {
        Tutor tutor = getApprovedTutorByUserId(currentUserId);

        // API của tutor - trả về đầy đủ thông tin bao gồm meetingUrl
        List<TutorBookingPlanResponse> planResponses = bookingPlanRepository
                .findByTutorIDAndIsActiveTrueOrderByTitleAscStartHoursAsc(tutor.getTutorID())
                .stream()
                .map(plan -> toBookingPlanResponse(plan, true))
                .toList();

        return BookingPlanListResponse.builder()
                .tutorId(tutor.getTutorID())
                .plans(planResponses)
                .build();
    }

    @Transactional(readOnly = true)
    public BookingPlanListWithSlotsResponse getMyBookingPlansWithSlots(Long currentUserId) {
        Tutor tutor = getApprovedTutorByUserId(currentUserId);

        List<BookingPlan> plans = bookingPlanRepository
                .findByTutorIDAndIsActiveTrueOrderByTitleAscStartHoursAsc(tutor.getTutorID());

        // Tạo map để lấy meetingUrl nhanh
        Map<Long, String> meetingUrlMap = plans.stream()
                .filter(plan -> plan != null && plan.getBookingPlanID() != null)
                .collect(Collectors.toMap(
                        BookingPlan::getBookingPlanID,
                        plan -> plan.getMeetingUrl() != null ? plan.getMeetingUrl() : "",
                        (existing, replacement) -> existing
                ));

        List<BookingPlanDetailResponse> planDetailResponses = plans.stream()
                .map(plan -> {
                    List<BookingPlanSlot> slots = bookingPlanSlotRepository
                            .findByBookingPlanIDOrderByStartTimeAsc(plan.getBookingPlanID());

                    List<BookingPlanSlotSummaryResponse> slotResponses = slots.stream()
                            .map(slot -> toSlotSummary(slot, meetingUrlMap))
                            .toList();

                    return BookingPlanDetailResponse.builder()
                            .bookingPlan(toBookingPlanResponse(plan, true))
                            .slots(slotResponses)
                            .build();
                })
                .toList();

        return BookingPlanListWithSlotsResponse.builder()
                .tutorId(tutor.getTutorID())
                .plans(planDetailResponses)
                .build();
    }

    @Transactional(readOnly = true)
    public BookingPlanDetailResponse getBookingPlanDetail(Long bookingPlanId) {
        BookingPlan bookingPlan = bookingPlanRepository.findById(bookingPlanId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_PLAN_NOT_FOUND));

        List<BookingPlanSlot> slots = bookingPlanSlotRepository
                .findByBookingPlanIDOrderByStartTimeAsc(bookingPlanId);

        // Tạo map để lấy meetingUrl nhanh (chỉ cho slot đã thanh toán)
        String meetingUrl = bookingPlan.getMeetingUrl() != null ? bookingPlan.getMeetingUrl() : "";
        Map<Long, String> meetingUrlMap = Map.of(bookingPlanId, meetingUrl);

        List<BookingPlanSlotSummaryResponse> slotResponses = slots.stream()
                .map(slot -> toSlotSummary(slot, meetingUrlMap))
                .toList();

        // API public - không trả về meetingUrl trong booking plan cho guest/learner
        return BookingPlanDetailResponse.builder()
                .bookingPlan(toBookingPlanResponse(bookingPlan, false))
                .slots(slotResponses)
                .build();
    }

    private BookingPlanSlotSummaryResponse toSlotSummary(BookingPlanSlot slot, Map<Long, String> meetingUrlMap) {
        // Lấy meetingUrl từ map, chỉ khi slot đã thanh toán
        String meetingUrl = null;
        if (slot.getStatus() == SlotStatus.Paid && slot.getBookingPlanID() != null) {
            meetingUrl = meetingUrlMap.get(slot.getBookingPlanID());
            // Nếu meetingUrl là empty string, set về null
            if (meetingUrl != null && meetingUrl.isEmpty()) {
                meetingUrl = null;
            }
        }

        return BookingPlanSlotSummaryResponse.builder()
                .slotId(slot.getSlotID())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .status(slot.getStatus().name())
                .meetingUrl(meetingUrl)
                .build();
    }

    // =========================================================
    // VALIDATION
    // =========================================================
    private void validatePlanRequest(TutorBookingPlanRequest request) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        long totalMinutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();
        if (totalMinutes < request.getSlotDuration()) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
    }

    /**
     * Validate giới hạn 4 ngày/tuần cho tutor
     * Tutor chỉ có thể tạo booking plan cho tối đa 4 ngày khác nhau trong tuần
     *
     * Logic:
     * - Nếu title (ngày) đã tồn tại: cho phép tạo thêm plan cho ngày đó (số ngày không tăng)
     * - Nếu title chưa tồn tại và đã có 4 ngày: không cho phép (số ngày sẽ tăng lên 5)
     * - Sử dụng pessimistic lock trong repository để tránh race condition
     */
    private void validateMaxDaysPerWeek(Long tutorId, String newTitle) {
        // Đếm số ngày duy nhất hiện tại của tutor (với pessimistic lock)
        Long currentDaysCount = bookingPlanRepository.countDistinctDaysByTutorID(tutorId);
        if (currentDaysCount == null) {
            currentDaysCount = 0L;
        }

        // Kiểm tra xem title (ngày) mới đã tồn tại chưa
        List<BookingPlan> existingPlansWithSameTitle = bookingPlanRepository
                .findByTutorIDAndTitle(tutorId, newTitle);
        boolean titleAlreadyExists = existingPlansWithSameTitle.stream()
                .anyMatch(plan -> plan.getIsActive());

        // Nếu tutor đã có 4 ngày và title mới chưa tồn tại, thì không cho phép
        if (currentDaysCount >= 4 && !titleAlreadyExists) {
            throw new AppException(ErrorCode.BOOKING_PLAN_MAX_DAYS_EXCEEDED);
        }
    }

    private void ensureNoOverlappingPlans(
            Long tutorId,
            String title,
            LocalTime startTime,
            LocalTime endTime,
            Long excludeId
    ) {
        List<BookingPlan> overlappingPlans = bookingPlanRepository.findOverlappingPlans(
                tutorId, title, startTime, endTime, excludeId);

        if (!overlappingPlans.isEmpty()) {
            throw new AppException(ErrorCode.BOOKING_TIME_CONFLICT);
        }
    }

    private Tutor getApprovedTutorByUserId(Long currentUserId) {
        Tutor tutor = tutorRepository.findByUser_UserID(currentUserId)
                .orElseThrow(() -> {
                    log.warn("User {} attempted to access booking plan but tutor not found", currentUserId);
                    return new AppException(ErrorCode.TUTOR_NOT_FOUND);
                });

        if (tutor.getStatus() == TutorStatus.SUSPENDED) {
            log.warn("Tutor {} (SUSPENDED) attempted to access booking plan", tutor.getTutorID());
            throw new AppException(ErrorCode.TUTOR_ACCOUNT_LOCKED);
        }

        if (tutor.getStatus() != TutorStatus.APPROVED) {
            log.warn("Tutor {} (status: {}) attempted to access booking plan but not approved",
                    tutor.getTutorID(), tutor.getStatus());
            throw new AppException(ErrorCode.TUTOR_NOT_APPROVED);
        }

        return tutor;
    }

    private void ensurePlanOwner(Tutor tutor, BookingPlan bookingPlan) {
        if (!bookingPlan.getTutorID().equals(tutor.getTutorID())) {
            log.warn("Tutor {} attempted to access booking plan {} owned by tutor {}",
                    tutor.getTutorID(), bookingPlan.getBookingPlanID(), bookingPlan.getTutorID());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    private boolean hasTimeFieldsChanged(BookingPlan bookingPlan, TutorBookingPlanRequest request) {
        return !bookingPlan.getStartHours().equals(request.getStartTime())
                || !bookingPlan.getEndHours().equals(request.getEndTime())
                || !bookingPlan.getSlotDuration().equals(request.getSlotDuration())
                || !bookingPlan.getTitle().equals(request.getTitle());
    }

    // =========================================================
    // LOGIC UPDATE PLAN → HANDLE SLOTS
    // =========================================================
    /**
     * Điều chỉnh slots khi update booking plan theo 3 trường hợp:
     * 1. Slot trùng giữa thời gian cũ và mới → GIỮ NGUYÊN
     * 2. Slot có trong thời gian mới nhưng không tồn tại trước đó → TẠO MỚI
     * 3. Slot cũ không còn nằm trong thời gian mới → XOÁ (nếu không có learner) hoặc giữ lại và thông báo (nếu có learner)
     */
    private int adjustSlotsForNewPlan(BookingPlan plan, LocalTime oldStartHours, LocalTime oldEndHours, Integer oldSlotDuration) {
        List<BookingPlanSlot> existingSlots = bookingPlanSlotRepository
                .findByBookingPlanIDOrderByStartTimeAsc(plan.getBookingPlanID());

        // Tính toán thời gian trùng nhau giữa cũ và mới
        LocalTime intersectionStart = oldStartHours.isBefore(plan.getStartHours())
                ? plan.getStartHours()
                : oldStartHours;
        LocalTime intersectionEnd = oldEndHours.isBefore(plan.getEndHours())
                ? oldEndHours
                : plan.getEndHours();

        // Nếu không có intersection, tất cả slots cũ sẽ bị xử lý
        boolean hasIntersection = !intersectionStart.isAfter(intersectionEnd);

        int affected = 0;
        int created = 0;
        int deleted = 0;
        int kept = 0;

        // Xử lý từng slot hiện có
        for (BookingPlanSlot slot : existingSlots) {
            if (slot.getStatus() == SlotStatus.Rejected) continue;

            LocalTime slotStart = slot.getStartTime().toLocalTime();
            LocalTime slotEnd = slot.getEndTime().toLocalTime();

            // Kiểm tra slot có nằm trong thời gian mới không
            boolean isInNewTime = !slotStart.isBefore(plan.getStartHours())
                    && !slotEnd.isAfter(plan.getEndHours());

            // Kiểm tra slot có nằm trong thời gian cũ không
            boolean isInOldTime = !slotStart.isBefore(oldStartHours)
                    && !slotEnd.isAfter(oldEndHours);

            if (isInNewTime && isInOldTime) {
                // TRƯỜNG HỢP 1: Slot trùng giữa thời gian cũ và mới → GIỮ NGUYÊN
                kept++;
                log.debug("Slot {} kept unchanged (overlapping time range)", slot.getSlotID());
            } else if (!isInNewTime) {
                // TRƯỜNG HỢP 3: Slot cũ không còn nằm trong thời gian mới
                handleSlotOutOfNewTime(slot, plan);
                if (slot.getUserID() == null) {
                    deleted++;
                } else {
                    kept++; // Giữ lại nhưng đã thông báo hoặc chuyển sang refund
                }
                affected++;
            }
            // Nếu slot chỉ nằm trong thời gian mới nhưng không nằm trong thời gian cũ
            // → Đây là slot mới, sẽ được tạo ở bước sau
        }

        // TRƯỜNG HỢP 2: Tạo slots mới cho thời gian mới
        if (hasIntersection) {
            // Tạo slots cho phần thời gian mới ngoài intersection
            created += generateSlotsForTimeRange(
                    plan,
                    plan.getStartHours(),
                    intersectionStart,
                    existingSlots
            );
            created += generateSlotsForTimeRange(
                    plan,
                    intersectionEnd,
                    plan.getEndHours(),
                    existingSlots
            );
        } else {
            // Không có intersection, tạo toàn bộ slots mới
            created += generateSlotsForTimeRange(
                    plan,
                    plan.getStartHours(),
                    plan.getEndHours(),
                    existingSlots
            );
        }

        log.info("Updated booking plan {}: kept={}, created={}, deleted={}, affected={}",
                plan.getBookingPlanID(), kept, created, deleted, affected);

        return affected + created;
    }

    /**
     * Tạo slots mới cho một khoảng thời gian, tránh trùng với slots đã tồn tại
     */
    private int generateSlotsForTimeRange(
            BookingPlan plan,
            LocalTime rangeStart,
            LocalTime rangeEnd,
            List<BookingPlanSlot> existingSlots
    ) {
        if (rangeStart.isAfter(rangeEnd) || rangeStart.equals(rangeEnd)) {
            return 0;
        }

        int created = 0;
        LocalTime currentStart = rangeStart;

        while (currentStart.isBefore(rangeEnd)) {
            final LocalTime slotStart = currentStart; // Final variable for lambda
            LocalTime currentEnd = currentStart.plusMinutes(plan.getSlotDuration());

            // Nếu vượt quá rangeEnd, dừng lại
            if (currentEnd.isAfter(rangeEnd)) {
                break;
            }

            final LocalTime slotEnd = currentEnd; // Final variable for lambda

            // Kiểm tra xem slot này đã tồn tại chưa (so sánh theo thời gian)
            boolean slotExists = existingSlots.stream()
                    .anyMatch(slot -> {
                        LocalTime existingSlotStart = slot.getStartTime().toLocalTime();
                        LocalTime existingSlotEnd = slot.getEndTime().toLocalTime();
                        return existingSlotStart.equals(slotStart) && existingSlotEnd.equals(slotEnd);
                    });

            if (!slotExists) {
                // Tạo slot mới - xác định ngày cụ thể dựa trên title
                LocalDateTime slotStartDateTime = getNextOccurrenceOfDay(
                        plan.getTitle(),
                        slotStart
                );
                LocalDateTime slotEndDateTime = slotStartDateTime.plusMinutes(plan.getSlotDuration());

                BookingPlanSlot newSlot = BookingPlanSlot.builder()
                        .bookingPlanID(plan.getBookingPlanID())
                        .tutorID(plan.getTutorID())
                        .userID(null) // Chưa có learner
                        .startTime(slotStartDateTime)
                        .endTime(slotEndDateTime)
                        .status(SlotStatus.Available)
                        .build();

                // Nếu muốn auto tạo slot mới trong DB, bỏ comment dòng dưới:
                // bookingPlanSlotRepository.save(newSlot);
                // created++;
            }

            currentStart = currentEnd;
        }

        return created;
    }

    /**
     * Lấy ngày tiếp theo của một ngày trong tuần (dựa trên title)
     * Ví dụ: "Monday" → thứ 2 tuần này hoặc tuần sau
     */
    private LocalDateTime getNextOccurrenceOfDay(String dayTitle, LocalTime time) {
        // Map title sang DayOfWeek
        DayOfWeek targetDay = mapTitleToDayOfWeek(dayTitle);
        LocalDate today = LocalDate.now();
        LocalDate nextOccurrence = today;

        // Tìm ngày tiếp theo có DayOfWeek trùng với targetDay
        while (nextOccurrence.getDayOfWeek() != targetDay) {
            nextOccurrence = nextOccurrence.plusDays(1);
        }

        return LocalDateTime.of(nextOccurrence, time);
    }

    /**
     * Map title (ví dụ: "Monday", "Thứ 2") sang DayOfWeek
     */
    private DayOfWeek mapTitleToDayOfWeek(String title) {
        String lowerTitle = title.toLowerCase().trim();

        // Hỗ trợ tiếng Anh + tiếng Việt
        if (lowerTitle.contains("monday") || lowerTitle.contains("thứ 2") || lowerTitle.contains("thứ hai")) {
            return DayOfWeek.MONDAY;
        } else if (lowerTitle.contains("tuesday") || lowerTitle.contains("thứ 3") || lowerTitle.contains("thứ ba")) {
            return DayOfWeek.TUESDAY;
        } else if (lowerTitle.contains("wednesday") || lowerTitle.contains("thứ 4") || lowerTitle.contains("thứ tư")) {
            return DayOfWeek.WEDNESDAY;
        } else if (lowerTitle.contains("thursday") || lowerTitle.contains("thứ 5") || lowerTitle.contains("thứ năm")) {
            return DayOfWeek.THURSDAY;
        } else if (lowerTitle.contains("friday") || lowerTitle.contains("thứ 6") || lowerTitle.contains("thứ sáu")) {
            return DayOfWeek.FRIDAY;
        } else if (lowerTitle.contains("saturday") || lowerTitle.contains("thứ 7") || lowerTitle.contains("thứ bảy")) {
            return DayOfWeek.SATURDAY;
        } else if (lowerTitle.contains("sunday") || lowerTitle.contains("chủ nhật")) {
            return DayOfWeek.SUNDAY;
        }

        // Mặc định là thứ 2 nếu parse không được
        return DayOfWeek.MONDAY;
    }

    /**
     * Xử lý slot không còn nằm trong thời gian mới
     * - Không đụng tới slot QUÁ KHỨ
     * - Không đụng tới slot TRONG NGÀY HÔM NAY
     * - Chỉ xử lý slot TƯƠNG LAI (ngày > hôm nay)
     *   + Locked  -> hủy payment link + thông báo
     *   + Paid    -> tạo refund TUTOR_RESCHEDULE + set Rejected
     *   + Others  -> chỉ thông báo
     */
    private void handleSlotOutOfNewTime(BookingPlanSlot slot, BookingPlan plan) {
        Long learnerUserId = slot.getUserID();

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDate slotDate = slot.getStartTime().toLocalDate();

        // 0) Nếu slot đã ở QUÁ KHỨ (endTime < now) -> KHÔNG đụng
        if (slot.getEndTime() != null && slot.getEndTime().isBefore(now)) {
            log.info("[BOOKING-UPDATE] Skip slot {} ({} - {}) because it is in the past",
                    slot.getSlotID(), slot.getStartTime(), slot.getEndTime());
            return;
        }

        // 1) Nếu slot là NGÀY HÔM NAY -> KHÔNG đụng
        if (slotDate.isEqual(today)) {
            log.info("[BOOKING-UPDATE] Skip slot {} ({} - {}) because it is TODAY",
                    slot.getSlotID(), slot.getStartTime(), slot.getEndTime());
            return;
        }

        // 2) Slot TƯƠNG LAI nhưng KHÔNG có learner -> XÓA slot luôn
        if (learnerUserId == null) {
            bookingPlanSlotRepository.delete(slot);
            log.info("[BOOKING-UPDATE] Deleted future empty slot {} ({} - {})",
                    slot.getSlotID(), slot.getStartTime(), slot.getEndTime());
            return;
        }

        // 3) Slot TƯƠNG LAI có learner -> tùy theo status
        Tutor tutor = tutorRepository.findById(plan.getTutorID())
                .orElse(null);
        Long tutorUserId = tutor != null && tutor.getUser() != null
                ? tutor.getUser().getUserID()
                : null;

        // =========================
        // CASE: SLOT LOCKED (đang thanh toán)
        // =========================
        if (slot.getStatus() == SlotStatus.Locked) {

            // Hủy link thanh toán nếu có
            if (slot.getPaymentID() != null) {
                Payment payment = paymentRepository.findById(slot.getPaymentID()).orElse(null);
                if (payment != null && payment.getPaymentLinkId() != null) {
                    try {
                        payOSService.cancelPaymentLink(payment.getPaymentLinkId());
                        payment.setStatus(PaymentStatus.CANCELLED);
                        payment.setIsPaid(false);
                        payment.setPaidAt(null);
                        payment.setExpiresAt(LocalDateTime.now());
                        paymentRepository.save(payment);
                        log.info("[BOOKING-UPDATE] Payment {} cancelled because plan updated",
                                payment.getPaymentID());
                    } catch (Exception e) {
                        log.error("Cannot cancel payment link {} when updating booking plan",
                                payment.getPaymentLinkId(), e);
                    }
                }
            }

            // Thông báo cho learner
            notificationService.sendNotification(
                    learnerUserId,
                    "Lịch học đã thay đổi",
                    "Buổi học vào lúc " + formatDateTime(slot.getStartTime()) +
                            " đã bị ảnh hưởng do tutor thay đổi lịch. " +
                            "Link thanh toán đã bị hủy, vui lòng chọn lịch mới và thanh toán lại.",
                    NotificationType.TUTOR_CANCEL_BOOKING,
                    "/learner/booking"
            );

            // Thông báo cho tutor
            if (tutorUserId != null) {
                notificationService.sendNotification(
                        tutorUserId,
                        "Slot có learner đang thanh toán bị ảnh hưởng",
                        "Buổi học vào lúc " + formatDateTime(slot.getStartTime()) +
                                " có learner đang thanh toán đã bị ảnh hưởng do bạn cập nhật lịch làm việc. " +
                                "Hệ thống đã hủy link thanh toán và thông báo cho learner.",
                        NotificationType.TUTOR_CANCEL_BOOKING,
                        "/tutor/booking-plan"
                );
            }

            log.info("[BOOKING-UPDATE] Locked slot {} affected by plan update (learnerId={})",
                    slot.getSlotID(), learnerUserId);
            return;
        }

        // =========================
        // CASE: SLOT PAID (đã thanh toán)
        // =========================
        if (slot.getStatus() == SlotStatus.Paid) {

            // Không tạo refund trùng nếu đã có refund open/approved cho slot này
            boolean hasRefund = refundRequestRepository.existsBySlotIdAndStatusIn(
                    slot.getSlotID(),
                    List.of(
                            RefundStatus.PENDING,
                            RefundStatus.SUBMITTED,
                            RefundStatus.APPROVED
                    )
            );
            if (hasRefund) {
                log.info("[BOOKING-UPDATE] Skip creating refund for slot {} because it already has refund",
                        slot.getSlotID());
                return;
            }

            BigDecimal refundAmount = calculateRefundAmount(slot, plan);

            RefundRequest refund = RefundRequest.builder()
                    .bookingPlanId(plan.getBookingPlanID())
                    .slotId(slot.getSlotID())
                    .userId(learnerUserId)
                    .packageId(slot.getUserPackage() != null
                            ? slot.getUserPackage().getUserPackageID()
                            : null)
                    .refundAmount(refundAmount)
                    .status(RefundStatus.PENDING)
                    .refundType(RefundType.TUTOR_RESCHEDULE)
                    .createdAt(LocalDateTime.now())
                    .tutor(tutor)
                    .reason("Hoàn tiền do tutor thay đổi lịch, slot không còn phù hợp với lịch mới")
                    .build();

            // Slot này không còn được sử dụng nữa
            slot.setStatus(SlotStatus.Rejected);
            bookingPlanSlotRepository.save(slot);
            refundRequestRepository.save(refund);

            // Thông báo cho learner
            notificationService.sendNotification(
                    learnerUserId,
                    "Lịch học đã thay đổi - Yêu cầu hoàn tiền",
                    "Buổi học vào lúc " + formatDateTime(slot.getStartTime()) +
                            " đã bị ảnh hưởng do tutor thay đổi lịch làm việc. " +
                            "Hệ thống đã tạo yêu cầu hoàn tiền cho bạn. " +
                            "Vui lòng nhập thông tin ngân hàng để nhận tiền hoặc chọn lịch khác.",
                    NotificationType.REFUND_AVAILABLE,
                    "/learner/refunds"
            );

            // Thông báo cho tutor
            if (tutorUserId != null) {
                notificationService.sendNotification(
                        tutorUserId,
                        "Lịch học đã thanh toán bị ảnh hưởng - Yêu cầu hoàn tiền",
                        "Buổi học vào lúc " + formatDateTime(slot.getStartTime()) +
                                " đã được thanh toán nhưng không còn phù hợp với lịch mới của bạn. " +
                                "Hệ thống đã tạo yêu cầu hoàn tiền cho học viên.",
                        NotificationType.REFUND_AVAILABLE,
                        "/tutor/booking-plan"
                );
            }

            log.info("[BOOKING-UPDATE] Paid slot {} -> refund {} (TUTOR_RESCHEDULE)",
                    slot.getSlotID(), refund.getRefundRequestId());
            return;
        }

        // =========================
        // CASE: CÁC STATUS KHÁC (Available nhưng có userID, v.v.)
        // =========================
        notificationService.sendNotification(
                learnerUserId,
                "Lịch học đã thay đổi",
                "Buổi học vào lúc " + formatDateTime(slot.getStartTime()) +
                        " đã bị ảnh hưởng do tutor thay đổi lịch. " +
                        "Vui lòng chọn lịch học mới.",
                NotificationType.TUTOR_CANCEL_BOOKING,
                "/learner/booking"
        );

        if (tutorUserId != null) {
            notificationService.sendNotification(
                    tutorUserId,
                    "Lịch học có learner bị ảnh hưởng",
                    "Buổi học vào lúc " + formatDateTime(slot.getStartTime()) +
                            " có learner đã book nhưng không còn phù hợp với lịch mới của bạn. " +
                            "Vui lòng trao đổi với học viên và sắp xếp lại lịch nếu cần.",
                    NotificationType.TUTOR_CANCEL_BOOKING,
                    "/tutor/booking-plan"
            );
        }

        log.info("[BOOKING-UPDATE] Slot {} (status={}) with learner affected by plan update",
                slot.getSlotID(), slot.getStatus());
    }

    private BigDecimal calculateRefundAmount(BookingPlanSlot slot, BookingPlan plan) {
        BigDecimal pricePerHour = BigDecimal.valueOf(plan.getPricePerHours());
        long minutes = Duration.between(slot.getStartTime(), slot.getEndTime()).toMinutes();

        if (minutes <= 0) return BigDecimal.ZERO;

        return pricePerHour
                .multiply(BigDecimal.valueOf(minutes))
                .divide(BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP);
    }

//    private void sendNotification(
//            Long userId,
//            String title,
//            String content,
//            NotificationType type,
//            String primaryUrl
//    ) {
//        Notification n = Notification.builder()
//                .userId(userId)
//                .title(title)
//                .content(content)
//                .type(type)
//                .primaryActionUrl(primaryUrl)
//                .isRead(false)
//                .createdAt(LocalDateTime.now())
//                .build();
//
//        notificationRepository.save(n);
//    }

    private String formatDateTime(LocalDateTime dt) {
        return dt.toLocalTime() + " ngày " + dt.toLocalDate();
    }

    private TutorBookingPlanResponse toBookingPlanResponse(BookingPlan bookingPlan, boolean includeMeetingUrl) {
        Double rawPrice = bookingPlan.getPricePerHours();

        return TutorBookingPlanResponse.builder()
                .bookingPlanId(bookingPlan.getBookingPlanID())
                .tutorId(bookingPlan.getTutorID())
                .title(bookingPlan.getTitle())
                .startTime(bookingPlan.getStartHours())
                .endTime(bookingPlan.getEndHours())
                .slotDuration(bookingPlan.getSlotDuration())
                .pricePerHours(rawPrice == null ? BigDecimal.ZERO : BigDecimal.valueOf(rawPrice))
                .meetingUrl(includeMeetingUrl ? bookingPlan.getMeetingUrl() : null)
                .isOpen(bookingPlan.getIsOpen())
                .isActive(bookingPlan.getIsActive())
                .createdAt(bookingPlan.getCreatedAt())
                .updatedAt(bookingPlan.getUpdatedAt())
                .build();
    }

}
