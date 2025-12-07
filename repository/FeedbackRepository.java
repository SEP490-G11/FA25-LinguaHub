package edu.lms.repository;

import edu.lms.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    // 1 user chỉ được feedback 1 lần cho 1 payment
    Optional<Feedback> findByPayment_PaymentIDAndUser_UserID(Long paymentId, Long userId);

    // lấy tất cả feedback booking cho 1 tutor
    List<Feedback> findByPayment_TutorId(Long tutorId);
    
    // Lấy tất cả feedback booking cho 1 tutor với JOIN FETCH để tránh N+1
    @Query("SELECT DISTINCT f FROM Feedback f " +
           "JOIN FETCH f.payment p " +
           "JOIN FETCH f.user u " +
           "WHERE p.tutorId = :tutorId " +
           "ORDER BY p.paidAt DESC")
    List<Feedback> findByPayment_TutorIdWithDetails(@Param("tutorId") Long tutorId);
}
