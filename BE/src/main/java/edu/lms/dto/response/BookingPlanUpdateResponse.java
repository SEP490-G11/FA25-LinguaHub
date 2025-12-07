package edu.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingPlanUpdateResponse {
    Boolean success;

    @JsonProperty("updated_slots")
    Integer updatedSlots;
}


