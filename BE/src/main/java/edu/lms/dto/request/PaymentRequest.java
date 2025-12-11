package edu.lms.dto.request;

import edu.lms.enums.PaymentType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentRequest {

    @NotNull(message = "User id is required")
    @Positive(message = "User id must be a positive number")
    Long userId;

    @NotNull(message = "Target id is required")
    @Positive(message = "Target id must be a positive number")
    Long targetId;

    @NotNull(message = "Ivalid Payment Type")
    PaymentType paymentType;

    // userPackageId can be null (e.g. when creating a new package)
    @Positive(message = "User package id must be a positive number")
    Long userPackageId;

    // If you want to require slots for booking payments:
    // => Keep nullable here and validate in service based on paymentType
    @Valid
    List<@Valid SlotRequest> slots;

    @NotBlank(message = "Turnstile token must not be blank")
    String turnstileToken;
}
