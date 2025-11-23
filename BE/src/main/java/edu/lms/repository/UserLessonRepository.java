package edu.lms.repository;

import edu.lms.entity.UserLesson;
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
}
