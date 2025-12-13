package edu.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "CourseSection")
public class CourseSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long sectionID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "courseID", nullable = false)
    @ToString.Exclude
    @JsonIgnore
    Course course;

    String title;
    String description;
    Integer orderIndex;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Lesson> lessons;
}