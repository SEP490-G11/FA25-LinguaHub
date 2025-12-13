package edu.lms.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import edu.lms.dto.request.*;
import edu.lms.dto.response.AuthenticationReponse;
import edu.lms.dto.response.IntrospectResponse;
import edu.lms.entity.*;
import edu.lms.enums.Gender;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho AuthenticationService – cover các method:
 * - setSignerKey
 * - register
 * - verifyEmail
 * - authenticate
 * - generateAccessToken
 * - generateRefreshToken
 * - refreshToken
 * - logout
 * - introspect
 * - forgotPassword
 * - verifyResetOtp
 * - setNewPassword
 *
 * Mỗi test case có note UTCID + Type (N/A/B) + Precondition + Input + Expected,
 * bám theo file Excel test specification.
 */
@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    HttpSession session;

    @Mock
    RefreshTokenRepository refreshTokenRepository;

    @Mock
    TutorRepository tutorRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    InvalidatedTokenRepository invalidatedTokenRepository;

    @Mock
    RoleRepository roleRepository;

    @Mock
    VerificationRepository verificationRepository;

    @Mock
    EmailService emailService;

    @InjectMocks
    AuthenticationService authenticationService;

    // Key dùng cho HS512 – phải đủ dài (>= 64 bytes), nếu không Nimbus chỉ hỗ trợ HS256
    // => dùng key 64 ký tự hex cho chắc chắn.
    private static final String TEST_SIGNER_KEY =
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    @BeforeEach
    void setUp() {
        authenticationService.setSignerKey(TEST_SIGNER_KEY);
    }

    // ========================================================================
    // 0. setSignerKey
    // ========================================================================
    /**
     * [NO-UTCID]
     * Type: N (Normal)
     * Precondition: service đã được inject.
     * Input: newKey = "another-key-9876543210"
     * Expected:
     *  - Field SIGNER_KEY trong AuthenticationService được cập nhật = newKey.
     */
    @Test
    @DisplayName("setSignerKey – cập nhật SIGNER_KEY runtime")
    void setSignerKey() throws Exception {
        String newKey = "another-key-9876543210";
        authenticationService.setSignerKey(newKey);

        Field f = AuthenticationService.class.getDeclaredField("SIGNER_KEY");
        f.setAccessible(true);
        String actual = (String) f.get(authenticationService);

        assertEquals(newKey, actual, "SIGNER_KEY phải được cập nhật đúng");
    }

    // ========================================================================
    // 1. register(UserCreationRequest) – theo bảng REGISTER
    // ========================================================================
    @Nested
    @DisplayName("AuthenticationService.register")
    class RegisterTests {

        private UserCreationRequest validRequest() {
            UserCreationRequest req = new UserCreationRequest();
            req.setEmail("Trangnp@gmail.com");
            req.setUsername("trangnp");
            req.setPassword("12345678");
            req.setFullName("Nguyen Phuong Trang");
            req.setGender(Gender.Female);
            req.setDob(LocalDate.of(2003, 8, 30));
            req.setPhone("0987654321");
            req.setCountry("VietNam");
            req.setAddress("Ha Dong");
            req.setBio("bio description");
            return req;
        }

        /**
         * UTCID01 - REGISTER
         * Type: A (Abnormal)
         * Precondition:
         *  - Tồn tại user với email = "Trangnp@gmail.com"
         * Input:
         *  - request.email = "Trangnp@gmail.com"
         * Expected:
         *  - Throw AppException với ErrorCode.EMAIL_EXISTED
         *  - Không gọi findByUsername, không gửi OTP.
         */
        @Test
        @DisplayName("UTCID01 - Email đã tồn tại -> EMAIL_EXISTED")
        void register_emailExisted_shouldThrowEMAIL_EXISTED() {
            UserCreationRequest req = validRequest();

            when(userRepository.findByEmail(req.getEmail()))
                    .thenReturn(Optional.of(new User()));

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.register(req));

            assertEquals(ErrorCode.EMAIL_EXISTED, ex.getErrorcode());
            verify(userRepository).findByEmail(req.getEmail());
            verify(userRepository, never()).findByUsername(anyString());
            verify(roleRepository, never()).findByName(anyString());
            verify(emailService, never()).sendOtp(anyString(), anyString());
        }

        /**
         * UTCID02 - REGISTER
         * Type: A (Abnormal)
         * Precondition:
         *  - Không có user trùng email
         *  - Tồn tại user với username = "trangnp"
         * Input:
         *  - request.username = "trangnp"
         * Expected:
         *  - Throw AppException USER_EXISTED
         *  - Không gửi OTP, không save Verification.
         */
        @Test
        @DisplayName("UTCID02 - Username đã tồn tại -> USER_EXISTED")
        void register_usernameExisted_shouldThrowUSER_EXISTED() {
            UserCreationRequest req = validRequest();

            when(userRepository.findByEmail(req.getEmail()))
                    .thenReturn(Optional.empty());
            when(userRepository.findByUsername(req.getUsername()))
                    .thenReturn(Optional.of(new User()));

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.register(req));

            assertEquals(ErrorCode.USER_EXISTED, ex.getErrorcode());
            verify(roleRepository, never()).findByName(anyString());
            verify(emailService, never()).sendOtp(anyString(), anyString());
        }

        /**
         * UTCID03 - REGISTER
         * Type: A (Abnormal)
         * Precondition:
         *  - Email/username chưa tồn tại
         *  - Role "Learner" không tồn tại trong DB
         * Input:
         *  - request hợp lệ
         * Expected:
         *  - Throw AppException ROLE_NOT_FOUND
         *  - Không gửi OTP, không save Verification.
         */
        @Test
        @DisplayName("UTCID03 - Role Learner không tồn tại -> ROLE_NOT_FOUND")
        void register_roleNotFound_shouldThrowROLE_NOT_FOUND() {
            UserCreationRequest req = validRequest();

            when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByUsername(req.getUsername())).thenReturn(Optional.empty());
            when(roleRepository.findByName("Learner")).thenReturn(Optional.empty());

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.register(req));

            assertEquals(ErrorCode.ROLE_NOT_FOUND, ex.getErrorcode());
            verify(emailService, never()).sendOtp(anyString(), anyString());
        }

        /**
         * UTCID04 - REGISTER
         * Type: A (Abnormal)
         * Precondition:
         *  - Email/username chưa tồn tại
         *  - Role Learner tồn tại
         *  - emailService.sendOtp() ném RuntimeException
         * Input:
         *  - request hợp lệ
         * Expected:
         *  - RuntimeException "Failed to send email"
         *  - Không save Verification.
         */
        @Test
        @DisplayName("UTCID04 - Lỗi gửi OTP -> RuntimeException")
        void register_sendOtpFail_shouldThrowRuntimeException() {
            UserCreationRequest req = validRequest();

            Role role = new Role();
            role.setName("Learner");

            when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByUsername(req.getUsername())).thenReturn(Optional.empty());
            when(roleRepository.findByName("Learner")).thenReturn(Optional.of(role));
            doThrow(new RuntimeException("Failed to send email"))
                    .when(emailService).sendOtp(eq(req.getEmail()), anyString());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> authenticationService.register(req));

            assertTrue(ex.getMessage().contains("Failed to send email"));
            verify(verificationRepository, never()).save(any(Verification.class));
        }

        /**
         * UTCID05 - REGISTER
         * Type: N (Normal)
         * Precondition:
         *  - Email & username chưa tồn tại
         *  - Role Learner tồn tại
         *  - Gửi OTP thành công
         * Input:
         *  - request đầy đủ field hợp lệ
         * Expected:
         *  - Xóa Verification cũ theo email
         *  - Lưu Verification mới
         *  - setAttribute("registerEmail", email)
         */
        @Test
        @DisplayName("UTCID05 - Happy path -> lưu Verification & set session 'registerEmail'")
        void register_success_shouldSaveVerificationAndSetSession() {
            UserCreationRequest req = validRequest();

            Role role = new Role();
            role.setName("Learner");

            when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByUsername(req.getUsername())).thenReturn(Optional.empty());
            when(roleRepository.findByName("Learner")).thenReturn(Optional.of(role));

            doNothing().when(emailService).sendOtp(eq(req.getEmail()), anyString());

            assertDoesNotThrow(() -> authenticationService.register(req));

            verify(verificationRepository).deleteByEmail(req.getEmail());
            verify(verificationRepository).save(any(Verification.class));
            verify(session).setAttribute("registerEmail", req.getEmail());
        }
    }

    // ========================================================================
    // 2. verifyEmail(String otp) – theo bảng VERIFY_EMAIL
    // ========================================================================
    @Nested
    @DisplayName("AuthenticationService.verifyEmail")
    class VerifyEmailTests {

        /**
         * UTCID01 - VERIFY_EMAIL
         * Type: A
         * Precondition:
         *  - session không có "registerEmail"
         * Input:
         *  - otp = "123456"
         * Expected:
         *  - Throw AppException UNAUTHENTICATED
         */
        @Test
        @DisplayName("UTCID01 - Không có registerEmail trong session -> UNAUTHENTICATED")
        void verifyEmail_noEmailInSession_shouldThrowUNAUTHENTICATED() {
            when(session.getAttribute("registerEmail")).thenReturn(null);

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.verifyEmail("123456"));

            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }

        /**
         * UTCID02 - VERIFY_EMAIL
         * Type: A
         * Precondition:
         *  - session.registerEmail = "trang@gmail.com"
         *  - verificationRepository không tìm thấy email + otp
         * Input:
         *  - otp = "123456"
         * Expected:
         *  - Throw AppException INVALID_OTP
         */
        @Test
        @DisplayName("UTCID02 - OTP không tìm thấy -> INVALID_OTP")
        void verifyEmail_invalidOtp_shouldThrowINVALID_OTP() {
            when(session.getAttribute("registerEmail")).thenReturn("trang@gmail.com");
            when(verificationRepository.findByEmailAndOtp("trang@gmail.com", "123456"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.verifyEmail("123456"));

            assertEquals(ErrorCode.INVALID_OTP, ex.getErrorcode());
        }

        /**
         * UTCID03 - VERIFY_EMAIL
         * Type: B (Boundary)
         * Precondition:
         *  - session.registerEmail = email
         *  - Verification.expiresAt = now - 1s (hết hạn)
         * Input:
         *  - otp = "123456"
         * Expected:
         *  - Throw AppException OTP_EXPIRED
         */
        @Test
        @DisplayName("UTCID03 - OTP hết hạn -> OTP_EXPIRED")
        void verifyEmail_expiredOtp_shouldThrowOTP_EXPIRED() {
            String email = "trang@gmail.com";
            when(session.getAttribute("registerEmail")).thenReturn(email);

            Verification ver = new Verification();
            ver.setEmail(email);
            ver.setOtp("123456");
            ver.setExpiresAt(LocalDateTime.now().minusSeconds(1));

            when(verificationRepository.findByEmailAndOtp(email, "123456"))
                    .thenReturn(Optional.of(ver));

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.verifyEmail("123456"));

            assertEquals(ErrorCode.OTP_EXPIRED, ex.getErrorcode());
        }

        /**
         * UTCID04 - VERIFY_EMAIL
         * Type: A
         * Precondition:
         *  - OTP hợp lệ, chưa hết hạn
         *  - Role Learner không tồn tại trong DB
         * Input:
         *  - otp = "123456"
         * Expected:
         *  - Throw AppException ROLE_NOT_FOUND
         */
        @Test
        @DisplayName("UTCID04 - Role Learner không tồn tại -> ROLE_NOT_FOUND")
        void verifyEmail_roleNotFound_shouldThrowROLE_NOT_FOUND() {
            String email = "trang@gmail.com";
            when(session.getAttribute("registerEmail")).thenReturn(email);

            Verification ver = new Verification();
            ver.setEmail(email);
            ver.setUsername("trangnp");
            ver.setFullName("Nguyen Phuong Trang");
            ver.setPasswordHash("hash");
            ver.setGender(Gender.Female);
            ver.setDob(LocalDate.of(2003, 8, 30));
            ver.setPhone("0987654321");
            ver.setCountry("VietNam");
            ver.setAddress("Ha Dong");
            ver.setBio("bio");
            ver.setOtp("123456");
            ver.setExpiresAt(LocalDateTime.now().plusMinutes(5));

            when(verificationRepository.findByEmailAndOtp(email, "123456"))
                    .thenReturn(Optional.of(ver));
            when(roleRepository.findByName("Learner")).thenReturn(Optional.empty());

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.verifyEmail("123456"));

            assertEquals(ErrorCode.ROLE_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * UTCID05 - VERIFY_EMAIL
         * Type: N
         * Precondition:
         *  - OTP hợp lệ, chưa hết hạn
         *  - Role Learner tồn tại
         * Input:
         *  - otp = "123456"
         * Expected:
         *  - Tạo User mới, save user
         *  - Xóa Verification
         *  - removeAttribute("registerEmail")
         */
        @Test
        @DisplayName("UTCID05 - Happy path -> tạo User, xóa Verification, remove session")
        void verifyEmail_success_shouldCreateUserAndCleanup() {
            String email = "trang@gmail.com";
            when(session.getAttribute("registerEmail")).thenReturn(email);

            Verification ver = new Verification();
            ver.setEmail(email);
            ver.setUsername("trangnp");
            ver.setFullName("Nguyen Phuong Trang");
            ver.setPasswordHash("hash");
            ver.setGender(Gender.Female);
            ver.setDob(LocalDate.of(2003, 8, 30));
            ver.setPhone("0987654321");
            ver.setCountry("VietNam");
            ver.setAddress("Ha Dong");
            ver.setBio("bio description");
            ver.setOtp("123456");
            ver.setExpiresAt(LocalDateTime.now().plusMinutes(5));

            Role role = new Role();
            role.setName("Learner");

            when(verificationRepository.findByEmailAndOtp(email, "123456"))
                    .thenReturn(Optional.of(ver));
            when(roleRepository.findByName("Learner")).thenReturn(Optional.of(role));

            assertDoesNotThrow(() -> authenticationService.verifyEmail("123456"));

            verify(userRepository).save(any(User.class));
            verify(verificationRepository).delete(ver);
            verify(session).removeAttribute("registerEmail");
        }
    }

    // ========================================================================
    // 3. authenticate(AuthenticationRequest) – theo bảng AUTHENTICATE
    // ========================================================================
    @Nested
    @DisplayName("AuthenticationService.authenticate")
    class AuthenticateTests {

        private AuthenticationRequest buildAuthRequest(String username, String password) {
            AuthenticationRequest req = new AuthenticationRequest();
            req.setUsername(username);
            req.setPassword(password);
            return req;
        }

        private User buildActiveUser(String usernameOrEmail, String rawPassword) {
            User u = new User();
            u.setUserID(1L);
            u.setEmail(usernameOrEmail);
            u.setUsername(usernameOrEmail);
            u.setIsActive(true);

            Role role = new Role();
            role.setName("Learner");
            role.setPermissions(new HashSet<>()); // không null để tránh NPE
            u.setRole(role);

            // Hash password với BCrypt(10) – giống logic thực tế
            PasswordEncoder encoder = new BCryptPasswordEncoder(10);
            u.setPasswordHash(encoder.encode(rawPassword));
            return u;
        }

        /**
         * UTCID01 - AUTHENTICATE
         * Type: N (Normal)
         * Precondition:
         *  - User tồn tại trong DB, isActive = true
         *  - Password lưu trong DB khớp với input
         * Input:
         *  - username = "nguyentrang"
         *  - password = "abc123456"
         * Expected:
         *  - Trả AuthenticationResponse.authenticated = true
         *  - Có accessToken & refreshToken
         *  - Lưu refreshToken vào DB
         */
        @Test
        @DisplayName("UTCID01 - N: user tồn tại, active, password đúng -> authenticated=true")
        void authenticate_validUser_shouldReturnAuthenticatedTrue() {
            String username = "nguyentrang";
            String password = "abc123456";

            User u = buildActiveUser(username, password);

            when(userRepository.findByEmail(username)).thenReturn(Optional.of(u));

            AuthenticationRequest req = buildAuthRequest(username, password);

            AuthenticationReponse res = authenticationService.authenticate(req);

            assertTrue(res.isAuthenticated());
            assertNotNull(res.getAccessToken());
            assertNotNull(res.getRefreshToken());

            verify(refreshTokenRepository).save(any(RefreshToken.class));
        }

        /**
         * UTCID02 - AUTHENTICATE
         * Type: A (Abnormal)
         * Precondition:
         *  - Không có user trùng email hoặc username
         * Input:
         *  - username = "nguyenanh"
         *  - password = "abc123456"
         * Expected:
         *  - Throw AppException USER_NOT_EXIST
         */
        @Test
        @DisplayName("UTCID02 - A: user không tồn tại (cả email & username) -> USER_NOT_EXIST")
        void authenticate_userNotExist_shouldThrowUSER_NOT_EXIST() {
            String username = "nguyenanh";
            String password = "abc123456";

            when(userRepository.findByEmail(username)).thenReturn(Optional.empty());
            when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

            AuthenticationRequest req = buildAuthRequest(username, password);

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.authenticate(req));

            assertEquals(ErrorCode.USER_NOT_EXIST, ex.getErrorcode());
        }

        /**
         * UTCID03 - AUTHENTICATE
         * Type: A
         * Precondition:
         *  - User tồn tại nhưng isActive = false
         * Input:
         *  - username = "nguyentrang"
         *  - password = "abc123456"
         * Expected:
         *  - Throw AppException UNAUTHENTICATED
         */
        @Test
        @DisplayName("UTCID03 - A: user tồn tại nhưng isActive=false -> UNAUTHENTICATED")
        void authenticate_inactiveUser_shouldThrowUNAUTHENTICATED() {
            String username = "nguyentrang";
            String password = "abc123456";

            User u = buildActiveUser(username, password);
            u.setIsActive(false);

            when(userRepository.findByEmail(username)).thenReturn(Optional.of(u));

            AuthenticationRequest req = buildAuthRequest(username, password);

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.authenticate(req));

            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }

        /**
         * UTCID04 - AUTHENTICATE
         * Type: A
         * Precondition:
         *  - User tồn tại, isActive = true
         *  - Password trong DB KHÔNG khớp với password nhập
         * Input:
         *  - username = "nguyentrang"
         *  - password = "abc123456" (sai)
         * Expected:
         *  - Throw AppException INVALID_PASSWORD
         */
        @Test
        @DisplayName("UTCID04 - A: password sai -> INVALID_PASSWORD")
        void authenticate_wrongPassword_shouldThrowINVALID_PASSWORD() {
            String username = "nguyentrang";

            User u = buildActiveUser(username, "correctPassword");

            when(userRepository.findByEmail(username)).thenReturn(Optional.of(u));

            AuthenticationRequest req = buildAuthRequest(username, "abc123456"); // sai

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.authenticate(req));

            assertEquals(ErrorCode.INVALID_PASSWORD, ex.getErrorcode());
        }

        /**
         * EXTRA CASE (không có riêng dòng trong Excel nhưng quan trọng):
         * Type: N
         * Precondition:
         *  - userRepository.findByEmail(username) = empty
         *  - userRepository.findByUsername(username) trả về user
         * Input:
         *  - username = "tranhai123"
         *  - password = "abc123456"
         * Expected:
         *  - Service fallback sang username
         *  - authenticated = true
         */
        @Test
        @DisplayName("Extra - N: login bằng username (email không match, username match)")
        void authenticate_byUsernameFallback_shouldWork() {
            String username = "tranhai123";
            String password = "abc123456";

            User u = buildActiveUser(username, password);

            when(userRepository.findByEmail(username)).thenReturn(Optional.empty());
            when(userRepository.findByUsername(username)).thenReturn(Optional.of(u));

            AuthenticationRequest req = buildAuthRequest(username, password);

            AuthenticationReponse res = authenticationService.authenticate(req);

            assertTrue(res.isAuthenticated());
            verify(refreshTokenRepository).save(any(RefreshToken.class));
        }

        // Các case password null / "" / "      " (boundary) được validate ở layer DTO/Controller
        // nên không test thêm ở service.
    }

    // ========================================================================
    // 4. generateAccessToken(User)
    // ========================================================================
    @Nested
    @DisplayName("AuthenticationService.generateAccessToken")
    class GenerateAccessTokenTests {

        /**
         * [NO-UTCID] - generateAccessToken cho Learner
         * Type: N
         * Precondition:
         *  - User role = Learner, có 2 permission VIEW_COURSE, MANAGE_PROFILE
         * Input:
         *  - user
         * Expected:
         *  - Token chứa claim:
         *    + subject = email
         *    + role = "Learner"
         *    + userId = 10L
         *    + permissions = ["VIEW_COURSE","MANAGE_PROFILE"]
         */
        @Test
        @DisplayName("N - User role Learner -> claim role, userId, permissions chính xác")
        void generateAccessToken_forLearner_shouldContainClaims() throws Exception {
            User user = new User();
            user.setUserID(10L);
            user.setEmail("learner@linguahub.com");

            Permission p1 = new Permission();
            p1.setName("VIEW_COURSE");
            Permission p2 = new Permission();
            p2.setName("MANAGE_PROFILE");

            Role role = new Role();
            role.setName("Learner");
            role.setPermissions(new HashSet<>(Arrays.asList(p1, p2)));

            user.setRole(role);

            String token = authenticationService.generateAccessToken(user);
            assertNotNull(token);

            SignedJWT jwt = SignedJWT.parse(token);
            JWTClaimsSet claims = jwt.getJWTClaimsSet();

            assertEquals("learner@linguahub.com", claims.getSubject());
            assertEquals("Learner", claims.getStringClaim("role"));
            assertEquals(10L, claims.getLongClaim("userId"));
            List<String> perms = (List<String>) claims.getClaim("permissions");
            assertTrue(perms.contains("VIEW_COURSE"));
            assertTrue(perms.contains("MANAGE_PROFILE"));
        }

        /**
         * [NO-UTCID] - generateAccessToken cho Tutor
         * Type: N
         * Precondition:
         *  - User role = Tutor
         *  - tutorRepository.findByUser(user) trả Tutor với tutorId=99
         * Input:
         *  - user
         * Expected:
         *  - Token chứa claim tutorId = 99
         *  - Có gọi tutorRepository.findByUser(user)
         */
        @Test
        @DisplayName("N - User role Tutor -> phải query tutorRepository & claim tutorId")
        void generateAccessToken_forTutor_shouldAddTutorId() throws Exception {
            User user = new User();
            user.setUserID(20L);
            user.setEmail("tutor@linguahub.com");

            Role role = new Role();
            role.setName("Tutor");
            role.setPermissions(Collections.emptySet());
            user.setRole(role);

            Tutor tutor = new Tutor();
            tutor.setTutorID(99L);

            when(tutorRepository.findByUser(user)).thenReturn(Optional.of(tutor));

            String token = authenticationService.generateAccessToken(user);
            assertNotNull(token);

            SignedJWT jwt = SignedJWT.parse(token);
            JWTClaimsSet claims = jwt.getJWTClaimsSet();

            assertEquals(99L, claims.getLongClaim("tutorId"));
            verify(tutorRepository).findByUser(user);
        }
    }

    // ========================================================================
    // 5. generateRefreshToken(User)
    // ========================================================================
    @Nested
    @DisplayName("AuthenticationService.generateRefreshToken")
    class GenerateRefreshTokenTests {

        /**
         * [NO-UTCID]
         * Type: N
         * Precondition:
         *  - user có email, username
         * Input:
         *  - user
         * Expected:
         *  - JWT có subject = email
         *  - issuer = linguahub.com
         *  - expirationTime > now
         *  - có JWTID khác null
         */
        @Test
        @DisplayName("N - Refresh token có subject & expiration > now")
        void generateRefreshToken_shouldReturnValidJwt() throws Exception {
            User user = new User();
            user.setEmail("user@linguahub.com");
            user.setUsername("username");

            String token = authenticationService.generateRefreshToken(user);
            assertNotNull(token);

            SignedJWT jwt = SignedJWT.parse(token);
            JWTClaimsSet claims = jwt.getJWTClaimsSet();

            assertEquals("user@linguahub.com", claims.getSubject());
            assertEquals("linguahub.com", claims.getIssuer());
            assertTrue(claims.getExpirationTime().after(new Date()));
            assertNotNull(claims.getJWTID());
        }
    }

    // ========================================================================
    // 6. refreshToken(String refreshToken)
    // ========================================================================
    @Nested
    @DisplayName("AuthenticationService.refreshToken")
    class RefreshTokenTests {

        private User buildUserForRefresh() {
            User user = new User();
            user.setUserID(1L);
            user.setEmail("user@linguahub.com");

            Role role = new Role();
            role.setName("Learner");
            role.setPermissions(Collections.emptySet());
            user.setRole(role);

            return user;
        }

        /**
         * [NO-UTCID] - tương đương case N trong Excel
         * Type: N
         * Precondition:
         *  - RefreshToken tồn tại, revoked=false, expiryDate > now
         * Input:
         *  - refreshToken="refresh-token"
         * Expected:
         *  - Trả AuthenticationResponse.authenticated=true
         *  - refreshToken giữ nguyên
         *  - accessToken mới khác null
         */
        @Test
        @DisplayName("N - refreshToken hợp lệ -> trả về accessToken mới")
        void refreshToken_valid_shouldReturnNewAccessToken() {
            String refreshToken = "refresh-token";

            User user = buildUserForRefresh();

            RefreshToken rt = new RefreshToken();
            rt.setToken(refreshToken);
            rt.setUser(user);
            rt.setRevoked(false);
            rt.setExpiryDate(Instant.now().plus(7, ChronoUnit.DAYS));

            when(refreshTokenRepository.findByToken(refreshToken))
                    .thenReturn(Optional.of(rt));

            AuthenticationReponse res = authenticationService.refreshToken(refreshToken);

            assertTrue(res.isAuthenticated());
            assertEquals(refreshToken, res.getRefreshToken());
            assertNotNull(res.getAccessToken());
        }

        /**
         * [NO-UTCID] - tương đương case A: token không tồn tại
         * Type: A
         * Precondition:
         *  - refreshTokenRepository.findByToken("invalid") = empty
         * Input:
         *  - "invalid"
         * Expected:
         *  - Throw AppException UNAUTHENTICATED
         */
        @Test
        @DisplayName("A - refreshToken không tồn tại -> UNAUTHENTICATED")
        void refreshToken_notFound_shouldThrowUNAUTHENTICATED() {
            when(refreshTokenRepository.findByToken("invalid"))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.refreshToken("invalid"));

            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }

        /**
         * [NO-UTCID] - tương đương case A: token revoked
         * Type: A
         * Precondition:
         *  - RefreshToken.revoked = true, expiryDate > now
         * Input:
         *  - token="revoked-token"
         * Expected:
         *  - Throw AppException UNAUTHENTICATED
         */
        @Test
        @DisplayName("A - refreshToken revoked -> UNAUTHENTICATED")
        void refreshToken_revoked_shouldThrowUNAUTHENTICATED() {
            String token = "revoked-token";

            RefreshToken rt = new RefreshToken();
            rt.setToken(token);
            rt.setRevoked(true);
            rt.setExpiryDate(Instant.now().plus(1, ChronoUnit.DAYS));

            when(refreshTokenRepository.findByToken(token))
                    .thenReturn(Optional.of(rt));

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.refreshToken(token));

            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }

        /**
         * [NO-UTCID] - tương đương case B: token hết hạn
         * Type: B (Boundary)
         * Precondition:
         *  - RefreshToken.revoked=false, expiryDate < now
         * Input:
         *  - token="expired-token"
         * Expected:
         *  - Throw AppException UNAUTHENTICATED
         */
        @Test
        @DisplayName("B - refreshToken hết hạn -> UNAUTHENTICATED")
        void refreshToken_expired_shouldThrowUNAUTHENTICATED() {
            String token = "expired-token";

            RefreshToken rt = new RefreshToken();
            rt.setToken(token);
            rt.setRevoked(false);
            rt.setExpiryDate(Instant.now().minus(1, ChronoUnit.MINUTES));

            when(refreshTokenRepository.findByToken(token))
                    .thenReturn(Optional.of(rt));

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.refreshToken(token));

            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }
    }

    // ========================================================================
    // 7. logout(LogoutRequest)
    // ========================================================================
    @Nested
    @DisplayName("AuthenticationService.logout")
    class LogoutTests {

        private String createSignedJwt(String jti, Instant exp) throws JOSEException {
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .jwtID(jti)
                    .expirationTime(Date.from(exp))
                    .build();

            JWSObject jwsObject = new JWSObject(header, new Payload(claims.toJSONObject()));
            jwsObject.sign(new MACSigner(TEST_SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        }

        /**
         * [NO-UTCID]
         * Type: N
         * Precondition:
         *  - Token hợp lệ (chưa hết hạn)
         *  - invalidatedTokenRepository.existsById(jti) = false
         *  - refreshTokenRepository.findByToken(token) trả RefreshToken.revoked=false
         * Input:
         *  - LogoutRequest.token = signedJWT
         * Expected:
         *  - Lưu InvalidatedToken với id=jti
         *  - RefreshToken được set revoked=true và save lại
         */
        @Test
        @DisplayName("N - Token hợp lệ -> lưu InvalidatedToken & revoke refreshToken nếu có")
        void logout_validToken_shouldInvalidateAndRevoke() throws Exception {
            String jti = "jit-123";
            String token = createSignedJwt(jti, Instant.now().plus(1, ChronoUnit.HOURS));

            // verifyToken sẽ check invalidatedTokenRepository.existsById -> false
            when(invalidatedTokenRepository.existsById(jti)).thenReturn(false);

            RefreshToken rt = new RefreshToken();
            rt.setToken(token);
            rt.setRevoked(false);

            when(refreshTokenRepository.findByToken(token))
                    .thenReturn(Optional.of(rt));

            LogoutRequest req = new LogoutRequest();
            req.setToken(token);

            authenticationService.logout(req);

            verify(invalidatedTokenRepository).save(any(InvalidatedToken.class));
            verify(refreshTokenRepository).findByToken(token);
            verify(refreshTokenRepository).save(argThat(saved -> saved.isRevoked()));
        }
    }

    // ========================================================================
    // 8. introspect(IntrospectRequest)
    // ========================================================================
    @Nested
    @DisplayName("AuthenticationService.introspect")
    class IntrospectTests {

        private String createJwt(String jti, Instant exp) throws JOSEException {
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .jwtID(jti)
                    .expirationTime(Date.from(exp))
                    .build();

            JWSObject jwsObject = new JWSObject(header, new Payload(claims.toJSONObject()));
            jwsObject.sign(new MACSigner(TEST_SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        }

        /**
         * [NO-UTCID]
         * Type: N
         * Precondition:
         *  - Token hợp lệ, chưa hết hạn
         *  - invalidatedTokenRepository.existsById(jti) = false
         * Input:
         *  - IntrospectRequest.token = token
         * Expected:
         *  - IntrospectResponse.valid = true
         */
        @Test
        @DisplayName("N - Token hợp lệ & chưa bị blacklist -> valid=true")
        void introspect_validToken_shouldReturnValidTrue() throws Exception {
            String jti = "jit-ok";
            String token = createJwt(jti, Instant.now().plus(1, ChronoUnit.HOURS));

            when(invalidatedTokenRepository.existsById(jti)).thenReturn(false);

            IntrospectRequest req = new IntrospectRequest();
            req.setToken(token);

            IntrospectResponse res = authenticationService.introspect(req);

            assertTrue(res.isValid());
        }

        /**
         * [NO-UTCID]
         * Type: A
         * Precondition:
         *  - Token hợp lệ về chữ ký nhưng jti đã tồn tại trong invalidatedTokenRepository
         * Input:
         *  - IntrospectRequest.token = token
         * Expected:
         *  - IntrospectResponse.valid = false (do verifyToken ném AppException)
         */
        @Test
        @DisplayName("A - Token đã bị blacklist -> valid=false")
        void introspect_blacklistedToken_shouldReturnValidFalse() throws Exception {
            String jti = "jit-blacklist";
            String token = createJwt(jti, Instant.now().plus(1, ChronoUnit.HOURS));

            when(invalidatedTokenRepository.existsById(jti)).thenReturn(true);

            IntrospectRequest req = new IntrospectRequest();
            req.setToken(token);

            IntrospectResponse res = authenticationService.introspect(req);

            assertFalse(res.isValid());
        }
    }

    // ========================================================================
    // 9. forgotPassword(ForgotPasswordRequest) – theo bảng FORGOT_PASSWORD
    // ========================================================================
    @Nested
    @DisplayName("AuthenticationService.forgotPassword")
    class ForgotPasswordTests {

        /**
         * UTCID01 - FORGOT_PASSWORD
         * Type: A
         * Precondition:
         *  - userRepository.findByEmail(email) = empty
         * Input:
         *  - email = "hailt2003@gmail.com"
         * Expected:
         *  - Throw AppException USER_NOT_EXIST
         */
        @Test
        @DisplayName("UTCID01 - A: user không tồn tại -> USER_NOT_EXIST")
        void forgotPassword_userNotExist_shouldThrowUSER_NOT_EXIST() {
            ForgotPasswordRequest req = new ForgotPasswordRequest();
            req.setEmail("hailt2003@gmail.com");

            when(userRepository.findByEmail(req.getEmail()))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.forgotPassword(req));

            assertEquals(ErrorCode.USER_NOT_EXIST, ex.getErrorcode());
        }

        /**
         * UTCID02 - FORGOT_PASSWORD
         * Type: A
         * Precondition:
         *  - User tồn tại
         *  - emailService.sendOtp() ném RuntimeException
         * Input:
         *  - email = "npt2003@gmail.com"
         * Expected:
         *  - RuntimeException "Mail error"
         *  - Không save Verification
         */
        @Test
        @DisplayName("UTCID02 - A: lỗi gửi OTP -> RuntimeException")
        void forgotPassword_sendOtpFail_shouldThrowRuntimeException() {
            ForgotPasswordRequest req = new ForgotPasswordRequest();
            req.setEmail("npt2003@gmail.com");

            User user = new User();
            user.setEmail(req.getEmail());
            when(userRepository.findByEmail(req.getEmail()))
                    .thenReturn(Optional.of(user));

            doThrow(new RuntimeException("Mail error"))
                    .when(emailService).sendOtp(eq(req.getEmail()), anyString());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> authenticationService.forgotPassword(req));

            assertTrue(ex.getMessage().contains("Mail error"));
        }

        /**
         * UTCID03 - FORGOT_PASSWORD
         * Type: N
         * Precondition:
         *  - User tồn tại trong DB
         *  - Gửi OTP thành công
         * Input:
         *  - email = "npt2003@gmail.com"
         * Expected:
         *  - Xóa Verification cũ theo email
         *  - Lưu Verification mới
         *  - setAttribute("resetEmail", email)
         */
        @Test
        @DisplayName("UTCID03 - N: user tồn tại -> lưu Verification & set resetEmail")
        void forgotPassword_success_shouldSaveVerificationAndSetSession() {
            ForgotPasswordRequest req = new ForgotPasswordRequest();
            req.setEmail("npt2003@gmail.com");

            User user = new User();
            user.setEmail(req.getEmail());

            when(userRepository.findByEmail(req.getEmail()))
                    .thenReturn(Optional.of(user));

            doNothing().when(emailService).sendOtp(eq(req.getEmail()), anyString());

            assertDoesNotThrow(() -> authenticationService.forgotPassword(req));

            verify(verificationRepository).deleteByEmail(req.getEmail());
            verify(verificationRepository).save(any(Verification.class));
            verify(session).setAttribute("resetEmail", req.getEmail());
        }
    }

    // ========================================================================
    // 10. verifyResetOtp(VerifyResetOtpRequest) – theo bảng VERIFY_RESET_OTP
    // ========================================================================
    @Nested
    @DisplayName("AuthenticationService.verifyResetOtp")
    class VerifyResetOtpTests {

        /**
         * UTCID01 - VERIFY_RESET_OTP
         * Type: A
         * Precondition:
         *  - session.resetEmail = null
         * Input:
         *  - otp = "123456"
         * Expected:
         *  - Throw AppException UNAUTHENTICATED
         */
        @Test
        @DisplayName("UTCID01 - A: không có resetEmail trong session -> UNAUTHENTICATED")
        void verifyResetOtp_noResetEmail_shouldThrowUNAUTHENTICATED() {
            when(session.getAttribute("resetEmail")).thenReturn(null);

            VerifyResetOtpRequest req = new VerifyResetOtpRequest();
            req.setOtp("123456");

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.verifyResetOtp(req));

            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }

        /**
         * UTCID02 - VERIFY_RESET_OTP
         * Type: A
         * Precondition:
         *  - session.resetEmail = "npt2003@gmail.com"
         *  - verificationRepository.findByEmailAndOtp(email, otp) = empty
         * Input:
         *  - otp = "123456"
         * Expected:
         *  - Throw AppException INVALID_OTP
         */
        @Test
        @DisplayName("UTCID02 - A: OTP không khớp -> INVALID_OTP")
        void verifyResetOtp_invalidOtp_shouldThrowINVALID_OTP() {
            when(session.getAttribute("resetEmail")).thenReturn("npt2003@gmail.com");

            when(verificationRepository.findByEmailAndOtp("npt2003@gmail.com", "123456"))
                    .thenReturn(Optional.empty());

            VerifyResetOtpRequest req = new VerifyResetOtpRequest();
            req.setOtp("123456");

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.verifyResetOtp(req));

            assertEquals(ErrorCode.INVALID_OTP, ex.getErrorcode());
        }

        /**
         * UTCID03 - VERIFY_RESET_OTP
         * Type: B (Boundary)
         * Precondition:
         *  - session.resetEmail = email
         *  - Verification.expiresAt = now - 1s
         * Input:
         *  - otp = "123456"
         * Expected:
         *  - Throw AppException OTP_EXPIRED
         */
        @Test
        @DisplayName("UTCID03 - B: OTP hết hạn -> OTP_EXPIRED")
        void verifyResetOtp_expiredOtp_shouldThrowOTP_EXPIRED() {
            String email = "npt2003@gmail.com";
            when(session.getAttribute("resetEmail")).thenReturn(email);

            Verification ver = new Verification();
            ver.setEmail(email);
            ver.setOtp("123456");
            ver.setExpiresAt(LocalDateTime.now().minusSeconds(1));

            when(verificationRepository.findByEmailAndOtp(email, "123456"))
                    .thenReturn(Optional.of(ver));

            VerifyResetOtpRequest req = new VerifyResetOtpRequest();
            req.setOtp("123456");

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.verifyResetOtp(req));

            assertEquals(ErrorCode.OTP_EXPIRED, ex.getErrorcode());
        }

        /**
         * UTCID04 - VERIFY_RESET_OTP
         * Type: N
         * Precondition:
         *  - session.resetEmail = email
         *  - Verification hợp lệ, chưa hết hạn
         * Input:
         *  - otp = "123456"
         * Expected:
         *  - session.setAttribute("resetOtp", "123456")
         */
        @Test
        @DisplayName("UTCID04 - N: OTP hợp lệ -> set session resetOtp")
        void verifyResetOtp_success_shouldSetResetOtp() {
            String email = "npt2003@gmail.com";
            when(session.getAttribute("resetEmail")).thenReturn(email);

            Verification ver = new Verification();
            ver.setEmail(email);
            ver.setOtp("123456");
            ver.setExpiresAt(LocalDateTime.now().plusMinutes(5));

            when(verificationRepository.findByEmailAndOtp(email, "123456"))
                    .thenReturn(Optional.of(ver));

            VerifyResetOtpRequest req = new VerifyResetOtpRequest();
            req.setOtp("123456");

            assertDoesNotThrow(() -> authenticationService.verifyResetOtp(req));

            verify(session).setAttribute("resetOtp", "123456");
        }
    }

    // ========================================================================
    // 11. setNewPassword(SetNewPasswordRequest) – theo bảng SET_NEW_PASSWORD
    // ========================================================================
    @Nested
    @DisplayName("AuthenticationService.setNewPassword")
    class SetNewPasswordTests {

        /**
         * UTCID01 - SET_NEW_PASSWORD
         * Type: A
         * Precondition:
         *  - session.resetEmail = null
         *  - session.resetOtp = null
         * Input:
         *  - newPassword = "abc12345"
         *  - confirmPassword = "abc12345"
         * Expected:
         *  - Throw AppException UNAUTHENTICATED
         */
        @Test
        @DisplayName("UTCID01 - A: thiếu resetEmail / resetOtp -> UNAUTHENTICATED")
        void setNewPassword_missingSession_shouldThrowUNAUTHENTICATED() {
            when(session.getAttribute("resetEmail")).thenReturn(null);
            when(session.getAttribute("resetOtp")).thenReturn(null);

            SetNewPasswordRequest req = new SetNewPasswordRequest();
            req.setNewPassword("abc12345");
            req.setConfirmPassword("abc12345");

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.setNewPassword(req));

            assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorcode());
        }

        /**
         * UTCID02 - SET_NEW_PASSWORD
         * Type: A
         * Precondition:
         *  - session.resetEmail = email
         *  - session.resetOtp = "123456"
         *  - verificationRepository.findByEmailAndOtp(email,"123456") = empty
         * Input:
         *  - newPassword = "abc12345"
         *  - confirmPassword = "abc12345"
         * Expected:
         *  - Throw AppException INVALID_OTP
         */
        @Test
        @DisplayName("UTCID02 - A: Verification không tồn tại -> INVALID_OTP")
        void setNewPassword_invalidOtp_shouldThrowINVALID_OTP() {
            when(session.getAttribute("resetEmail")).thenReturn("npt2003@gmail.com");
            when(session.getAttribute("resetOtp")).thenReturn("123456");

            when(verificationRepository.findByEmailAndOtp("npt2003@gmail.com", "123456"))
                    .thenReturn(Optional.empty());

            SetNewPasswordRequest req = new SetNewPasswordRequest();
            req.setNewPassword("abc12345");
            req.setConfirmPassword("abc12345");

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.setNewPassword(req));

            assertEquals(ErrorCode.INVALID_OTP, ex.getErrorcode());
        }

        /**
         * UTCID03 - SET_NEW_PASSWORD
         * Type: A
         * Precondition:
         *  - session.resetEmail = email
         *  - session.resetOtp = "123456"
         *  - Verification tồn tại, chưa hết hạn
         * Input:
         *  - newPassword = "abc12345"
         *  - confirmPassword = "Password2" (không khớp)
         * Expected:
         *  - Throw AppException PASSWORD_NOT_MATCH
         */
        @Test
        @DisplayName("UTCID03 - A: newPassword != confirmPassword -> PASSWORD_NOT_MATCH")
        void setNewPassword_notMatch_shouldThrowPASSWORD_NOT_MATCH() {
            String email = "npt2003@gmail.com";
            when(session.getAttribute("resetEmail")).thenReturn(email);
            when(session.getAttribute("resetOtp")).thenReturn("123456");

            Verification ver = new Verification();
            ver.setEmail(email);
            ver.setOtp("123456");
            ver.setExpiresAt(LocalDateTime.now().plusMinutes(5));

            when(verificationRepository.findByEmailAndOtp(email, "123456"))
                    .thenReturn(Optional.of(ver));

            SetNewPasswordRequest req = new SetNewPasswordRequest();
            req.setNewPassword("abc12345");
            req.setConfirmPassword("Password2");

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.setNewPassword(req));

            assertEquals(ErrorCode.PASSWORD_NOT_MATCH, ex.getErrorcode());
        }

        /**
         * UTCID04 - SET_NEW_PASSWORD
         * Type: A
         * Precondition:
         *  - session.resetEmail = email
         *  - session.resetOtp = "123456"
         *  - Verification tồn tại, chưa hết hạn
         *  - userRepository.findByEmail(email) = empty
         * Input:
         *  - newPassword = "abc12345"
         *  - confirmPassword = "abc12345"
         * Expected:
         *  - Throw AppException USER_NOT_EXIST
         */
        @Test
        @DisplayName("UTCID04 - A: user không tồn tại -> USER_NOT_EXIST")
        void setNewPassword_userNotFound_shouldThrowUSER_NOT_EXIST() {
            String email = "npt2003@gmail.com";
            when(session.getAttribute("resetEmail")).thenReturn(email);
            when(session.getAttribute("resetOtp")).thenReturn("123456");

            Verification ver = new Verification();
            ver.setEmail(email);
            ver.setOtp("123456");
            ver.setExpiresAt(LocalDateTime.now().plusMinutes(5));

            when(verificationRepository.findByEmailAndOtp(email, "123456"))
                    .thenReturn(Optional.of(ver));
            when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

            SetNewPasswordRequest req = new SetNewPasswordRequest();
            req.setNewPassword("abc12345");
            req.setConfirmPassword("abc12345");

            AppException ex = assertThrows(AppException.class,
                    () -> authenticationService.setNewPassword(req));

            assertEquals(ErrorCode.USER_NOT_EXIST, ex.getErrorcode());
        }

        /**
         * UTCID05 - SET_NEW_PASSWORD
         * Type: N
         * Precondition:
         *  - session.resetEmail = email
         *  - session.resetOtp = "123456"
         *  - Verification hợp lệ
         *  - User tồn tại
         * Input:
         *  - newPassword = "abc12345"
         *  - confirmPassword = "abc12345"
         * Expected:
         *  - User.passwordHash được cập nhật
         *  - verificationRepository.delete(verification)
         *  - removeAttribute("resetEmail"), removeAttribute("resetOtp")
         */
        @Test
        @DisplayName("UTCID05 - N: Happy path -> update password & clear session")
        void setNewPassword_success_shouldUpdatePasswordAndClearSession() {
            String email = "npt2003@gmail.com";
            when(session.getAttribute("resetEmail")).thenReturn(email);
            when(session.getAttribute("resetOtp")).thenReturn("123456");

            Verification ver = new Verification();
            ver.setEmail(email);
            ver.setOtp("123456");
            ver.setExpiresAt(LocalDateTime.now().plusMinutes(5));

            User user = new User();
            user.setEmail(email);
            user.setPasswordHash("old-hash");

            when(verificationRepository.findByEmailAndOtp(email, "123456"))
                    .thenReturn(Optional.of(ver));
            when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

            SetNewPasswordRequest req = new SetNewPasswordRequest();
            req.setNewPassword("abc12345");
            req.setConfirmPassword("abc12345");

            assertDoesNotThrow(() -> authenticationService.setNewPassword(req));

            verify(userRepository).save(any(User.class));
            verify(verificationRepository).delete(ver);
            verify(session).removeAttribute("resetEmail");
            verify(session).removeAttribute("resetOtp");
        }
    }
}
