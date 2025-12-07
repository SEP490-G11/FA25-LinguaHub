package edu.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.lms.enums.LessonType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "Lessons")
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long lessonID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sectionID", nullable = false)
    @ToString.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    CourseSection section;

    @Column(nullable = false)
    String title;

    Short duration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    LessonType lessonType = LessonType.Video;

    String videoURL;

    @Lob
    String content;

    Integer orderIndex;

    @Column(updatable = false)
    LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    List<LessonResource> resources = new ArrayList<>();

    // ================== QuizQuestions  ==================
    @Builder.Default
    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @JsonIgnore
    List<QuizQuestion> quizQuestions = new ArrayList<>();

    // ================== UserQuizResult  ==================
    @Builder.Default
    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @JsonIgnore
    List<UserQuizResult> quizResults = new ArrayList<>();
}