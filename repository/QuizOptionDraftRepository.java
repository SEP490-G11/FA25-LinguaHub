package edu.lms.repository;

import edu.lms.entity.QuizOptionDraft;
import edu.lms.entity.QuizQuestionDraft;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizOptionDraftRepository extends JpaRepository<QuizOptionDraft, Long> {
    List<QuizOptionDraft> findByQuestionDraftOrderByOrderIndexAsc(QuizQuestionDraft questionDraft);
}
