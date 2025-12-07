package edu.lms.repository;

import edu.lms.entity.LessonResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LessonResourceRepository extends JpaRepository<LessonResource, Long> {
    List<LessonResource> findByLessonLessonID(Long lessonId);
    List<LessonResource> findByLesson_LessonIDIn(Collection<Long> lessonIds);
    @Query("SELECT lr FROM LessonResource lr WHERE lr.resourceID = :resourceId AND lr.lesson.section.course.tutor.tutorID = :tutorId")
    Optional<LessonResource> findByResourceIdAndTutorId(@Param("resourceId") Long resourceId,
            @Param("tutorId") Long tutorId);
}