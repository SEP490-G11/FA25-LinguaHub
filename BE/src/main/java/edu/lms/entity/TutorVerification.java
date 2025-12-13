package edu.lms.entity;

import edu.lms.enums.TutorVerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "tutor_verification")
public class TutorVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tutor_verificationid")
    Long tutorVerificationID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutorid", nullable = false)
    Tutor tutor;

    @Builder.Default
    @Column(name = "experience", nullable = false)
    Short experience = 0;

    @Column(name = "specialization", columnDefinition = "TEXT")
    String specialization;

    @Column(name = "teaching_language", columnDefinition = "TEXT")
    String teachingLanguage;

    @Column(name = "bio", columnDefinition = "TEXT")
    String bio;

    @Builder.Default
    @Column(name = "documenturl", length = 255, nullable = false)
    String documentUrl = "";

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    TutorVerificationStatus status = TutorVerificationStatus.PENDING;

    @Builder.Default
    @Column(name = "submitted_at", nullable = false, updatable = false)
    LocalDateTime submittedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by", referencedColumnName = "userid")
    User reviewedBy;

    @Column(name = "reviewed_at")
    LocalDateTime reviewedAt;

    @Column(name = "reason_for_reject", columnDefinition = "TEXT")
    String reasonForReject;

    @Builder.Default
    @OneToMany(mappedBy = "tutorVerification", cascade = CascadeType.ALL, orphanRemoval = true)
    List<TutorCertificate> certificates = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (documentUrl == null) {
            documentUrl = "";
        }
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
    }
}
