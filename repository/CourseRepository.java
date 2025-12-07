package edu.lms.repository;

import edu.lms.entity.Course;
import edu.lms.entity.Tutor;
import edu.lms.enums.CourseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByTutor(Tutor tutor);
    List<Course> findByTutorAndStatus(Tutor tutor, CourseStatus status);
    List<Course> findByStatus(CourseStatus status);
    // Check xem có course nào dùng category này không
    boolean existsByCategory_CategoryID(Long categoryId);
    // Trường hợp bạn vẫn dùng String language trong Course:
     boolean existsByLanguage(String language);

    long countByStatus(CourseStatus status);

    List<Course> findTop5ByOrderByCreatedAtDesc();

    List<Course> findTop10ByStatusOrderByCreatedAtAsc(CourseStatus status);
    // NEW: lấy 5 khóa học mới nhất với status != Draft
    List<Course> findTop5ByStatusNotOrderByCreatedAtDesc(CourseStatus status);
}