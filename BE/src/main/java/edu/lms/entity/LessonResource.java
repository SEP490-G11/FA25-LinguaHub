package edu.lms.entity;

import edu.lms.enums.ResourceType;
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
@Table(name = "LessonResource")
public class LessonResource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long resourceID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lessonID", nullable = false)
    @ToString.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    Lesson lesson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    ResourceType resourceType = ResourceType.PDF;

    String resourceTitle;

    @Column(nullable = false)
    String resourceURL;

    @Column(updatable = false)
    LocalDateTime uploadedAt = LocalDateTime.now();
}