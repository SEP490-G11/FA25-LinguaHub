package edu.lms.controller;

import edu.lms.dto.request.PackageSlotRequest;
import edu.lms.dto.response.OperationStatusResponse;
import edu.lms.security.UserPrincipal;
import edu.lms.service.TutorPackageBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/tutor/booking")
public class TutorPackageBookingController {

    private final TutorPackageBookingService tutorPackageBookingService;

    @PostMapping("/lock-slot")
    @PreAuthorize("permitAll()")
    public ResponseEntity<OperationStatusResponse> lockSlots(
            @Valid @RequestBody PackageSlotRequest request
    ) {
        Long currentUserId = getCurrentUserId();
        OperationStatusResponse response = tutorPackageBookingService.lockSlots(currentUserId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirm")
    @PreAuthorize("permitAll()")
    public ResponseEntity<OperationStatusResponse> confirmSlots(
            @Valid @RequestBody PackageSlotRequest request
    ) {
        Long currentUserId = getCurrentUserId();
        OperationStatusResponse response = tutorPackageBookingService.confirmSlots(currentUserId, request);
        return ResponseEntity.ok(response);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
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
        } else if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return principal.getUserId();
        }
        throw new IllegalStateException("User not authenticated");
    }
}
