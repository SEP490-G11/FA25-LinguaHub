package edu.lms.dto.request;

import lombok.Data;

@Data
public class NotificationStatusUpdateRequest {

    /**
     * true  = đã đọc
     * false = chưa đọc
     */
    private Boolean read;
}
