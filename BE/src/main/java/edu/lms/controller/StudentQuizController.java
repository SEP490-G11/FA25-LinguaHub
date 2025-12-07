package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.SubmitQuizRequest;
import edu.lms.dto.response.QuizQuestionResponse;
import edu.lms.dto.response.SubmitQuizResultResponse;
import edu.lms.entity.User;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.UserRepository;
import edu.lms.service.StudentQuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/student/courses/{courseId}/lessons/{lessonId}/quiz")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
@Tag(
        name = "Student Quiz",
        description = "API cho học viên làm Quiz trong từng lesson của khoá học đã ghi danh"
)
public class StudentQuizController {

    StudentQuizService studentQuizService;
    UserRepository userRepository;


    @GetMapping
    @Operation(summary = "Student: Lấy danh sách câu hỏi quiz của 1 lesson")
    public ApiRespond<List<QuizQuestionResponse>> getQuizForLesson(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        return ApiRespond.<List<QuizQuestionResponse>>builder()
                .result(studentQuizService.getQuizForLesson(user.getUserID(), courseId, lessonId))
                .message("Fetched quiz questions for lesson")
                .build();
    }

    @PostMapping("/submit")
    @Operation(summary = "Student: Nộp bài quiz cho 1 lesson")
    public ApiRespond<SubmitQuizResultResponse> submitQuiz(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @AuthenticationPrincipal(expression = "claims['sub']") String email,
            @RequestBody SubmitQuizRequest request
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        return ApiRespond.<SubmitQuizResultResponse>builder()
                .result(studentQuizService.submitQuiz(user.getUserID(), courseId, lessonId, request))
                .message("Submitted quiz and calculated result")
                .build();
    }

    @GetMapping("/result/latest")
    @Operation(summary = "Student: Lấy kết quả quiz mới nhất đã làm cho lesson này")
    public ApiRespond<SubmitQuizResultResponse> getLatestQuizResult(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        return ApiRespond.<SubmitQuizResultResponse>builder()
                .result(studentQuizService.getLatestQuizResult(user.getUserID(), courseId, lessonId))
                .message("Fetched latest quiz result for lesson")
                .build();
    }
}
