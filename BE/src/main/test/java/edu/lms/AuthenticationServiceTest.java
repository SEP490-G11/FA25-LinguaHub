//package edu.lms;
//
//
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import edu.lms.dto.request.AuthenticationRequest;
//import edu.lms.dto.request.UserCreationRequest;
//import edu.lms.dto.request.VerifyEmailRequest;
//import edu.lms.dto.request.ForgotPasswordRequest;
//import edu.lms.dto.request.VerifyResetOtpRequest;
//import edu.lms.dto.request.SetNewPasswordRequest;
//import org.junit.jupiter.api.*;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
//import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.http.MediaType;
//import org.springframework.test.context.ActiveProfiles;
//import org.springframework.test.web.servlet.MockMvc;
//
//import java.util.Map;
//
//import static org.hamcrest.Matchers.*;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
//
///**
// * 🔥 Integration Test for AuthenticationController
// * Uses real MySQL data (not mocks)
// */
//@SpringBootTest
//@ActiveProfiles("test")
//@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
//@AutoConfigureMockMvc
//@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
//class AuthenticationControllerIntegrationTest {
//
//    @Autowired
//    private MockMvc mockMvc;
//
//    @Autowired
//    private ObjectMapper objectMapper;
//
//    private static String accessToken;
//    private static String refreshToken;
//
//    @Test
//    @Order(1)
//    @DisplayName("POST /auth/register → should send OTP and return 200")
//    void register_shouldSendOtp() throws Exception {
//        UserCreationRequest req = new UserCreationRequest();
//        req.setEmail("newuser@gmail.com");
//        req.setFullName("Integration Test User");
//        req.setPassword("12345678");
//
//        mockMvc.perform(post("/auth/register")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(req)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("OTP")));
//    }
//
//    @Test
//    @Order(2)
//    @DisplayName("POST /auth/verify → should verify OTP and create user")
//    void verify_shouldActivateAccount() throws Exception {
//        VerifyEmailRequest req = new VerifyEmailRequest();
//        req.setOtp("111111");
//
//        mockMvc.perform(post("/auth/verify")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(req)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("verified")));
//    }
//
//    @Test
//    @Order(3)
//    @DisplayName("POST /auth/token → should return JWT tokens for valid user")
//    void login_shouldReturnTokens() throws Exception {
//        AuthenticationRequest req = new AuthenticationRequest();
//        req.setUsername("learner01@gmail.com");
//        req.setPassword("12345678");
//
//        var result = mockMvc.perform(post("/auth/token")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(req)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.authenticated", is(true)))
//                .andExpect(jsonPath("$.accessToken").exists())
//                .andExpect(jsonPath("$.refreshToken").exists())
//                .andReturn();
//
//        Map<String, Object> response = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
//        accessToken = (String) response.get("accessToken");
//        refreshToken = (String) response.get("refreshToken");
//    }
//
//    @Test
//    @Order(4)
//    @DisplayName("POST /auth/token → should fail when password invalid")
//    void login_shouldFailWithWrongPassword() throws Exception {
//        AuthenticationRequest req = new AuthenticationRequest();
//        req.setUsername("learner01@gmail.com");
//        req.setPassword("wrongpass");
//
//        mockMvc.perform(post("/auth/token")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(req)))
//                .andExpect(status().isUnauthorized())
//                .andExpect(jsonPath("$.code", containsString("INVALID_CREDENTIAL")));
//    }
//
//    @Test
//    @Order(5)
//    @DisplayName("POST /auth/introspect → should return valid=true for valid token")
//    void introspect_shouldReturnValidTrue() throws Exception {
//        mockMvc.perform(post("/auth/introspect")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"token\": \"" + accessToken + "\"}"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.valid", is(true)));
//    }
//
//    @Test
//    @Order(6)
//    @DisplayName("POST /auth/refresh → should return new token")
//    void refresh_shouldReturnNewAccessToken() throws Exception {
//        mockMvc.perform(post("/auth/refresh")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"refreshToken\": \"" + refreshToken + "\"}"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.accessToken").exists());
//    }
//
//
//    @Test
//    @Order(7)
//    @DisplayName("POST /auth/logout → should invalidate token")
//    void logout_shouldInvalidateToken() throws Exception {
//        mockMvc.perform(post("/auth/logout")
//                        .header("Authorization", "Bearer " + accessToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("logout")));
//    }
//
//
//    @Test
//    @Order(8)
//    @DisplayName("POST /auth/forgot-password → should send OTP")
//    void forgotPassword_shouldSendOtp() throws Exception {
//        ForgotPasswordRequest req = new ForgotPasswordRequest();
//        req.setEmail("learner01@gmail.com");
//
//        mockMvc.perform(post("/auth/forgot-password")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(req)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("OTP")));
//    }
//
//    @Test
//    @Order(9)
//    @DisplayName("POST /auth/verify-reset-otp → should verify OTP for reset password")
//    void verifyResetOtp_shouldWork() throws Exception {
//        VerifyResetOtpRequest req = new VerifyResetOtpRequest();
//
//        req.setOtp("111111");
//        mockMvc.perform(post("/auth/verify-reset-otp")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(req)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("verified")));
//    }
//
//    @Test
//    @Order(10)
//    @DisplayName("POST /auth/set-new-password → should change password successfully")
//    void setNewPassword_shouldSucceed() throws Exception {
//        SetNewPasswordRequest req = new SetNewPasswordRequest();
//        req.setNewPassword("newpass123");
//
//        mockMvc.perform(post("/auth/set-new-password")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(req)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("changed")));
//    }
//}
