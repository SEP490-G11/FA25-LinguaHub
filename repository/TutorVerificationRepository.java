package edu.lms.repository;
import edu.lms.entity.Tutor;
import edu.lms.entity.TutorVerification;
import edu.lms.enums.TutorVerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TutorVerificationRepository extends JpaRepository<TutorVerification, Long> {

    // Tìm lần apply gần nhất của một Tutor
    Optional<TutorVerification> findTopByTutorOrderBySubmittedAtDesc(Tutor tutor);

    // Lấy danh sách tất cả các đơn cho 1 tutor (lịch sử)
    List<TutorVerification> findAllByTutorOrderBySubmittedAtDesc(Tutor tutor);

    // Kiểm tra tutor có đơn nào đang pending chưa
    boolean existsByTutorAndStatus(Tutor tutor, TutorVerificationStatus status);

    // Lấy tất cả hồ sơ có trạng thái pending (cho Admin review)
    List<TutorVerification> findAllByStatusOrderBySubmittedAtAsc(TutorVerificationStatus status);

    // Lấy tất cả hồ sơ có trạng thái cụ thể, sắp xếp theo submittedAt giảm dần
    List<TutorVerification> findAllByStatusOrderBySubmittedAtDesc(TutorVerificationStatus status);

    // Lấy tất cả hồ sơ có trạng thái trong danh sách status (PENDING, REJECTED, APPROVED)
    List<TutorVerification> findAllByStatusInOrderBySubmittedAtDesc(List<TutorVerificationStatus> statuses);

    long countByStatus(TutorVerificationStatus status);

    List<TutorVerification> findTop10ByStatusOrderBySubmittedAtAsc(TutorVerificationStatus status);

    // Lấy tất cả verifications của tutor với certificates được fetch (JOIN FETCH)
    @Query("SELECT DISTINCT v FROM TutorVerification v LEFT JOIN FETCH v.certificates WHERE v.tutor = :tutor ORDER BY v.submittedAt DESC")
    List<TutorVerification> findAllByTutorWithCertificates(@Param("tutor") Tutor tutor);
}
