package edu.lms.repository;

import edu.lms.entity.CourseObjective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseObjectiveRepository extends JpaRepository<CourseObjective, Long> {
    List<CourseObjective> findByCourse_CourseIDOrderByOrderIndexAsc(Long courseID);
    void deleteByCourse_CourseID(Long courseID);
}
