package edu.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import edu.lms.enums.RefundStatus;
import edu.lms.enums.RefundType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // field nào = null thì không trả ra JSON
public class RefundRequestResponse {

    Long refundRequestId;
    Long bookingPlanId;
    Long slotId;
    Long userId;
    Long packageId;
    BigDecimal refundAmount;

    String bankAccountNumber;
    String bankOwnerName;
    String bankName;

    RefundStatus status;
    RefundType refundType;

    LocalDateTime createdAt;
    LocalDateTime processedAt;

    Long tutorId;
    String reason;

    Boolean learnerAttend;
    Boolean tutorAttend;
    String learnerEvidence;
    String tutorEvidence;
}
