package edu.lms.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FileUrlResponse {
    private String viewUrl;     // URL để xem trực tiếp
    private String downloadUrl; // URL để tải file
}
