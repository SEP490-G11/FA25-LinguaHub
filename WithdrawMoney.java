package edu.lms.entity;

import edu.lms.enums.WithdrawStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "withdraw_money")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WithdrawMoney {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long withdrawId;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    Tutor tutor;


    @Column(nullable = false, length = 50)
    String bankAccountNumber;

    @Column(nullable = false, length = 100)
    String bankName;

    @Column(nullable = false, length = 100)
    String bankOwnerName;

    @Column(nullable = false)
    BigDecimal totalAmount;

    @Column(nullable = false)
    BigDecimal withdrawAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    WithdrawStatus status = WithdrawStatus.PENDING;

    @Column(nullable = false)
    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();
}
