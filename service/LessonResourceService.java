package edu.lms.service;

import edu.lms.dto.request.LessonResourceRequest;
import edu.lms.dto.response.LessonResourceResponse;

import java.util.List;

public interface LessonResourceService {
    LessonResourceResponse addResource(Long lessonId, LessonResourceRequest request);

    List<LessonResourceResponse> getResourcesByLesson(Long lessonId);

    LessonResourceResponse updateResource(Long resourceId, LessonResourceRequest request);

    void deleteResource(Long resourceId);
}
