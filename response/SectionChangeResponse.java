// src/main/java/edu/lms/dto/response/SectionChangeResponse.java
package edu.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SectionChangeResponse {
    Long originalSectionId;   // null nếu section mới
    Long draftSectionId;
    String title;
    String changeType;        // "ADDED", "UPDATED", "DELETED"
    List<FieldChangeResponse> fieldChanges;
}
