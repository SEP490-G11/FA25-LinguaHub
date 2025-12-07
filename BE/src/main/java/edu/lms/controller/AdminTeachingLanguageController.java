package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.TeachingLanguageRequest;
import edu.lms.dto.response.TeachingLanguageResponse;
import edu.lms.service.AdminTeachingLanguageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/admin/languages")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
@Tag(
        name = "Admin Teaching Language",
        description = "API cho Admin quản lý Teaching Language"
)
@PreAuthorize("hasAuthority('MANAGE_COURSES')and principal.claims['role'] == 'Admin'")
public class AdminTeachingLanguageController {

    AdminTeachingLanguageService adminTeachingLanguageService;

    @PostMapping
    @Operation(summary = "Admin tạo language")
    public ApiRespond<TeachingLanguageResponse> createLanguage(
            @RequestBody TeachingLanguageRequest request
    ) {
        var result = adminTeachingLanguageService.createLanguage(request);
        return ApiRespond.<TeachingLanguageResponse>builder()
                .result(result)
                .build();
    }

    @PutMapping("/{id}")
    @Operation(summary = "Admin cập nhật language")
    public ApiRespond<TeachingLanguageResponse> updateLanguage(
            @PathVariable("id") Long id,
            @RequestBody TeachingLanguageRequest request
    ) {
        var result = adminTeachingLanguageService.updateLanguage(id, request);
        return ApiRespond.<TeachingLanguageResponse>builder()
                .result(result)
                .build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Admin xoá language (chỉ khi chưa có course nào dùng)")
    public ApiRespond<Void> deleteLanguage(@PathVariable("id") Long id) {
        adminTeachingLanguageService.deleteLanguage(id);
        return ApiRespond.<Void>builder()
                .message("Delete language successfully")
                .build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Admin xem chi tiết 1 language")
    public ApiRespond<TeachingLanguageResponse> getLanguage(@PathVariable("id") Long id) {
        var result = adminTeachingLanguageService.getLanguage(id);
        return ApiRespond.<TeachingLanguageResponse>builder()
                .result(result)
                .build();
    }

    @GetMapping
    @Operation(summary = "Admin lấy danh sách tất cả language")
    public ApiRespond<List<TeachingLanguageResponse>> getAllLanguages() {
        var result = adminTeachingLanguageService.getAllLanguages();
        return ApiRespond.<List<TeachingLanguageResponse>>builder()
                .result(result)
                .build();
    }
}
