package edu.lms.service;

import edu.lms.dto.request.TeachingLanguageRequest;
import edu.lms.dto.response.TeachingLanguageResponse;
import edu.lms.entity.TeachingLanguage;
import edu.lms.exception.AppException;
import edu.lms.repository.CourseRepository;
import edu.lms.repository.TeachingLanguageRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho AdminTeachingLanguageServiceImpl
 *
 * Cover:
 *  - createLanguage
 *      + nameEn đã tồn tại -> LANGUAGE_ALREADY_EXISTS
 *      + Happy path tạo mới
 *  - updateLanguage
 *      + Language không tồn tại -> LANGUAGE_NOT_FOUND
 *      + newNameEn == null -> không đổi nameEn, chỉ update field khác
 *      + newNameEn == oldNameEn -> không đổi nameEn, không check existsByLanguage/existsByNameEn
 *      + newNameEn khác, nhưng đang có course dùng oldNameEn -> LANGUAGE_NAME_EN_IN_USE
 *      + newNameEn khác, course không dùng oldNameEn, nhưng nameEn mới đã tồn tại -> LANGUAGE_ALREADY_EXISTS
 *      + newNameEn khác, course không dùng, nameEn mới chưa tồn tại -> đổi nameEn + update field khác (happy path)
 *  - deleteLanguage
 *      + Language không tồn tại -> LANGUAGE_NOT_FOUND
 *      + Language đang được course sử dụng -> LANGUAGE_IN_USE
 *      + Happy path xóa thành công
 *  - getLanguage
 *      + Language không tồn tại -> LANGUAGE_NOT_FOUND
 *      + Happy path lấy thành công
 *  - getAllLanguages
 *      + Không có language nào -> list rỗng
 *      + Có nhiều language -> trả list map đúng
 *
 * Lưu ý:
 *  - Chỉ assertThrows(AppException.class), KHÔNG dùng getErrorCode().
 */
@ExtendWith(MockitoExtension.class)
class AdminTeachingLanguageServiceTest {

    @Mock
    TeachingLanguageRepository teachingLanguageRepository;

    @Mock
    CourseRepository courseRepository;

    @InjectMocks
    AdminTeachingLanguageServiceImpl adminTeachingLanguageService;

    // =======================
    // HELPER
    // =======================

    private TeachingLanguage buildLanguage(
            Long id,
            String nameVi,
            String nameEn,
            Boolean isActive,
            String difficulty,
            String certificates,
            String thumbnail
    ) {
        TeachingLanguage t = new TeachingLanguage();
        t.setId(id);
        t.setNameVi(nameVi);
        t.setNameEn(nameEn);
        t.setIsActive(isActive);
        t.setDifficulty(difficulty);
        t.setCertificates(certificates);
        t.setThumbnailUrl(thumbnail);
        return t;
    }

    private TeachingLanguageRequest buildRequest(
            String nameVi,
            String nameEn,
            Boolean isActive,
            String difficulty,
            String certificates,
            String thumbnail
    ) {
        TeachingLanguageRequest r = new TeachingLanguageRequest();
        r.setNameVi(nameVi);
        r.setNameEn(nameEn);
        r.setIsActive(isActive);
        r.setDifficulty(difficulty);
        r.setCertificates(certificates);
        r.setThumbnailUrl(thumbnail);
        return r;
    }

    // =====================================================================
    // createLanguage
    // =====================================================================

    @Nested
    @DisplayName("AdminTeachingLanguageServiceImpl.createLanguage")
    class CreateLanguageTests {

        /**
         * NOTE – Case 1:
         *  - nameEn đã tồn tại trong DB
         *  - teachingLanguageRepository.existsByNameEn(nameEn) = true
         *  - Kỳ vọng: ném AppException (LANGUAGE_ALREADY_EXISTS)
         */
        @Test
        @DisplayName("createLanguage - nameEn đã tồn tại -> AppException")
        void createLanguage_nameEnAlreadyExists_shouldThrow() {
            String nameEn = "English";
            TeachingLanguageRequest request = buildRequest(
                    "Tiếng Anh",
                    nameEn,
                    true,
                    "MEDIUM",
                    "IELTS, TOEIC",
                    "thumb-url"
            );

            when(teachingLanguageRepository.existsByNameEn(nameEn))
                    .thenReturn(true);

            assertThrows(AppException.class,
                    () -> adminTeachingLanguageService.createLanguage(request));

            verify(teachingLanguageRepository).existsByNameEn(nameEn);
            verify(teachingLanguageRepository, never()).save(any());
        }

        /**
         * NOTE – Case 2:
         *  - nameEn chưa tồn tại
         *  - Tạo TeachingLanguage mới và lưu
         *  - Kỳ vọng: response map đúng (id, nameVi, nameEn, isActive, difficulty, certificates, thumbnailUrl)
         */
        @Test
        @DisplayName("createLanguage - Happy path tạo mới language")
        void createLanguage_success() {
            String nameEn = "English";
            TeachingLanguageRequest request = buildRequest(
                    "Tiếng Anh",
                    nameEn,
                    true,
                    "MEDIUM",
                    "IELTS, TOEIC",
                    "thumb-url"
            );

            when(teachingLanguageRepository.existsByNameEn(nameEn))
                    .thenReturn(false);

            TeachingLanguage saved = buildLanguage(
                    1L,
                    "Tiếng Anh",
                    nameEn,
                    true,
                    "MEDIUM",
                    "IELTS, TOEIC",
                    "thumb-url"
            );

            when(teachingLanguageRepository.save(any(TeachingLanguage.class)))
                    .thenReturn(saved);

            TeachingLanguageResponse res =
                    adminTeachingLanguageService.createLanguage(request);

            assertEquals(1L, res.id());
            assertEquals("Tiếng Anh", res.nameVi());
            assertEquals(nameEn, res.nameEn());
            assertTrue(res.isActive());
            assertEquals("MEDIUM", res.difficulty());
            assertEquals("IELTS, TOEIC", res.certificates());
            assertEquals("thumb-url", res.thumbnailUrl());

            verify(teachingLanguageRepository).existsByNameEn(nameEn);
            verify(teachingLanguageRepository).save(any(TeachingLanguage.class));
        }
    }

    // =====================================================================
    // updateLanguage
    // =====================================================================

    @Nested
    @DisplayName("AdminTeachingLanguageServiceImpl.updateLanguage")
    class UpdateLanguageTests {

        /**
         * NOTE – Case 1:
         *  - Language không tồn tại trong DB
         *  - findById(id) = Optional.empty()
         *  - Kỳ vọng: ném AppException (LANGUAGE_NOT_FOUND)
         */
        @Test
        @DisplayName("updateLanguage - Language không tồn tại -> AppException")
        void updateLanguage_notFound_shouldThrow() {
            Long id = 99L;
            TeachingLanguageRequest request = buildRequest(
                    "Tiếng Anh mới",
                    "English-new",
                    true,
                    "HARD",
                    "IELTS",
                    "thumb-new"
            );

            when(teachingLanguageRepository.findById(id))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminTeachingLanguageService.updateLanguage(id, request));

            verify(teachingLanguageRepository).findById(id);
            verify(courseRepository, never()).existsByLanguage(anyString());
            verify(teachingLanguageRepository, never()).existsByNameEn(anyString());
            verify(teachingLanguageRepository, never()).save(any());
        }

        /**
         * NOTE – Case 2:
         *  - Language tồn tại
         *  - request.getNameEn() == null -> không đổi nameEn
         *  - Chỉ update các field khác
         */
        @Test
        @DisplayName("updateLanguage - newNameEn = null -> không đổi nameEn, update field khác")
        void updateLanguage_newNameEnNull_onlyUpdateOtherFields() {
            Long id = 1L;
            TeachingLanguage existing = buildLanguage(
                    id,
                    "Tiếng Anh",
                    "English",
                    true,
                    "MEDIUM",
                    "IELTS",
                    "thumb-old"
            );

            TeachingLanguageRequest request = buildRequest(
                    "Tiếng Anh (cập nhật)",
                    null, // newNameEn = null
                    false,
                    "HARD",
                    "IELTS, TOEFL",
                    "thumb-new"
            );

            when(teachingLanguageRepository.findById(id))
                    .thenReturn(Optional.of(existing));

            when(teachingLanguageRepository.save(any(TeachingLanguage.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            TeachingLanguageResponse res =
                    adminTeachingLanguageService.updateLanguage(id, request);

            // nameEn giữ nguyên
            assertEquals("English", res.nameEn());
            // các field khác đổi theo request
            assertEquals("Tiếng Anh (cập nhật)", res.nameVi());
            assertFalse(res.isActive());
            assertEquals("HARD", res.difficulty());
            assertEquals("IELTS, TOEFL", res.certificates());
            assertEquals("thumb-new", res.thumbnailUrl());

            // không check existsByLanguage, existsByNameEn
            verify(courseRepository, never()).existsByLanguage(anyString());
            verify(teachingLanguageRepository, never()).existsByNameEn(anyString());
            verify(teachingLanguageRepository).save(existing);
        }

        /**
         * NOTE – Case 3:
         *  - Language tồn tại
         *  - newNameEn == oldNameEn -> không đổi nameEn
         *  - Không gọi existsByLanguage / existsByNameEn
         */
        @Test
        @DisplayName("updateLanguage - newNameEn = oldNameEn -> không rename, không check exists")
        void updateLanguage_newNameEnEqualOld_noRename() {
            Long id = 1L;
            TeachingLanguage existing = buildLanguage(
                    id,
                    "Tiếng Anh",
                    "English",
                    true,
                    "MEDIUM",
                    "IELTS",
                    "thumb-old"
            );

            TeachingLanguageRequest request = buildRequest(
                    "Tiếng Anh (cập nhật)",
                    "English", // trùng với oldNameEn
                    true,
                    "EASY",
                    "IELTS",
                    "thumb-new"
            );

            when(teachingLanguageRepository.findById(id))
                    .thenReturn(Optional.of(existing));

            when(teachingLanguageRepository.save(any(TeachingLanguage.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            TeachingLanguageResponse res =
                    adminTeachingLanguageService.updateLanguage(id, request);

            assertEquals("English", res.nameEn());
            assertEquals("Tiếng Anh (cập nhật)", res.nameVi());
            assertEquals("EASY", res.difficulty());
            assertEquals("thumb-new", res.thumbnailUrl());

            verify(courseRepository, never()).existsByLanguage(anyString());
            verify(teachingLanguageRepository, never()).existsByNameEn(anyString());
            verify(teachingLanguageRepository).save(existing);
        }

        /**
         * NOTE – Case 4:
         *  - newNameEn khác oldNameEn
         *  - courseRepository.existsByLanguage(oldNameEn) = true
         *  - Kỳ vọng: ném AppException (LANGUAGE_NAME_EN_IN_USE)
         */
        @Test
        @DisplayName("updateLanguage - newNameEn khác, đang có course dùng oldNameEn -> AppException")
        void updateLanguage_renameButUsedByCourse_shouldThrow() {
            Long id = 1L;
            TeachingLanguage existing = buildLanguage(
                    id,
                    "Tiếng Anh",
                    "English",
                    true,
                    "MEDIUM",
                    "IELTS",
                    "thumb-old"
            );

            TeachingLanguageRequest request = buildRequest(
                    "Tiếng Anh mới",
                    "English-new", // khác
                    true,
                    "MEDIUM",
                    "IELTS",
                    "thumb-new"
            );

            when(teachingLanguageRepository.findById(id))
                    .thenReturn(Optional.of(existing));

            when(courseRepository.existsByLanguage("English"))
                    .thenReturn(true);

            assertThrows(AppException.class,
                    () -> adminTeachingLanguageService.updateLanguage(id, request));

            verify(courseRepository).existsByLanguage("English");
            verify(teachingLanguageRepository, never()).existsByNameEn(anyString());
            verify(teachingLanguageRepository, never()).save(any());
        }

        /**
         * NOTE – Case 5:
         *  - newNameEn khác oldNameEn
         *  - courseRepository.existsByLanguage(oldNameEn) = false
         *  - teachingLanguageRepository.existsByNameEn(newNameEn) = true (đã có language khác dùng nameEn này)
         *  - Kỳ vọng: ném AppException (LANGUAGE_ALREADY_EXISTS)
         */
        @Test
        @DisplayName("updateLanguage - newNameEn khác, không bị course dùng, nhưng trùng nameEn mới -> AppException")
        void updateLanguage_renameButNewNameEnDuplicated_shouldThrow() {
            Long id = 1L;
            TeachingLanguage existing = buildLanguage(
                    id,
                    "Tiếng Anh",
                    "English",
                    true,
                    "MEDIUM",
                    "IELTS",
                    "thumb-old"
            );

            TeachingLanguageRequest request = buildRequest(
                    "Tiếng Anh mới",
                    "English-new",
                    true,
                    "MEDIUM",
                    "IELTS",
                    "thumb-new"
            );

            when(teachingLanguageRepository.findById(id))
                    .thenReturn(Optional.of(existing));

            when(courseRepository.existsByLanguage("English"))
                    .thenReturn(false);

            when(teachingLanguageRepository.existsByNameEn("English-new"))
                    .thenReturn(true);

            assertThrows(AppException.class,
                    () -> adminTeachingLanguageService.updateLanguage(id, request));

            verify(courseRepository).existsByLanguage("English");
            verify(teachingLanguageRepository).existsByNameEn("English-new");
            verify(teachingLanguageRepository, never()).save(any());
        }

        /**
         * NOTE – Case 6:
         *  - newNameEn khác oldNameEn
         *  - courseRepository.existsByLanguage(oldNameEn) = false
         *  - teachingLanguageRepository.existsByNameEn(newNameEn) = false
         *  - Kỳ vọng: Được phép đổi nameEn + update các field khác (happy path)
         */
        @Test
        @DisplayName("updateLanguage - Happy path đổi nameEn + update field khác")
        void updateLanguage_renameAndUpdate_success() {
            Long id = 1L;
            TeachingLanguage existing = buildLanguage(
                    id,
                    "Tiếng Anh",
                    "English",
                    true,
                    "MEDIUM",
                    "IELTS",
                    "thumb-old"
            );

            TeachingLanguageRequest request = buildRequest(
                    "Tiếng Anh Advanced",
                    "English-advanced",
                    false,
                    "HARD",
                    "IELTS, TOEFL",
                    "thumb-advanced"
            );

            when(teachingLanguageRepository.findById(id))
                    .thenReturn(Optional.of(existing));

            when(courseRepository.existsByLanguage("English"))
                    .thenReturn(false);

            when(teachingLanguageRepository.existsByNameEn("English-advanced"))
                    .thenReturn(false);

            when(teachingLanguageRepository.save(any(TeachingLanguage.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            TeachingLanguageResponse res =
                    adminTeachingLanguageService.updateLanguage(id, request);

            assertEquals(id, res.id());
            assertEquals("Tiếng Anh Advanced", res.nameVi());
            assertEquals("English-advanced", res.nameEn());
            assertFalse(res.isActive());
            assertEquals("HARD", res.difficulty());
            assertEquals("IELTS, TOEFL", res.certificates());
            assertEquals("thumb-advanced", res.thumbnailUrl());

            verify(courseRepository).existsByLanguage("English");
            verify(teachingLanguageRepository).existsByNameEn("English-advanced");
            verify(teachingLanguageRepository).save(existing);
        }
    }

    // =====================================================================
    // deleteLanguage
    // =====================================================================

    @Nested
    @DisplayName("AdminTeachingLanguageServiceImpl.deleteLanguage")
    class DeleteLanguageTests {

        /**
         * NOTE – Case 1:
         *  - Language không tồn tại
         *  - findById(id) = empty
         *  - Kỳ vọng: ném AppException (LANGUAGE_NOT_FOUND)
         */
        @Test
        @DisplayName("deleteLanguage - Language không tồn tại -> AppException")
        void deleteLanguage_notFound_shouldThrow() {
            Long id = 99L;

            when(teachingLanguageRepository.findById(id))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminTeachingLanguageService.deleteLanguage(id));

            verify(teachingLanguageRepository).findById(id);
            verify(courseRepository, never()).existsByLanguage(anyString());
            verify(teachingLanguageRepository, never()).delete(any());
        }

        /**
         * NOTE – Case 2:
         *  - Language tồn tại nhưng đang có course dùng lang.getNameEn()
         *  - existsByLanguage(nameEn) = true
         *  - Kỳ vọng: ném AppException (LANGUAGE_IN_USE)
         */
        @Test
        @DisplayName("deleteLanguage - Language đang được course dùng -> AppException LANGUAGE_IN_USE")
        void deleteLanguage_inUse_shouldThrow() {
            Long id = 1L;
            TeachingLanguage lang = buildLanguage(
                    id,
                    "Tiếng Anh",
                    "English",
                    true,
                    "MEDIUM",
                    "IELTS",
                    "thumb"
            );

            when(teachingLanguageRepository.findById(id))
                    .thenReturn(Optional.of(lang));

            when(courseRepository.existsByLanguage("English"))
                    .thenReturn(true);

            assertThrows(AppException.class,
                    () -> adminTeachingLanguageService.deleteLanguage(id));

            verify(teachingLanguageRepository).findById(id);
            verify(courseRepository).existsByLanguage("English");
            verify(teachingLanguageRepository, never()).delete(any());
        }

        /**
         * NOTE – Case 3:
         *  - Language tồn tại, không có course nào dùng
         *  - existsByLanguage(nameEn) = false
         *  - Kỳ vọng: gọi delete(lang) thành công
         */
        @Test
        @DisplayName("deleteLanguage - Happy path xóa thành công")
        void deleteLanguage_success() {
            Long id = 1L;
            TeachingLanguage lang = buildLanguage(
                    id,
                    "Tiếng Anh",
                    "English",
                    true,
                    "MEDIUM",
                    "IELTS",
                    "thumb"
            );

            when(teachingLanguageRepository.findById(id))
                    .thenReturn(Optional.of(lang));

            when(courseRepository.existsByLanguage("English"))
                    .thenReturn(false);

            adminTeachingLanguageService.deleteLanguage(id);

            verify(teachingLanguageRepository).findById(id);
            verify(courseRepository).existsByLanguage("English");
            verify(teachingLanguageRepository).delete(lang);
        }
    }

    // =====================================================================
    // getLanguage
    // =====================================================================

    @Nested
    @DisplayName("AdminTeachingLanguageServiceImpl.getLanguage")
    class GetLanguageTests {

        /**
         * NOTE – Case 1:
         *  - Language không tồn tại
         *  - Kỳ vọng: ném AppException (LANGUAGE_NOT_FOUND)
         */
        @Test
        @DisplayName("getLanguage - Language không tồn tại -> AppException")
        void getLanguage_notFound_shouldThrow() {
            Long id = 99L;

            when(teachingLanguageRepository.findById(id))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminTeachingLanguageService.getLanguage(id));

            verify(teachingLanguageRepository).findById(id);
        }

        /**
         * NOTE – Case 2:
         *  - Language tồn tại
         *  - Kỳ vọng: map đúng sang TeachingLanguageResponse
         */
        @Test
        @DisplayName("getLanguage - Happy path lấy thành công")
        void getLanguage_success() {
            Long id = 1L;
            TeachingLanguage lang = buildLanguage(
                    id,
                    "Tiếng Anh",
                    "English",
                    true,
                    "MEDIUM",
                    "IELTS",
                    "thumb"
            );

            when(teachingLanguageRepository.findById(id))
                    .thenReturn(Optional.of(lang));

            TeachingLanguageResponse res =
                    adminTeachingLanguageService.getLanguage(id);

            assertEquals(id, res.id());
            assertEquals("Tiếng Anh", res.nameVi());
            assertEquals("English", res.nameEn());
            assertTrue(res.isActive());
            assertEquals("MEDIUM", res.difficulty());
            assertEquals("IELTS", res.certificates());
            assertEquals("thumb", res.thumbnailUrl());

            verify(teachingLanguageRepository).findById(id);
        }
    }

    // =====================================================================
    // getAllLanguages
    // =====================================================================

    @Nested
    @DisplayName("AdminTeachingLanguageServiceImpl.getAllLanguages")
    class GetAllLanguagesTests {

        /**
         * NOTE – Case 1:
         *  - Không có language nào trong DB
         *  - findAll() trả list rỗng
         *  - Kỳ vọng: trả list rỗng
         */
        @Test
        @DisplayName("getAllLanguages - Không có language -> list rỗng")
        void getAllLanguages_empty_shouldReturnEmptyList() {
            when(teachingLanguageRepository.findAll())
                    .thenReturn(List.of());

            List<TeachingLanguageResponse> res =
                    adminTeachingLanguageService.getAllLanguages();

            assertNotNull(res);
            assertTrue(res.isEmpty());

            verify(teachingLanguageRepository).findAll();
        }

        /**
         * NOTE – Case 2:
         *  - Có nhiều language trong DB
         *  - Kỳ vọng: list size đúng và mapping field đúng
         */
        @Test
        @DisplayName("getAllLanguages - Có nhiều language -> map đúng")
        void getAllLanguages_success() {
            TeachingLanguage l1 = buildLanguage(
                    1L,
                    "Tiếng Anh",
                    "English",
                    true,
                    "MEDIUM",
                    "IELTS",
                    "thumb-en"
            );
            TeachingLanguage l2 = buildLanguage(
                    2L,
                    "Tiếng Hàn",
                    "Korean",
                    false,
                    "HARD",
                    "TOPIK",
                    "thumb-kr"
            );

            when(teachingLanguageRepository.findAll())
                    .thenReturn(List.of(l1, l2));

            List<TeachingLanguageResponse> res =
                    adminTeachingLanguageService.getAllLanguages();

            assertEquals(2, res.size());

            TeachingLanguageResponse r1 = res.get(0);
            TeachingLanguageResponse r2 = res.get(1);

            assertEquals(1L, r1.id());
            assertEquals("Tiếng Anh", r1.nameVi());
            assertEquals("English", r1.nameEn());

            assertEquals(2L, r2.id());
            assertEquals("Tiếng Hàn", r2.nameVi());
            assertEquals("Korean", r2.nameEn());

            verify(teachingLanguageRepository).findAll();
        }
    }
}
