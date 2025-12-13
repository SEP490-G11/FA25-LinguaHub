package edu.lms.service;

import edu.lms.dto.request.WithdrawRequest;
import edu.lms.dto.response.WithdrawResponse;
import edu.lms.entity.BookingPlanSlot;
import edu.lms.entity.Payment;
import edu.lms.entity.Setting;
import edu.lms.entity.Tutor;
import edu.lms.entity.WithdrawMoney;
import edu.lms.enums.PaymentType;
import edu.lms.enums.RefundStatus;
import edu.lms.enums.SlotStatus;
import edu.lms.enums.WithdrawStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.PaymentRepository;
import edu.lms.repository.RefundRequestRepository;
import edu.lms.repository.SettingRepository;
import edu.lms.repository.TutorRepository;
import edu.lms.repository.WithdrawRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumSet;
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
    //  CHECK SLOT BOOKING ĐÃ "RELEASE" CHƯA
    // =============================
    private boolean isBookingSlotReleased(BookingPlanSlot slot, LocalDateTime now) {

        // Chỉ xét slot đã được thanh toán
        if (slot.getStatus() != SlotStatus.Paid) {
            return false;
        }

        // Tutor chưa join => không release
        if (!Boolean.TRUE.equals(slot.getTutorJoin())) {
            return false;
        }

        // Nếu learner cũng join thì ok luôn
        if (Boolean.TRUE.equals(slot.getLearnerJoin())) {
            return true;
        }

        // Learner không xác nhận join:
        // chỉ auto-release nếu đã qua endTime và không có complaint pending/submitted
        if (slot.getEndTime() == null) {
            return false;
        }

        if (now.isBefore(slot.getEndTime())) {
            // chưa hết giờ buổi học
            return false;
        }

        // Kiểm tra xem có refund COMPLAINT còn open không
        boolean hasOpenComplaint = refundRepository.existsBySlotIdAndStatusIn(
                slot.getSlotID(),
                EnumSet.of(RefundStatus.PENDING, RefundStatus.SUBMITTED)
        );

        // Nếu có complaint đang xử lý → KHÔNG release
        return !hasOpenComplaint;
    }

    // =============================
    //  TÍNH TỔNG NET INCOME (PAYMENT)
    // =============================
    // Tổng tiền tutor nhận được:
    //  - Course: mọi payment PAID
    //  - Booking: chỉ payment có ÍT NHẤT 1 slot Paid và TẤT CẢ slot Paid đó đã "release"
    //  - Mỗi payment dùng snapshot netAmount; nếu null thì fallback dùng Setting hiện tại
    private BigDecimal calculateNetIncome(Long tutorId) {

        Setting setting = settingRepository.getCurrentSetting();
        BigDecimal commissionCourse = setting.getCommissionCourse();
        BigDecimal commissionBooking = setting.getCommissionBooking();

        List<Payment> payments = paymentRepository.findSuccessPaymentsByTutor(tutorId);

        BigDecimal totalNet = BigDecimal.ZERO;
        LocalDateTime now = LocalDateTime.now();

        for (Payment p : payments) {

            // ----- COURSE: luôn tính nếu PAID -----
            if (p.getPaymentType() == PaymentType.Course) {

                BigDecimal net;

                if (p.getNetAmount() != null) {
                    net = p.getNetAmount();
                } else {
                    // fallback cho dữ liệu cũ
                    net = p.getAmount()
                            .subtract(p.getAmount().multiply(commissionCourse));
                }

                totalNet = totalNet.add(net);
            }

            // ----- BOOKING: chỉ tính nếu có slot Paid và tất cả slot Paid đã release -----
            else if (p.getPaymentType() == PaymentType.Booking) {

                List<BookingPlanSlot> slots =
                        bookingPlanSlotRepository.findAllByPaymentID(p.getPaymentID());

                if (slots.isEmpty()) {
                    continue;
                }

                // chỉ xét các slot còn trạng thái Paid
                List<BookingPlanSlot> paidSlots = slots.stream()
                        .filter(s -> s.getStatus() == SlotStatus.Paid)
                        .toList();

                // nếu không còn slot Paid (bị Rejected hết) → KHÔNG tính payment này
                if (paidSlots.isEmpty()) {
                    continue;
                }

                boolean allReleased = paidSlots.stream()
                        .allMatch(slot -> isBookingSlotReleased(slot, now));

                if (!allReleased) {
                    // Còn slot chưa release => chưa cộng payment này
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
    // (Refund learner do admin tự xử lý, không trừ ví tutor)
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
