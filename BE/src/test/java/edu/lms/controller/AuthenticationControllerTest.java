package edu.lms.controller;

import edu.lms.dto.request.*;
import edu.lms.dto.response.AuthResponse;
import edu.lms.dto.response.AuthenticationReponse;
import edu.lms.dto.response.IntrospectResponse;
import edu.lms.service.AuthenticationService;
import edu.lms.service.GoogleAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthenticationController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthenticationControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    AuthenticationService authenticationService;

    @MockitoBean
    AuthenticationManager authenticationManager;

    @MockitoBean
    GoogleAuthService googleAuthService;

    /**
     * Set sẵn SecurityContext với quyền INTROSPECT_TOKEN và LOGOUT
     * để @PreAuthorize trên /auth/introspect và /auth/logout pass.
     */
    @BeforeEach
    void setupSecurityContext() {
        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("INTROSPECT_TOKEN"),
                new SimpleGrantedAuthority("LOGOUT")
        );
        Authentication auth =
                new UsernamePasswordAuthenticationToken("admin@linguahub.com", null, authorities);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    // ========================================================================
    // 1. POST /auth/register
    // ========================================================================
    @Test
    void register() throws Exception {
        String email = "test@example.com";

        doNothing().when(authenticationService).register(any(UserCreationRequest.class));

        String body = """
                {
                  "email": "test@example.com",
                  "username": "testuser",
                  "password": "Password123",
                  "fullName": "Test User",
                  "gender": "Male",
                  "dob": "2000-01-01",
                  "phone": "0123456789",
                  "country": "Vietnam",
                  "address": "Hanoi",
                  "bio": "Some bio"
                }
                """;

        ResultActions result = mockMvc.perform(
                post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.message")
                        .value("OTP sent successfully to " + email));

        verify(authenticationService).register(any(UserCreationRequest.class));
    }

    // ========================================================================
    // 2. POST /auth/verify
    // ========================================================================
    @Test
    void verifyEmail() throws Exception {
        String otp = "123456";

        doNothing().when(authenticationService).verifyEmail(eq(otp));

        String body = """
                {
                  "otp": "123456"
                }
                """;

        ResultActions result = mockMvc.perform(
                post("/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.message")
                        .value("Account verified successfully!"));

        verify(authenticationService).verifyEmail(eq(otp));
    }

    // ========================================================================
    // 3. POST /auth/token (login)
    // ========================================================================
    @Test
    void login() throws Exception {
        AuthenticationReponse mockResponse = AuthenticationReponse.builder()
                .accessToken("access-token")
                .refreshToken("refresh-token")
                .authenticated(true)
                .build();

        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("user@example.com", null, List.of()));

        when(authenticationService.authenticate(any(AuthenticationRequest.class)))
                .thenReturn(mockResponse);

        String body = """
                {
                  "username": "user@example.com",
                  "password": "Password123"
                }
                """;

        ResultActions result = mockMvc.perform(
                post("/auth/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.accessToken").value("access-token"))
                .andExpect(jsonPath("$.result.refreshToken").value("refresh-token"))
                .andExpect(jsonPath("$.result.authenticated").value(true));

        verify(authenticationManager).authenticate(any(Authentication.class));
        verify(authenticationService).authenticate(any(AuthenticationRequest.class));
    }

    // ========================================================================
    // 4. POST /auth/refresh
    // ========================================================================
    @Test
    void refreshToken() throws Exception {
        String refreshToken = "refresh-token";

        AuthenticationReponse mockResponse = AuthenticationReponse.builder()
                .accessToken("new-access-token")
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();

        when(authenticationService.refreshToken(eq(refreshToken)))
                .thenReturn(mockResponse);

        String body = """
                {
                  "refreshToken": "refresh-token"
                }
                """;

        ResultActions result = mockMvc.perform(
                post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.message")
                        .value("Access token refreshed successfully."))
                .andExpect(jsonPath("$.result.accessToken").value("new-access-token"))
                .andExpect(jsonPath("$.result.refreshToken").value("refresh-token"));

        verify(authenticationService).refreshToken(eq(refreshToken));
    }

    // ========================================================================
    // 5. POST /auth/introspect
    // ========================================================================
    @Test
    void introspect() throws Exception {
        IntrospectResponse mockResult = IntrospectResponse.builder()
                .valid(true)
                .build();

        when(authenticationService.introspect(any(IntrospectRequest.class)))
                .thenReturn(mockResult);

        String body = """
                {
                  "token": "any-token"
                }
                """;

        ResultActions result = mockMvc.perform(
                post("/auth/introspect")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.valid").value(true));

        verify(authenticationService).introspect(any(IntrospectRequest.class));
    }

    // ========================================================================
    // 6. POST /auth/logout
    // ========================================================================
    @Test
    void logout() throws Exception {
        doNothing().when(authenticationService).logout(any(LogoutRequest.class));

        String body = """
                {
                  "token": "logout-token"
                }
                """;

        ResultActions result = mockMvc.perform(
                post("/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully."));

        verify(authenticationService).logout(any(LogoutRequest.class));
    }

    // ========================================================================
    // 7. POST /auth/forgot-password
    // ========================================================================
    @Test
    void forgotPassword() throws Exception {
        doNothing().when(authenticationService).forgotPassword(any(ForgotPasswordRequest.class));

        String body = """
                {
                  "email": "user@example.com"
                }
                """;

        ResultActions result = mockMvc.perform(
                post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP sent to your email."));

        verify(authenticationService).forgotPassword(any(ForgotPasswordRequest.class));
    }

    // ========================================================================
    // 8. POST /auth/verify-reset-otp
    // ========================================================================
    @Test
    void verifyResetOtp() throws Exception {
        doNothing().when(authenticationService).verifyResetOtp(any(VerifyResetOtpRequest.class));

        String body = """
                {
                  "otp": "123456"
                }
                """;

        ResultActions result = mockMvc.perform(
                post("/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP verified successfully."));

        verify(authenticationService).verifyResetOtp(any(VerifyResetOtpRequest.class));
    }

    // ========================================================================
    // 9. POST /auth/set-new-password
    // ========================================================================
    @Test
    void setNewPassword() throws Exception {
        doNothing().when(authenticationService).setNewPassword(any(SetNewPasswordRequest.class));

        String body = """
                {
                  "newPassword": "NewPassword123",
                  "confirmPassword": "NewPassword123"
                }
                """;

        ResultActions result = mockMvc.perform(
                post("/auth/set-new-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password updated successfully."));

        verify(authenticationService).setNewPassword(any(SetNewPasswordRequest.class));
    }

    // ========================================================================
    // 10. POST /auth/google
    // ========================================================================
    @Test
    void loginWithGoogle() throws Exception {
        String idToken = "google-id-token";

        AuthResponse mockResponse = AuthResponse.builder()
                .token("jwt-token")
                .email("user@example.com")
                .fullName("User Name")
                .avatarURL("https://example.com/avatar.png")
                .build();

        when(googleAuthService.loginWithGoogle(eq(idToken))).thenReturn(mockResponse);

        String body = """
                {
                  "idToken": "google-id-token"
                }
                """;

        ResultActions result = mockMvc.perform(
                post("/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.fullName").value("User Name"))
                .andExpect(jsonPath("$.avatarURL").value("https://example.com/avatar.png"));

        verify(googleAuthService).loginWithGoogle(eq(idToken));
    }
}
