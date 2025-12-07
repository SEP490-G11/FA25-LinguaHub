package edu.lms.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SettingRequest {

    BigDecimal commissionCourse;     // vd: 0.15 = 15%
    BigDecimal commissionBooking;    // vd: 0.10 = 10%
}
