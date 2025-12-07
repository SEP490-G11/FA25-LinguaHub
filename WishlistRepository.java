package edu.lms.repository;

import edu.lms.entity.Course;
import edu.lms.entity.User;
import edu.lms.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByUser(User user);
    Optional<Wishlist> findByUserAndCourse(User user, Course course);
    void deleteByUserAndCourse(User user, Course course);
    boolean existsByUserAndCourse(User user, Course course);
}
