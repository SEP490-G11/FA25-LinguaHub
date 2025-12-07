package edu.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingPlanCreateResponse {

    Boolean success;

    @JsonProperty("booking_planid")
    Long bookingPlanId;

    @JsonProperty("slots_created")
    Integer slotsCreated;
}


