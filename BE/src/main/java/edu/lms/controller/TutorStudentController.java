package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.response.TutorStudentSummaryResponse;
import edu.lms.entity.User;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.service.TutorStudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tutors")
@RequiredArgsConstructor
public class TutorStudentController {

    private final TutorStudentService tutorStudentService;

    /**
     * Tutor login -> xem danh sách các học viên của CHÍNH MÌNH
     */
    @GetMapping("/students")
    public ApiRespond<List<TutorStudentSummaryResponse>> getStudentsForCurrentTutor(
            Authentication authentication
    ) {
        System.out.println(">>> [TutorStudentController] /api/tutors/students CALLED");
        String email = resolveEmail(authentication);

        List<TutorStudentSummaryResponse> data =
                tutorStudentService.getStudentsForTutorByTutorEmail(email);

        return ApiRespond.<List<TutorStudentSummaryResponse>>builder()
                .result(data)
                .build();
    }

    /**
     * Tutor xem chi tiết một học viên.
     * Có check: chỉ xem được nếu học viên này đã học (Paid) với tutor đó.
     */
    @GetMapping("/students/{studentUserId}")
    public ApiRespond<User> getStudentDetailForCurrentTutor(
            Authentication authentication,
            @PathVariable Long studentUserId
    ) {
        String email = resolveEmail(authentication);

        User student = tutorStudentService.getStudentDetailForTutor(email, studentUserId);

        return ApiRespond.<User>builder()
                .result(student)
                .build();
    }

    // Helper lấy email từ Authentication (tùy cách bạn set trong Security)
    private String resolveEmail(Authentication authentication) {
        System.out.println(">>> Auth in controller = " + authentication);
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        System.out.println(">>> Principal = " + authentication.getPrincipal());
        System.out.println(">>> Name = " + authentication.getName());
        return authentication.getName();
    }
}
