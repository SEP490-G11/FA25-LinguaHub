package edu.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorBookingPlanResponse {

    @JsonProperty("booking_planid")
    Long bookingPlanId;

    @JsonProperty("tutor_id")
    Long tutorId;

    String title;

    @JsonProperty("start_hours")
    @JsonSerialize(using = LocalTimeSerializer.class)
    LocalTime startTime;

    @JsonProperty("end_hours")
    @JsonSerialize(using = LocalTimeSerializer.class)
    LocalTime endTime;

    @JsonProperty("slot_duration")
    Integer slotDuration;

    @JsonProperty("price_per_hours")
    BigDecimal pricePerHours;

    @JsonProperty("meeting_url")
    String meetingUrl;

    @JsonProperty("is_open")
    Boolean isOpen;

    @JsonProperty("is_active")
    Boolean isActive;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
