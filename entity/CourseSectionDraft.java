package edu.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "CourseSectionDraft")
public class CourseSectionDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long sectionDraftID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "draftID", nullable = false)
    CourseDraft draft;

    //  Section gốc trong bảng live (nullable: null = section mới)
    Long originalSectionID;

    String title;
    String description;
    Integer orderIndex;

    @OneToMany(mappedBy = "sectionDraft", cascade = CascadeType.ALL, orphanRemoval = true)
    List<LessonDraft> lessons;
}
