package edu.lms.repository;

import edu.lms.entity.Tutor;
import edu.lms.entity.User;
import edu.lms.enums.TutorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TutorRepository extends JpaRepository<Tutor, Long> {
    // Tìm Tutor theo User
    Optional<Tutor> findByUser(User user);

    // Kiểm tra xem user có role tutor chưa (để tránh apply trùng)
    boolean existsByUser(User user);

    // Tìm tutor theo status (dùng cho admin lọc danh sách)
    List<Tutor> findAllByStatus(TutorStatus status);

    // Tìm tutor có status pending (dùng khi admin xem hồ sơ chờ duyệt)
    List<Tutor> findAllByStatusOrderByTutorIDAsc(TutorStatus status);

    // Tìm Tutor theo UserID (để lấy TutorID từ UserID đang đăng nhập)
    Optional<Tutor> findByUser_UserID(Long userId);

    Optional<Tutor> findByUser_Email(String email);

    long countByStatus(TutorStatus status);

    // THÊM MỚI: dùng createdAt của User
    @Query("""
        SELECT t FROM Tutor t
        WHERE t.user.createdAt BETWEEN :from AND :to
    """)
    List<Tutor> findByUserCreatedAtBetween(LocalDateTime from, LocalDateTime to);
}
