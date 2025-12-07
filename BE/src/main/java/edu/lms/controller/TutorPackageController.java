package edu.lms.controller;

import edu.lms.dto.request.TutorPackageRequest;
import edu.lms.dto.response.OperationStatusResponse;
import edu.lms.dto.response.TutorPackageCreateResponse;
import edu.lms.dto.response.TutorPackageListResponse;
import edu.lms.dto.response.TutorPackageResponse;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.security.UserPrincipal;
import edu.lms.service.TutorPackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tutor")
@RequiredArgsConstructor
public class TutorPackageController {

    private final TutorPackageService tutorPackageService;

    @PostMapping("/package")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<TutorPackageCreateResponse> createTutorPackage(
            @Valid @RequestBody TutorPackageRequest request
    ) {
        Long tutorUserId = getCurrentUserId();
        TutorPackageCreateResponse response = tutorPackageService.createTutorPackage(tutorUserId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/package/{packageId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<OperationStatusResponse> updateTutorPackage(
            @PathVariable Long packageId,
            @Valid @RequestBody TutorPackageRequest request
    ) {
        Long tutorUserId = getCurrentUserId();
        OperationStatusResponse response = tutorPackageService.updateTutorPackage(tutorUserId, packageId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/package/{packageId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<OperationStatusResponse> deleteTutorPackage(
            @PathVariable Long packageId
    ) {
        Long tutorUserId = getCurrentUserId();
        OperationStatusResponse response = tutorPackageService.deleteTutorPackage(tutorUserId, packageId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{tutorId}/packages")
    @PreAuthorize("permitAll()")
    public ResponseEntity<TutorPackageListResponse> getTutorPackages(@PathVariable Long tutorId) {
        TutorPackageListResponse response = tutorPackageService.getPackagesByTutor(tutorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/package/me")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<TutorPackageListResponse> getMyPackages() {
        Long tutorUserId = getCurrentUserId();
        TutorPackageListResponse response = tutorPackageService.getMyPackages(tutorUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/package/{packageId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<TutorPackageResponse> getTutorPackageDetail(@PathVariable Long packageId) {
        TutorPackageResponse response = tutorPackageService.getPackageDetail(packageId);
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


