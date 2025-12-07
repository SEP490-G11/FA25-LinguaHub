package edu.lms.controller;

import edu.lms.dto.request.SlotBookingRequest;
import edu.lms.dto.response.OperationStatusResponse;
import edu.lms.security.UserPrincipal;
import edu.lms.service.TutorSlotBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/booking/slots")
@RequiredArgsConstructor
public class TutorSlotBookingController {

    private final TutorSlotBookingService tutorSlotBookingService;

    @PostMapping("/lock")
    public ResponseEntity<OperationStatusResponse> lockSlots(
            @Valid @RequestBody SlotBookingRequest request
    ) {
        Long currentUserId = getCurrentUserId();
        OperationStatusResponse response = tutorSlotBookingService.lockSlots(currentUserId, request);
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


