package edu.lms.repository;

import edu.lms.entity.Payment;
import edu.lms.enums.PaymentStatus;
import edu.lms.enums.PaymentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderCode(String orderCode);

    List<Payment> findAllByTutorId(Long tutorId);

    List<Payment> findAllByUserId(Long userId);

    List<Payment> findAllByStatusAndExpiresAtBefore(PaymentStatus status, LocalDateTime now);

    @Query("""
        SELECT p FROM Payment p
        WHERE p.tutorId = :tutorId
          AND p.status = edu.lms.enums.PaymentStatus.PAID
    """)
    List<Payment> findSuccessPaymentsByTutor(Long tutorId);

    Optional<Payment> findFirstByTargetIdAndUserIdAndPaymentTypeAndStatusOrderByPaidAtDesc(
            Long targetId,
            Long userId,
            PaymentType paymentType,
            PaymentStatus status
    );

    long countByUserIdAndPaymentTypeAndTargetIdAndStatusAndCreatedAtAfter(
            Long userId,
            PaymentType paymentType,
            Long targetId,
            PaymentStatus status,
            LocalDateTime createdAtAfter
    );

    // ==== thêm cho dashboard ====

    List<Payment> findByTutorIdAndStatusAndPaidAtBetween(
            Long tutorId,
            PaymentStatus status,
            LocalDateTime from,
            LocalDateTime to
    );

    List<Payment> findByTutorIdAndStatusAndPaymentTypeAndPaidAtBetween(
            Long tutorId,
            PaymentStatus status,
            PaymentType paymentType,
            LocalDateTime from,
            LocalDateTime to
    );

    // chỉ ghi phần mới, giữ nguyên mấy method cũ của bạn
    List<Payment> findByStatusAndPaidAtBetween(
            PaymentStatus status,
            LocalDateTime from,
            LocalDateTime to
    );

    List<Payment> findByStatusAndPaymentTypeAndPaidAtBetween(
            PaymentStatus status,
            PaymentType paymentType,
            LocalDateTime from,
            LocalDateTime to
    );
}
