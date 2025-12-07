// src/main/java/edu/lms/controller/TutorDashboardController.java
package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.response.TutorDashboardResponse;
import edu.lms.entity.User;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.UserRepository;
import edu.lms.service.TutorDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/tutor/dashboard")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
@Tag(name = "Tutor Dashboard", description = "API dashboard tổng quan cho Tutor")
public class TutorDashboardController {

    TutorDashboardService tutorDashboardService;
    UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Lấy dữ liệu dashboard của tutor hiện tại")
    public ApiRespond<TutorDashboardResponse> getDashboard(
            Authentication authentication,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        // Nếu FE không truyền thì mặc định là tháng hiện tại
        LocalDate now = LocalDate.now();
        if (startDate == null) {
            startDate = now.withDayOfMonth(1);
        }
        if (endDate == null) {
            endDate = now;
        }

        String email = resolveEmail(authentication);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        TutorDashboardResponse data =
                tutorDashboardService.getDashboardForTutor(user.getUserID(), startDate, endDate);

        return ApiRespond.<TutorDashboardResponse>builder()
                .result(data)
                .build();
    }

    // Helper giống các controller khác
    private String resolveEmail(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Object p = auth.getPrincipal();

        if (p instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) return email;
            return jwt.getSubject();
        }
        if (p instanceof UserDetails ud) return ud.getUsername();

        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
}
