package edu.lms.repository;

import edu.lms.entity.LessonResourceDraft;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonResourceDraftRepository extends JpaRepository<LessonResourceDraft, Long> {
    List<LessonResourceDraft> findByLessonDraft_LessonDraftID(Long lessonDraftID);
    List<LessonResourceDraft> findByLessonDraft_LessonDraftIDIn(List<Long> lessonDraftIds);

}
