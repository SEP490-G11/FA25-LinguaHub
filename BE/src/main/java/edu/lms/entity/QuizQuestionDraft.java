package edu.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "quiz_question_draft")
public class QuizQuestionDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_draftid")
    Long questionDraftID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_draftid", nullable = false)
    @ToString.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    LessonDraft lessonDraft;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    String questionText;

    @Column(name = "order_index")
    Integer orderIndex;

    @Column(columnDefinition = "TEXT")
    String explanation;

    @Builder.Default
    @Column(nullable = false, precision = 5, scale = 2)
    BigDecimal score = BigDecimal.valueOf(1.0);

    @Builder.Default
    @OneToMany(mappedBy = "questionDraft", cascade = CascadeType.ALL, orphanRemoval = true)
    List<QuizOptionDraft> options = new ArrayList<>();
}
