package edu.lms.service;

import edu.lms.dto.request.CategoryRequest;
import edu.lms.dto.response.CategoryResponse;
import edu.lms.entity.CourseCategory;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.CourseCategoryRepository;
import edu.lms.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class AdminCategoryServiceImpl implements AdminCategoryService {

    CourseCategoryRepository courseCategoryRepository;
    CourseRepository courseRepository;

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {
        // Optional: check trùng tên
        if (courseCategoryRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_ALREADY_EXISTS);
        }

        CourseCategory category = new CourseCategory();
        category.setName(request.getName());
        category.setDescription(request.getDescription());

        CourseCategory saved = courseCategoryRepository.save(category);

        return CategoryResponse.builder()
                .categoryId(saved.getCategoryID())
                .categoryName(saved.getName())
                .description(saved.getDescription())
                .build();
    }

    @Override
    public CategoryResponse updateCategory(Long categoryId, CategoryRequest request) {
        CourseCategory category = courseCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        category.setName(request.getName());
        category.setDescription(request.getDescription());

        CourseCategory saved = courseCategoryRepository.save(category);

        return CategoryResponse.builder()
                .categoryId(saved.getCategoryID())
                .categoryName(saved.getName())
                .description(saved.getDescription())
                .build();
    }

    @Override
    public void deleteCategory(Long categoryId) {
        CourseCategory category = courseCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // Chỉ được xoá nếu không có course nào dùng category này
        boolean used = courseRepository.existsByCategory_CategoryID(categoryId);
        if (used) {
            throw new AppException(ErrorCode.CATEGORY_IN_USE);
        }

        courseCategoryRepository.delete(category);
    }

    @Override
    public CategoryResponse getCategory(Long categoryId) {
        CourseCategory category = courseCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        return CategoryResponse.builder()
                .categoryId(category.getCategoryID())
                .categoryName(category.getName())
                .description(category.getDescription())
                .build();
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        return courseCategoryRepository.findAll()
                .stream()
                .map(c -> CategoryResponse.builder()
                        .categoryId(c.getCategoryID())
                        .categoryName(c.getName())
                        .description(c.getDescription())
                        .build())
                .toList();
    }
}
