package edu.lms.repository;

import edu.lms.entity.TeachingLanguage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeachingLanguageRepository extends JpaRepository<TeachingLanguage, Long> {

    // Dùng cho form tạo / update khóa học
    List<TeachingLanguage> findAllByIsActiveTrueOrderByDisplayOrderAsc();

    // Dùng cho hiển thị public (learner xem)
    List<TeachingLanguage> findAllByOrderByDisplayOrderAsc();

    boolean existsByNameEn(String nameEn);
}
