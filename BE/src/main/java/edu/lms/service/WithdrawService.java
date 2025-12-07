package edu.lms.service;

import edu.lms.dto.request.WithdrawRequest;
import edu.lms.dto.response.WithdrawResponse;
import edu.lms.entity.*;
import edu.lms.enums.PaymentType;
import edu.lms.enums.SlotStatus;
import edu.lms.enums.WithdrawStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class WithdrawService {

    WithdrawRepository withdrawRepository;
    TutorRepository tutorRepository;
    PaymentRepository paymentRepository;
    SettingRepository settingRepository;
    RefundRequestRepository refundRepository;
    BookingPlanSlotRepository bookingPlanSlotRepository;

    // =============================
    //  TÍNH TỔNG NET INCOME (PAYMENT)
    // =============================
    // Tổng tiền tutor nhận được:
    //  - Course: mọi payment PAID
    //  - Booking: chỉ payment có tất cả slot Paid && tutorJoin && learnerJoin
    //  - Mỗi payment dùng snapshot netAmount; nếu null thì fallback dùng Setting hiện tại
    private BigDecimal calculateNetIncome(Long tutorId) {

        Setting setting = settingRepository.getCurrentSetting();
        BigDecimal commissionCourse = setting.getCommissionCourse();
        BigDecimal commissionBooking = setting.getCommissionBooking();

        List<Payment> payments = paymentRepository.findSuccessPaymentsByTutor(tutorId);

        BigDecimal totalNet = BigDecimal.ZERO;

        for (Payment p : payments) {

            // ----- COURSE: luôn tính nếu PAID -----
            if (p.getPaymentType() == PaymentType.Course) {

                BigDecimal net;

                if (p.getNetAmount() != null) {
                    // ✅ dùng snapshot nếu có
                    net = p.getNetAmount();
                } else {
                    // fallback cho dữ liệu cũ
                    net = p.getAmount()
                            .subtract(p.getAmount().multiply(commissionCourse));
                }

                totalNet = totalNet.add(net);
            }

            // ----- BOOKING: chỉ tính nếu tất cả slot đã join -----
            else if (p.getPaymentType() == PaymentType.Booking) {

                List<BookingPlanSlot> slots =
                        bookingPlanSlotRepository.findAllByPaymentID(p.getPaymentID());

                if (slots.isEmpty()) {
                    continue;
                }

                boolean allConfirmed = slots.stream()
                        .filter(s -> s.getStatus() == SlotStatus.Paid)
                        .allMatch(s ->
                                Boolean.TRUE.equals(s.getTutorJoin())
                                        && Boolean.TRUE.equals(s.getLearnerJoin())
                        );

                if (!allConfirmed) {
                    // chưa release → chưa cộng vào ví
                    continue;
                }

                BigDecimal net;
                if (p.getNetAmount() != null) {
                    net = p.getNetAmount();
                } else {
                    net = p.getAmount()
                            .subtract(p.getAmount().multiply(commissionBooking));
                }

                totalNet = totalNet.add(net);
            }
        }

        return totalNet;
    }

    // =============================
    //  TÍNH SỐ DƯ HIỆN TẠI CỦA VÍ
    // =============================
    // Balance = NetIncome - WithdrawApproved
    // (refund learner do admin xử lý từ tiền admin, không trừ ví tutor nữa)
    public BigDecimal calculateCurrentBalance(Long tutorId) {

        BigDecimal netIncome = calculateNetIncome(tutorId);

        BigDecimal totalWithdrawApproved =
                withdrawRepository.sumWithdrawAmountByTutorAndStatus(
                        tutorId,
                        WithdrawStatus.APPROVED
                );
        if (totalWithdrawApproved == null) {
            totalWithdrawApproved = BigDecimal.ZERO;
        }

        return netIncome
                .subtract(totalWithdrawApproved);
    }

    // =============================
    // TUTOR REQUEST WITHDRAW
    // =============================
    public WithdrawResponse createWithdraw(Long tutorId, WithdrawRequest req) {

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        BigDecimal currentBalance = calculateCurrentBalance(tutorId);
        BigDecimal withdrawAmount = req.getWithdrawAmount();

        if (withdrawAmount.compareTo(currentBalance) > 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }

        WithdrawMoney withdraw = WithdrawMoney.builder()
                .tutor(tutor)
                .totalAmount(currentBalance)
                .withdrawAmount(withdrawAmount)
                .bankAccountNumber(req.getBankAccountNumber())
                .bankName(req.getBankName())
                .bankOwnerName(req.getBankOwnerName())
                .status(WithdrawStatus.PENDING)
                .build();

        withdrawRepository.save(withdraw);

        return toResponse(withdraw);
    }

    // =============================
    // GET BALANCE TỪ VÍ
    // =============================
    public BigDecimal getBalance(Long tutorId) {
        // Luôn tính lại, không đọc cứng từ tutor.walletBalance
        return calculateCurrentBalance(tutorId);
    }

    // =============================
    // HISTORY FOR TUTOR
    // =============================
    public List<WithdrawResponse> getWithdrawHistory(Long tutorId) {
        return withdrawRepository.findByTutorTutorID(tutorId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =============================
    // MAPPER
    // =============================
    private WithdrawResponse toResponse(WithdrawMoney w) {
        return WithdrawResponse.builder()
                .withdrawId(w.getWithdrawId())
                .tutorId(w.getTutor().getTutorID())
                .totalAmount(w.getTotalAmount())
                .withdrawAmount(w.getWithdrawAmount())
                .bankAccountNumber(w.getBankAccountNumber())
                .bankName(w.getBankName())
                .bankOwnerName(w.getBankOwnerName())
                .status(w.getStatus())
                .createdAt(w.getCreatedAt())
                .build();
    }
}
