package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.response.TutorStudentDetailResponse;
import edu.lms.dto.response.TutorStudentSummaryResponse;
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


    //Tutor xem danh sách học viên của CHÍNH MÌNH
    @GetMapping("/students")
    public ApiRespond<List<TutorStudentSummaryResponse>> getStudentsForCurrentTutor(
            Authentication authentication
    ) {
        String email = resolveEmail(authentication);

        List<TutorStudentSummaryResponse> data =
                tutorStudentService.getStudentsForTutorByTutorEmail(email);

        return ApiRespond.<List<TutorStudentSummaryResponse>>builder()
                .result(data)
                .build();
    }


     //Tutor xem chi tiết 1 học viên (modal detail)

    @GetMapping("/students/{studentId}")
    public ApiRespond<TutorStudentDetailResponse> getStudentDetailForCurrentTutor(
            @PathVariable Long studentId,
            Authentication authentication
    ) {
        String email = resolveEmail(authentication);

        TutorStudentDetailResponse detail =
                tutorStudentService.getStudentDetailForTutorByEmail(email, studentId);

        return ApiRespond.<TutorStudentDetailResponse>builder()
                .result(detail)
                .build();
    }

    // Helper: lấy email từ token
    private String resolveEmail(Authentication authentication) {
        // Thường username trong Security chính là email
        return authentication.getName();
    }
}
