package edu.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.lms.enums.CourseDraftStatus;
import edu.lms.enums.CourseLevel;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "CourseDrafts")
public class CourseDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long draftID;

    // Khóa này luôn trỏ về course "gốc" đang live
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "courseID", nullable = false)
    @ToString.Exclude
    @JsonIgnore
    Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutorID", nullable = false)
    @ToString.Exclude
    @JsonIgnore
    Tutor tutor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoryID", nullable = false)
    @ToString.Exclude
    @JsonIgnore
    CourseCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    CourseDraftStatus status = CourseDraftStatus.EDITING;

    @Column(nullable = false, length = 255)
    String title;

    @Column(length = 500)
    String shortDescription;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(columnDefinition = "TEXT")
    String requirement;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    CourseLevel level = CourseLevel.BEGINNER;

    Integer duration;

    @Column(precision = 10, scale = 2, nullable = false)
    @Builder.Default
    BigDecimal price = BigDecimal.ZERO;

    String language;
    String thumbnailURL;

    @Column(columnDefinition = "TEXT")
    String adminReviewNote;

    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "draft", cascade = CascadeType.ALL, orphanRemoval = true)
    List<CourseSectionDraft> sections;

    @OneToMany(mappedBy = "draft", cascade = CascadeType.ALL, orphanRemoval = true)
    List<CourseObjectiveDraft> objectives;

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}