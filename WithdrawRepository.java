package edu.lms.repository;

import edu.lms.entity.WithdrawMoney;
import edu.lms.enums.WithdrawStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface WithdrawRepository extends JpaRepository<WithdrawMoney, Long> {

    List<WithdrawMoney> findByTutorTutorID(Long tutorId);

    List<WithdrawMoney> findByStatus(WithdrawStatus status);
    @Query("""
    SELECT COALESCE(SUM(p.amount), 0)
    FROM Payment p
    WHERE p.tutorId = :tutorId 
      AND p.status = edu.lms.enums.PaymentStatus.PAID
""")
    BigDecimal getTotalEarningOfTutor(Long tutorId);
    @Query("""
       SELECT COALESCE(SUM(w.withdrawAmount), 0)
       FROM WithdrawMoney w
       WHERE w.tutor.tutorID = :tutorId
         AND w.status = :status
       """)
    BigDecimal sumWithdrawAmountByTutorAndStatus(Long tutorId, WithdrawStatus status);


}
