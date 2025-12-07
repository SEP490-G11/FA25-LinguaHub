package edu.lms.repository;

import edu.lms.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;


public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findBySectionSectionID(Long sectionId);
    List<Lesson> findBySection_SectionIDIn(Collection<Long> sectionIds);

    @Query("SELECT l FROM Lesson l WHERE l.section.sectionID = :sectionId " +
           "AND (:keyword IS NULL OR LOWER(l.title) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY " +
           "CASE WHEN :sortBy = 'title' THEN l.title END ASC, " +
           "CASE WHEN :sortBy = 'title' AND :order = 'DESC' THEN l.title END DESC, " +
           "CASE WHEN :sortBy = 'duration' THEN l.duration END ASC, " +
           "CASE WHEN :sortBy = 'duration' AND :order = 'DESC' THEN l.duration END DESC, " +
           "CASE WHEN :sortBy = 'orderIndex' THEN l.orderIndex END ASC, " +
           "CASE WHEN :sortBy = 'orderIndex' AND :order = 'DESC' THEN l.orderIndex END DESC, " +
           "CASE WHEN :sortBy = 'createdAt' THEN l.createdAt END ASC, " +
           "CASE WHEN :sortBy = 'createdAt' AND :order = 'DESC' THEN l.createdAt END DESC, " +
           "l.orderIndex ASC")
    List<Lesson> findBySectionWithFilters(@Param("sectionId") Long sectionId, 
                                         @Param("keyword") String keyword,
                                         @Param("sortBy") String sortBy,
                                         @Param("order") String order);
    
    @Query("SELECT l FROM Lesson l WHERE l.lessonID = :lessonId AND l.section.course.tutor.tutorID = :tutorId")
    Optional<Lesson> findByLessonIdAndTutorId(@Param("lessonId") Long lessonId, @Param("tutorId") Long tutorId);
}
