package edu.lms.service;

import edu.lms.dto.request.CategoryRequest;
import edu.lms.dto.response.CategoryResponse;

import java.util.List;

public interface AdminCategoryService {

    CategoryResponse createCategory(CategoryRequest request);

    CategoryResponse updateCategory(Long categoryId, CategoryRequest request);

    void deleteCategory(Long categoryId);

    CategoryResponse getCategory(Long categoryId);

    List<CategoryResponse> getAllCategories();
}
