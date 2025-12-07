package edu.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tutor_packages")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "packageid")
    Long packageID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    Tutor tutor;

    @Column(nullable = false, length = 100)
    String name;

    @Column(nullable = true, columnDefinition = "TEXT")
    String description;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    Boolean isActive = true;

    @Column(name = "max_slots")
    Integer maxSlots;

    @Column(nullable = true, columnDefinition = "TEXT")
    String requirement;

    @Column(nullable = true, columnDefinition = "TEXT")
    String objectives;

    @Column(name = "slot_content", nullable = true, columnDefinition = "TEXT")
    String slotContent; // Lưu dưới dạng JSON array

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
