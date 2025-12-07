package edu.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "CourseObjectiveDraft")
public class CourseObjectiveDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long objectiveDraftID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "draftID", nullable = false)
    CourseDraft draft;

    Long originalObjectiveID; // 🔹 ID objective gốc (nullable)

    String objectiveText;
    Integer orderIndex;
}
