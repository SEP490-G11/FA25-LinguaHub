package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.response.StudentCourseListItemResponse;
import edu.lms.dto.response.StudentCourseResponse;
import edu.lms.entity.User;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.UserRepository;
import edu.lms.service.StudentCourseService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/student/courses")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class StudentCourseController {

    StudentCourseService studentCourseService;
    UserRepository userRepository;


    @GetMapping
    public ApiRespond<List<StudentCourseListItemResponse>> getMyCourses(
            @AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        return ApiRespond.<List<StudentCourseListItemResponse>>builder()
                .result(studentCourseService.getCoursesSummary(user.getUserID()))
                .message("Fetched enrolled courses successfully")
                .build();
    }


    @GetMapping("/{courseId}")
    public ApiRespond<StudentCourseResponse> getMyCourseDetail(
            @PathVariable Long courseId,
            @AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        return ApiRespond.<StudentCourseResponse>builder()
                .result(studentCourseService.getCourseDetail(user.getUserID(), courseId))
                .message("Fetched course detail successfully")
                .build();
    }
}
