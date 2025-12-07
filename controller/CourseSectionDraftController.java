// src/main/java/edu/lms/controller/CourseSectionDraftController.java
package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.CourseSectionRequest;
import edu.lms.dto.response.CourseSectionResponse;
import edu.lms.service.CourseSectionDraftService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/tutor/courses/drafts")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class CourseSectionDraftController {

    CourseSectionDraftService courseSectionDraftService;

    @Operation(summary = "Tutor: get sections of a course draft")
    @GetMapping("/{draftID}/sections")
    public ApiRespond<List<CourseSectionResponse>> getSectionsByDraft(
            @PathVariable Long draftID,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<List<CourseSectionResponse>>builder()
                .result(courseSectionDraftService.getSectionsByDraft(draftID, email))
                .build();
    }

    @Operation(summary = "Tutor: create section in course draft")
    @PostMapping("/{draftID}/sections")
    public ApiRespond<CourseSectionResponse> createSection(
            @PathVariable Long draftID,
            @RequestBody CourseSectionRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<CourseSectionResponse>builder()
                .result(courseSectionDraftService.createSection(draftID, request, email))
                .message("Draft section created successfully")
                .build();
    }

    @Operation(summary = "Tutor: update section in course draft")
    @PutMapping("/sections/{sectionDraftID}")
    public ApiRespond<CourseSectionResponse> updateSection(
            @PathVariable Long sectionDraftID,
            @RequestBody CourseSectionRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<CourseSectionResponse>builder()
                .result(courseSectionDraftService.updateSection(sectionDraftID, request, email))
                .message("Draft section updated successfully")
                .build();
    }

    @Operation(summary = "Tutor: delete section in course draft")
    @DeleteMapping("/sections/{sectionDraftID}")
    public ApiRespond<Void> deleteSection(
            @PathVariable Long sectionDraftID,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        courseSectionDraftService.deleteSection(sectionDraftID, email);
        return ApiRespond.<Void>builder()
                .message("Draft section deleted successfully")
                .build();
    }
}
