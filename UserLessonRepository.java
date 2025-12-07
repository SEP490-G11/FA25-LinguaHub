package edu.lms.repository;

import edu.lms.entity.UserLesson;
import edu.lms.enums.LessonStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserLessonRepository extends JpaRepository<UserLesson, Long> {

    Optional<UserLesson> findByUser_UserIDAndLesson_LessonID(Long userId, Long lessonId);

    void deleteByLesson_LessonIDIn(List<Long> lessonIds);

    @Query("""
        SELECT MAX(ul.completedAt)
        FROM UserLesson ul
        WHERE ul.user.userID = :userId
          AND ul.lesson.section.course.tutor.tutorID = :tutorId
    """)
    LocalDateTime findLastActivityForStudentAndTutor(
            @Param("userId") Long userId,
            @Param("tutorId") Long tutorId
    );

    // ==== thêm cho dashboard ====

    @Query("""
        SELECT ul FROM UserLesson ul
        WHERE ul.lesson.section.course.tutor.tutorID = :tutorId
          AND ul.completedAt BETWEEN :from AND :to
    """)
    List<UserLesson> findByTutorAndCompletedAtBetween(
            @Param("tutorId") Long tutorId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    long countByUser_UserIDAndLesson_Section_Course_CourseIDAndIsDoneTrue(
            Long userId,
            Long courseId
    );

    long countByUser_UserIDAndLesson_Section_SectionIDAndIsDoneTrue(
            Long userId,
            Long sectionId
    );

}
