package edu.lms.service;

import edu.lms.dto.request.ChangePasswordRequest;
import edu.lms.dto.request.UserCreationRequest;
import edu.lms.dto.response.UserResponse;
import edu.lms.entity.Role;
import edu.lms.entity.User;
import edu.lms.enums.Gender;
import edu.lms.exception.AppException;
import edu.lms.mapper.UserMapping;
import edu.lms.repository.RoleRepository;
import edu.lms.repository.UserRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Code Module : UserService
 * Implementation : UserService
 *
 * Covered methods:
 *  - createUser(UserCreationRequest)
 *  - getUsers()
 *  - getUser(Long id)
 *  - getMyInfo()
 *  - updateUserFields(Long userID, Map<String,Object> updates)
 *  - deleteUser(Long userId)
 *  - changePassword(ChangePasswordRequest)
 *
 * Lưu ý:
 *  - AppException của hệ thống không set message => getMessage() có thể null
 *    → Trong test chỉ assertThrows(AppException.class), không kiểm tra message.
 */
@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class UserServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    RoleRepository roleRepository;

    @Mock
    UserMapping userMapping;

    @Mock
    PasswordEncoder passwordEncoder;

    @InjectMocks
    UserService userService;

    // =========================================================
    // Helper chung
    // =========================================================

    private UserCreationRequest buildValidUserCreationRequest() {
        return UserCreationRequest.builder()
                .email("test@mail.com")
                .username("testuser")
                .password("Password123")
                .fullName("Test User")
                .gender(Gender.Male)
                .dob(LocalDate.of(2000, 1, 1))
                .phone("0123456789")
                .country("Vietnam")
                .address("Hanoi")
                .bio("This is a test bio")
                .build();
    }

    private void setAuthenticationPrincipal(String principal) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ========================================================================
    // 1. createUser
    // ========================================================================
    @Nested
    @DisplayName("UserService.createUser")
    class CreateUserTests {

        /**
         * UTCID01 - createUser
         * Type: A
         * Role "Learner" không tồn tại -> AppException(USER_NOT_EXIST)
         */
        @Test
        @DisplayName("UTCID01 - A: Role 'Learner' không tồn tại")
        void createUser_learnerRoleNotFound_shouldThrow() {
            UserCreationRequest request = buildValidUserCreationRequest();
            User user = new User();

            when(userMapping.toUser(request)).thenReturn(user);
            when(roleRepository.findById("Learner")).thenReturn(Optional.empty());

            assertThrows(AppException.class, () -> userService.createUser(request));

            verify(userRepository, never()).save(any(User.class));
        }

        /**
         * UTCID02 - createUser
         * Type: A
         * Duplicate user (DataIntegrityViolationException) -> AppException(USER_EXISTED)
         */
        @Test
        @DisplayName("UTCID02 - A: Duplicate (DataIntegrityViolationException)")
        void createUser_duplicateUser_shouldThrow() {
            UserCreationRequest request = buildValidUserCreationRequest();

            User user = new User();
            Role learnerRole = new Role();
            learnerRole.setName("Learner");

            when(userMapping.toUser(request)).thenReturn(user);
            when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPW");
            when(roleRepository.findById("Learner")).thenReturn(Optional.of(learnerRole));
            when(userRepository.save(any(User.class)))
                    .thenThrow(new DataIntegrityViolationException("duplicate"));

            assertThrows(AppException.class, () -> userService.createUser(request));

            verify(userRepository, times(1)).save(user);
        }

        /**
         * UTCID03 - createUser
         * Type: N
         * Happy path
         */
        @Test
        @DisplayName("UTCID03 - N: Happy path -> create user thành công")
        void createUser_happyPath_shouldReturnUserResponse() {
            UserCreationRequest request = buildValidUserCreationRequest();

            User user = new User();
            user.setUserID(1L);
            Role learnerRole = new Role();
            learnerRole.setName("Learner");

            UserResponse response = UserResponse.builder()
                    .userID(1L)
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .role("Learner")
                    .build();

            when(userMapping.toUser(request)).thenReturn(user);
            when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPW");
            when(roleRepository.findById("Learner")).thenReturn(Optional.of(learnerRole));
            when(userRepository.save(user)).thenReturn(user);
            when(userMapping.toUserResponse(user)).thenReturn(response);

            UserResponse result = userService.createUser(request);

            assertEquals(1L, result.getUserID());
            assertEquals("Learner", result.getRole());
            assertEquals("encodedPW", user.getPasswordHash());
            assertEquals("Learner", user.getRole().getName());

            verify(userRepository, times(1)).save(user);
            verify(userMapping, times(1)).toUserResponse(user);
        }
    }

    // ========================================================================
    // 2. getUsers
    // ========================================================================
    @Nested
    @DisplayName("UserService.getUsers")
    class GetUsersTests {

        /**
         * UTCID01 - getUsers
         * Type: N
         */
        @Test
        @DisplayName("UTCID01 - N: Lấy danh sách user thành công")
        void getUsers_shouldReturnAllUsers() {
            User u1 = new User();
            u1.setUserID(1L);
            User u2 = new User();
            u2.setUserID(2L);

            UserResponse r1 = UserResponse.builder().userID(1L).build();
            UserResponse r2 = UserResponse.builder().userID(2L).build();

            when(userRepository.findAll()).thenReturn(List.of(u1, u2));
            when(userMapping.toUserResponse(u1)).thenReturn(r1);
            when(userMapping.toUserResponse(u2)).thenReturn(r2);

            List<UserResponse> result = userService.getUsers();

            assertEquals(2, result.size());
            assertEquals(1L, result.get(0).getUserID());
            assertEquals(2L, result.get(1).getUserID());
        }

        /**
         * UTCID02 - getUsers
         * Type: N
         */
        @Test
        @DisplayName("UTCID02 - N: Không có user -> trả về list rỗng")
        void getUsers_empty_shouldReturnEmptyList() {
            when(userRepository.findAll()).thenReturn(List.of());

            List<UserResponse> result = userService.getUsers();

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // ========================================================================
    // 3. getUser
    // ========================================================================
    @Nested
    @DisplayName("UserService.getUser")
    class GetUserTests {

        /**
         * UTCID01 - getUser
         * Type: A
         */
        @Test
        @DisplayName("UTCID01 - A: User không tồn tại")
        void getUser_userNotFound_shouldThrow() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class, () -> userService.getUser(1L));
        }

        /**
         * UTCID02 - getUser
         * Type: N
         */
        @Test
        @DisplayName("UTCID02 - N: Lấy user theo ID thành công")
        void getUser_happyPath_shouldReturnUserResponse() {
            User user = new User();
            user.setUserID(2L);

            UserResponse response = UserResponse.builder()
                    .userID(2L)
                    .email("u2@mail.com")
                    .build();

            when(userRepository.findById(2L)).thenReturn(Optional.of(user));
            when(userMapping.toUserResponse(user)).thenReturn(response);

            UserResponse result = userService.getUser(2L);

            assertEquals(2L, result.getUserID());
            assertEquals("u2@mail.com", result.getEmail());
        }
    }

    // ========================================================================
    // 4. getMyInfo
    // ========================================================================
    @Nested
    @DisplayName("UserService.getMyInfo")
    class GetMyInfoTests {

        /**
         * UTCID01 - getMyInfo
         * Type: A
         */
        @Test
        @DisplayName("UTCID01 - A: Principal không map được user")
        void getMyInfo_userNotFoundByEmailAndUsername_shouldThrow() {
            String principal = "user_not_found";
            setAuthenticationPrincipal(principal);

            when(userRepository.findByEmail(principal)).thenReturn(Optional.empty());
            when(userRepository.findByUsername(principal)).thenReturn(Optional.empty());

            assertThrows(AppException.class, () -> userService.getMyInfo());
        }

        /**
         * UTCID02 - getMyInfo
         * Type: N
         */
        @Test
        @DisplayName("UTCID02 - N: Tìm user bằng email principal")
        void getMyInfo_findByEmail_shouldReturnUserResponse() {
            String principal = "email@mail.com";
            setAuthenticationPrincipal(principal);

            User user = new User();
            user.setUserID(10L);
            user.setEmail(principal);

            UserResponse response = UserResponse.builder()
                    .userID(10L)
                    .email(principal)
                    .build();

            when(userRepository.findByEmail(principal)).thenReturn(Optional.of(user));
            when(userMapping.toUserResponse(user)).thenReturn(response);

            UserResponse result = userService.getMyInfo();

            assertEquals(10L, result.getUserID());
            assertEquals(principal, result.getEmail());
        }

        /**
         * UTCID03 - getMyInfo
         * Type: N
         */
        @Test
        @DisplayName("UTCID03 - N: Email không có, tìm bằng username")
        void getMyInfo_findByUsername_shouldReturnUserResponse() {
            String principal = "username123";
            setAuthenticationPrincipal(principal);

            User user = new User();
            user.setUserID(11L);
            user.setUsername(principal);

            UserResponse response = UserResponse.builder()
                    .userID(11L)
                    .username(principal)
                    .build();

            when(userRepository.findByEmail(principal)).thenReturn(Optional.empty());
            when(userRepository.findByUsername(principal)).thenReturn(Optional.of(user));
            when(userMapping.toUserResponse(user)).thenReturn(response);

            UserResponse result = userService.getMyInfo();

            assertEquals(11L, result.getUserID());
            assertEquals(principal, result.getUsername());
        }
    }

    // ========================================================================
    // 5. updateUserFields
    // ========================================================================
    @Nested
    @DisplayName("UserService.updateUserFields")
    class UpdateUserFieldsTests {

        /**
         * UTCID01 - updateUserFields
         * Type: A
         */
        @Test
        @DisplayName("UTCID01 - A: User không tồn tại")
        void updateUserFields_userNotFound_shouldThrow() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            Map<String, Object> updates = Map.of("fullName", "New Name");

            assertThrows(AppException.class,
                    () -> userService.updateUserFields(1L, updates));
        }

        /**
         * UTCID02 - updateUserFields
         * Type: N
         */
        @Test
        @DisplayName("UTCID02 - N: Update một số field hợp lệ")
        void updateUserFields_validFields_shouldUpdateAndReturnResponse() {
            User user = new User();
            user.setUserID(2L);
            user.setFullName("Old Name");
            user.setCountry("Old Country");

            Map<String, Object> updates = new HashMap<>();
            updates.put("fullName", "New Name");
            updates.put("country", "Vietnam");
            updates.put("dob", "2001-02-03");
            updates.put("gender", Gender.Female);

            UserResponse response = UserResponse.builder()
                    .userID(2L)
                    .fullName("New Name")
                    .country("Vietnam")
                    .gender("Female")
                    .dob(LocalDate.parse("2001-02-03"))
                    .build();

            when(userRepository.findById(2L)).thenReturn(Optional.of(user));
            when(userRepository.save(user)).thenReturn(user);
            when(userMapping.toUserResponse(user)).thenReturn(response);

            UserResponse result = userService.updateUserFields(2L, updates);

            assertEquals("New Name", user.getFullName());
            assertEquals("Vietnam", user.getCountry());
            assertEquals(LocalDate.parse("2001-02-03"), user.getDob());
            assertEquals(Gender.Female, user.getGender());
            assertEquals("New Name", result.getFullName());
            assertEquals("Vietnam", result.getCountry());

            verify(userRepository, times(1)).save(user);
        }

        /**
         * UTCID03 - updateUserFields
         * Type: A
         */
        @Test
        @DisplayName("UTCID03 - A: Field không được hỗ trợ -> RuntimeException")
        void updateUserFields_unknownField_shouldThrowRuntimeException() {
            User user = new User();
            user.setUserID(3L);

            when(userRepository.findById(3L)).thenReturn(Optional.of(user));

            Map<String, Object> updates = Map.of("unknownField", "value");

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> userService.updateUserFields(3L, updates));

            assertTrue(ex.getMessage().contains("unknownField")
                    && ex.getMessage().contains("not updatable"));

            verify(userRepository, never()).save(any(User.class));
        }
    }

    // ========================================================================
    // 6. deleteUser – soft delete
    // ========================================================================
    @Nested
    @DisplayName("UserService.deleteUser")
    class DeleteUserTests {

        /**
         * UTCID01 - deleteUser
         * Type: A
         */
        @Test
        @DisplayName("UTCID01 - A: User không tồn tại")
        void deleteUser_userNotFound_shouldThrow() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(AppException.class, () -> userService.deleteUser(1L));
        }

        /**
         * UTCID02 - deleteUser
         * Type: N
         */
        @Test
        @DisplayName("UTCID02 - N: Soft delete user -> isActive=false")
        void deleteUser_happyPath_shouldSetInactiveAndSave() {
            User user = new User();
            user.setUserID(2L);
            user.setIsActive(true);

            when(userRepository.findById(2L)).thenReturn(Optional.of(user));
            when(userRepository.save(user)).thenReturn(user);

            assertDoesNotThrow(() -> userService.deleteUser(2L));

            assertEquals(false, user.getIsActive());
            verify(userRepository, times(1)).save(user);
        }
    }

    // ========================================================================
    // 7. changePassword
    // ========================================================================
    @Nested
    @DisplayName("UserService.changePassword")
    class ChangePasswordTests {

        /**
         * UTCID01 - changePassword
         * Type: A
         * User không tồn tại -> USER_NOT_EXIST
         */
        @Test
        @DisplayName("UTCID01 - A: User không tồn tại")
        void changePassword_userNotFound_shouldThrow() {
            String email = "user1@mail.com";
            setAuthenticationPrincipal(email);

            ChangePasswordRequest request = new ChangePasswordRequest();
            request.setOldPassword("12345678");
            request.setNewPassword("abcdef123");
            request.setConfirmPassword("abcdef123");

            when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

            assertThrows(AppException.class, () -> userService.changePassword(request));

            verify(userRepository, never()).save(any(User.class));
        }

        /**
         * UTCID02 - changePassword
         * Type: A
         * Old password sai -> PASSWORD_ENABLED
         */
        @Test
        @DisplayName("UTCID02 - A: Old password sai")
        void changePassword_oldPasswordWrong_shouldThrow() {
            String email = "user2@mail.com";
            setAuthenticationPrincipal(email);

            org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder =
                    new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(10);

            User user = new User();
            user.setUserID(2L);
            user.setEmail(email);
            user.setPasswordHash(encoder.encode("correctOldPass"));

            ChangePasswordRequest request = new ChangePasswordRequest();
            request.setOldPassword("wrongPass");
            request.setNewPassword("NewPass123");
            request.setConfirmPassword("NewPass123");

            when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

            assertThrows(AppException.class, () -> userService.changePassword(request));

            verify(userRepository, never()).save(any(User.class));
        }

        /**
         * UTCID03 - changePassword
         * Type: A
         * newPassword != confirmPassword -> PASSWORD_NOT_MATCH
         */
        @Test
        @DisplayName("UTCID03 - A: newPassword != confirmPassword")
        void changePassword_newAndConfirmNotMatch_shouldThrow() {
            String email = "user3@mail.com";
            setAuthenticationPrincipal(email);

            org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder =
                    new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(10);

            User user = new User();
            user.setUserID(3L);
            user.setEmail(email);
            user.setPasswordHash(encoder.encode("correctOldPass"));

            ChangePasswordRequest request = new ChangePasswordRequest();
            request.setOldPassword("correctOldPass");
            request.setNewPassword("NewPass123");
            request.setConfirmPassword("abcdef123");  // không khớp

            when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

            assertThrows(AppException.class, () -> userService.changePassword(request));

            verify(userRepository, never()).save(any(User.class));
        }

        /**
         * UTCID04 - changePassword
         * Type: N
         * Happy path
         */
        @Test
        @DisplayName("UTCID04 - N: Đổi mật khẩu thành công")
        void changePassword_happyPath_shouldUpdatePassword() {
            String email = "user4@mail.com";
            setAuthenticationPrincipal(email);

            org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder =
                    new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(10);

            User user = new User();
            user.setUserID(4L);
            user.setEmail(email);
            String oldHash = encoder.encode("correctOldPass");
            user.setPasswordHash(oldHash);

            ChangePasswordRequest request = new ChangePasswordRequest();
            request.setOldPassword("correctOldPass");
            request.setNewPassword("NewPass123");
            request.setConfirmPassword("NewPass123");

            when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> userService.changePassword(request));

            assertNotEquals(oldHash, user.getPasswordHash());
            assertTrue(encoder.matches("NewPass123", user.getPasswordHash()));

            verify(userRepository, times(1)).save(user);
        }
    }
}
