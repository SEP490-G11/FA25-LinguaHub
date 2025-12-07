package edu.lms.dto.request;

import lombok.Data;

@Data
public class TeachingLanguageRequest {
    String nameVi;
    String nameEn;
    Boolean isActive;
    String difficulty;
    String certificates;
    String thumbnailUrl;
}
