package edu.lms.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)


public class SlotRequest {
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
