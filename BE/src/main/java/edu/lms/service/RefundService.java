package edu.lms.service;

import edu.lms.dto.request.EvidenceRequest;
import edu.lms.dto.request.RefundInfoRequest;
import edu.lms.dto.response.RefundRequestResponse;
import edu.lms.entity.BookingPlanSlot;
import edu.lms.entity.RefundRequest;
import edu.lms.entity.Tutor;
import edu.lms.enums.RefundStatus;
import edu.lms.enums.RefundType;
import edu.lms.enums.SlotStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.RefundRequestRepository;
import edu.lms.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class RefundService {

    RefundRequestRepository refundRepo;
    WithdrawService withdrawService;          // hiện tại không trừ ví tutor nữa, nhưng giữ lại nếu sau này dùng
    TutorRepository tutorRepository;
    BookingPlanSlotRepository bookingPlanSlotRepository;

    /* ==========================
       LEARNER SUBMIT BANK INFO
       ========================== */
    public void submitRefundInfo(Long refundId, RefundInfoRequest dto, Long userId) {
        RefundRequest req = refundRepo.findById(refundId)
                .orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));

        if (!req.getUserId().equals(userId))
            throw new AppException(ErrorCode.UNAUTHORIZED);

        req.setBankName(dto.getBankName());
        req.setBankOwnerName(dto.getBankOwnerName());
        req.setBankAccountNumber(dto.getBankAccountNumber());
        req.setStatus(RefundStatus.SUBMITTED);

        refundRepo.save(req);
    }

    /* ==========================
       ADMIN VIEW
       ========================== */
    public List<RefundRequestResponse> getAllRefunds() {
        return refundRepo.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<RefundRequestResponse> getByStatus(RefundStatus status) {
        return refundRepo.findByStatus(status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public RefundRequestResponse getOne(Long id) {
        RefundRequest req = refundRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));

        return toResponse(req);
    }

    /* ==========================
       TUTOR VIEW / ACTION
       ========================== */

    // Tutor xem chi tiết 1 refund (qua link từ notification)
    public RefundRequestResponse getOneForTutor(Long refundId, Long tutorUserId) {
        RefundRequest req = refundRepo.findById(refundId)
                .orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));

        Long ownerUserId = req.getTutor().getUser().getUserID();
        if (!ownerUserId.equals(tutorUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return toResponse(req);
    }

    // Tutor xác nhận "có tham gia buổi học" + upload evidence
    public void tutorConfirmAttend(Long refundId, Long tutorUserId, EvidenceRequest dto) {
        RefundRequest req = refundRepo.findById(refundId)
                .orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));

        Long ownerUserId = req.getTutor().getUser().getUserID();
        if (!ownerUserId.equals(tutorUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (req.getRefundType() != RefundType.COMPLAINT) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        // Nếu đã có tutorAttend rồi (do join trước đó hoặc sync từ lịch) => không cho sửa nữa
        if (req.getTutorAttend() != null) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        BookingPlanSlot slot = bookingPlanSlotRepository.findById(req.getSlotId())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_SLOT_NOT_FOUND));

        if (!slot.getTutorID().equals(req.getTutor().getTutorID())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        slot.setTutorJoin(true);
        if (dto != null) {
            slot.setTutorEvidence(dto.getEvidenceUrl());
        }
        bookingPlanSlotRepository.save(slot);

        req.setTutorAttend(true);
        req.setTutorRespondedAt(LocalDateTime.now());
        refundRepo.save(req);

        log.info("[REFUND][TUTOR] Tutor {} confirm attend for refund {}",
                req.getTutor().getTutorID(), refundId);
    }
    // Tutor đồng ý cho refund (xác nhận KHÔNG tham gia / đồng ý trả tiền)
    public void tutorAgreeRefund(Long refundId, Long tutorUserId) {
        RefundRequest req = refundRepo.findById(refundId)
                .orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));

        Long ownerUserId = req.getTutor().getUser().getUserID();
        if (!ownerUserId.equals(tutorUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (req.getRefundType() != RefundType.COMPLAINT) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        // nếu đã có tutorAttend rồi => cũng không cho đổi quyết định nữa
        if (req.getTutorAttend() != null) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        //Update slot flags immediately
        if (req.getSlotId() != null) {
            BookingPlanSlot slot = bookingPlanSlotRepository.findById(req.getSlotId())
                    .orElseThrow(() -> new AppException(ErrorCode.BOOKING_SLOT_NOT_FOUND));

            // Ensure slot belongs to this tutor
            if (!slot.getTutorID().equals(req.getTutor().getTutorID())) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }

            slot.setLearnerJoin(true);   // learner considered attended
            slot.setTutorJoin(false);    // tutor confirms not attended
            bookingPlanSlotRepository.save(slot);
        }

        req.setTutorAttend(false); // false = đồng ý refund / xác nhận không tham gia
        req.setTutorRespondedAt(LocalDateTime.now());
        refundRepo.save(req);

        log.info("[REFUND][TUTOR] Tutor {} agreed refund for refund {}",
                req.getTutor().getTutorID(), refundId);
    }


    // ==========================
    // APPROVE / REJECT ADMIN
    // ==========================

    public void approve(Long refundId) {
        RefundRequest req = refundRepo.findById(refundId)
                .orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));

        Tutor tutor = req.getTutor();
        Long tutorId = tutor.getTutorID();

        // Theo logic mới: refund không trừ trực tiếp ví tutor
        req.setStatus(RefundStatus.APPROVED);
        req.setProcessedAt(LocalDateTime.now());
        refundRepo.save(req);

        // Admin đứng về phía learner:
        //  - Slot bị coi là "không dạy" => status = Rejected
        //  - tutor_join = false (dù trước đó có thể = true)
        //  - learner_join = true (learner có mặt nhưng vẫn được refund)
        if (req.getSlotId() != null) {
            bookingPlanSlotRepository.findById(req.getSlotId())
                    .ifPresent(slot -> {
                        slot.setStatus(SlotStatus.Rejected);  // slot này không bao giờ được release
                        slot.setTutorJoin(false);             // coi như tutor KHÔNG tham gia
                        slot.setLearnerJoin(true);            // learner được coi là có tham gia
                        bookingPlanSlotRepository.save(slot);
                    });
        }

        // Recalc ví tutor để đảm bảo nếu payment này từng được tính,
        // thì sau khi approve refund nó sẽ bị loại khỏi NetIncome (nhờ thuật toán trong WithdrawService)
        BigDecimal newBalance = withdrawService.calculateCurrentBalance(tutorId);
        tutor.setWalletBalance(newBalance);
        tutorRepository.save(tutor);

        log.info("[REFUND][ADMIN] Approved refund {} for tutor {} -> slot rejected, tutor_join=0, learner_join=1",
                refundId, tutorId);
    }

    public void reject(Long refundId) {
        RefundRequest req = refundRepo.findById(refundId)
                .orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));

        Tutor tutor = req.getTutor();
        Long tutorId = tutor.getTutorID();

        req.setStatus(RefundStatus.REJECTED);
        req.setProcessedAt(LocalDateTime.now());
        refundRepo.save(req);

        // Admin đứng về phía tutor:
        //  - Slot vẫn giữ status = Paid
        //  - learner_join = true để slot đủ điều kiện release (khi hết giờ + không còn complaint open)
        if (req.getSlotId() != null) {
            bookingPlanSlotRepository.findById(req.getSlotId())
                    .ifPresent(slot -> {
                        slot.setLearnerJoin(true);   // coi như learner đã tham gia
                        bookingPlanSlotRepository.save(slot);
                    });
        }

        // Recalc ví tutor – nếu slot đã hết giờ & đủ điều kiện release,
        // payment sẽ được cộng vào NetIncome và phản ánh vào walletBalance
        BigDecimal newBalance = withdrawService.calculateCurrentBalance(tutorId);
        tutor.setWalletBalance(newBalance);
        tutorRepository.save(tutor);

        log.info("[REFUND][ADMIN] Rejected refund {} for tutor {} -> learner_join=1, payment may be released",
                refundId, tutorId);
    }

    /* ==========================
       MAPPER
       ========================== */

    private RefundRequestResponse toResponse(RefundRequest r) {

        RefundRequestResponse.RefundRequestResponseBuilder builder =
                RefundRequestResponse.builder()
                        .refundRequestId(r.getRefundRequestId())
                        .bookingPlanId(r.getBookingPlanId())
                        .slotId(r.getSlotId())
                        .userId(r.getUserId())
                        .packageId(r.getPackageId())
                        .refundAmount(r.getRefundAmount())
                        .bankAccountNumber(r.getBankAccountNumber())
                        .bankOwnerName(r.getBankOwnerName())
                        .bankName(r.getBankName())
                        .status(r.getStatus())
                        .refundType(r.getRefundType())
                        .createdAt(r.getCreatedAt())
                        .processedAt(r.getProcessedAt())
                        .reason(r.getReason())
                        .tutorId(r.getTutor().getTutorID());

        if (r.getRefundType() == RefundType.COMPLAINT && r.getSlotId() != null) {
            bookingPlanSlotRepository.findById(r.getSlotId())
                    .ifPresent(slot -> {
                        // Learner được coi là "attend" nếu:
                        //  - learnerJoin = true  HOẶC
                        //  - có learnerEvidence
                        boolean learnerAttend = Boolean.TRUE.equals(slot.getLearnerJoin())
                                || slot.getLearnerEvidence() != null;

                        // TutorAttend ưu tiên theo RefundRequest.tutorAttend
                        Boolean tutorAttend;
                        if (r.getTutorAttend() != null) {
                            tutorAttend = r.getTutorAttend();
                        } else {
                            tutorAttend = Boolean.TRUE.equals(slot.getTutorJoin())
                                    || slot.getTutorEvidence() != null;
                        }

                        builder
                                .learnerAttend(learnerAttend)
                                .tutorAttend(tutorAttend)
                                .learnerEvidence(slot.getLearnerEvidence())
                                .tutorEvidence(slot.getTutorEvidence());
                    });
        }

        return builder.build();
    }
}
