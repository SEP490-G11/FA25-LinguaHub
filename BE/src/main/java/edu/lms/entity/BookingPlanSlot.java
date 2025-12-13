package edu.lms.entity;

import edu.lms.enums.SlotStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "Booking_Plan_Slot")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingPlanSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long slotID;

    @Column(nullable = false)
    Long bookingPlanID;

    @Column(nullable = false)
    Long tutorID;

    @Column(nullable = true)
    Long userID;

    @Column(nullable = false)
    LocalDateTime startTime;

    @Column(nullable = false)
    LocalDateTime endTime;

    @Column(nullable = true)
    Long paymentID;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    SlotStatus status = SlotStatus.Available;

    @Column(nullable = true)
    LocalDateTime lockedAt;

    @Column(nullable = true)
    LocalDateTime expiresAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_package_id")
    UserPackage userPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_package_id")
    TutorPackage tutorPackage;

    @Builder.Default
    @Column(name = "reminder_sent", nullable = false)
    Boolean reminderSent = false;

    @Builder.Default
    @Column(name = "tutor_join", nullable = false)
    Boolean tutorJoin = false;

    @Builder.Default
    @Column(name = "learner_join", nullable = false)
    Boolean learnerJoin = false;

    @Column(name = "tutor_evidence", length = 1000)
    String tutorEvidence;

    @Column(name = "learner_evidence", length = 1000)
    String learnerEvidence;
}
