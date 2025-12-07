package edu.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "CourseObjective")
public class CourseObjective {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long objectiveID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "courseID", nullable = false)
    @ToString.Exclude
    @JsonIgnore
    Course course;

    @Column(nullable = false, length = 255)
    String objectiveText;

    @Column(nullable = false)
    @Builder.Default
    Integer orderIndex = 1;
}
