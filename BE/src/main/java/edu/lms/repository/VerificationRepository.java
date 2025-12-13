package edu.lms.repository;

import edu.lms.entity.Verification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VerificationRepository extends JpaRepository<Verification, Long> {
    Optional<Verification> findByEmailAndOtp(String email, String otp);

    void deleteByEmail(String email);
    Optional<Verification> findByOtp(String otp);
}
