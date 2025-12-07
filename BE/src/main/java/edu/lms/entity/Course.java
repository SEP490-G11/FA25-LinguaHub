package edu.lms.entity;

import edu.lms.enums.CourseLevel;
import edu.lms.enums.CourseStatus;
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
@Table(name = "Courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long courseID;

    @Column(nullable = false, length = 255)
    String title;

    @Column(length = 500)
    String shortDescription; // Mô tả ngắn hiển thị ở card

    @Column(columnDefinition = "TEXT")
    String description; // Mô tả chi tiết khóa học

    @Column(columnDefinition = "TEXT")
    String requirement; //  Yêu cầu đầu vào

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    CourseLevel level = CourseLevel.BEGINNER; //  BEGINNER / INTERMEDIATE / ADVANCED

    Integer duration;

    @Column(precision = 10, scale = 2, nullable = false)
    @Builder.Default
    BigDecimal price = BigDecimal.ZERO;

    String language;
    String thumbnailURL;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    CourseStatus status = CourseStatus.Draft;

    @Column(columnDefinition = "TEXT")
    String adminReviewNote;   // Lý do reject / ghi chú của admin

    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "tutorID", nullable = false)
    Tutor tutor;

    @ManyToOne
    @JoinColumn(name = "categoryID", nullable = false)
    CourseCategory category;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    List<CourseSection> sections;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    List<CourseObjective> objectives; //  Mục tiêu học tập (what you'll learn)

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
