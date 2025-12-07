package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.ChangePasswordRequest;
import edu.lms.dto.request.UserCreationRequest;
import edu.lms.dto.response.UserResponse;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {

    UserService userService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_USER')")
    ApiRespond<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request) {
        return ApiRespond.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_USER')")
    ApiRespond<List<UserResponse>> getUsers() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("User: {}", auth.getName());
        auth.getAuthorities().forEach(a -> log.info("Authority: {}", a.getAuthority()));

        return ApiRespond.<List<UserResponse>>builder()
                .result(userService.getUsers())
                .build();
    }

    @GetMapping("/myInfo")
    @PreAuthorize("hasAuthority('VIEW_USER')")
    public ApiRespond<UserResponse> getMyInfo() {
        return ApiRespond.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }
    @PostMapping("/change-password")
    @PreAuthorize("hasAuthority('CHANGE_PASSWORD')")
    public ApiRespond<String> changePassword(@RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ApiRespond.<String>builder().message("Password changed successfully.").build();
    }

    @PatchMapping("/{userID}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> updateUserFields(
            @PathVariable Long userID,
            @AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt,
            @RequestBody Map<String, Object> updates) {

        Long currentUserId = jwt.getClaim("userId");

        // nếu không phải chính chủ và cũng không có UPDATE_USER -> chặn
        if (!currentUserId.equals(userID)
                && jwt.getClaimAsStringList("permissions").stream().noneMatch("UPDATE_USER"::equals)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return ResponseEntity.ok(userService.updateUserFields(userID, updates));
    }


    @DeleteMapping("/{userID}")
    @PreAuthorize("hasAuthority('DELETE_USER')")
    public void deleteUser(@PathVariable Long userID) {
        userService.deleteUser(userID);
    }
}
