package edu.lms.dto.response;

import edu.lms.enums.WithdrawStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WithdrawResponse {

    Long withdrawId;
    Long tutorId;

    BigDecimal totalAmount;
    BigDecimal withdrawAmount;
    BigDecimal commission;

    String bankAccountNumber;
    String bankName;
    String bankOwnerName;

    WithdrawStatus status;
    LocalDateTime createdAt;
}
