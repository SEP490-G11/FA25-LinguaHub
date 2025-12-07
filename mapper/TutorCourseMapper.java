package edu.lms.mapper;

import edu.lms.dto.request.TutorCourseRequest;
import edu.lms.dto.response.TutorCourseResponse;
import edu.lms.entity.Course;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TutorCourseMapper {

    @Mapping(target = "status", constant = "Draft")
    @Mapping(target = "courseID", ignore = true)
    @Mapping(target = "tutor", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "sections", ignore = true)
    @Mapping(target = "objectives", ignore = true)
    @Mapping(target = "createdAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    Course toCourse(TutorCourseRequest request);

    @Mapping(target = "id", source = "courseID")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "status", source = "status")
    TutorCourseResponse toTutorCourseResponse(Course course);
}
