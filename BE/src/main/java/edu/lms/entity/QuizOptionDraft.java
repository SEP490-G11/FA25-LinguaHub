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
@Table(name = "quiz_option_draft")
public class QuizOptionDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "option_draftid")
    Long optionDraftID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_draftid", nullable = false)
    @ToString.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    QuizQuestionDraft questionDraft;

    @Column(name = "option_text", nullable = false, columnDefinition = "TEXT")
    String optionText;

    @Column(name = "is_correct", nullable = false)
    Boolean isCorrect;

    @Column(name = "order_index")
    Integer orderIndex;
}
