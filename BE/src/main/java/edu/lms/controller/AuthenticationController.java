package edu.lms.controller;

import edu.lms.dto.request.*;
import edu.lms.dto.response.AuthResponse;
import edu.lms.dto.response.AuthenticationReponse;
import edu.lms.dto.response.IntrospectResponse;
import edu.lms.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import edu.lms.service.GoogleAuthService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {

    AuthenticationService authenticationService;
    AuthenticationManager authenticationManager;
    GoogleAuthService googleAuthService;

    // ===================== REGISTER =====================

    @PostMapping("/register")
    @PreAuthorize("permitAll()")
    public ApiRespond<Void> register(@RequestBody UserCreationRequest request) {
        authenticationService.register(request);
        return ApiRespond.<Void>builder()
                .message("OTP sent successfully to " + request.getEmail())
                .build();
    }

    // ===================== VERIFY EMAIL =====================

    @PostMapping("/verify")
    @PreAuthorize("permitAll()")
    public ApiRespond<String> verifyEmail(@RequestBody VerifyEmailRequest request) {
        authenticationService.verifyEmail(request.getOtp());

        return ApiRespond.<String>builder()
                .message("Account verified successfully!")
                .build();
    }




    // ===================== LOGIN =====================

    @PostMapping("/token")
    @PreAuthorize("permitAll()")
    public ApiRespond<AuthenticationReponse> login(@RequestBody AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );
        var result = authenticationService.authenticate(request);
        return ApiRespond.<AuthenticationReponse>builder()
                .result(result)
                .build();
    }
    @PostMapping("/refresh")
    @PreAuthorize("permitAll()")
    public ApiRespond<AuthenticationReponse> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        AuthenticationReponse response = authenticationService.refreshToken(refreshToken);
        return ApiRespond.<AuthenticationReponse>builder()
                .result(response)
                .message("Access token refreshed successfully.")
                .build();
    }




    // ===================== INTROSPECT =====================

    @PostMapping("/introspect")
    @PreAuthorize("hasAuthority('INTROSPECT_TOKEN')")
    public ApiRespond<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.introspect(request);
        return ApiRespond.<IntrospectResponse>builder()
                .result(result)
                .build();
    }

    // ===================== LOGOUT =====================

    @PostMapping("/logout")
    @PreAuthorize("hasAuthority('LOGOUT')")
    public ApiRespond<Void> logout(@RequestBody LogoutRequest request)
            throws ParseException, JOSEException {
        authenticationService.logout(request);
        return ApiRespond.<Void>builder()
                .message("Logged out successfully.")
                .build();
    }
    @PostMapping("/forgot-password")
    public ApiRespond<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authenticationService.forgotPassword(request);
        return ApiRespond.<String>builder().message("OTP sent to your email.").build();
    }

    @PostMapping("/verify-reset-otp")
    public ApiRespond<String> verifyResetOtp(@RequestBody VerifyResetOtpRequest request) {
        authenticationService.verifyResetOtp(request);
        return ApiRespond.<String>builder().message("OTP verified successfully.").build();
    }

    @PostMapping("/set-new-password")
    public ApiRespond<String> setNewPassword(@RequestBody SetNewPasswordRequest request) {
        authenticationService.setNewPassword(request);
        return ApiRespond.<String>builder().message("Password updated successfully.").build();
    }
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@RequestBody @Valid GoogleLoginRequest request) {
        AuthResponse authResponse = googleAuthService.loginWithGoogle(request.getIdToken());
        return ResponseEntity.ok(authResponse);
    }




}