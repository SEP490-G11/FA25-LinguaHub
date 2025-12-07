package edu.lms.mapper;

import edu.lms.dto.request.CourseSectionRequest;
import edu.lms.dto.response.CourseSectionResponse;
import edu.lms.dto.response.LessonResourceResponse;
import edu.lms.dto.response.LessonResponse;
import edu.lms.entity.CourseSection;
import edu.lms.entity.Lesson;
import edu.lms.entity.LessonResource;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface CourseSectionMapper {

    // Request → Entity
    @Mapping(target = "sectionID", ignore = true)
    @Mapping(target = "course", ignore = true) // set thủ công trong service
    @Mapping(target = "lessons", ignore = true)
    CourseSection toEntity(CourseSectionRequest request);

    default CourseSectionResponse toResponse(CourseSection entity) {
        if (entity == null) {
            return null;
        }

        List<LessonResponse> lessonResponses = entity.getLessons() != null
                ? entity.getLessons().stream()
                        .map(this::lessonToLessonResponse)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        return CourseSectionResponse.builder()
                .sectionID(entity.getSectionID())
                .courseID(entity.getCourse() != null ? entity.getCourse().getCourseID() : null)
                .title(entity.getTitle())
                .description(entity.getDescription())
                .orderIndex(entity.getOrderIndex())
                .lessons(lessonResponses)
                .build();
    }


    default LessonResponse lessonToLessonResponse(Lesson lesson) {
        if (lesson == null) {
            return null;
        }

        List<LessonResourceResponse> resourceResponses = lesson.getResources() != null
                ? lesson.getResources().stream()
                        .map(this::resourceToResourceResponse)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        return LessonResponse.builder()
                .lessonID(lesson.getLessonID())
                .title(lesson.getTitle())
                .duration(lesson.getDuration())
                .lessonType(lesson.getLessonType())
                .videoURL(lesson.getVideoURL())
                .content(lesson.getContent())
                .orderIndex(lesson.getOrderIndex())
                .createdAt(lesson.getCreatedAt())
                .resources(resourceResponses)
                .build();
    }


    default LessonResourceResponse resourceToResourceResponse(LessonResource resource) {
        if (resource == null) {
            return null;
        }
        return LessonResourceResponse.builder()
                .resourceID(resource.getResourceID())
                .resourceType(resource.getResourceType())
                .resourceTitle(resource.getResourceTitle())
                .resourceURL(resource.getResourceURL())
                .uploadedAt(resource.getUploadedAt())
                .build();
    }
}
