// src/main/java/edu/lms/dto/response/ResourceChangeResponse.java
package edu.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ResourceChangeResponse {
    Long originalResourceId;  // null nếu resource mới
    Long draftResourceId;
    String resourceTitle;
    String changeType;        // "ADDED", "UPDATED", "DELETED"
    List<FieldChangeResponse> fieldChanges;
}
