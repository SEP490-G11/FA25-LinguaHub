// src/main/java/edu/lms/dto/response/ObjectiveChangeResponse.java
package edu.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ObjectiveChangeResponse {
    Long originalObjectiveId;  // có thể null nếu là objective mới
    Long draftObjectiveId;     // id của CourseObjectiveDraft
    String changeType;         // "ADDED", "UPDATED", "DELETED"
    List<FieldChangeResponse> fieldChanges;
}
