// src/main/java/edu/lms/dto/response/FieldChangeResponse.java
package edu.lms.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FieldChangeResponse {
    String field;     // tên field: "title", "price", "videoURL", ...
    String oldValue;  // giá trị cũ (String để dễ show ra FE)
    String newValue;  // giá trị mới
}
