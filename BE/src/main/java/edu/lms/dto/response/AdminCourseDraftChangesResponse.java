package edu.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminCourseDraftChangesResponse {

    Long courseId;
    Long draftId;

    // thay đổi ở metadata course (title, price, language, thumbnail, ...)
    List<FieldChangeResponse> courseChanges;

    // objectives
    List<ObjectiveChangeResponse> objectives;

    // sections
    List<SectionChangeResponse> sections;

    // lessons
    List<LessonChangeResponse> lessons;

    // resources
    List<ResourceChangeResponse> resources;
}
