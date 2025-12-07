package edu.lms.dto.request;

import lombok.Data;

@Data
public class BookingComplaintRequest {
    private String evidenceUrl;
    private String reason;
}
