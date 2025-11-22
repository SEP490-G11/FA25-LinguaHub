package edu.lms.repository;

import edu.lms.entity.UserCourseSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserCourseSectionRepository extends JpaRepository<UserCourseSection, Long> {
    Optional<UserCourseSection> findByUser_UserIDAndSection_SectionID(Long userId, Long sectionId);
    List<UserCourseSection> findByUser_UserIDAndSection_Course_CourseID(Long userId, Long courseId);
    void deleteBySection_SectionIDIn(List<Long> sectionIds);
    @Query("""
        SELECT ucs.enrollment.enrollmentID, COALESCE(AVG(ucs.progress), 0)
        FROM UserCourseSection ucs
        WHERE ucs.enrollment.enrollmentID IN :enrollmentIds
        GROUP BY ucs.enrollment.enrollmentID
        """)
    List<Object[]> findAverageProgressByEnrollmentIds(@Param("enrollmentIds") List<Long> enrollmentIds);
    List<UserCourseSection> findByUser_UserIDAndEnrollment_EnrollmentID(Long userId, Long enrollmentId);

}
