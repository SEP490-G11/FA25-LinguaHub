// src/main/java/edu/lms/controller/CourseObjectiveDraftController.java
package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.CourseObjectiveRequest;
import edu.lms.dto.response.CourseObjectiveResponse;
import edu.lms.service.CourseObjectiveDraftService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/tutor/courses/drafts")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class CourseObjectiveDraftController {

    CourseObjectiveDraftService courseObjectiveDraftService;

    @Operation(summary = "Tutor: get objectives of a course draft")
    @GetMapping("/{draftID}/objectives")
    public ApiRespond<List<CourseObjectiveResponse>> getByDraft(
            @PathVariable Long draftID,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<List<CourseObjectiveResponse>>builder()
                .result(courseObjectiveDraftService.getByDraft(draftID, email))
                .build();
    }

    @Operation(summary = "Tutor: create an objective in course draft")
    @PostMapping("/{draftID}/objectives")
    public ApiRespond<CourseObjectiveResponse> create(
            @PathVariable Long draftID,
            @Validated @RequestBody CourseObjectiveRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<CourseObjectiveResponse>builder()
                .result(courseObjectiveDraftService.create(draftID, request, email))
                .build();
    }

    @Operation(summary = "Tutor: update an objective in course draft")
    @PutMapping("/objectives/{objectiveDraftID}")
    public ApiRespond<CourseObjectiveResponse> update(
            @PathVariable Long objectiveDraftID,
            @Validated @RequestBody CourseObjectiveRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<CourseObjectiveResponse>builder()
                .result(courseObjectiveDraftService.update(objectiveDraftID, request, email))
                .build();
    }

    @Operation(summary = "Tutor: delete an objective in course draft")
    @DeleteMapping("/objectives/{objectiveDraftID}")
    public ApiRespond<String> delete(
            @PathVariable Long objectiveDraftID,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        courseObjectiveDraftService.delete(objectiveDraftID, email);
        return ApiRespond.<String>builder()
                .result("Deleted objective draft successfully.")
                .build();
    }
}
