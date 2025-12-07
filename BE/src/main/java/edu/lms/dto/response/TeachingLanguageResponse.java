package edu.lms.dto.response;

import lombok.Builder;

@Builder
public record TeachingLanguageResponse(
        Long id,
        String nameVi,
        String nameEn,
        Boolean isActive,
        String difficulty,
        String certificates,
        String thumbnailUrl
) {}
