package edu.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingPlanSlotSummaryResponse {

    @JsonProperty("slotid")
    Long slotId;

    @JsonProperty("start_time")
    LocalDateTime startTime;

    @JsonProperty("end_time")
    LocalDateTime endTime;

    String status;
    
    @JsonProperty("meeting_url")
    String meetingUrl; // Meeting URL chỉ hiển thị khi slot đã thanh toán (status = Paid)
}


