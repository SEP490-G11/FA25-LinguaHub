package edu.lms.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.lms.dto.request.SlotContentRequest;
import edu.lms.dto.request.TutorPackageRequest;
import edu.lms.dto.response.OperationStatusResponse;
import edu.lms.dto.response.TutorPackageCreateResponse;
import edu.lms.dto.response.TutorPackageListResponse;
import edu.lms.dto.response.TutorPackageResponse;
import edu.lms.entity.BookingPlan;
import edu.lms.entity.Tutor;
import edu.lms.entity.TutorPackage;
import edu.lms.enums.TutorStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.mapper.TutorPackageMapper;
import edu.lms.repository.BookingPlanRepository;
import edu.lms.repository.TutorPackageRepository;
import edu.lms.repository.TutorRepository;
import edu.lms.repository.UserPackageRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho TutorPackageService:
 *  - createTutorPackage
 *  - updateTutorPackage
 *  - deleteTutorPackage
 *  - getPackagesByTutor
 *  - getMyPackages
 *  - getPackageDetail
 *
 * Ghi chú:
 *  - Gom nhiều dòng trong bảng UTCID vào chung 1 test nếu cùng ErrorCode.
 *  - Kiểm tra AppException qua ex.getErrorcode() – KHÔNG dùng ex.getMessage().
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@FieldDefaults(level = AccessLevel.PRIVATE)
class TutorPackageServiceTest {

    @Mock
    TutorRepository tutorRepository;
    @Mock
    TutorPackageRepository tutorPackageRepository;
    @Mock
    UserPackageRepository userPackageRepository;
    @Mock
    TutorPackageMapper tutorPackageMapper;
    @Mock
    ObjectMapper objectMapper;
    @Mock
    BookingPlanRepository bookingPlanRepository;

    @InjectMocks
    TutorPackageService tutorPackageService;

    // ===================== Helpers dựng entity/dto ======================

    private Tutor buildTutor(Long tutorId, Long userId, TutorStatus status) {
        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setStatus(status);
        return t;
    }

    private TutorPackage buildTutorPackage(Long packageId, Tutor tutor) {
        TutorPackage p = new TutorPackage();
        p.setPackageID(packageId);
        p.setTutor(tutor);
        p.setName("Basic");
        p.setMaxSlots(2);
        p.setRequirement("Req");
        p.setObjectives("Obj");
        p.setDescription("Desc");
        // KHÔNG cần setActive / setIsActive – @Builder.Default đã để true
        p.setCreatedAt(LocalDateTime.now().minusDays(1));
        p.setUpdatedAt(LocalDateTime.now());
        return p;
    }

    private TutorPackageRequest buildValidRequest() {
        // maxSlots = 2, slot_content 2 items, slot_number = 1,2 -> hợp lệ
        return TutorPackageRequest.builder()
                .name("Basic")
                .description("New Description about package")
                .maxSlots(2)
                .requirement("Requirement about package")
                .objectives("Objectives about package")
                .slotContent(List.of(
                        SlotContentRequest.builder().slotNumber(1).content("A").build(),
                        SlotContentRequest.builder().slotNumber(2).content("B").build()
                ))
                .build();
    }

    // ============================ createTutorPackage =============================

    @Nested
    @DisplayName("TutorPackageService.createTutorPackage")
    class CreateTutorPackageTests {

        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void createTutorPackage_tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_UserID(1L))
                    .thenReturn(Optional.empty());

            TutorPackageRequest req = buildValidRequest();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.createTutorPackage(1L, req)
            );

            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        @Test
        @DisplayName("Tutor SUSPENDED -> TUTOR_ACCOUNT_LOCKED")
        void createTutorPackage_tutorSuspended_shouldThrowAccountLocked() {
            Tutor tutor = buildTutor(1L, 1L, TutorStatus.SUSPENDED);
            when(tutorRepository.findByUser_UserID(1L))
                    .thenReturn(Optional.of(tutor));

            TutorPackageRequest req = buildValidRequest();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.createTutorPackage(1L, req)
            );

            assertEquals(ErrorCode.TUTOR_ACCOUNT_LOCKED, ex.getErrorcode());
        }

        @Test
        @DisplayName("Tutor PENDING -> TUTOR_NOT_APPROVED")
        void createTutorPackage_tutorPending_shouldThrowNotApproved() {
            Tutor tutor = buildTutor(1L, 1L, TutorStatus.PENDING);
            when(tutorRepository.findByUser_UserID(1L))
                    .thenReturn(Optional.of(tutor));

            TutorPackageRequest req = buildValidRequest();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.createTutorPackage(1L, req)
            );

            assertEquals(ErrorCode.TUTOR_NOT_APPROVED, ex.getErrorcode());
        }

        @Test
        @DisplayName("Trùng tên gói (sau khi trim) -> TUTOR_PACKAGE_DUPLICATE_NAME")
        void createTutorPackage_duplicateName_shouldThrow() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            TutorPackageRequest req = buildValidRequest();
            req.setName("   Basic   "); // normalize -> "Basic"

            TutorPackage existing = buildTutorPackage(99L, tutor);
            when(tutorPackageRepository.findByTutor_TutorIDAndNameIgnoreCase(
                    tutor.getTutorID(), "Basic"))
                    .thenReturn(Optional.of(existing));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.createTutorPackage(10L, req)
            );

            assertEquals(ErrorCode.TUTOR_PACKAGE_DUPLICATE_NAME, ex.getErrorcode());
        }

        @Test
        @DisplayName("Lỗi slot_content / max_slots -> TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH")
        void createTutorPackage_invalidSlotContentOrMaxSlots_shouldThrowMismatch() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));
            when(tutorPackageRepository.findByTutor_TutorIDAndNameIgnoreCase(anyLong(), anyString()))
                    .thenReturn(Optional.empty());

            // Case1: slotContent null
            TutorPackageRequest req1 = buildValidRequest();
            req1.setSlotContent(null);

            AppException ex1 = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.createTutorPackage(10L, req1)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH, ex1.getErrorcode());

            // Case2: maxSlots null
            TutorPackageRequest req2 = buildValidRequest();
            req2.setMaxSlots(null);

            AppException ex2 = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.createTutorPackage(10L, req2)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH, ex2.getErrorcode());

            // Case3: maxSlots <= 0
            TutorPackageRequest req3 = buildValidRequest();
            req3.setMaxSlots(0);

            AppException ex3 = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.createTutorPackage(10L, req3)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH, ex3.getErrorcode());

            // Case4: size(slotContent) != maxSlots
            TutorPackageRequest req4 = buildValidRequest();
            req4.setMaxSlots(1); // slot_content vẫn 2 item

            AppException ex4 = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.createTutorPackage(10L, req4)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH, ex4.getErrorcode());

            // Case5: slotNumber trùng lặp / out-of-range
            TutorPackageRequest req5 = buildValidRequest();
            req5.setSlotContent(List.of(
                    SlotContentRequest.builder().slotNumber(1).content("A").build(),
                    SlotContentRequest.builder().slotNumber(1).content("B").build()
            ));

            AppException ex5 = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.createTutorPackage(10L, req5)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH, ex5.getErrorcode());
        }

        @Test
        @DisplayName("Happy path – Tạo gói thành công, tên được trim, JSON slot_content được lưu")
        void createTutorPackage_happyPath_shouldCreateSuccessfully() throws Exception {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            TutorPackageRequest req = buildValidRequest();
            req.setName("   Premium Pack   ");

            when(tutorPackageRepository.findByTutor_TutorIDAndNameIgnoreCase(
                    tutor.getTutorID(), "Premium Pack"))
                    .thenReturn(Optional.empty());

            when(tutorPackageMapper.toEntity(any(TutorPackageRequest.class)))
                    .thenAnswer(invocation -> {
                        TutorPackageRequest r = invocation.getArgument(0);
                        TutorPackage p = new TutorPackage();
                        p.setName(r.getName());
                        p.setMaxSlots(r.getMaxSlots());
                        return p;
                    });

            when(objectMapper.writeValueAsString(any()))
                    .thenReturn("[{\"slotNumber\":1,\"content\":\"A\"}]");

            when(tutorPackageRepository.save(any(TutorPackage.class)))
                    .thenAnswer(invocation -> {
                        TutorPackage p = invocation.getArgument(0);
                        p.setPackageID(1L);
                        return p;
                    });

            TutorPackageCreateResponse response =
                    tutorPackageService.createTutorPackage(10L, req);

            assertTrue(response.getSuccess());
            assertEquals(1L, response.getPackageId());
            assertEquals("Tutor package created successfully", response.getMessage());

            ArgumentCaptor<TutorPackageRequest> reqCaptor =
                    ArgumentCaptor.forClass(TutorPackageRequest.class);
            verify(tutorPackageMapper).toEntity(reqCaptor.capture());
            assertEquals("Premium Pack", reqCaptor.getValue().getName());

            verify(tutorPackageRepository, times(1)).save(any(TutorPackage.class));
        }

        @Test
        @DisplayName("Error JSON mapping -> INVALID_KEY")
        void createTutorPackage_jsonError_shouldThrowInvalidKey() throws Exception {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));
            when(tutorPackageRepository.findByTutor_TutorIDAndNameIgnoreCase(anyLong(), anyString()))
                    .thenReturn(Optional.empty());

            TutorPackageRequest req = buildValidRequest();

            when(tutorPackageMapper.toEntity(any()))
                    .thenReturn(new TutorPackage());

            when(objectMapper.writeValueAsString(any()))
                    .thenThrow(new JsonProcessingException("err") {});

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.createTutorPackage(10L, req)
            );
            assertEquals(ErrorCode.INVALID_KEY, ex.getErrorcode());
        }
    }

    // ============================ updateTutorPackage =============================

    @Nested
    @DisplayName("TutorPackageService.updateTutorPackage")
    class UpdateTutorPackageTests {

        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void updateTutorPackage_tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.empty());

            TutorPackageRequest req = buildValidRequest();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.updateTutorPackage(10L, 1L, req)
            );

            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        @Test
        @DisplayName("Tutor SUSPENDED -> TUTOR_ACCOUNT_LOCKED")
        void updateTutorPackage_tutorSuspended_shouldThrowAccountLocked() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.SUSPENDED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            TutorPackageRequest req = buildValidRequest();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.updateTutorPackage(10L, 1L, req)
            );

            assertEquals(ErrorCode.TUTOR_ACCOUNT_LOCKED, ex.getErrorcode());
        }

        @Test
        @DisplayName("Tutor PENDING -> TUTOR_NOT_APPROVED")
        void updateTutorPackage_tutorPending_shouldThrowNotApproved() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.PENDING);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            TutorPackageRequest req = buildValidRequest();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.updateTutorPackage(10L, 1L, req)
            );

            assertEquals(ErrorCode.TUTOR_NOT_APPROVED, ex.getErrorcode());
        }

        @Test
        @DisplayName("TutorPackage không tồn tại -> TUTOR_PACKAGE_NOT_FOUND")
        void updateTutorPackage_notFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));
            when(tutorPackageRepository.findById(1L))
                    .thenReturn(Optional.empty());

            TutorPackageRequest req = buildValidRequest();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.updateTutorPackage(10L, 1L, req)
            );

            assertEquals(ErrorCode.TUTOR_PACKAGE_NOT_FOUND, ex.getErrorcode());
        }

        @Test
        @DisplayName("Không phải owner gói -> UNAUTHORIZED")
        void updateTutorPackage_notOwner_shouldThrowUnauthorized() {
            Tutor tutor1 = buildTutor(1L, 10L, TutorStatus.APPROVED);
            Tutor tutor2 = buildTutor(2L, 20L, TutorStatus.APPROVED);

            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor1));

            TutorPackage p = buildTutorPackage(1L, tutor2);
            when(tutorPackageRepository.findById(1L))
                    .thenReturn(Optional.of(p));

            TutorPackageRequest req = buildValidRequest();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.updateTutorPackage(10L, 1L, req)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        @Test
        @DisplayName("Gói đã được mua -> TUTOR_PACKAGE_ALREADY_PURCHASED")
        void updateTutorPackage_packageAlreadyPurchased_shouldThrow() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            TutorPackage p = buildTutorPackage(1L, tutor);
            when(tutorPackageRepository.findById(1L))
                    .thenReturn(Optional.of(p));

            when(userPackageRepository.existsByTutorPackage_PackageID(1L))
                    .thenReturn(true);

            TutorPackageRequest req = buildValidRequest();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.updateTutorPackage(10L, 1L, req)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_ALREADY_PURCHASED, ex.getErrorcode());
        }

        @Test
        @DisplayName("Trùng tên gói khác (excludePackageId) -> TUTOR_PACKAGE_DUPLICATE_NAME")
        void updateTutorPackage_duplicateName_shouldThrow() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            TutorPackage p = buildTutorPackage(1L, tutor);
            when(tutorPackageRepository.findById(1L))
                    .thenReturn(Optional.of(p));

            when(userPackageRepository.existsByTutorPackage_PackageID(1L))
                    .thenReturn(false);

            TutorPackage other = buildTutorPackage(2L, tutor);
            other.setName("Basic");
            when(tutorPackageRepository.findByTutor_TutorIDAndNameIgnoreCase(
                    tutor.getTutorID(), "Basic"))
                    .thenReturn(Optional.of(other));

            TutorPackageRequest req = buildValidRequest();
            req.setName("Basic");

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.updateTutorPackage(10L, 1L, req)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_DUPLICATE_NAME, ex.getErrorcode());
        }

        @Test
        @DisplayName("Lỗi slot_content / max_slots -> TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH")
        void updateTutorPackage_invalidSlotContentOrMaxSlots_shouldThrowMismatch() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            TutorPackage p = buildTutorPackage(1L, tutor);
            when(tutorPackageRepository.findById(1L))
                    .thenReturn(Optional.of(p));
            when(userPackageRepository.existsByTutorPackage_PackageID(1L))
                    .thenReturn(false);
            when(tutorPackageRepository.findByTutor_TutorIDAndNameIgnoreCase(anyLong(), anyString()))
                    .thenReturn(Optional.empty());

            // slotContent null
            TutorPackageRequest req1 = buildValidRequest();
            req1.setSlotContent(null);
            AppException ex1 = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.updateTutorPackage(10L, 1L, req1)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH, ex1.getErrorcode());

            // size != maxSlots
            TutorPackageRequest req2 = buildValidRequest();
            req2.setMaxSlots(1);
            AppException ex2 = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.updateTutorPackage(10L, 1L, req2)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH, ex2.getErrorcode());

            // slotNumber trùng
            TutorPackageRequest req3 = buildValidRequest();
            req3.setSlotContent(List.of(
                    SlotContentRequest.builder().slotNumber(1).content("A").build(),
                    SlotContentRequest.builder().slotNumber(1).content("B").build()
            ));
            AppException ex3 = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.updateTutorPackage(10L, 1L, req3)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH, ex3.getErrorcode());
        }

        @Test
        @DisplayName("Happy path – Cập nhật gói, tên được trim, trả về success")
        void updateTutorPackage_happyPath_shouldUpdateSuccessfully() throws Exception {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            TutorPackage p = buildTutorPackage(1L, tutor);
            when(tutorPackageRepository.findById(1L))
                    .thenReturn(Optional.of(p));
            when(userPackageRepository.existsByTutorPackage_PackageID(1L))
                    .thenReturn(false);

            when(tutorPackageRepository.findByTutor_TutorIDAndNameIgnoreCase(
                    anyLong(), anyString()))
                    .thenReturn(Optional.empty());

            TutorPackageRequest req = buildValidRequest();
            req.setName("   Premium Pack   ");

            doAnswer(invocation -> {
                TutorPackageRequest r = invocation.getArgument(0);
                TutorPackage entity = invocation.getArgument(1);
                entity.setName(r.getName());
                entity.setMaxSlots(r.getMaxSlots());
                return null;
            }).when(tutorPackageMapper).updateEntityFromRequest(any(), any());

            when(objectMapper.writeValueAsString(any()))
                    .thenReturn("[{\"slotNumber\":1,\"content\":\"A\"}]");

            OperationStatusResponse response =
                    tutorPackageService.updateTutorPackage(10L, 1L, req);

            assertTrue(response.getSuccess());
            assertEquals("Tutor package updated successfully.", response.getMessage());
            assertEquals("Premium Pack", p.getName());
            verify(tutorPackageRepository, times(1)).save(p);
        }
    }

    // ============================ deleteTutorPackage =============================

    @Nested
    @DisplayName("TutorPackageService.deleteTutorPackage")
    class DeleteTutorPackageTests {

        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void deleteTutorPackage_tutorNotFound_shouldThrow() {
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.deleteTutorPackage(10L, 1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        @Test
        @DisplayName("Tutor PENDING -> TUTOR_NOT_APPROVED")
        void deleteTutorPackage_tutorPending_shouldThrowNotApproved() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.PENDING);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.deleteTutorPackage(10L, 1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_APPROVED, ex.getErrorcode());
        }

        @Test
        @DisplayName("Tutor SUSPENDED -> TUTOR_ACCOUNT_LOCKED")
        void deleteTutorPackage_tutorSuspended_shouldThrowAccountLocked() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.SUSPENDED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.deleteTutorPackage(10L, 1L)
            );
            assertEquals(ErrorCode.TUTOR_ACCOUNT_LOCKED, ex.getErrorcode());
        }

        @Test
        @DisplayName("TutorPackage không tồn tại -> TUTOR_PACKAGE_NOT_FOUND")
        void deleteTutorPackage_packageNotFound_shouldThrow() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));
            when(tutorPackageRepository.findById(1L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.deleteTutorPackage(10L, 1L)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_NOT_FOUND, ex.getErrorcode());
        }

        @Test
        @DisplayName("Không phải owner gói -> UNAUTHORIZED")
        void deleteTutorPackage_notOwner_shouldThrowUnauthorized() {
            Tutor tutor1 = buildTutor(1L, 10L, TutorStatus.APPROVED);
            Tutor tutor2 = buildTutor(2L, 20L, TutorStatus.APPROVED);

            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor1));

            TutorPackage p = buildTutorPackage(1L, tutor2);
            when(tutorPackageRepository.findById(1L))
                    .thenReturn(Optional.of(p));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.deleteTutorPackage(10L, 1L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        @Test
        @DisplayName("Gói đã được mua -> TUTOR_PACKAGE_ALREADY_PURCHASED")
        void deleteTutorPackage_alreadyPurchased_shouldThrow() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            TutorPackage p = buildTutorPackage(1L, tutor);
            when(tutorPackageRepository.findById(1L))
                    .thenReturn(Optional.of(p));
            when(userPackageRepository.existsByTutorPackage_PackageID(1L))
                    .thenReturn(true);

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.deleteTutorPackage(10L, 1L)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_ALREADY_PURCHASED, ex.getErrorcode());
        }

        @Test
        @DisplayName("Happy path – Xóa thành công")
        void deleteTutorPackage_happyPath_shouldDeleteSuccessfully() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            TutorPackage p = buildTutorPackage(1L, tutor);
            when(tutorPackageRepository.findById(1L))
                    .thenReturn(Optional.of(p));
            when(userPackageRepository.existsByTutorPackage_PackageID(1L))
                    .thenReturn(false);

            OperationStatusResponse resp =
                    tutorPackageService.deleteTutorPackage(10L, 1L);

            assertTrue(resp.getSuccess());
            assertEquals("Tutor package deleted successfully.", resp.getMessage());
            verify(tutorPackageRepository, times(1)).delete(p);
        }
    }

    // ============================ getPackagesByTutor =============================

    @Nested
    @DisplayName("TutorPackageService.getPackagesByTutor")
    class GetPackagesByTutorTests {

        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void getPackagesByTutor_tutorNotFound_shouldThrow() {
            when(tutorRepository.findById(1L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.getPackagesByTutor(1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        @Test
        @DisplayName("Happy path – Trả về list gói, minBookingPricePerHour")
        void getPackagesByTutor_happyPath_shouldReturnList() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findById(1L))
                    .thenReturn(Optional.of(tutor));

            TutorPackage p1 = buildTutorPackage(1L, tutor);
            p1.setSlotContent(null);

            TutorPackage p2 = buildTutorPackage(2L, tutor);
            p2.setSlotContent(null);

            when(tutorPackageRepository.findByTutor_TutorID(1L))
                    .thenReturn(List.of(p1, p2));

            when(tutorPackageMapper.toResponse(p1))
                    .thenReturn(TutorPackageResponse.builder()
                            .packageId(1L)
                            .tutorId(1L)
                            .name("Basic")
                            .maxSlots(2)
                            .build());
            when(tutorPackageMapper.toResponse(p2))
                    .thenReturn(TutorPackageResponse.builder()
                            .packageId(2L)
                            .tutorId(1L)
                            .name("Premium")
                            .maxSlots(2)
                            .build());

            BookingPlan plan1 = new BookingPlan();
            plan1.setPricePerHours(10.0);
            BookingPlan plan2 = new BookingPlan();
            plan2.setPricePerHours(5.0);
            BookingPlan plan3 = new BookingPlan();
            plan3.setPricePerHours(0.0); // bỏ qua

            when(bookingPlanRepository
                    .findByTutorIDAndIsActiveTrueOrderByTitleAscStartHoursAsc(1L))
                    .thenReturn(List.of(plan1, plan2, plan3));

            TutorPackageListResponse resp =
                    tutorPackageService.getPackagesByTutor(1L);

            assertEquals(2, resp.getPackages().size());
            TutorPackageResponse r1 = resp.getPackages().get(0);
            TutorPackageResponse r2 = resp.getPackages().get(1);

            assertEquals(1L, r1.getPackageId());
            assertEquals(2L, r2.getPackageId());
            assertEquals(5.0, r1.getMinBookingPricePerHour());
            assertEquals(5.0, r2.getMinBookingPricePerHour());
        }
    }

    // ============================ getMyPackages =============================

    @Nested
    @DisplayName("TutorPackageService.getMyPackages")
    class GetMyPackagesTests {

        @Test
        @DisplayName("Tutor chưa APPROVED -> TUTOR_NOT_APPROVED")
        void getMyPackages_tutorNotApproved_shouldThrow() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.PENDING);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.getMyPackages(10L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_APPROVED, ex.getErrorcode());
        }

        @Test
        @DisplayName("Happy path – Lấy gói của tutor hiện tại")
        void getMyPackages_happyPath_shouldReturnList() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(10L))
                    .thenReturn(Optional.of(tutor));

            TutorPackage p = buildTutorPackage(1L, tutor);
            p.setSlotContent(null);

            when(tutorPackageRepository.findByTutor_TutorID(1L))
                    .thenReturn(List.of(p));

            when(tutorPackageMapper.toResponse(p))
                    .thenReturn(TutorPackageResponse.builder()
                            .packageId(1L)
                            .tutorId(1L)
                            .name("My Package")
                            .build());

            when(bookingPlanRepository
                    .findByTutorIDAndIsActiveTrueOrderByTitleAscStartHoursAsc(1L))
                    .thenReturn(List.of());

            TutorPackageListResponse resp =
                    tutorPackageService.getMyPackages(10L);

            assertEquals(1, resp.getPackages().size());
            assertEquals("My Package", resp.getPackages().get(0).getName());
        }
    }

    // ============================ getPackageDetail =============================

    @Nested
    @DisplayName("TutorPackageService.getPackageDetail")
    class GetPackageDetailTests {

        @Test
        @DisplayName("Gói không tồn tại -> TUTOR_PACKAGE_NOT_FOUND")
        void getPackageDetail_notFound_shouldThrow() {
            when(tutorPackageRepository.findById(1L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorPackageService.getPackageDetail(1L)
            );
            assertEquals(ErrorCode.TUTOR_PACKAGE_NOT_FOUND, ex.getErrorcode());
        }

        @Test
        @DisplayName("Happy path – Lấy detail gói, minBookingPricePerHour")
        void getPackageDetail_happyPath_shouldReturnDetail() {
            Tutor tutor = buildTutor(1L, 10L, TutorStatus.APPROVED);
            TutorPackage p = buildTutorPackage(1L, tutor);
            p.setSlotContent(null);

            when(tutorPackageRepository.findById(1L))
                    .thenReturn(Optional.of(p));

            when(tutorPackageMapper.toResponse(p))
                    .thenReturn(TutorPackageResponse.builder()
                            .packageId(1L)
                            .tutorId(1L)
                            .name("Detail Package")
                            .build());

            BookingPlan plan1 = new BookingPlan();
            plan1.setPricePerHours(20.0);
            BookingPlan plan2 = new BookingPlan();
            plan2.setPricePerHours(15.0);
            when(bookingPlanRepository
                    .findByTutorIDAndIsActiveTrueOrderByTitleAscStartHoursAsc(1L))
                    .thenReturn(List.of(plan1, plan2));

            TutorPackageResponse resp =
                    tutorPackageService.getPackageDetail(1L);

            assertEquals(1L, resp.getPackageId());
            assertEquals("Detail Package", resp.getName());
            assertEquals(15.0, resp.getMinBookingPricePerHour());
        }
    }
}









