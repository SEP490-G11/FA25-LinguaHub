package edu.lms.controller;

import edu.lms.dto.request.TutorApprovalRequest;
import edu.lms.dto.request.TutorUpdateRequest;
import edu.lms.dto.response.TutorApplicationDetailResponse;
import edu.lms.dto.response.TutorApplicationListResponse;
import edu.lms.security.UserPrincipal;
import edu.lms.service.TutorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/tutors")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('VIEW_TUTOR_APPLICATIONS')")
public class AdminTutorController {

    private final TutorService tutorService;

    // 1. Xem danh sách tất cả đơn đăng ký đang pending
    @GetMapping("/applications/pending")
    public ResponseEntity<List<TutorApplicationListResponse>> getPendingApplications() {
        List<TutorApplicationListResponse> pendingApplications = tutorService.getPendingApplications();
        return ResponseEntity.ok(pendingApplications);
    }

    // 2. Xem danh sách tất cả đơn đăng ký đã được approve
    @GetMapping("/applications/approved")
    public ResponseEntity<List<TutorApplicationListResponse>> getApprovedApplications() {
        List<TutorApplicationListResponse> approvedApplications = tutorService.getApprovedApplications();
        return ResponseEntity.ok(approvedApplications);
    }

    // 3. Xem danh sách tất cả đơn đăng ký đã bị reject
    @GetMapping("/applications/rejected")
    public ResponseEntity<List<TutorApplicationListResponse>> getRejectedApplications() {
        List<TutorApplicationListResponse> rejectedApplications = tutorService.getRejectedApplications();
        return ResponseEntity.ok(rejectedApplications);
    }

    // 4. Xem tất cả các đơn đăng ký (PENDING, REJECTED, APPROVED) - có thể filter theo status
    @GetMapping("/applications")
    @PreAuthorize("hasAuthority('VIEW_TUTOR_APPLICATIONS')")
    public ResponseEntity<List<TutorApplicationListResponse>> getAllApplications(
            @RequestParam(required = false) String status
    ) {
        List<TutorApplicationListResponse> allApplications = tutorService.getAllApplications(status);
        return ResponseEntity.ok(allApplications);
    }

    // 5. Xem chi tiết một đơn đăng ký
    @GetMapping("/applications/{verificationId}")
    public ResponseEntity<TutorApplicationDetailResponse> getApplicationDetail(
            @PathVariable Long verificationId
    ) {
        TutorApplicationDetailResponse applicationDetail = tutorService.getApplicationDetail(verificationId);
        return ResponseEntity.ok(applicationDetail);
    }

    // 6. Duyệt đơn đăng ký (approve)
    @PostMapping("/applications/{verificationId}/approve")
    @PreAuthorize("hasAuthority('APPROVE_TUTOR')")
    public ResponseEntity<?> approveApplication(
            @PathVariable Long verificationId
    ) {
        Long adminId = getCurrentUserId();
        tutorService.approveTutorApplication(verificationId, adminId);
        return ResponseEntity.ok("Application approved successfully");
    }

    // 7. Từ chối đơn đăng ký (reject)
    @PostMapping("/applications/{verificationId}/reject")
    @PreAuthorize("hasAuthority('REJECT_TUTOR')")
    public ResponseEntity<?> rejectApplication(
            @PathVariable Long verificationId,
            @RequestBody @Valid TutorApprovalRequest request
    ) {
        Long adminId = getCurrentUserId();
        tutorService.rejectTutorApplication(verificationId, adminId, request.getReason());
        return ResponseEntity.ok("Application rejected successfully");
    }

    // 8. Xem danh sách các tutor đã được approve (có thể filter theo status)
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('VIEW_TUTOR_APPLICATIONS')")
    public ResponseEntity<List<TutorApplicationListResponse>> getAllTutors(
            @RequestParam(required = false, defaultValue = "APPROVED") String status
    ) {
        List<TutorApplicationListResponse> tutors = tutorService.getAllTutors(status);
        return ResponseEntity.ok(tutors);
    }

    // 9. Suspend/Unsuspend tutor
    @PostMapping("/{tutorId}/suspend")
    @PreAuthorize("hasAuthority('SUSPEND_TUTOR')")
    public ResponseEntity<?> suspendTutor(
            @PathVariable Long tutorId
    ) {
        Long adminId = getCurrentUserId();
        tutorService.suspendTutor(tutorId, adminId);
        return ResponseEntity.ok("Tutor suspended successfully");
    }

    @PostMapping("/{tutorId}/unsuspend")
    @PreAuthorize("hasAuthority('ACTIVATE_TUTOR')")
    public ResponseEntity<?> unsuspendTutor(
            @PathVariable Long tutorId
    ) {
        Long adminId = getCurrentUserId();
        tutorService.unsuspendTutor(tutorId, adminId);
        return ResponseEntity.ok("Tutor unsuspended successfully");
    }

    // 10. Update tutor information
    @PatchMapping("/{tutorId}")
    @PreAuthorize("hasAuthority('UPDATE_TUTOR_INFO')")
    public ResponseEntity<?> updateTutorInfo(
            @PathVariable Long tutorId,
            @RequestBody @Valid TutorUpdateRequest request
    ) {
        tutorService.updateTutorInfo(tutorId, request);
        return ResponseEntity.ok("Tutor information updated successfully");
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
