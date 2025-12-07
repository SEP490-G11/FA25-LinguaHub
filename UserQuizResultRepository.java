package edu.lms.repository;

import edu.lms.entity.UserQuizResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserQuizResultRepository extends JpaRepository<UserQuizResult, Long> {

    Optional<UserQuizResult> findTopByUser_UserIDAndLesson_LessonIDOrderBySubmittedAtDesc(
            Long userId,
            Long lessonId
    );

}
