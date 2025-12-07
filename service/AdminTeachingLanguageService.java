package edu.lms.service;

import edu.lms.dto.request.TeachingLanguageRequest;
import edu.lms.dto.response.TeachingLanguageResponse;

import java.util.List;

public interface AdminTeachingLanguageService {

    TeachingLanguageResponse createLanguage(TeachingLanguageRequest request);

    TeachingLanguageResponse updateLanguage(Long id, TeachingLanguageRequest request);

    void deleteLanguage(Long id);

    TeachingLanguageResponse getLanguage(Long id);

    List<TeachingLanguageResponse> getAllLanguages();
}
