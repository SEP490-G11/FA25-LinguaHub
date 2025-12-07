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
public class BookingPlanListWithSlotsResponse {

    @JsonProperty("tutor_id")
    Long tutorId;

    @JsonProperty("plans")
    List<BookingPlanDetailResponse> plans;
}

