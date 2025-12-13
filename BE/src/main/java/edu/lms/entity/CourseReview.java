package edu.lms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "CourseReview")
public class CourseReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long reviewID;

    @ManyToOne
    @JoinColumn(name = "courseID", nullable = false)
    Course course;

    @ManyToOne
    @JoinColumn(name = "userID", nullable = false)
    User user;

    @Column(nullable = false)
    Double rating;


    @Column(columnDefinition = "TEXT")
    String comment;

    LocalDateTime createdAt = LocalDateTime.now();
}
