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
@Table(name = "LessonResourceDraft")
public class LessonResourceDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long resourceDraftID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lessonDraftID", nullable = false)
    LessonDraft lessonDraft;

    Long originalResourceID; // 🔹 ID resource gốc (nullable)

    ResourceType resourceType;
    String resourceTitle;
    String resourceURL;
}

