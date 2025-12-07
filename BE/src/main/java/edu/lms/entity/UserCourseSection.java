package edu.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "UserCourseSection")
public class UserCourseSection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long userCourseSectionID;

    @ManyToOne
    @JoinColumn(name = "userID", nullable = false)
    User user;

    @ManyToOne
    @JoinColumn(name = "enrollmentID", nullable = false)
    Enrollment enrollment;

    @ManyToOne
    @JoinColumn(name = "sectionID", nullable = false)
    CourseSection section;

    BigDecimal progress = BigDecimal.ZERO;
}
