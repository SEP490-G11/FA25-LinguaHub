package edu.lms.dto.request;

import edu.lms.entity.UserPackage;
import edu.lms.enums.PaymentType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

public class PaymentRequest {
    private Long userId;
    private Long targetId;
    private PaymentType paymentType;
    private Long userPackageId;
    private List<SlotRequest> slots;
    private String turnstileToken;
}
