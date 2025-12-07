package edu.lms.service;

import edu.lms.dto.response.TeachingLanguageResponse;
import edu.lms.entity.TeachingLanguage;
import edu.lms.repository.TeachingLanguageRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class TeachingLanguageServiceImpl implements TeachingLanguageService {

    TeachingLanguageRepository teachingLanguageRepository;

    private TeachingLanguageResponse toResponse(TeachingLanguage l) {
        return TeachingLanguageResponse.builder()
                .id(l.getId())
                .nameVi(l.getNameVi())
                .nameEn(l.getNameEn())
                .isActive(l.getIsActive())
                .difficulty(l.getDifficulty())
                .certificates(l.getCertificates())
                .thumbnailUrl(l.getThumbnailUrl())
                .build();
    }

    @Override
    public List<TeachingLanguageResponse> getActiveLanguages() {
        return teachingLanguageRepository
                .findAllByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<TeachingLanguageResponse> getAllLanguages() {
        return teachingLanguageRepository
                .findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }
}
