package edu.lms.repository;

import edu.lms.entity.LessonDraft;
import edu.lms.entity.QuizQuestionDraft;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionDraftRepository extends JpaRepository<QuizQuestionDraft, Long> {

    List<QuizQuestionDraft> findByLessonDraftOrderByOrderIndexAsc(LessonDraft lessonDraft);
}
