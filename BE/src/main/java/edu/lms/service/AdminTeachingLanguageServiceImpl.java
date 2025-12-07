package edu.lms.service;

import edu.lms.dto.request.TeachingLanguageRequest;
import edu.lms.dto.response.TeachingLanguageResponse;
import edu.lms.entity.TeachingLanguage;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.CourseRepository;
import edu.lms.repository.TeachingLanguageRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class AdminTeachingLanguageServiceImpl implements AdminTeachingLanguageService {

    TeachingLanguageRepository teachingLanguageRepository;
    CourseRepository courseRepository;

    @Override
    public TeachingLanguageResponse createLanguage(TeachingLanguageRequest request) {
        if (teachingLanguageRepository.existsByNameEn(request.getNameEn())) {
            throw new AppException(ErrorCode.LANGUAGE_ALREADY_EXISTS);
        }

        TeachingLanguage lang = TeachingLanguage.builder()
                .nameVi(request.getNameVi())
                .nameEn(request.getNameEn())
                .isActive(request.getIsActive())
                .difficulty(request.getDifficulty())
                .certificates(request.getCertificates())
                .thumbnailUrl(request.getThumbnailUrl())
                .build();

        TeachingLanguage saved = teachingLanguageRepository.save(lang);

        return toResponse(saved);
    }

    @Override
    public TeachingLanguageResponse updateLanguage(Long id, TeachingLanguageRequest request) {
        TeachingLanguage lang = teachingLanguageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LANGUAGE_NOT_FOUND));

        String oldNameEn = lang.getNameEn();
        String newNameEn = request.getNameEn();

        // --- KHÔNG CHO ĐỔI name_en KHI ĐÃ CÓ COURSE ĐANG DÙNG ---
        if (newNameEn != null && !newNameEn.equals(oldNameEn)) {
            // Check xem có course nào đang dùng oldNameEn không
            boolean usedByCourse = courseRepository.existsByLanguage(oldNameEn);
            if (usedByCourse) {
                // Gợi ý ErrorCode mới: LANGUAGE_NAME_EN_IN_USE
                throw new AppException(ErrorCode.LANGUAGE_NAME_EN_IN_USE);
            }

            // Nếu được phép đổi (chưa có course nào dùng), thì check trùng name_en mới
            boolean duplicated = teachingLanguageRepository.existsByNameEn(newNameEn);
            if (duplicated) {
                throw new AppException(ErrorCode.LANGUAGE_ALREADY_EXISTS);
            }

            lang.setNameEn(newNameEn);
        }

        // Các field khác vẫn cho update bình thường
        lang.setNameVi(request.getNameVi());
        lang.setIsActive(request.getIsActive());
        lang.setDifficulty(request.getDifficulty());
        lang.setCertificates(request.getCertificates());
        lang.setThumbnailUrl(request.getThumbnailUrl());

        TeachingLanguage saved = teachingLanguageRepository.save(lang);
        return toResponse(saved);
    }
    @Override
    public void deleteLanguage(Long id) {
        TeachingLanguage lang = teachingLanguageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LANGUAGE_NOT_FOUND));

        // --- CHỐT LOGIC XOÁ: chỉ xoá nếu không có course nào dùng ---

        // Nếu Course vẫn dùng String language = lang.getNameEn():
         boolean used = courseRepository.existsByLanguage(lang.getNameEn());

        if (used) {
            throw new AppException(ErrorCode.LANGUAGE_IN_USE);
        }

        teachingLanguageRepository.delete(lang);
    }

    @Override
    public TeachingLanguageResponse getLanguage(Long id) {
        TeachingLanguage lang = teachingLanguageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LANGUAGE_NOT_FOUND));
        return toResponse(lang);
    }

    @Override
    public List<TeachingLanguageResponse> getAllLanguages() {
        return teachingLanguageRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private TeachingLanguageResponse toResponse(TeachingLanguage lang) {
        return TeachingLanguageResponse.builder()
                .id(lang.getId())
                .nameVi(lang.getNameVi())
                .nameEn(lang.getNameEn())
                .isActive(lang.getIsActive())
                .difficulty(lang.getDifficulty())
                .certificates(lang.getCertificates())
                .thumbnailUrl(lang.getThumbnailUrl())
                .build();
    }
}
