package edu.lms.mapper;

import edu.lms.dto.response.PaymentResponse;
import edu.lms.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(target = "description", expression = "java(buildDescription(payment))")
    PaymentResponse toPaymentResponse(Payment payment);

    default String buildDescription(Payment payment) {
        if (payment.getPaymentType() == null) return "Payment";
        return switch (payment.getPaymentType()) {
            case Course -> "Payment for Course ID: " + payment.getTargetId();
            case Booking -> "Payment for Booking Plan ID: " + payment.getTargetId();
            default -> "Payment";
        };
    }
}
