package edu.lms.repository;

import edu.lms.entity.Course;
import edu.lms.entity.Enrollment;
import edu.lms.enums.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    boolean existsByCourse(Course course);

    @Query("""
        SELECT e FROM Enrollment e
        JOIN FETCH e.user u
        WHERE e.course.courseID = :courseId
    """)
    List<Enrollment> findAllByCourseId(Long courseId);

    List<Enrollment> findByUser_UserID(Long userId);
    Optional<Enrollment> findByUser_UserIDAndCourse_CourseID(Long userId, Long courseId);
    long countByCourse_CourseID(Long courseId);
    void deleteByCourse_CourseID(Long courseId);

    // Lấy toàn bộ enrollment của learner vào các khóa học thuộc 1 tutor
    List<Enrollment> findByCourse_Tutor_TutorID(Long tutorId);

    // Nếu muốn chỉ lấy những enrollment đang active, có thể thêm:
    List<Enrollment> findByCourse_Tutor_TutorIDAndStatusIn(
            Long tutorId,
            List<EnrollmentStatus> statuses
    );
    // thêm:
    List<Enrollment> findByUser_UserIDAndCourse_Tutor_TutorID(Long userId, Long tutorId);

}
