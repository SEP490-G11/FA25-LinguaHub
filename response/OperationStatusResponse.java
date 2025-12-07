package edu.lms.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OperationStatusResponse {
    Boolean success;
    String message;

    public static OperationStatusResponse success(String message) {
        return OperationStatusResponse.builder()
                .success(true)
                .message(message)
                .build();
    }
}


