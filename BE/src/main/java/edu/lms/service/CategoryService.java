package edu.lms.service;

import edu.lms.dto.response.CategoryResponse;
import edu.lms.entity.CourseCategory;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.CourseCategoryRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryService {

    CourseCategoryRepository courseCategoryRepository;

    //Get all
    public List<CategoryResponse> findAll() {
      return courseCategoryRepository.findAll()
              .stream()
              .map(this::toResponse)
              .toList();
    }

    //Get detail
    public CategoryResponse findById(Long id) {
        CourseCategory courseCategory = courseCategoryRepository.findById(id).orElse(null);
        if (courseCategory == null) {
            throw new AppException(ErrorCode.COURSE_CATEGORY_NOT_FOUND);
        }
        return toResponse(courseCategory);
    }

    private CategoryResponse toResponse(CourseCategory category) {
        return CategoryResponse.builder()
                .categoryId(category.getCategoryID())
                .categoryName(category.getName())
                .description(category.getDescription())
                .build();
    }
}
