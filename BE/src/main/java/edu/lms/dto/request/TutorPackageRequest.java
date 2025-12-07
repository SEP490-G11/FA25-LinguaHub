package edu.lms.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorPackageRequest {

    @NotBlank(message = "Package name must not be blank")
    @Size(max = 100, message = "Package name must not exceed 100 characters")
    String name;

    String description;

    @NotNull(message = "max_slots is required")
    @Min(value = 1, message = "max_slots must be greater than 0")
    @JsonProperty("max_slots")
    Integer maxSlots;

    String requirement;

    String objectives;

    @NotNull(message = "slot_content is required")
    @Size(min = 1, message = "slot_content must not be empty")
    @JsonProperty("slot_content")
    List<SlotContentRequest> slotContent;
}


