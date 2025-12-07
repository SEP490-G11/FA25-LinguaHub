package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.LessonProgressRequest;
import edu.lms.dto.response.LessonProgressResponse;
import edu.lms.service.StudentLessonService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/student/lessons")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class StudentLessonController {

    StudentLessonService studentLessonService;

    @PostMapping("/{lessonId}/progress")
    public ApiRespond<LessonProgressResponse> saveLessonProgress(
            @PathVariable Long lessonId,
            @RequestBody LessonProgressRequest request,
            @AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<LessonProgressResponse>builder()
                .result(studentLessonService.saveLessonProgress(email, lessonId, request))
                .message("Progress saved successfully")
                .build();
    }
}
