package edu.lms.repository;

import edu.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Vẫn giữ logic cũ (username)
    boolean existsByUsername(String username);
    Optional<User> findByUsername(String username);

    // Thêm mới để chuẩn với DB v3 (email)
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    // mới: đếm user active
    long countByIsActiveTrue();

    // mới: dùng cho biểu đồ tăng trưởng
    List<User> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // mới: dùng cho Recent Users
    List<User> findTop5ByOrderByCreatedAtDesc();
}
