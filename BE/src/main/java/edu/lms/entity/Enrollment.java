package edu.lms.entity;

import edu.lms.enums.EnrollmentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "Enrollments")
public class Enrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long enrollmentID;

    @ManyToOne
    @JoinColumn(name = "userID", nullable = false)
    User user;

    @ManyToOne
    @JoinColumn(name = "courseID", nullable = false)
    Course course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnrollmentStatus status;


    LocalDateTime createdAt = LocalDateTime.now();
}
