package edu.lms.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE) //có thể xóa private ở dưới khai báo

public class RoleRequest {
    String name;
    String description;
    Set<String> permissions;
}
