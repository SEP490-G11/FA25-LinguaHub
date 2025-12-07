package edu.lms.service;

import edu.lms.dto.request.RefundInfoRequest;
import edu.lms.dto.response.RefundRequestResponse;
import edu.lms.entity.RefundRequest;
import edu.lms.entity.Tutor;
import edu.lms.enums.RefundStatus;
import edu.lms.enums.SlotStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.RefundRequestRepository;
import edu.lms.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@Transactional
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class RefundService {

    RefundRequestRepository refundRepo;
    WithdrawService withdrawService;
    TutorRepository tutorRepository;
    BookingPlanSlotRepository bookingPlanSlotRepository;

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


    // ==========================
    //   APPROVE / REJECT ADMIN
    // ==========================

    public void approve(Long refundId) {
        RefundRequest req = refundRepo.findById(refundId)
                .orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));

        Tutor tutor = req.getTutor();
        Long tutorId = tutor.getTutorID();

        // 1) Check đủ tiền trong ví
        BigDecimal currentBalance = withdrawService.calculateCurrentBalance(tutorId);
        if (req.getRefundAmount().compareTo(currentBalance) > 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }

        // 2) Update trạng thái refund
        req.setStatus(RefundStatus.APPROVED);
        req.setProcessedAt(LocalDateTime.now());
        refundRepo.save(req);

        // 3) Nếu có slot liên quan → set slot = Rejected
        if (req.getSlotId() != null) {
            bookingPlanSlotRepository.findById(req.getSlotId())
                    .ifPresent(slot -> {
                        slot.setStatus(SlotStatus.Rejected);
                        bookingPlanSlotRepository.save(slot);
                    });
        }

        // 4) Recalc ví tutor
        BigDecimal newBalance = withdrawService.calculateCurrentBalance(tutorId);
        tutor.setWalletBalance(newBalance);
        tutorRepository.save(tutor);
    }

    public void reject(Long refundId) {
        RefundRequest req = refundRepo.findById(refundId)
                .orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));

        req.setStatus(RefundStatus.REJECTED);
        req.setProcessedAt(LocalDateTime.now());

        refundRepo.save(req);
        // Reject không ảnh hưởng balance nên không cần tính lại
    }


    // ==========================
    //       MAPPER
    // ==========================

    private RefundRequestResponse toResponse(RefundRequest r) {
        return RefundRequestResponse.builder()
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
                .createdAt(r.getCreatedAt())
                .processedAt(r.getProcessedAt())
                .TutorId(r.getTutor().getTutorID())
                .build();
    }
}
