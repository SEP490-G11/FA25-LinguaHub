package edu.lms.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WithdrawRequest {

    BigDecimal withdrawAmount;   // số tiền tutor muốn rút

    String bankAccountNumber;
    String bankName;
    String bankOwnerName;
}
