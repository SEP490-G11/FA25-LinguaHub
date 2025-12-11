package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.LessonRequest;
import edu.lms.dto.response.LessonResponse;
import edu.lms.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/tutor/courses/" +
        "" +
        "" +
        "" +
        "" +
        "" +
        "")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class LessonController {

        LessonService lessonService;

        // GET LESSONS BY SECTION
        @GetMapping("/{sectionID}/lessons")
        public ApiRespond<List<LessonResponse>> getLessonsBySection(
                @PathVariable Long sectionID,
                @RequestParam(required = false) String sortBy,
                @RequestParam(required = false, defaultValue = "ASC") String order,
                @RequestParam(required = false) String keyword,
                @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
        ) {
                List<LessonResponse> lessons = lessonService.getLessonsBySectionWithFilters(
                        sectionID, email, keyword, sortBy, order
                );
                return ApiRespond.<List<LessonResponse>>builder()
                        .result(lessons)
                        .message("Lessons retrieved successfully")
                        .build();
        }

        // CREATE LESSON
        @PostMapping("/{sectionID}/lessons")
        public ApiRespond<LessonResponse> createLesson(
                @PathVariable Long sectionID,
                @RequestBody @Valid LessonRequest request,
                @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
        ) {
                LessonResponse lesson = lessonService.createLesson(sectionID, request, email);
                return ApiRespond.<LessonResponse>builder()
                        .result(lesson)
                        .message("Lesson created successfully")
                        .build();
        }

        // GET LESSON DETAIL
        @GetMapping("/lessons/{lessonId}")
        public ApiRespond<LessonResponse> getLessonDetail(
                @PathVariable Long lessonId,
                @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
        ) {
                LessonResponse lesson = lessonService.getLessonDetail(lessonId, email);
                return ApiRespond.<LessonResponse>builder()
                        .result(lesson)
                        .message("Lesson details retrieved successfully")
                        .build();
        }

        // UPDATE LESSON
        @PutMapping("/lessons/{lessonId}")
        public ApiRespond<LessonResponse> updateLesson(
                @PathVariable Long lessonId,
                @RequestBody @Valid LessonRequest request,
                @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
        ) {
                LessonResponse lesson = lessonService.updateLesson(lessonId, request, email);
                return ApiRespond.<LessonResponse>builder()
                        .result(lesson)
                        .message("Lesson updated successfully")
                        .build();
        }

        // DELETE LESSON
        @DeleteMapping("/lessons/{lessonId}")
        public ApiRespond<Void> deleteLesson(
                @PathVariable Long lessonId,
                @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "claims['sub']") String email
        ) {
                lessonService.deleteLesson(lessonId, email);
                return ApiRespond.<Void>builder()
                        .message("Lesson deleted successfully")
                        .build();
        }
}
