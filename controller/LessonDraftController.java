// src/main/java/edu/lms/controller/LessonDraftController.java
package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.LessonRequest;
import edu.lms.dto.response.LessonResponse;
import edu.lms.service.LessonDraftService;
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
public class LessonDraftController {

    LessonDraftService lessonDraftService;

    @GetMapping("/sections/{sectionDraftID}/lessons")
    public ApiRespond<List<LessonResponse>> getLessonsBySectionDraft(
            @PathVariable Long sectionDraftID,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<List<LessonResponse>>builder()
                .result(lessonDraftService.getLessonsBySectionDraft(sectionDraftID, email))
                .message("Draft lessons retrieved successfully")
                .build();
    }

    @PostMapping("/sections/{sectionDraftID}/lessons")
    public ApiRespond<LessonResponse> createLessonDraft(
            @PathVariable Long sectionDraftID,
            @RequestBody @Valid LessonRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<LessonResponse>builder()
                .result(lessonDraftService.createLesson(sectionDraftID, request, email))
                .message("Draft lesson created successfully")
                .build();
    }

    @GetMapping("/lessons/{lessonDraftID}")
    public ApiRespond<LessonResponse> getLessonDraftDetail(
            @PathVariable Long lessonDraftID,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<LessonResponse>builder()
                .result(lessonDraftService.getLessonDetail(lessonDraftID, email))
                .message("Draft lesson detail retrieved successfully")
                .build();
    }

    @PutMapping("/lessons/{lessonDraftID}")
    public ApiRespond<LessonResponse> updateLessonDraft(
            @PathVariable Long lessonDraftID,
            @RequestBody @Valid LessonRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<LessonResponse>builder()
                .result(lessonDraftService.updateLesson(lessonDraftID, request, email))
                .message("Draft lesson updated successfully")
                .build();
    }

    @DeleteMapping("/lessons/{lessonDraftID}")
    public ApiRespond<Void> deleteLessonDraft(
            @PathVariable Long lessonDraftID,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        lessonDraftService.deleteLesson(lessonDraftID, email);
        return ApiRespond.<Void>builder()
                .message("Draft lesson deleted successfully")
                .build();
    }
}
