package edu.lms.repository;

import edu.lms.entity.CourseDraft;
import edu.lms.enums.CourseDraftStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CourseDraftRepository extends JpaRepository<CourseDraft, Long> {

    Optional<CourseDraft> findByCourse_CourseIDAndStatusIn(Long courseId,
                                                           Collection<CourseDraftStatus> statuses);

    List<CourseDraft> findByStatus(CourseDraftStatus status);
    List<CourseDraft> findByCourse_CourseID(Long courseId);

    long countByStatus(CourseDraftStatus status);

    List<CourseDraft> findTop10ByStatusOrderByCreatedAtAsc(CourseDraftStatus status);


}
