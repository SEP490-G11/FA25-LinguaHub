package edu.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;

@Slf4j
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tutor_certificate")
public class TutorCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "certificate_id")
    private Long certificateId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_verification_id", nullable = false)
    private TutorVerification tutorVerification;

    @Column(name = "certificate_name", nullable = false, length = 255)
    private String certificateName;

    @Builder.Default
    @Column(name = "document_url", nullable = false, length = 255)
    private String documentUrl = "";

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    private void onCreate() {
        // Đảm bảo createdAt luôn có giá trị
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        // Đảm bảo documentUrl luôn có giá trị (không bao giờ null)
        // Log warning nếu giá trị bị set thành empty (không nên xảy ra)
        if (documentUrl == null || documentUrl.trim().isEmpty()) {
            log.warn("documentUrl is null or empty in @PrePersist for certificate: {}. Setting to empty string.", certificateName);
            documentUrl = "";
        }
    }
    
    @PreUpdate
    private void onUpdate() {
        // Đảm bảo documentUrl luôn có giá trị khi update
        // Log warning nếu giá trị bị set thành empty (không nên xảy ra)
        if (documentUrl == null || documentUrl.trim().isEmpty()) {
            log.warn("documentUrl is null or empty in @PreUpdate for certificate ID: {}. Setting to empty string.", certificateId);
            documentUrl = "";
        }
    }
}
