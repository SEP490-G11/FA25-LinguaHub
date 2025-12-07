package edu.lms.repository;

import edu.lms.entity.UserPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserPackageRepository extends JpaRepository<UserPackage, Long> {

    boolean existsByTutorPackage_PackageID(Long packageId);

    long countByTutorPackage_PackageID(Long packageId);

    Optional<UserPackage> findByUserPackageIDAndUser_UserID(Long userPackageId, Long userId);
}