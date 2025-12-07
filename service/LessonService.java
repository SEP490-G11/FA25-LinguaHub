// src/main/java/edu/lms/service/LessonService.java
package edu.lms.service;

import edu.lms.dto.request.LessonRequest;
import edu.lms.dto.response.LessonResponse;

import java.util.List;

public interface LessonService {

    LessonResponse createLesson(Long sectionID, LessonRequest request, String email);
    LessonResponse updateLesson(Long lessonId, LessonRequest request, String email);
    void deleteLesson(Long lessonId, String email);

    List<LessonResponse> getLessonsBySection(Long sectionID, String email);
    List<LessonResponse> getLessonsBySectionWithFilters(Long sectionID, String email, String keyword, String sortBy, String order);
    LessonResponse getLessonDetail(Long lessonId, String email);
}
