package edu.lms.service;

import edu.lms.dto.request.TutorApplyRequest;
import edu.lms.dto.request.TutorCertificateRequest;
import edu.lms.dto.request.TutorUpdateRequest;
import edu.lms.dto.response.TutorApplicationListResponse;
import edu.lms.dto.response.TutorApplyResponse;
import edu.lms.entity.*;
import edu.lms.enums.TutorStatus;
import edu.lms.enums.TutorVerificationStatus;
import edu.lms.exception.TutorApplicationException;
import edu.lms.exception.TutorNotFoundException;
import edu.lms.mapper.TutorCourseMapper;
import edu.lms.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Code Module : TutorService
 * Implementation : TutorServiceImpl
 *
 * Covered methods:
 *  - applyToBecomeTutor(userID, TutorApplyRequest)
 *  - approveTutorApplication(verificationId, adminId)
 *  - getApplicationStatus(userID)
 *  - getAllTutors(status)
 *
 * Mỗi test case có note:
 *  - UTCIDxx
 *  - Type (N/A/B)
 *  - Precondition
 *  - Input
 *  - Expected
 *
 * Mapping với file Excel test specification anh đã gửi.
 */
@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class TutorServiceTest {

    @Mock
    TutorRepository tutorRepository;

    @Mock
    TutorVerificationRepository tutorVerificationRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    RoleRepository roleRepository;

    @Mock
    CourseRepository courseRepository;

    @Mock
    BookingPlanRepository bookingPlanRepository;

    @Mock
    FeedbackRepository feedbackRepository;

    @Mock
    TutorCourseMapper tutorCourseMapper;

    @Mock
    TutorBookingPlanService tutorBookingPlanService;

    @InjectMocks
    TutorServiceImpl tutorService;

    // =========================================================
    // Helper methods dùng chung cho các test
    // =========================================================

    private TutorApplyRequest buildApplyRequest(short experience, String docUrl) {
        TutorCertificateRequest cert = TutorCertificateRequest.builder()
                .certificateName("IELTS 8.0")
                .documentUrl(docUrl)
                .build();

        return TutorApplyRequest.builder()
                .experience(experience)
                .specialization("English Writing")
                .teachingLanguage("English")
                .bio("Experienced teacher with many years of experience in English writing")
                .certificates(List.of(cert))
                .build();
    }

    private User buildUserWithDob(Long userId, LocalDate dob) {
        User u = new User();
        u.setUserID(userId);
        u.setDob(dob);
        u.setFullName("Test User " + userId);
        u.setEmail("user" + userId + "@mail.com");
        return u;
    }

    private Tutor buildTutor(Long tutorId, User user, TutorStatus status) {
        return Tutor.builder()
                .tutorID(tutorId)
                .user(user)
                .status(status)
                .rating(BigDecimal.ZERO)
                .experience((short) 0)
                .build();
    }

    // ========================================================================
    // 1. applyToBecomeTutor – theo bảng applyBecomeTutor (UTCID01 – UTCID09)
    // ========================================================================
    @Nested
    @DisplayName("TutorService.applyToBecomeTutor")
    class ApplyToBecomeTutorTests {

        /**
         * UTCID01 - applyBecomeTutor
         * Type: A (Abnormal)
         * Precondition:
         *  - User không tồn tại trong DB (userRepository.findById = Optional.empty)
         * Input:
         *  - userID = 1
         *  - request: valid (experience=20, docUrl hợp lệ)
         * Expected:
         *  - Throw EntityNotFoundException("User not found with ID: 1")
         *  - Không gọi tutorRepository, tutorVerificationRepository
         */
        @Test
        @DisplayName("UTCID01 - A: User không tồn tại -> EntityNotFoundException")
        void applyToBecomeTutor_userNotFound_shouldThrow() {
            Long userId = 1L;
            TutorApplyRequest request = buildApplyRequest((short) 20, "https://doc.com/tutor100.pdf");

            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                    () -> tutorService.applyToBecomeTutor(userId, request));

            assertTrue(ex.getMessage().contains("User not found with ID: " + userId));
            verify(tutorRepository, never()).findByUser(any());
            verify(tutorVerificationRepository, never()).save(any());
        }

        /**
         * UTCID02 - applyBecomeTutor
         * Type: A (Abnormal)
         * Precondition:
         *  - User tồn tại, có dob
         *  - age = 20, experience = 40 (>= age)
         * Input:
         *  - userID = 2
         *  - request.experience = 40
         * Expected:
         *  - TutorApplicationException("Experience must be less than your age ...")
         *  - Không tạo Tutor, không lưu TutorVerification
         */
        @Test
        @DisplayName("UTCID02 - A: experience >= age -> TutorApplicationException (less than your age)")
        void applyToBecomeTutor_experienceGreaterOrEqualAge_shouldThrow() {
            Long userId = 2L;
            // Tuổi 20
            User user = buildUserWithDob(userId, LocalDate.now().minusYears(20));
            TutorApplyRequest request = buildApplyRequest((short) 40, "https://doc.com/tutor100.pdf");

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            TutorApplicationException ex = assertThrows(TutorApplicationException.class,
                    () -> tutorService.applyToBecomeTutor(userId, request));

            assertTrue(ex.getMessage().contains("Experience must be less than your age"));
            verify(tutorRepository, never()).findByUser(any());
            verify(tutorVerificationRepository, never()).save(any());
        }

        /**
         * UTCID03 - applyBecomeTutor
         * Type: B (Boundary – kinh nghiệm > 60, dob=null)
         * Precondition:
         *  - User tồn tại, dob = null
         *  - request.experience = 61 (>60 – boundary)
         * Input:
         *  - userID = 5
         * Expected:
         *  - TutorApplicationException("Experience must be reasonable. Please update your date of birth...")
         */
        @Test
        @DisplayName("UTCID03 - B: dob=null, experience>60 -> TutorApplicationException (reasonable)")
        void applyToBecomeTutor_dobNull_experienceTooHigh_shouldThrow() {
            Long userId = 5L;
            User user = new User();
            user.setUserID(userId);
            user.setDob(null);

            TutorApplyRequest request = buildApplyRequest((short) 61, "https://doc.com/tutor100.pdf");

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            TutorApplicationException ex = assertThrows(TutorApplicationException.class,
                    () -> tutorService.applyToBecomeTutor(userId, request));

            assertTrue(ex.getMessage().contains("Experience must be reasonable"));
            verify(tutorRepository, never()).findByUser(any());
            verify(tutorVerificationRepository, never()).save(any());
        }

        /**
         * UTCID04 - applyBecomeTutor
         * Type: A (Abnormal)
         * Precondition:
         *  - User tồn tại, có dob, experience < age
         *  - Tutor đã tồn tại với status = APPROVED
         * Input:
         *  - userID = 3
         * Expected:
         *  - TutorApplicationException("You are already an approved tutor. You cannot submit a new application.")
         */
        @Test
        @DisplayName("UTCID04 - A: Tutor đã APPROVED -> không cho apply lại")
        void applyToBecomeTutor_tutorAlreadyApproved_shouldThrow() {
            Long userId = 3L;
            User user = buildUserWithDob(userId, LocalDate.now().minusYears(30));
            TutorApplyRequest request = buildApplyRequest((short) 20, "https://doc.com/tutor100.pdf");

            Tutor tutor = buildTutor(10L, user, TutorStatus.APPROVED);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(tutorRepository.findByUser(user)).thenReturn(Optional.of(tutor));

            TutorApplicationException ex = assertThrows(TutorApplicationException.class,
                    () -> tutorService.applyToBecomeTutor(userId, request));

            assertTrue(ex.getMessage().contains("already an approved tutor"));
            verify(tutorVerificationRepository, never()).existsByTutorAndStatus(any(), any());
            verify(tutorVerificationRepository, never()).save(any());
        }

        /**
         * UTCID05 - applyBecomeTutor
         * Type: A (Abnormal)
         * Precondition:
         *  - User tồn tại, có dob, experience < age
         *  - Tutor tồn tại với status = PENDING
         *  - Đã có verification PENDING
         * Input:
         *  - userID = 4
         * Expected:
         *  - TutorApplicationException("An application is already pending approval")
         */
        @Test
        @DisplayName("UTCID05 - A: Tutor PENDING, đã có hồ sơ PENDING -> không cho apply thêm")
        void applyToBecomeTutor_pendingVerificationAlreadyExists_shouldThrow() {
            Long userId = 4L;
            User user = buildUserWithDob(userId, LocalDate.now().minusYears(25));
            TutorApplyRequest request = buildApplyRequest((short) 5, "https://doc.com/tutor100.pdf");

            Tutor tutor = buildTutor(20L, user, TutorStatus.PENDING);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(tutorRepository.findByUser(user)).thenReturn(Optional.of(tutor));
            when(tutorVerificationRepository.existsByTutorAndStatus(tutor, TutorVerificationStatus.PENDING))
                    .thenReturn(true);

            TutorApplicationException ex = assertThrows(TutorApplicationException.class,
                    () -> tutorService.applyToBecomeTutor(userId, request));

            assertTrue(ex.getMessage().contains("already a pending tutor application")
                    || ex.getMessage().contains("already pending approval"));
            verify(tutorVerificationRepository, never()).save(any());
        }

        /**
         * UTCID06 - applyBecomeTutor
         * Type: A (Abnormal)
         * Precondition:
         *  - User tồn tại, experience < age hoặc dob=null nhưng experience hợp lệ
         *  - Tutor mới được tạo (chưa có pending verification)
         *  - Certificate.documentUrl = null
         * Input:
         *  - userID = 6
         *  - docUrl = null
         * Expected:
         *  - TutorApplicationException("Document URL is required for certificate: IELTS 8.0")
         */
        @Test
        @DisplayName("UTCID06 - A: Certificate.documentUrl = null -> TutorApplicationException (required)")
        void applyToBecomeTutor_certificateDocUrlNull_shouldThrow() {
            Long userId = 6L;
            User user = buildUserWithDob(userId, LocalDate.now().minusYears(30));
            TutorApplyRequest request = buildApplyRequest((short) 5, null);

            Tutor tutor = buildTutor(30L, user, TutorStatus.PENDING);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            // không có tutor => create mới
            when(tutorRepository.findByUser(user)).thenReturn(Optional.empty());
            when(tutorRepository.save(any(Tutor.class))).thenReturn(tutor);
            when(tutorVerificationRepository.existsByTutorAndStatus(tutor, TutorVerificationStatus.PENDING))
                    .thenReturn(false);

            TutorApplicationException ex = assertThrows(TutorApplicationException.class,
                    () -> tutorService.applyToBecomeTutor(userId, request));

            assertTrue(ex.getMessage().contains("Document URL is required"));
            verify(tutorVerificationRepository, never()).save(any());
        }

        /**
         * UTCID07 - applyBecomeTutor
         * Type: A (Abnormal)
         * Precondition:
         *  - User tồn tại, experience hợp lệ
         *  - tutor không có pending verification
         *  - Certificate.documentUrl = "   " (chỉ toàn space)
         * Input:
         *  - userID = 6
         *  - docUrl = "   "
         * Expected:
         *  - TutorApplicationException("Document URL cannot be empty for certificate: IELTS 8.0")
         */
        @Test
        @DisplayName("UTCID07 - A: Certificate.documentUrl = '   ' -> TutorApplicationException (cannot be empty)")
        void applyToBecomeTutor_certificateDocUrlBlank_shouldThrow() {
            Long userId = 6L;
            User user = buildUserWithDob(userId, LocalDate.now().minusYears(30));
            TutorApplyRequest request = buildApplyRequest((short) 5, "   ");

            Tutor tutor = buildTutor(30L, user, TutorStatus.PENDING);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(tutorRepository.findByUser(user)).thenReturn(Optional.empty());
            when(tutorRepository.save(any(Tutor.class))).thenReturn(tutor);
            when(tutorVerificationRepository.existsByTutorAndStatus(tutor, TutorVerificationStatus.PENDING))
                    .thenReturn(false);

            TutorApplicationException ex = assertThrows(TutorApplicationException.class,
                    () -> tutorService.applyToBecomeTutor(userId, request));

            assertTrue(ex.getMessage().contains("Document URL cannot be empty"));
            verify(tutorVerificationRepository, never()).save(any());
        }

        /**
         * UTCID08 - applyBecomeTutor
         * Type: B (Boundary)
         * Precondition:
         *  - User tồn tại, experience hợp lệ
         *  - tutor không có pending verification
         *  - Certificate.documentUrl = "https://doc.com/tutor100" (không .pdf nhưng vẫn hợp lệ)
         * Input:
         *  - userID = 2
         * Expected:
         *  - Không exception
         *  - tutorVerificationRepository.save được gọi
         */
        @Test
        @DisplayName("UTCID08 - B: documentUrl không .pdf nhưng hợp lệ -> apply success")
        void applyToBecomeTutor_certificateDocUrlWithoutPdf_shouldStillSuccess() {
            Long userId = 2L;
            User user = buildUserWithDob(userId, LocalDate.now().minusYears(25));
            TutorApplyRequest request = buildApplyRequest((short) 5, "https://doc.com/tutor100");

            Tutor tutor = buildTutor(40L, user, TutorStatus.PENDING);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(tutorRepository.findByUser(user)).thenReturn(Optional.empty());
            when(tutorRepository.save(any(Tutor.class))).thenReturn(tutor);
            when(tutorVerificationRepository.existsByTutorAndStatus(tutor, TutorVerificationStatus.PENDING))
                    .thenReturn(false);
            when(tutorVerificationRepository.save(any(TutorVerification.class))).thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> tutorService.applyToBecomeTutor(userId, request));

            verify(tutorVerificationRepository).save(any(TutorVerification.class));
        }

        /**
         * UTCID09 - applyBecomeTutor
         * Type: N (Normal)
         * Precondition:
         *  - User tồn tại, dob hợp lệ, experience < age
         *  - tutor có thể đã tồn tại hoặc chưa, không có pending verification
         *  - Certificate.documentUrl hợp lệ "https://doc.com/tutor100.pdf"
         * Input:
         *  - userID = 6
         * Expected:
         *  - Tạo (hoặc update) TutorVerification với status=PENDING
         *  - tutorVerificationRepository.save() được gọi 1 lần
         *  - Không có exception
         */
        @Test
        @DisplayName("UTCID09 - N: Happy path -> submit application thành công")
        void applyToBecomeTutor_happyPath_shouldSaveVerification() {
            Long userId = 6L;
            User user = buildUserWithDob(userId, LocalDate.now().minusYears(30));
            TutorApplyRequest request = buildApplyRequest((short) 5, "https://doc.com/tutor100.pdf");

            Tutor tutor = buildTutor(50L, user, TutorStatus.PENDING);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(tutorRepository.findByUser(user)).thenReturn(Optional.of(tutor));
            when(tutorVerificationRepository.existsByTutorAndStatus(tutor, TutorVerificationStatus.PENDING))
                    .thenReturn(false);
            when(tutorVerificationRepository.save(any(TutorVerification.class))).thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> tutorService.applyToBecomeTutor(userId, request));

            verify(tutorVerificationRepository).save(any(TutorVerification.class));
        }
    }

    // ========================================================================
    // 2. approveTutorApplication – theo bảng approveTutorApplication
    // ========================================================================
    @Nested
    @DisplayName("TutorService.approveTutorApplication")
    class ApproveTutorApplicationTests {

        /**
         * UTCID01 - approveTutorApplication
         * Type: A
         * Precondition:
         *  - tutorVerificationRepository.findById(100) = empty
         * Input:
         *  - verificationId = 100, adminId = 5
         * Expected:
         *  - EntityNotFoundException("Application not found with ID: 100")
         */
        @Test
        @DisplayName("UTCID01 - A: Application không tồn tại -> EntityNotFoundException")
        void approveTutorApplication_verificationNotFound_shouldThrow() {
            when(tutorVerificationRepository.findById(100L))
                    .thenReturn(Optional.empty());

            EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                    () -> tutorService.approveTutorApplication(100L, 5L));

            assertTrue(ex.getMessage().contains("Application not found with ID: 100"));
        }

        /**
         * UTCID02 - approveTutorApplication
         * Type: A
         * Precondition:
         *  - Verification tồn tại nhưng status != PENDING (APPROVED/REJECTED)
         * Input:
         *  - verificationId = 1, adminId=5
         * Expected:
         *  - TutorApplicationException("Application is not in pending status")
         */
        @Test
        @DisplayName("UTCID02 - A: Application không ở trạng thái PENDING -> TutorApplicationException")
        void approveTutorApplication_statusNotPending_shouldThrow() {
            TutorVerification verification = new TutorVerification();
            verification.setTutorVerificationID(1L);
            verification.setStatus(TutorVerificationStatus.APPROVED);

            when(tutorVerificationRepository.findById(1L))
                    .thenReturn(Optional.of(verification));

            TutorApplicationException ex = assertThrows(TutorApplicationException.class,
                    () -> tutorService.approveTutorApplication(1L, 5L));

            assertTrue(ex.getMessage().contains("not in pending status"));
        }

        /**
         * UTCID03 - approveTutorApplication
         * Type: A
         * Precondition:
         *  - Verification tồn tại, status=PENDING
         *  - userRepository.findById(adminId) = empty
         * Input:
         *  - verificationId = 1, adminId = 99
         * Expected:
         *  - EntityNotFoundException("Admin not found with ID: 99")
         */
        @Test
        @DisplayName("UTCID03 - A: Admin không tồn tại -> EntityNotFoundException")
        void approveTutorApplication_adminNotFound_shouldThrow() {
            TutorVerification verification = new TutorVerification();
            verification.setTutorVerificationID(1L);
            verification.setStatus(TutorVerificationStatus.PENDING);
            verification.setTutor(Tutor.builder().tutorID(101L).build());

            when(tutorVerificationRepository.findById(1L))
                    .thenReturn(Optional.of(verification));
            when(userRepository.findById(99L))
                    .thenReturn(Optional.empty());

            EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                    () -> tutorService.approveTutorApplication(1L, 99L));

            assertTrue(ex.getMessage().contains("Admin not found with ID: 99"));
        }

        /**
         * UTCID04 - approveTutorApplication
         * Type: B (Boundary – thiếu role Tutor)
         * Precondition:
         *  - Verification PENDING, admin tồn tại
         *  - roleRepository.findById("Tutor") = empty
         * Input:
         *  - verificationId = 1, adminId=5
         * Expected:
         *  - EntityNotFoundException("Tutor role not found")
         */
        @Test
        @DisplayName("UTCID04 - B: Role 'Tutor' không tồn tại -> EntityNotFoundException")
        void approveTutorApplication_tutorRoleNotFound_shouldThrow() {
            User admin = new User();
            admin.setUserID(5L);

            User learner = new User();
            learner.setUserID(10L);

            Tutor tutor = buildTutor(101L, learner, TutorStatus.PENDING);

            TutorVerification verification = new TutorVerification();
            verification.setTutorVerificationID(1L);
            verification.setStatus(TutorVerificationStatus.PENDING);
            verification.setTutor(tutor);

            when(tutorVerificationRepository.findById(1L))
                    .thenReturn(Optional.of(verification));
            when(userRepository.findById(5L))
                    .thenReturn(Optional.of(admin));
            when(roleRepository.findById("Tutor"))
                    .thenReturn(Optional.empty());

            EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                    () -> tutorService.approveTutorApplication(1L, 5L));

            assertTrue(ex.getMessage().contains("Tutor role not found"));
        }

        /**
         * UTCID05 - approveTutorApplication
         * Type: N (Normal)
         * Precondition:
         *  - Verification PENDING với các field (experience, specialization, teachingLanguage, bio)
         *  - Admin tồn tại
         *  - Role "Tutor" tồn tại
         * Input:
         *  - verificationId=1, adminId=5
         * Expected:
         *  - verification.status = APPROVED
         *  - tutor.status = APPROVED, fields copy từ verification
         *  - user.role = Tutor
         *  - verification & tutor & user được save()
         */
        @Test
        @DisplayName("UTCID05 - N: Approve application thành công, cập nhật tutor & role user")
        void approveTutorApplication_happyPath_shouldUpdateTutorAndUserRole() {
            User admin = new User();
            admin.setUserID(5L);

            User learner = new User();
            learner.setUserID(10L);
            learner.setFullName("Learner");
            Role learnerRole = new Role();
            learnerRole.setName("Learner");
            learner.setRole(learnerRole);

            Tutor tutor = buildTutor(101L, learner, TutorStatus.PENDING);

            TutorVerification verification = new TutorVerification();
            verification.setTutorVerificationID(1L);
            verification.setStatus(TutorVerificationStatus.PENDING);
            verification.setTutor(tutor);
            verification.setExperience((short) 5);
            verification.setSpecialization("Advanced Math");
            verification.setTeachingLanguage("English");
            verification.setBio("Bio desc");

            Role tutorRole = new Role();
            tutorRole.setName("Tutor");

            when(tutorVerificationRepository.findById(1L))
                    .thenReturn(Optional.of(verification));
            when(userRepository.findById(5L))
                    .thenReturn(Optional.of(admin));
            when(roleRepository.findById("Tutor"))
                    .thenReturn(Optional.of(tutorRole));

            // Save trả lại chính object cho đơn giản
            when(tutorVerificationRepository.save(any(TutorVerification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(tutorRepository.save(any(Tutor.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(userRepository.save(any(User.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> tutorService.approveTutorApplication(1L, 5L));

            // Kiểm tra trạng thái sau khi approve
            assertEquals(TutorVerificationStatus.APPROVED, verification.getStatus());
            assertEquals(TutorStatus.APPROVED, tutor.getStatus());
            assertEquals((short) 5, tutor.getExperience());
            assertEquals("Advanced Math", tutor.getSpecialization());
            assertEquals("English", tutor.getTeachingLanguage());
            assertEquals("Bio desc", tutor.getBio());
            assertEquals("Tutor", learner.getRole().getName());

            verify(tutorVerificationRepository).save(verification);
            verify(tutorRepository).save(tutor);
            verify(userRepository).save(learner);
        }
    }

    // ========================================================================
    // 3. getApplicationStatus – theo bảng (Pending / Rejected / Approved / Not found)
    // ========================================================================
    @Nested
    @DisplayName("TutorService.getApplicationStatus")
    class GetApplicationStatusTests {

        /**
         * UTCID01 - getApplicationStatus
         * Type: A
         * Precondition:
         *  - userRepository.findById(1) = empty
         * Input:
         *  - userID = 1
         * Expected:
         *  - EntityNotFoundException("User not found with ID: 1")
         */
        @Test
        @DisplayName("UTCID01 - A: User không tồn tại -> EntityNotFoundException")
        void getApplicationStatus_userNotFound_shouldThrow() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                    () -> tutorService.getApplicationStatus(1L));

            assertTrue(ex.getMessage().contains("User not found with ID: 1"));
        }

        /**
         * UTCID02 - getApplicationStatus
         * Type: A
         * Precondition:
         *  - User tồn tại
         *  - tutorRepository.findByUser(user) = null (không có Tutor record)
         * Input:
         *  - userID = 2
         * Expected:
         *  - TutorNotFoundException("No application found. Please submit an application first.")
         */
        @Test
        @DisplayName("UTCID02 - A: User chưa có Tutor record -> TutorNotFoundException")
        void getApplicationStatus_noTutor_shouldThrowTutorNotFound() {
            User user = new User();
            user.setUserID(2L);

            when(userRepository.findById(2L)).thenReturn(Optional.of(user));
            when(tutorRepository.findByUser(user)).thenReturn(Optional.empty());

            TutorNotFoundException ex = assertThrows(TutorNotFoundException.class,
                    () -> tutorService.getApplicationStatus(2L));

            assertTrue(ex.getMessage().contains("No application found"));
        }

        /**
         * UTCID03 - getApplicationStatus
         * Type: A
         * Precondition:
         *  - User tồn tại, Tutor tồn tại
         *  - Không có bất kỳ TutorVerification nào
         * Input:
         *  - userID = 3
         * Expected:
         *  - TutorNotFoundException("No application found for user ID: 3")
         */
        @Test
        @DisplayName("UTCID03 - A: Tutor không có application nào -> TutorNotFoundException")
        void getApplicationStatus_noVerification_shouldThrow() {
            User user = new User();
            user.setUserID(3L);
            Tutor tutor = buildTutor(103L, user, TutorStatus.PENDING);

            when(userRepository.findById(3L)).thenReturn(Optional.of(user));
            when(tutorRepository.findByUser(user)).thenReturn(Optional.of(tutor));
            when(tutorVerificationRepository.findTopByTutorOrderBySubmittedAtDesc(tutor))
                    .thenReturn(Optional.empty());

            TutorNotFoundException ex = assertThrows(TutorNotFoundException.class,
                    () -> tutorService.getApplicationStatus(3L));

            assertTrue(ex.getMessage().contains("No application found for user ID: 3"));
        }

        /**
         * UTCID04 - getApplicationStatus
         * Type: N
         * Precondition:
         *  - User tồn tại, Tutor tồn tại
         *  - Verification mới nhất status = PENDING, reasonForReject = null
         * Input:
         *  - userID = 1
         * Expected:
         *  - response.status = "PENDING"
         *  - response.reasonForReject = null
         */
        @Test
        @DisplayName("UTCID04 - N: Latest application PENDING -> status=PENDING, reason=null")
        void getApplicationStatus_pending_shouldReturnPending() {
            User user = new User();
            user.setUserID(1L);
            Tutor tutor = buildTutor(101L, user, TutorStatus.PENDING);

            TutorVerification verification = new TutorVerification();
            verification.setTutorVerificationID(201L);
            verification.setTutor(tutor);
            verification.setStatus(TutorVerificationStatus.PENDING);
            verification.setSubmittedAt(LocalDateTime.now().minusDays(1));
            verification.setReasonForReject(null);

            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(tutorRepository.findByUser(user)).thenReturn(Optional.of(tutor));
            when(tutorVerificationRepository.findTopByTutorOrderBySubmittedAtDesc(tutor))
                    .thenReturn(Optional.of(verification));

            TutorApplyResponse res = tutorService.getApplicationStatus(1L);

            assertEquals("PENDING", res.getStatus());
            assertNull(res.getReasonForReject());
            assertEquals(verification.getSubmittedAt(), res.getSubmittedAt());
        }

        /**
         * UTCID05 - getApplicationStatus
         * Type: N
         * Precondition:
         *  - User tồn tại, Tutor tồn tại
         *  - Verification mới nhất status = REJECTED, có reasonForReject
         * Input:
         *  - userID = 2
         * Expected:
         *  - response.status = "REJECTED"
         *  - response.reasonForReject = "Insufficient qualification"
         */
        @Test
        @DisplayName("UTCID05 - N: Latest application REJECTED -> reasonForReject được map đúng")
        void getApplicationStatus_rejected_shouldReturnRejectReason() {
            User user = new User();
            user.setUserID(2L);
            // Status của Tutor ở đây không quan trọng, dùng APPROVED cho hợp lý
            Tutor tutor = buildTutor(102L, user, TutorStatus.APPROVED);

            TutorVerification verification = new TutorVerification();
            verification.setTutorVerificationID(202L);
            verification.setTutor(tutor);
            verification.setStatus(TutorVerificationStatus.REJECTED);
            verification.setSubmittedAt(LocalDateTime.now().minusDays(2));
            verification.setReasonForReject("Insufficient qualification");

            when(userRepository.findById(2L)).thenReturn(Optional.of(user));
            when(tutorRepository.findByUser(user)).thenReturn(Optional.of(tutor));
            when(tutorVerificationRepository.findTopByTutorOrderBySubmittedAtDesc(tutor))
                    .thenReturn(Optional.of(verification));

            TutorApplyResponse res = tutorService.getApplicationStatus(2L);

            assertEquals("REJECTED", res.getStatus());
            assertEquals("Insufficient qualification", res.getReasonForReject());
        }
    }

    // ========================================================================
    // 4. getAllTutors – theo bảng (status filter, invalid status)
    // ========================================================================
    @Nested
    @DisplayName("TutorService.getAllTutors")
    class GetAllTutorsTests {

        private Tutor buildTutorWithUser(Long tutorId, Long userId, TutorStatus status,
                                         String specialization, String teachingLang) {
            User user = new User();
            user.setUserID(userId);
            user.setFullName("User " + userId);
            user.setEmail("user" + userId + "@mail.com");

            Tutor tutor = new Tutor();
            tutor.setTutorID(tutorId);
            tutor.setUser(user);
            tutor.setStatus(status);
            tutor.setSpecialization(specialization);
            tutor.setTeachingLanguage(teachingLang);
            tutor.setRating(BigDecimal.ZERO);
            tutor.setExperience((short) 0);
            return tutor;
        }

        /**
         * UTCID01 - getAllTutors
         * Type: A (theo bảng là A vì có nhiều điều kiện, nhưng logic là Normal)
         * Precondition:
         *  - DB có 3 tutor:
         *      + ID=101, status=PENDING
         *      + ID=102, status=APPROVED
         *      + ID=103, status=SUSPENDED
         *  - status=null -> lấy tất cả
         * Input:
         *  - status = null
         * Expected:
         *  - Trả về list size = 3 (101,102,103)
         */
        @Test
        @DisplayName("UTCID01 - (Spec ghi A) status=null -> trả về tất cả tutor")
        void getAllTutors_statusNull_shouldReturnAll() {
            Tutor t1 = buildTutorWithUser(101L, 1L, TutorStatus.PENDING, "Math", "English");
            Tutor t2 = buildTutorWithUser(102L, 2L, TutorStatus.APPROVED, "Physics", "Vietnamese");
            Tutor t3 = buildTutorWithUser(103L, 3L, TutorStatus.SUSPENDED, "Chemistry", "Japanese");

            when(tutorRepository.findAll()).thenReturn(List.of(t1, t2, t3));
            // Luôn trả Optional.empty cho verification để đơn giản
            when(tutorVerificationRepository.findTopByTutorOrderBySubmittedAtDesc(any(Tutor.class)))
                    .thenReturn(Optional.empty());
            when(bookingPlanRepository.findByTutorID(anyLong()))
                    .thenReturn(Collections.emptyList());
            when(feedbackRepository.findByPayment_TutorId(anyLong()))
                    .thenReturn(Collections.emptyList());

            List<TutorApplicationListResponse> result = tutorService.getAllTutors(null);

            assertEquals(3, result.size());
            Set<Long> ids = new HashSet<>();
            result.forEach(r -> ids.add(r.getTutorId()));
            assertTrue(ids.contains(101L));
            assertTrue(ids.contains(102L));
            assertTrue(ids.contains(103L));
        }

        /**
         * UTCID02 - getAllTutors
         * Type: A (spec), nhưng logic là Normal filter PENDING
         * Precondition:
         *  - Có tutor 101 (PENDING), 102 (APPROVED), 103 (SUSPENDED)
         * Input:
         *  - status = "PENDING"
         * Expected:
         *  - List size = 1, tutorId = 101
         */
        @Test
        @DisplayName("UTCID02 - Filter PENDING -> chỉ trả tutor PENDING")
        void getAllTutors_statusPending_shouldReturnOnlyPending() {
            Tutor t1 = buildTutorWithUser(101L, 1L, TutorStatus.PENDING, "Math", "English");

            when(tutorRepository.findAllByStatus(TutorStatus.PENDING))
                    .thenReturn(List.of(t1));
            when(tutorVerificationRepository.findTopByTutorOrderBySubmittedAtDesc(any(Tutor.class)))
                    .thenReturn(Optional.empty());
            when(bookingPlanRepository.findByTutorID(anyLong()))
                    .thenReturn(Collections.emptyList());
            when(feedbackRepository.findByPayment_TutorId(anyLong()))
                    .thenReturn(Collections.emptyList());

            List<TutorApplicationListResponse> result = tutorService.getAllTutors("PENDING");

            assertEquals(1, result.size());
            assertEquals(101L, result.get(0).getTutorId());
        }

        /**
         * UTCID03 - getAllTutors
         * Type: N
         * Precondition:
         *  - Có tutor 102 (APPROVED)
         * Input:
         *  - status = "approved" (lowercase)
         * Expected:
         *  - Được convert thành TutorStatus.APPROVED -> trả về tutor 102
         */
        @Test
        @DisplayName("UTCID03 - N: status=\"approved\" (lowercase) -> filter APPROVED")
        void getAllTutors_statusApprovedLowercase_shouldWork() {
            Tutor t2 = buildTutorWithUser(102L, 2L, TutorStatus.APPROVED, "Physics", "Vietnamese");

            when(tutorRepository.findAllByStatus(TutorStatus.APPROVED))
                    .thenReturn(List.of(t2));
            when(tutorVerificationRepository.findTopByTutorOrderBySubmittedAtDesc(any(Tutor.class)))
                    .thenReturn(Optional.empty());
            when(bookingPlanRepository.findByTutorID(anyLong()))
                    .thenReturn(Collections.emptyList());
            when(feedbackRepository.findByPayment_TutorId(anyLong()))
                    .thenReturn(Collections.emptyList());

            List<TutorApplicationListResponse> result = tutorService.getAllTutors("approved");

            assertEquals(1, result.size());
            assertEquals(102L, result.get(0).getTutorId());
        }

        /**
         * UTCID04 - getAllTutors
         * Type: N
         * Precondition:
         *  - Có tutor 103 (SUSPENDED)
         * Input:
         *  - status = "SUSPENDED"
         * Expected:
         *  - List size = 1, tutorId = 103
         */
        @Test
        @DisplayName("UTCID04 - N: status=SUSPENDED -> chỉ trả tutor SUSPENDED")
        void getAllTutors_statusSuspended_shouldReturnSuspended() {
            Tutor t3 = buildTutorWithUser(103L, 3L, TutorStatus.SUSPENDED, "Chemistry", "Japanese");

            when(tutorRepository.findAllByStatus(TutorStatus.SUSPENDED))
                    .thenReturn(List.of(t3));
            when(tutorVerificationRepository.findTopByTutorOrderBySubmittedAtDesc(any(Tutor.class)))
                    .thenReturn(Optional.empty());
            when(bookingPlanRepository.findByTutorID(anyLong()))
                    .thenReturn(Collections.emptyList());
            when(feedbackRepository.findByPayment_TutorId(anyLong()))
                    .thenReturn(Collections.emptyList());

            List<TutorApplicationListResponse> result = tutorService.getAllTutors("SUSPENDED");

            assertEquals(1, result.size());
            assertEquals(103L, result.get(0).getTutorId());
        }

        /**
         * UTCID05 - getAllTutors
         * Type: N
         * Precondition:
         *  - status = "" (empty string)
         *  - Có 3 tutor trong DB
         * Input:
         *  - status = ""
         * Expected:
         *  - Lấy tất cả tutor (giống status=null)
         */
        @Test
        @DisplayName("UTCID05 - N: status=\"\" (empty) -> trả về tất cả tutor")
        void getAllTutors_statusEmpty_shouldReturnAll() {
            Tutor t1 = buildTutorWithUser(101L, 1L, TutorStatus.PENDING, "Math", "English");
            Tutor t2 = buildTutorWithUser(102L, 2L, TutorStatus.APPROVED, "Physics", "Vietnamese");
            Tutor t3 = buildTutorWithUser(103L, 3L, TutorStatus.SUSPENDED, "Chemistry", "Japanese");

            when(tutorRepository.findAll()).thenReturn(List.of(t1, t2, t3));
            when(tutorVerificationRepository.findTopByTutorOrderBySubmittedAtDesc(any(Tutor.class)))
                    .thenReturn(Optional.empty());
            when(bookingPlanRepository.findByTutorID(anyLong()))
                    .thenReturn(Collections.emptyList());
            when(feedbackRepository.findByPayment_TutorId(anyLong()))
                    .thenReturn(Collections.emptyList());

            List<TutorApplicationListResponse> result = tutorService.getAllTutors("");

            assertEquals(3, result.size());
        }

        /**
         * UTCID06 - getAllTutors
         * Type: A
         * Precondition:
         *  - status = "HELLO" (không map được sang TutorStatus)
         * Input:
         *  - status = "HELLO"
         * Expected:
         *  - IllegalArgumentException("Invalid status: HELLO")
         */
        @Test
        @DisplayName("UTCID06 - A: status không hợp lệ -> IllegalArgumentException")
        void getAllTutors_invalidStatus_shouldThrow() {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tutorService.getAllTutors("HELLO"));

            assertEquals("Invalid status: HELLO", ex.getMessage());
        }
    }
    // ========================================================================
    // 5. updateTutorInfo – theo bảng UTCID01 – UTCID12
    // ========================================================================
    @Nested
    @DisplayName("TutorService.updateTutorInfo")
    class UpdateTutorInfoTests {

        private Tutor buildBaseTutor() {
            User user = new User();
            user.setUserID(1L);
            user.setFullName("Tutor 1");

            Tutor tutor = new Tutor();
            tutor.setTutorID(1L);
            tutor.setUser(user);
            tutor.setExperience((short) 5);
            tutor.setSpecialization("Math");
            tutor.setTeachingLanguage("English");
            tutor.setBio("Experienced math tutor");
            tutor.setRating(new BigDecimal("4.5"));
            return tutor;
        }

        /**
         * UTCID01 – N
         * Precondition:
         *  - TutorID=1 tồn tại trong DB với các field:
         *    experience=5, specialization="Math", teachingLanguage="English",
         *    bio="Experienced math tutor", rating=4.5
         * Input:
         *  - id=1
         *  - request: teachingLanguage="Vietnamese", các field khác = null
         * Expected:
         *  - Chỉ teachingLanguage được update -> "Vietnamese"
         *  - Các field khác giữ nguyên
         *  - Không exception, save() được gọi
         */
        @Test
        @DisplayName("UTCID01 - N: Chỉ cập nhật teachingLanguage (các field khác null)")
        void updateTutorInfo_onlyTeachingLanguage_shouldUpdateOnlyThatField() {
            Long tutorId = 1L;
            Tutor tutor = buildBaseTutor();

            TutorUpdateRequest request = TutorUpdateRequest.builder()
                    .experience(null)
                    .specialization(null)
                    .teachingLanguage("Vietnamese")
                    .bio(null)
                    .rating(null)
                    .build();

            when(tutorRepository.findById(tutorId)).thenReturn(Optional.of(tutor));
            when(tutorRepository.save(any(Tutor.class))).thenAnswer(inv -> inv.getArgument(0));

            tutorService.updateTutorInfo(tutorId, request);

            assertEquals((short) 5, tutor.getExperience());
            assertEquals("Math", tutor.getSpecialization());
            assertEquals("Vietnamese", tutor.getTeachingLanguage());
            assertEquals("Experienced math tutor", tutor.getBio());
            assertEquals(new BigDecimal("4.5"), tutor.getRating());

            verify(tutorRepository).save(tutor);
        }

        /**
         * UTCID02 – N
         * Precondition:
         *  - TutorID=1 tồn tại
         * Input:
         *  - request: tất cả field = null
         * Expected:
         *  - Không field nào thay đổi
         *  - Không exception
         */
        @Test
        @DisplayName("UTCID02 - N: Tất cả field null -> không thay đổi gì nhưng vẫn thành công")
        void updateTutorInfo_allNull_shouldChangeNothing() {
            Long tutorId = 1L;
            Tutor tutor = buildBaseTutor();

            TutorUpdateRequest request = TutorUpdateRequest.builder()
                    .experience(null)
                    .specialization(null)
                    .teachingLanguage(null)
                    .bio(null)
                    .rating(null)
                    .build();

            when(tutorRepository.findById(tutorId)).thenReturn(Optional.of(tutor));
            when(tutorRepository.save(any(Tutor.class))).thenAnswer(inv -> inv.getArgument(0));

            tutorService.updateTutorInfo(tutorId, request);

            assertEquals((short) 5, tutor.getExperience());
            assertEquals("Math", tutor.getSpecialization());
            assertEquals("English", tutor.getTeachingLanguage());
            assertEquals("Experienced math tutor", tutor.getBio());
            assertEquals(new BigDecimal("4.5"), tutor.getRating());

            verify(tutorRepository).save(tutor);
        }

        /**
         * UTCID03 + một phần UTCID05/06 – N
         * Precondition:
         *  - TutorID=1 tồn tại
         * Input:
         *  - experience = 10
         *  - specialization = "Physics"
         *  - teachingLanguage = "Vietnamese"
         *  - bio = "Expert in physics"
         *  - rating = 4.9
         * Expected:
         *  - Tất cả field non-null được update tương ứng
         */
        @Test
        @DisplayName("UTCID03/05/06 - N: Cập nhật đầy đủ các field non-null")
        void updateTutorInfo_updateAllNonNullFields_shouldWork() {
            Long tutorId = 1L;
            Tutor tutor = buildBaseTutor();

            TutorUpdateRequest request = TutorUpdateRequest.builder()
                    .experience((short) 10)
                    .specialization("Physics")
                    .teachingLanguage("Vietnamese")
                    .bio("Expert in physics")
                    .rating(new BigDecimal("4.9"))
                    .build();

            when(tutorRepository.findById(tutorId)).thenReturn(Optional.of(tutor));
            when(tutorRepository.save(any(Tutor.class))).thenAnswer(inv -> inv.getArgument(0));

            tutorService.updateTutorInfo(tutorId, request);

            assertEquals((short) 10, tutor.getExperience());
            assertEquals("Physics", tutor.getSpecialization());
            assertEquals("Vietnamese", tutor.getTeachingLanguage());
            assertEquals("Expert in physics", tutor.getBio());
            assertEquals(new BigDecimal("4.9"), tutor.getRating());

            verify(tutorRepository).save(tutor);
        }

        /**
         * UTCID04 – A
         * Precondition:
         *  - TutorID=2 không tồn tại trong DB
         * Input:
         *  - id=2, request bất kỳ
         * Expected:
         *  - TutorNotFoundException("Tutor not found with ID: 2")
         */
        @Test
        @DisplayName("UTCID04 - A: Tutor không tồn tại -> TutorNotFoundException")
        void updateTutorInfo_tutorNotFound_shouldThrow() {
            Long tutorId = 2L;

            TutorUpdateRequest request = TutorUpdateRequest.builder()
                    .experience((short) 10)
                    .specialization("Physics")
                    .teachingLanguage("Vietnamese")
                    .bio("Expert in physics")
                    .rating(new BigDecimal("4.9"))
                    .build();

            when(tutorRepository.findById(tutorId)).thenReturn(Optional.empty());

            TutorNotFoundException ex = assertThrows(TutorNotFoundException.class,
                    () -> tutorService.updateTutorInfo(tutorId, request));

            assertTrue(ex.getMessage().contains("Tutor not found with ID: 2"));
            verify(tutorRepository, never()).save(any());
        }

        /**
         * UTCID08 + UTCID11 – B (boundary)
         * Precondition:
         *  - TutorID=1 tồn tại
         * Input:
         *  - experience = 0
         *  - rating = 0
         * Expected:
         *  - experience update về 0
         *  - rating update về 0
         */
        @Test
        @DisplayName("UTCID08/11 - B: experience=0, rating=0 -> boundary min")
        void updateTutorInfo_experienceZero_ratingZero_shouldUpdate() {
            Long tutorId = 1L;
            Tutor tutor = buildBaseTutor();

            TutorUpdateRequest request = TutorUpdateRequest.builder()
                    .experience((short) 0)
                    .specialization(null)
                    .teachingLanguage(null)
                    .bio(null)
                    .rating(BigDecimal.ZERO)
                    .build();

            when(tutorRepository.findById(tutorId)).thenReturn(Optional.of(tutor));
            when(tutorRepository.save(any(Tutor.class))).thenAnswer(inv -> inv.getArgument(0));

            tutorService.updateTutorInfo(tutorId, request);

            assertEquals((short) 0, tutor.getExperience());
            assertEquals(BigDecimal.ZERO, tutor.getRating());
            verify(tutorRepository).save(tutor);
        }

        /**
         * UTCID09 + UTCID12 – B (boundary)
         * Precondition:
         *  - TutorID=1 tồn tại
         * Input:
         *  - experience = 32767 (Max Short)
         *  - rating = 5
         * Expected:
         *  - experience = 32767
         *  - rating = 5
         */
        @Test
        @DisplayName("UTCID09/12 - B: experience=32767 (max short), rating=5 -> boundary max")
        void updateTutorInfo_experienceMaxShort_ratingFive_shouldUpdate() {
            Long tutorId = 1L;
            Tutor tutor = buildBaseTutor();

            TutorUpdateRequest request = TutorUpdateRequest.builder()
                    .experience(Short.MAX_VALUE)
                    .specialization("Computer Science")
                    .teachingLanguage("Vietnamese")
                    .bio("Updated bio")
                    .rating(new BigDecimal("5.0"))
                    .build();

            when(tutorRepository.findById(tutorId)).thenReturn(Optional.of(tutor));
            when(tutorRepository.save(any(Tutor.class))).thenAnswer(inv -> inv.getArgument(0));

            tutorService.updateTutorInfo(tutorId, request);

            assertEquals(Short.MAX_VALUE, tutor.getExperience());
            assertEquals("Computer Science", tutor.getSpecialization());
            assertEquals("Vietnamese", tutor.getTeachingLanguage());
            assertEquals("Updated bio", tutor.getBio());
            assertEquals(new BigDecimal("5.0"), tutor.getRating());
            verify(tutorRepository).save(tutor);
        }
    }


    // Các method khác (getPendingApplications, getApprovedApplications, getRejectedApplications,
    // getApplicationDetail, getTutorDetail, getAllApplications, suspendTutor, unsuspendTutor, updateTutorInfo)
    // có thể viết test tương tự nếu anh cần – nhưng 4 nhóm trên là trọng tâm theo bảng spec anh gửi.
}
