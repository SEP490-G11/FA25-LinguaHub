package edu.lms.repository;

import edu.lms.entity.WithdrawMoney;
import edu.lms.enums.WithdrawStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WithdrawMoneyRepository extends JpaRepository<WithdrawMoney, Long> {

    long countByStatus(WithdrawStatus status);

    List<WithdrawMoney> findTop10ByStatusOrderByCreatedAtAsc(WithdrawStatus status);
}
