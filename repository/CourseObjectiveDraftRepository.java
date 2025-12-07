package edu.lms.repository;

import edu.lms.entity.CourseObjectiveDraft;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseObjectiveDraftRepository extends JpaRepository<CourseObjectiveDraft, Long> {

    List<CourseObjectiveDraft> findByDraft_DraftIDOrderByOrderIndexAsc(Long draftID);
    List<CourseObjectiveDraft> findByDraft_DraftID(Long draftId);
}
