package edu.lms.dto.response;

import edu.lms.enums.SlotStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BookingPlanSlotResponse {
    Long slotID;
    Long bookingPlanID;
    Long tutorID;
    Long userID;
    LocalDateTime startTime;
    LocalDateTime endTime;
    Long paymentID;
    SlotStatus status;
    LocalDateTime lockedAt;
    LocalDateTime expiresAt;
    String meetingUrl;
    String tutorFullName;
    Boolean learnerJoin;
    Boolean tutorJoin;
    String learnerEvidence;
    String tutorEvidence;
}
