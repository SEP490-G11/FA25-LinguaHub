package edu.lms.repository;

import edu.lms.entity.CourseReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseReviewRepository extends JpaRepository<CourseReview, Long> {

    List<CourseReview> findByCourse_CourseID(Long courseId);
    Optional<CourseReview> findByCourse_CourseIDAndUser_UserID(Long courseId, Long userId);

    // ==== thêm cho dashboard ====

    @Query("""
        SELECT AVG(r.rating)
        FROM CourseReview r
        WHERE r.course.tutor.tutorID = :tutorId
    """)
    Double findAverageRatingByTutor(Long tutorId);

    long countByCourse_Tutor_TutorID(Long tutorId);

    @Query(value = """
        SELECT FLOOR(r.rating) AS stars, COUNT(*) AS cnt
        FROM course_review r
        JOIN courses c ON r.courseid = c.courseid
        WHERE c.tutorid = :tutorId
        GROUP BY FLOOR(r.rating)
        """, nativeQuery = true)
    List<Object[]> countRatingDistributionByTutor(Long tutorId);

    List<CourseReview> findTop10ByCourse_Tutor_TutorIDOrderByCreatedAtDesc(Long tutorId);
}
