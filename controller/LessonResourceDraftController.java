// src/main/java/edu/lms/controller/LessonResourceDraftController.java
package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.LessonResourceRequest;
import edu.lms.dto.response.LessonResourceResponse;
import edu.lms.service.LessonResourceDraftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/tutor/courses/drafts")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class LessonResourceDraftController {

    LessonResourceDraftService lessonResourceDraftService;

    @PostMapping("/lessons/{lessonDraftID}/resources")
    public ApiRespond<LessonResourceResponse> addResource(
            @PathVariable Long lessonDraftID,
            @RequestBody @Valid LessonResourceRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<LessonResourceResponse>builder()
                .result(lessonResourceDraftService.addResource(lessonDraftID, request, email))
                .message("Draft resource added successfully")
                .build();
    }

    @GetMapping("/lessons/{lessonDraftID}/resources")
    public ApiRespond<List<LessonResourceResponse>> getResourcesByLesson(
            @PathVariable Long lessonDraftID,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<List<LessonResourceResponse>>builder()
                .result(lessonResourceDraftService.getResourcesByLessonDraft(lessonDraftID, email))
                .message("Draft resources retrieved successfully")
                .build();
    }

    @PutMapping("/resources/{resourceDraftID}")
    public ApiRespond<LessonResourceResponse> updateResource(
            @PathVariable Long resourceDraftID,
            @RequestBody @Valid LessonResourceRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<LessonResourceResponse>builder()
                .result(lessonResourceDraftService.updateResource(resourceDraftID, request, email))
                .message("Draft resource updated successfully")
                .build();
    }

    @DeleteMapping("/resources/{resourceDraftID}")
    public ApiRespond<Void> deleteResource(
            @PathVariable Long resourceDraftID,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        lessonResourceDraftService.deleteResource(resourceDraftID, email);
        return ApiRespond.<Void>builder()
                .message("Draft resource deleted successfully")
                .build();
    }
}
