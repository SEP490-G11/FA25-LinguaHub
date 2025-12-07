package edu.lms.repository;

import edu.lms.entity.Lesson;
import edu.lms.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByLessonOrderByOrderIndexAsc(Lesson lesson);
    long countByLesson(Lesson lesson);
}
