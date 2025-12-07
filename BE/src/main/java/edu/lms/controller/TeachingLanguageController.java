package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.response.TeachingLanguageResponse;
import edu.lms.service.TeachingLanguageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/languages")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
@Tag(
        name = "Teaching Language",
        description = "API quản lý và lấy danh sách ngôn ngữ giảng dạy cho hệ thống"
)
public class TeachingLanguageController {

    TeachingLanguageService teachingLanguageService;

    /**
     * 1) Dùng cho form tạo / sửa khóa học
     *    -> chỉ trả về language đang active
     */
    @GetMapping
    @Operation(
            summary = "Lấy danh sách ngôn ngữ đang hoạt động (cho màn tạo/sửa khóa học)",
            description = """
                    FE dùng API này cho:
                    - Form Create Course
                    - Form Update Course
                    - Form Create/Update Course Draft
                    
                    Chỉ trả về những language có isActive = true.
                    Không dùng API này cho trang hiển thị danh sách ngôn ngữ public.
                    """
    )
    public ApiRespond<List<TeachingLanguageResponse>> getActiveLanguages() {
        var data = teachingLanguageService.getActiveLanguages();
        return ApiRespond.<List<TeachingLanguageResponse>>builder()
                .result(data)
                .build();
    }

    /**
     * 2) Dùng cho hiển thị cho người dùng (trang Ngôn ngữ)
     *    -> trả về tất cả, FE đọc field isActive để hiển thị trạng thái
     */
    @GetMapping("/all")
    @Operation(
            summary = "Lấy tất cả ngôn ngữ (cả active lẫn inactive) cho hiển thị public",
            description = """
                    FE dùng API này cho:
                    - Trang danh sách Ngôn ngữ (Languages page)
                    - Bất kỳ chỗ nào cần show đầy đủ các language, kèm trạng thái isActive.
                    
                    API trả về tất cả language (active + inactive).
                    FE tự đọc field isActive để:
                    - Hiển thị badge/trạng thái (ví dụ: 'Đang mở', 'Tạm ngừng mở khóa mới')
                    - KHÔNG dùng API này cho dropdown chọn ngôn ngữ khi tạo/sửa khóa học.
                    """
    )
    public ApiRespond<List<TeachingLanguageResponse>> getAllLanguages() {
        var data = teachingLanguageService.getAllLanguages();
        return ApiRespond.<List<TeachingLanguageResponse>>builder()
                .result(data)
                .build();
    }
}
