package edu.lms.dto.response;

import edu.lms.enums.RefundStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RefundRequestResponse {

    Long refundRequestId;

    Long bookingPlanId;

    Long slotId;

    Long userId;

    Long TutorId;

    Long packageId;

    BigDecimal refundAmount;

    String bankAccountNumber;

    String bankOwnerName;

    String bankName;

    RefundStatus status;

    LocalDateTime createdAt;

    LocalDateTime processedAt;


}
