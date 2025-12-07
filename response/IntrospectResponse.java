package edu.lms.dto.response;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE) //có thể xóa private ở dưới khai báo
public class IntrospectResponse {
    boolean valid;
}
