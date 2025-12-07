package edu.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SlotContentResponse {

    @JsonProperty("slot_number")
    Integer slotNumber;

    @JsonProperty("content")
    String content;
}

