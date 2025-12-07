package edu.lms.repository;

import edu.lms.entity.CourseSectionDraft;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseSectionDraftRepository extends JpaRepository<CourseSectionDraft, Long> {
    List<CourseSectionDraft> findByDraft_DraftIDOrderByOrderIndexAsc(Long draftID);
    List<CourseSectionDraft> findByDraft_DraftID(Long draftId);
}
