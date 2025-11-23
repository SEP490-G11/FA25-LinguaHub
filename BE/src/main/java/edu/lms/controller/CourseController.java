// src/main/java/edu/lms/controller/CourseController.java
package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.response.CourseDetailResponse;
import edu.lms.dto.response.CourseResponse;
import edu.lms.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class CourseController {

    CourseService courseService;

    private String resolveEmail(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return null;
        Object p = auth.getPrincipal();

        if (p instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            return (email != null && !email.isBlank()) ? email : jwt.getSubject(); // fallback sub
        }
        if (p instanceof UserDetails ud) return ud.getUsername();
        if (p instanceof String s)     return "anonymousUser".equalsIgnoreCase(s) ? null : s;
        return null;
    }

    @Operation(summary = "Public: Get all Approved courses")
    @GetMapping("/public/approved")
    public ApiRespond<List<CourseResponse>> getAllApprovedPublic(Authentication authentication) {
        String email = resolveEmail(authentication); // null nếu guest, có token thì ra email/sub
        return ApiRespond.<List<CourseResponse>>builder()
                .result(courseService.getAllApproved(email))
                .build();
    }

    @Operation(summary = "Public: Get Approved courses by tutor")
    @GetMapping("/public/approved/{tutorID}")
    public ApiRespond<List<CourseResponse>> getApprovedByTutorPublic(
            @PathVariable Long tutorID, Authentication authentication) {
        String email = resolveEmail(authentication);
        return ApiRespond.<List<CourseResponse>>builder()
                .result(courseService.getApprovedByTutor(tutorID, email))
                .build();
    }

    @Operation(summary = "Public: Get course detail by ID")
    @GetMapping("/detail/{courseID}")
    public ApiRespond<CourseDetailResponse> getCourseById(
            @PathVariable Long courseID, Authentication authentication) {
        String email = resolveEmail(authentication);
        return ApiRespond.<CourseDetailResponse>builder()
                .result(courseService.getCourseById(courseID, email))
                .build();
    }
}
