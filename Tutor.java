package edu.lms.entity;

import edu.lms.enums.TutorStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "tutor")
public class Tutor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tutorid")
    Long tutorID;

    @OneToOne
    @JoinColumn(name = "userid", unique = true, nullable = false)
    User user;

    @Column(name = "experience")
    Short experience = 0;
    
    @Column(name = "specialization")
    String specialization;
    
    @Column(name = "teaching_language")
    String teachingLanguage;
    
    @Column(name = "bio")
    String bio;

    @Builder.Default
    @Column(name = "rating")
    BigDecimal rating = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    TutorStatus status = TutorStatus.PENDING;

    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL)
    List<TutorVerification> verifications;

    @OneToMany
    @JoinColumn(name = "tutor_id", referencedColumnName = "tutorID")
    List<BookingPlan> bookingPlans;

    @Column(nullable = false)
    @Builder.Default
    BigDecimal walletBalance = BigDecimal.ZERO;

}
