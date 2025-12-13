package edu.lms.repository;

import edu.lms.entity.RefundRequest;
import edu.lms.enums.RefundStatus;
import edu.lms.enums.RefundType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long> {

    List<RefundRequest> findByUserId(Long userId);
    List<RefundRequest> findByStatus(RefundStatus status);

    @Query("""
       SELECT COALESCE(SUM(r.refundAmount), 0)
       FROM RefundRequest r
       WHERE r.tutor.tutorID = :tutorId
         AND r.status = :status
       """)
    BigDecimal sumRefundAmountByTutorAndStatus(Long tutorId, RefundStatus status);

    // ==== thêm cho dashboard ====
    long countByTutor_TutorIDAndStatusIn(Long tutorId, List<RefundStatus> statuses);

    long countByStatusIn(List<RefundStatus> statuses);

    List<RefundRequest> findTop10ByStatusInOrderByCreatedAtAsc(List<RefundStatus> statuses);

    // NEW: tìm các refund PENDING, tutor chưa phản hồi, đã quá 1 ngày
    List<RefundRequest> findByStatusAndTutorAttendIsNullAndCreatedAtBefore(
            RefundStatus status,
            LocalDateTime before
    );
    boolean existsBySlotIdAndStatusIn(Long slotId, java.util.Collection<RefundStatus> statuses);
    List<RefundRequest> findBySlotIdAndRefundType(Long slotId, RefundType refundType);
}
