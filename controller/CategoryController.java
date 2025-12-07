package edu.lms.controller;

import edu.lms.dto.response.CategoryResponse;
import edu.lms.service.CategoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Categories", description = "Get All Categories")
public class CategoryController {

    CategoryService categoryService;

    @GetMapping
    public List<CategoryResponse> getCategories() {
        return categoryService.findAll();
    }

    @GetMapping("/{categoryID}")
    public CategoryResponse getCategory(@PathVariable Long categoryID) {
        return categoryService.findById(categoryID);
    }
}
