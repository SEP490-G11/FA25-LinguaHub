package edu.lms.service;

import edu.lms.dto.request.CourseSectionRequest;
import edu.lms.dto.response.CourseSectionResponse;
import edu.lms.entity.*;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.mapper.CourseSectionMapper;
import edu.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toList;
import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class CourseSectionService {

    CourseRepository courseRepository;
    CourseSectionRepository courseSectionRepository;
    CourseSectionMapper courseSectionMapper;
    UserRepository userRepository;
    EnrollmentRepository enrollmentRepository;
    LessonRepository lessonRepository;
    LessonResourceRepository lessonResourceRepository;


    private void ensureTutorOwner(String email, Course course) {
        String tutorEmail = course.getTutor().getUser().getEmail();
        if (!tutorEmail.equalsIgnoreCase(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED); // 403
        }
    }

    private boolean isEnrolled(String email, Long courseId) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        return enrollmentRepository
                .findByUser_UserIDAndCourse_CourseID(user.getUserID(), courseId)
                .isPresent();
    }

    private void ensureViewPermission(String email, Course course) {
        // Tutor owner hoặc learner đã enroll
        boolean owner = course.getTutor().getUser().getEmail().equalsIgnoreCase(email);
        if (owner) return;
        if (isEnrolled(email, course.getCourseID())) return;
        throw new AppException(ErrorCode.UNAUTHORIZED); // 403
    }

    //  CREATE
    public CourseSectionResponse createSection(Long courseID, CourseSectionRequest request, String email) {
        // 1) Not found trước
        Course course = courseRepository.findById(courseID)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        // 2) Quyền sau
        ensureTutorOwner(email, course);

        CourseSection section = courseSectionMapper.toEntity(request);
        section.setCourse(course);
        var saved = courseSectionRepository.save(section);
        return courseSectionMapper.toResponse(saved);
    }

    // GET ALL
    public List<CourseSectionResponse> getSectionsByCourse(Long courseID, String email) {
        Course course = courseRepository.findById(courseID)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        ensureViewPermission(email, course);

        return courseSectionRepository.findByCourse_CourseID(courseID)
                .stream()
                .map(courseSectionMapper::toResponse)
                .collect(Collectors.toList());
    }

    // GET ONE
    public CourseSectionResponse getSectionById(Long sectionID, String email) {
        CourseSection section = courseSectionRepository.findById(sectionID)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));
        Course course = section.getCourse();
        ensureViewPermission(email, course);

        return courseSectionMapper.toResponse(section);
    }

    // UPDATE
    public CourseSectionResponse updateSection(Long sectionID, CourseSectionRequest request, String email) {
        CourseSection section = courseSectionRepository.findById(sectionID)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
        ensureTutorOwner(email, section.getCourse());

        section.setTitle(request.getTitle());
        section.setDescription(request.getDescription());
        section.setOrderIndex(request.getOrderIndex());
        return courseSectionMapper.toResponse(courseSectionRepository.save(section));
    }

    // DELETE

    @Transactional
    public void deleteSection(Long sectionID, String email) {
        CourseSection section = courseSectionRepository.findById(sectionID)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
        ensureTutorOwner(email, section.getCourse());
        courseSectionRepository.delete(section);
    }

}

