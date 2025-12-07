package edu.lms.repository;

import edu.lms.entity.TutorPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TutorPackageRepository extends JpaRepository<TutorPackage, Long> {

    boolean existsByTutor_TutorIDAndNameIgnoreCase(Long tutorId, String name);

    Optional<TutorPackage> findByTutor_TutorIDAndNameIgnoreCase(Long tutorId, String name);

    List<TutorPackage> findByTutor_TutorID(Long tutorId);
}


