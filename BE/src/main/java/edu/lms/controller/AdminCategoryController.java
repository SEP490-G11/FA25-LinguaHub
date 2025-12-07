package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.CategoryRequest;
import edu.lms.dto.response.CategoryResponse;
import edu.lms.service.AdminCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
@Tag(
        name = "Admin Category",
        description = "API cho Admin quản lý Course Category"
)
@PreAuthorize("hasAuthority('MANAGE_COURSES') and principal.claims['role'] == 'Admin'")
public class AdminCategoryController {

    AdminCategoryService adminCategoryService;

    @PostMapping
    @Operation(summary = "Admin tạo category")
    public ApiRespond<CategoryResponse> createCategory(@RequestBody CategoryRequest request) {
        var result = adminCategoryService.createCategory(request);
        return ApiRespond.<CategoryResponse>builder()
                .result(result)
                .build();
    }

    @PutMapping("/{id}")
    @Operation(summary = "Admin cập nhật category")
    public ApiRespond<CategoryResponse> updateCategory(
            @PathVariable("id") Long id,
            @RequestBody CategoryRequest request
    ) {
        var result = adminCategoryService.updateCategory(id, request);
        return ApiRespond.<CategoryResponse>builder()
                .result(result)
                .build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Admin xoá category (chỉ khi chưa có course nào dùng)")
    public ApiRespond<Void> deleteCategory(@PathVariable("id") Long id) {
        adminCategoryService.deleteCategory(id);
        return ApiRespond.<Void>builder()
                .message("Delete category successfully")
                .build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Admin xem chi tiết 1 category")
    public ApiRespond<CategoryResponse> getCategory(@PathVariable("id") Long id) {
        var result = adminCategoryService.getCategory(id);
        return ApiRespond.<CategoryResponse>builder()
                .result(result)
                .build();
    }

    @GetMapping
    @Operation(summary = "Admin lấy danh sách tất cả category")
    public ApiRespond<List<CategoryResponse>> getAllCategories() {
        var result = adminCategoryService.getAllCategories();
        return ApiRespond.<List<CategoryResponse>>builder()
                .result(result)
                .build();
    }
}
