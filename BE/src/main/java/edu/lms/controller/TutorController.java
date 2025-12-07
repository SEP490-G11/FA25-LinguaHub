package edu.lms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.lms.dto.request.TutorApplyRequest;
import edu.lms.dto.response.TutorApplicationListResponse;
import edu.lms.dto.response.TutorApplyResponse;
import edu.lms.dto.response.TutorDetailResponse;
import edu.lms.security.UserPrincipal;
import edu.lms.service.TutorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/tutors")
@RequiredArgsConstructor
public class TutorController {

    private final TutorService tutorService;
    private final ObjectMapper objectMapper;

    // 1. Submit application
    @PostMapping("/apply")
    public ResponseEntity<?> applyToBecomeTutor(
            @RequestBody @Valid TutorApplyRequest request
    ) {
        try {
            // Log request để debug
            log.info("Received tutor application request");
            if (request.getCertificates() != null) {
                log.info("Number of certificates: {}", request.getCertificates().size());
                for (int i = 0; i < request.getCertificates().size(); i++) {
                    var cert = request.getCertificates().get(i);
                    log.info("Certificate[{}]: name={}, documentUrl={}", 
                            i, cert.getCertificateName(), cert.getDocumentUrl());
                }
            } else {
                log.warn("Certificates list is null!");
            }
            
            // Log full request as JSON for debugging
            String requestJson = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(request);
            log.debug("Full request body:\n{}", requestJson);
        } catch (Exception e) {
            log.error("Error logging request", e);
        }
        
        Long userID = getCurrentUserId();
        tutorService.applyToBecomeTutor(userID, request);
        return ResponseEntity.ok("Application submitted successfully and is now pending review.");
    }

    // 2. View application status
    @GetMapping("/apply/status")
    public ResponseEntity<TutorApplyResponse> getApplyStatus() {
        Long userID = getCurrentUserId();
        return ResponseEntity.ok(tutorService.getApplicationStatus(userID));
    }

    // 3. Xem danh sách tất cả tutors đã được approve (tất cả role đều xem được)
    @GetMapping("/approved")
    public ResponseEntity<List<TutorApplicationListResponse>> getAllApprovedTutors() {
        List<TutorApplicationListResponse> tutors = tutorService.getAllTutors("APPROVED");
        return ResponseEntity.ok(tutors);
    }

    // 4. Xem chi tiết tutor và các khóa học đã được approved (tất cả role đều xem được)
    @GetMapping("/{tutorId}")
    public ResponseEntity<TutorDetailResponse> getTutorDetail(@PathVariable Long tutorId) {
        TutorDetailResponse tutorDetail = tutorService.getTutorDetail(tutorId);
        return ResponseEntity.ok(tutorDetail);
    }

    // Helper method to get current user ID from JWT token
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            Object userId = jwt.getClaim("userId");
            if (userId instanceof Integer) {
                return ((Integer) userId).longValue();
            } else if (userId instanceof Long) {
                return (Long) userId;
            } else if (userId instanceof Number) {
                return ((Number) userId).longValue();
            }
        } else if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) authentication.getPrincipal()).getUserId();
        }
        throw new RuntimeException("User not authenticated");
    }
}
