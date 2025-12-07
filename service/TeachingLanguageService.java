package edu.lms.service;

import edu.lms.dto.response.TeachingLanguageResponse;

import java.util.List;

public interface TeachingLanguageService {

    // Cho form tạo / sửa khóa học -> chỉ lấy active
    List<TeachingLanguageResponse> getActiveLanguages();

    // Cho màn hiển thị public (trang Ngôn ngữ) -> lấy tất cả
    List<TeachingLanguageResponse> getAllLanguages();
}
