package edu.lms.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BookingFeedbackRequest {
    BigDecimal rating;
    String comment;
}
