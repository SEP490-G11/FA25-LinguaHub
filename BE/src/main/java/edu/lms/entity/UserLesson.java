package edu.lms.entity;

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
@Table(name = "UserLesson")
public class UserLesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long userLessonID;

    @ManyToOne
    @JoinColumn(name = "lessonID")
    Lesson lesson;

    @ManyToOne
    @JoinColumn(name = "userID")
    User user;

    @ManyToOne
    @JoinColumn(name = "enrollmentID")
    Enrollment enrollment;

    Boolean isDone = false;
    Integer watchedDuration = 0;
    LocalDateTime completedAt;
}
