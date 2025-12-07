package edu.lms.service;

import edu.lms.dto.request.CategoryRequest;
import edu.lms.dto.response.CategoryResponse;
import edu.lms.entity.CourseCategory;
import edu.lms.exception.AppException;
import edu.lms.repository.CourseCategoryRepository;
import edu.lms.repository.CourseRepository;
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
 * Unit test cho AdminCategoryServiceImpl
 *
 * Cover:
 *  - createCategory
 *      + Tên đã tồn tại -> CATEGORY_ALREADY_EXISTS
 *      + Happy path tạo mới
 *  - updateCategory
 *      + Category không tồn tại -> CATEGORY_NOT_FOUND
 *      + Happy path update
 *  - deleteCategory
 *      + Category không tồn tại -> CATEGORY_NOT_FOUND
 *      + Category đang được dùng bởi course -> CATEGORY_IN_USE
 *      + Happy path xóa thành công
 *  - getCategory
 *      + Category không tồn tại -> CATEGORY_NOT_FOUND
 *      + Happy path get
 *  - getAllCategories
 *      + Không có category nào -> list rỗng
 *      + Có nhiều category -> trả list map đúng
 *
 * Lưu ý:
 *  - Chỉ assertThrows(AppException.class), KHÔNG gọi getErrorCode().
 */
@ExtendWith(MockitoExtension.class)
class AdminCategoryServiceTest {

    @Mock
    CourseCategoryRepository courseCategoryRepository;

    @Mock
    CourseRepository courseRepository;

    @InjectMocks
    AdminCategoryServiceImpl adminCategoryService;

    // =======================
    // HELPER
    // =======================
    private CourseCategory buildCategory(Long id, String name, String desc) {
        CourseCategory c = new CourseCategory();
        c.setCategoryID(id);
        c.setName(name);
        c.setDescription(desc);
        return c;
    }

    private CategoryRequest buildRequest(String name, String desc) {
        CategoryRequest r = new CategoryRequest();
        r.setName(name);
        r.setDescription(desc);
        return r;
    }

    // =====================================================================
    // createCategory
    // =====================================================================

    @Nested
    @DisplayName("AdminCategoryServiceImpl.createCategory")
    class CreateCategoryTests {

        /**
         * NOTE – Case 1:
         *  - Tên category đã tồn tại trong DB
         *  - courseCategoryRepository.existsByName(name) = true
         *  - Kỳ vọng: ném AppException (CATEGORY_ALREADY_EXISTS)
         */
        @Test
        @DisplayName("createCategory - Tên category đã tồn tại -> AppException")
        void createCategory_nameAlreadyExists_shouldThrow() {
            String name = "English";
            CategoryRequest request = buildRequest(name, "Desc");

            when(courseCategoryRepository.existsByName(name))
                    .thenReturn(true);

            assertThrows(AppException.class,
                    () -> adminCategoryService.createCategory(request));

            verify(courseCategoryRepository).existsByName(name);
            verify(courseCategoryRepository, never()).save(any());
        }

        /**
         * NOTE – Case 2:
         *  - Tên category chưa tồn tại
         *  - Lưu mới và trả về CategoryResponse
         *  - Kỳ vọng: field map đúng (id, name, description)
         */
        @Test
        @DisplayName("createCategory - Happy path tạo mới category")
        void createCategory_success() {
            String name = "English";
            String desc = "English courses";
            CategoryRequest request = buildRequest(name, desc);

            when(courseCategoryRepository.existsByName(name))
                    .thenReturn(false);

            CourseCategory toSave = new CourseCategory();
            toSave.setName(name);
            toSave.setDescription(desc);

            CourseCategory saved = new CourseCategory();
            saved.setCategoryID(1L);
            saved.setName(name);
            saved.setDescription(desc);

            // mock save(any) trả về "saved"
            when(courseCategoryRepository.save(any(CourseCategory.class)))
                    .thenReturn(saved);

            CategoryResponse res = adminCategoryService.createCategory(request);

            assertEquals(1L, res.getCategoryId());
            assertEquals(name, res.getCategoryName());
            assertEquals(desc, res.getDescription());

            verify(courseCategoryRepository).existsByName(name);
            verify(courseCategoryRepository).save(any(CourseCategory.class));
        }
    }

    // =====================================================================
    // updateCategory
    // =====================================================================

    @Nested
    @DisplayName("AdminCategoryServiceImpl.updateCategory")
    class UpdateCategoryTests {

        /**
         * NOTE – Case 1:
         *  - Category không tồn tại trong DB với categoryId
         *  - findById(categoryId) = Optional.empty()
         *  - Kỳ vọng: ném AppException (CATEGORY_NOT_FOUND)
         */
        @Test
        @DisplayName("updateCategory - Category không tồn tại -> AppException")
        void updateCategory_notFound_shouldThrow() {
            Long categoryId = 99L;
            CategoryRequest request = buildRequest("New name", "New desc");

            when(courseCategoryRepository.findById(categoryId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCategoryService.updateCategory(categoryId, request));

            verify(courseCategoryRepository).findById(categoryId);
            verify(courseCategoryRepository, never()).save(any());
        }

        /**
         * NOTE – Case 2:
         *  - Category tồn tại
         *  - Update name + description, save
         *  - Kỳ vọng: response map đúng dữ liệu mới
         */
        @Test
        @DisplayName("updateCategory - Happy path update thành công")
        void updateCategory_success() {
            Long categoryId = 1L;
            CourseCategory existing = buildCategory(categoryId, "Old name", "Old desc");

            CategoryRequest request = buildRequest("New name", "New desc");

            when(courseCategoryRepository.findById(categoryId))
                    .thenReturn(Optional.of(existing));

            CourseCategory saved = buildCategory(categoryId, "New name", "New desc");
            when(courseCategoryRepository.save(existing)).thenReturn(saved);

            CategoryResponse res = adminCategoryService.updateCategory(categoryId, request);

            assertEquals(categoryId, res.getCategoryId());
            assertEquals("New name", res.getCategoryName());
            assertEquals("New desc", res.getDescription());

            verify(courseCategoryRepository).findById(categoryId);
            verify(courseCategoryRepository).save(existing);
        }
    }

    // =====================================================================
    // deleteCategory
    // =====================================================================

    @Nested
    @DisplayName("AdminCategoryServiceImpl.deleteCategory")
    class DeleteCategoryTests {

        /**
         * NOTE – Case 1:
         *  - Category không tồn tại
         *  - findById(categoryId) = empty
         *  - Kỳ vọng: ném AppException (CATEGORY_NOT_FOUND)
         */
        @Test
        @DisplayName("deleteCategory - Category không tồn tại -> AppException")
        void deleteCategory_notFound_shouldThrow() {
            Long categoryId = 99L;

            when(courseCategoryRepository.findById(categoryId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCategoryService.deleteCategory(categoryId));

            verify(courseCategoryRepository).findById(categoryId);
            verify(courseRepository, never()).existsByCategory_CategoryID(anyLong());
            verify(courseCategoryRepository, never()).delete(any());
        }

        /**
         * NOTE – Case 2:
         *  - Category tồn tại nhưng đang được sử dụng bởi ít nhất 1 course
         *  - existsByCategory_CategoryID(categoryId) = true
         *  - Kỳ vọng: ném AppException (CATEGORY_IN_USE), không delete
         */
        @Test
        @DisplayName("deleteCategory - Category đang được dùng -> AppException CATEGORY_IN_USE")
        void deleteCategory_inUse_shouldThrow() {
            Long categoryId = 1L;
            CourseCategory category = buildCategory(categoryId, "English", "Desc");

            when(courseCategoryRepository.findById(categoryId))
                    .thenReturn(Optional.of(category));

            when(courseRepository.existsByCategory_CategoryID(categoryId))
                    .thenReturn(true);

            assertThrows(AppException.class,
                    () -> adminCategoryService.deleteCategory(categoryId));

            verify(courseCategoryRepository).findById(categoryId);
            verify(courseRepository).existsByCategory_CategoryID(categoryId);
            verify(courseCategoryRepository, never()).delete(any());
        }

        /**
         * NOTE – Case 3:
         *  - Category tồn tại, không được sử dụng bởi course nào
         *  - existsByCategory_CategoryID(categoryId) = false
         *  - Kỳ vọng: delete(category) được gọi
         */
        @Test
        @DisplayName("deleteCategory - Happy path xóa thành công")
        void deleteCategory_success() {
            Long categoryId = 1L;
            CourseCategory category = buildCategory(categoryId, "English", "Desc");

            when(courseCategoryRepository.findById(categoryId))
                    .thenReturn(Optional.of(category));

            when(courseRepository.existsByCategory_CategoryID(categoryId))
                    .thenReturn(false);

            adminCategoryService.deleteCategory(categoryId);

            verify(courseCategoryRepository).findById(categoryId);
            verify(courseRepository).existsByCategory_CategoryID(categoryId);
            verify(courseCategoryRepository).delete(category);
        }
    }

    // =====================================================================
    // getCategory
    // =====================================================================

    @Nested
    @DisplayName("AdminCategoryServiceImpl.getCategory")
    class GetCategoryTests {

        /**
         * NOTE – Case 1:
         *  - Category không tồn tại
         *  - findById(categoryId) = empty
         *  - Kỳ vọng: ném AppException (CATEGORY_NOT_FOUND)
         */
        @Test
        @DisplayName("getCategory - Category không tồn tại -> AppException")
        void getCategory_notFound_shouldThrow() {
            Long categoryId = 99L;

            when(courseCategoryRepository.findById(categoryId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> adminCategoryService.getCategory(categoryId));

            verify(courseCategoryRepository).findById(categoryId);
        }

        /**
         * NOTE – Case 2:
         *  - Category tồn tại
         *  - Kỳ vọng: map đúng CategoryResponse
         */
        @Test
        @DisplayName("getCategory - Happy path lấy thành công")
        void getCategory_success() {
            Long categoryId = 1L;
            CourseCategory category = buildCategory(categoryId, "English", "Desc");

            when(courseCategoryRepository.findById(categoryId))
                    .thenReturn(Optional.of(category));

            CategoryResponse res = adminCategoryService.getCategory(categoryId);

            assertEquals(categoryId, res.getCategoryId());
            assertEquals("English", res.getCategoryName());
            assertEquals("Desc", res.getDescription());

            verify(courseCategoryRepository).findById(categoryId);
        }
    }

    // =====================================================================
    // getAllCategories
    // =====================================================================

    @Nested
    @DisplayName("AdminCategoryServiceImpl.getAllCategories")
    class GetAllCategoriesTests {

        /**
         * NOTE – Case 1:
         *  - Không có category nào trong DB
         *  - findAll() trả list rỗng
         *  - Kỳ vọng: trả list rỗng
         */
        @Test
        @DisplayName("getAllCategories - Không có category -> list rỗng")
        void getAllCategories_empty_shouldReturnEmptyList() {
            when(courseCategoryRepository.findAll())
                    .thenReturn(List.of());

            List<CategoryResponse> res = adminCategoryService.getAllCategories();

            assertNotNull(res);
            assertTrue(res.isEmpty());

            verify(courseCategoryRepository).findAll();
        }

        /**
         * NOTE – Case 2:
         *  - Có nhiều category trong DB
         *  - Kỳ vọng: list size đúng và mapping field đúng
         */
        @Test
        @DisplayName("getAllCategories - Có nhiều category -> trả list map đúng")
        void getAllCategories_success() {
            CourseCategory c1 = buildCategory(1L, "English", "Desc1");
            CourseCategory c2 = buildCategory(2L, "Korean", "Desc2");

            when(courseCategoryRepository.findAll())
                    .thenReturn(List.of(c1, c2));

            List<CategoryResponse> res = adminCategoryService.getAllCategories();

            assertEquals(2, res.size());

            CategoryResponse r1 = res.get(0);
            CategoryResponse r2 = res.get(1);

            assertEquals(1L, r1.getCategoryId());
            assertEquals("English", r1.getCategoryName());
            assertEquals("Desc1", r1.getDescription());

            assertEquals(2L, r2.getCategoryId());
            assertEquals("Korean", r2.getCategoryName());
            assertEquals("Desc2", r2.getDescription());

            verify(courseCategoryRepository).findAll();
        }
    }
}
