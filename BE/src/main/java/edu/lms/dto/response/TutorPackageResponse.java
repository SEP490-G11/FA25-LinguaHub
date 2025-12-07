package edu.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorPackageResponse {
    
    @JsonProperty("packageid")
    Long packageId;
    
    @JsonProperty("tutor_id")
    Long tutorId;
    
    String name;
    
    String description;
    
    @JsonProperty("is_active")
    Boolean active;
    
    @JsonProperty("max_slots")
    Integer maxSlots;
    
    String requirement;
    
    String objectives;
    
    @JsonProperty("slot_content")
    List<SlotContentResponse> slotContent;
    
    @JsonProperty("min_booking_price_per_hour")
    Double minBookingPricePerHour;
    
    @JsonProperty("created_at")
    LocalDateTime createdAt;
    
    @JsonProperty("updated_at")
    LocalDateTime updatedAt;
}


