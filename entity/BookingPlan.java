package edu.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "booking_plan")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_planid")
    Long bookingPlanID;

    @Column(nullable = false, length = 100)
    String title;

    @Column(name = "start_hours")
    LocalTime startHours;

    @Column(name = "end_hours")
    LocalTime endHours;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    Boolean isActive = true;

    @Builder.Default
    @Column(name = "is_open", nullable = false)
    Boolean isOpen = true;

    @Column(name = "tutor_id", nullable = false)
    Long tutorID;

    @Column(name = "slot_duration")
    Integer slotDuration; // minutes

    @Builder.Default
    @Column(name = "price_per_hours")
    Double pricePerHours = 0.0;

    @Column(name = "meeting_url", length = 500)
    String meetingUrl;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
