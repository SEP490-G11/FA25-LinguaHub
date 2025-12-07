package edu.lms.repository;

import edu.lms.entity.LessonDraft;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonDraftRepository extends JpaRepository<LessonDraft, Long> {
    List<LessonDraft> findBySectionDraft_SectionDraftIDOrderByOrderIndexAsc(Long sectionDraftID);
    List<LessonDraft> findBySectionDraft_SectionDraftIDIn(List<Long> sectionDraftIds);
}
