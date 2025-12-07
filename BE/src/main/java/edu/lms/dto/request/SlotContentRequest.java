package edu.lms.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SlotContentRequest {

    @JsonProperty("slot_number")
    Integer slotNumber;

    @NotBlank(message = "Content is required")
    @JsonProperty("content")
    String content;
}

