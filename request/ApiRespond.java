package edu.lms.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApiRespond<T> {
    int code = 1000;
    String message;
    T result;

    public static <T> ApiRespond<T> success(T data) {
        return ApiRespond.<T>builder()
                .code(1000)
                .message("SUCCESS")
                .result(data)
                .build();
    }
}
