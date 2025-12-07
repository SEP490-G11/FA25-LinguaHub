package edu.lms.controller;

import edu.lms.dto.request.TutorBookingPlanRequest;
import edu.lms.dto.response.*;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.security.UserPrincipal;
import edu.lms.service.TutorBookingPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;


@RestController
@RequiredArgsConstructor
@RequestMapping("/tutor")
public class TutorBookingPlanController {

    private final TutorBookingPlanService tutorBookingPlanService;

    @PostMapping("/booking-plan")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<BookingPlanCreateResponse> createBookingPlan(
            @Valid @RequestBody TutorBookingPlanRequest request
    ) {
        Long currentUserId = getCurrentUserId();
        BookingPlanCreateResponse response = tutorBookingPlanService.createBookingPlan(currentUserId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/booking-plan/{bookingPlanId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<BookingPlanUpdateResponse> updateBookingPlan(
            @PathVariable Long bookingPlanId,
            @Valid @RequestBody TutorBookingPlanRequest request
    ) {
        Long currentUserId = getCurrentUserId();
        BookingPlanUpdateResponse response = tutorBookingPlanService.updateBookingPlan(currentUserId, bookingPlanId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/booking-plan/{bookingPlanId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<OperationStatusResponse> deleteBookingPlan(@PathVariable Long bookingPlanId) {
        Long currentUserId = getCurrentUserId();
        OperationStatusResponse response = tutorBookingPlanService.deleteBookingPlan(currentUserId, bookingPlanId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{tutorId}/booking-plan")
    @PreAuthorize("permitAll()")
    public ResponseEntity<BookingPlanListResponse> getBookingPlans(@PathVariable Long tutorId) {
        BookingPlanListResponse response = tutorBookingPlanService.getBookingPlansByTutor(tutorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/booking-plan/me")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<BookingPlanListResponse> getMyBookingPlans() {
        Long currentUserId = getCurrentUserId();
        BookingPlanListResponse response = tutorBookingPlanService.getMyBookingPlans(currentUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/booking-plan/me/with-slots")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<BookingPlanListWithSlotsResponse> getMyBookingPlansWithSlots() {
        Long currentUserId = getCurrentUserId();
        BookingPlanListWithSlotsResponse response = tutorBookingPlanService.getMyBookingPlansWithSlots(currentUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/booking-plan/{bookingPlanId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<BookingPlanDetailResponse> getBookingPlanDetail(@PathVariable Long bookingPlanId) {
        BookingPlanDetailResponse response = tutorBookingPlanService.getBookingPlanDetail(bookingPlanId);
        return ResponseEntity.ok(response);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            Object userId = jwt.getClaim("userId");
            if (userId instanceof Integer integerId) {
                return integerId.longValue();
            }
            if (userId instanceof Long longId) {
                return longId;
            }
            if (userId instanceof Number numberId) {
                return numberId.longValue();
            }
            // userId claim không tồn tại hoặc null
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        } 
        
        if (authentication.getPrincipal() instanceof UserPrincipal principal) {
            Long userId = principal.getUserId();
            if (userId == null) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }
            return userId;
        }
        
        // Principal không phải Jwt hoặc UserPrincipal
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
}
