package edu.lms.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE) //có thể xóa private ở dưới khai báo

public class PermissionRequest {
    String name;
    String description;
}
