package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.QuizQuestionRequest;
import edu.lms.dto.response.LessonQuizDetailResponse;
import edu.lms.dto.response.QuizQuestionResponse;
import edu.lms.service.TutorQuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/tutor/quiz")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Tutor Quiz", description = "API quản lý câu hỏi Quiz cho Lesson")
public class TutorQuizController {

    TutorQuizService tutorQuizService;

    // ====================== LIVE LESSON QUIZ ======================

    @Operation(summary = "Tutor xem chi tiết quiz của 1 lesson live (bao gồm question + options)")
    @GetMapping("/lessons/{lessonID}")
    public ApiRespond<LessonQuizDetailResponse> getLiveLessonQuiz(
            @AuthenticationPrincipal(expression = "claims['sub']") String email,
            @PathVariable Long lessonID
    ) {
        return ApiRespond.<LessonQuizDetailResponse>builder()
                .result(tutorQuizService.getLiveLessonQuiz(email, lessonID))
                .build();
    }

    @Operation(summary = "Tutor tạo mới 1 câu hỏi quiz cho lesson live (LessonType = Quiz)")
    @PostMapping("/lessons/{lessonID}/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiRespond<QuizQuestionResponse> createLiveQuestion(
            @AuthenticationPrincipal(expression = "claims['sub']") String email,
            @PathVariable Long lessonID,
            @RequestBody @Valid QuizQuestionRequest request
    ) {
        return ApiRespond.<QuizQuestionResponse>builder()
                .result(tutorQuizService.createLiveQuestion(email, lessonID, request))
                .build();
    }

    @Operation(summary = "Tutor cập nhật 1 câu hỏi quiz live (replace toàn bộ options)")
    @PutMapping("/questions/{questionID}")
    public ApiRespond<QuizQuestionResponse> updateLiveQuestion(
            @AuthenticationPrincipal(expression = "claims['sub']") String email,
            @PathVariable Long questionID,
            @RequestBody @Valid QuizQuestionRequest request
    ) {
        return ApiRespond.<QuizQuestionResponse>builder()
                .result(tutorQuizService.updateLiveQuestion(email, questionID, request))
                .build();
    }

    @Operation(summary = "Tutor xóa 1 câu hỏi quiz live")
    @DeleteMapping("/questions/{questionID}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLiveQuestion(
            @AuthenticationPrincipal(expression = "claims['sub']") String email,
            @PathVariable Long questionID
    ) {
        tutorQuizService.deleteLiveQuestion(email, questionID);
    }

    // ====================== DRAFT LESSON QUIZ ======================

    @Operation(summary = "Tutor xem chi tiết quiz của 1 lesson draft")
    @GetMapping("/draft-lessons/{lessonDraftID}")
    public ApiRespond<LessonQuizDetailResponse> getDraftLessonQuiz(
            @AuthenticationPrincipal(expression = "claims['sub']") String email,
            @PathVariable Long lessonDraftID
    ) {
        return ApiRespond.<LessonQuizDetailResponse>builder()
                .result(tutorQuizService.getDraftLessonQuiz(email, lessonDraftID))
                .build();
    }

    @Operation(summary = "Tutor tạo mới câu hỏi quiz cho lesson draft")
    @PostMapping("/draft-lessons/{lessonDraftID}/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiRespond<QuizQuestionResponse> createDraftQuestion(
            @AuthenticationPrincipal(expression = "claims['sub']") String email,
            @PathVariable Long lessonDraftID,
            @RequestBody @Valid QuizQuestionRequest request
    ) {
        return ApiRespond.<QuizQuestionResponse>builder()
                .result(tutorQuizService.createDraftQuestion(email, lessonDraftID, request))
                .build();
    }

    @Operation(summary = "Tutor cập nhật câu hỏi quiz draft (replace toàn bộ options)")
    @PutMapping("/draft-questions/{questionDraftID}")
    public ApiRespond<QuizQuestionResponse> updateDraftQuestion(
            @AuthenticationPrincipal(expression = "claims['sub']") String email,
            @PathVariable Long questionDraftID,
            @RequestBody @Valid QuizQuestionRequest request
    ) {
        return ApiRespond.<QuizQuestionResponse>builder()
                .result(tutorQuizService.updateDraftQuestion(email, questionDraftID, request))
                .build();
    }

    @Operation(summary = "Tutor xóa câu hỏi quiz draft")
    @DeleteMapping("/draft-questions/{questionDraftID}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDraftQuestion(
            @AuthenticationPrincipal(expression = "claims['sub']") String email,
            @PathVariable Long questionDraftID
    ) {
        tutorQuizService.deleteDraftQuestion(email, questionDraftID);
    }
}
