package edu.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingPlanDetailResponse {

    @JsonProperty("booking_plan")
    TutorBookingPlanResponse bookingPlan;

    List<BookingPlanSlotSummaryResponse> slots;
}


