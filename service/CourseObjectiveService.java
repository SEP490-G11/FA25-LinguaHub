package edu.lms.service;

import edu.lms.dto.request.CourseObjectiveRequest;
import edu.lms.dto.response.CourseObjectiveResponse;
import edu.lms.entity.Course;
import edu.lms.entity.CourseObjective;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.CourseObjectiveRepository;
import edu.lms.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class CourseObjectiveService {

    CourseObjectiveRepository courseObjectiveRepository;
    CourseRepository courseRepository;

    // Lấy danh sách mục tiêu theo khóa học
    public List<CourseObjectiveResponse> getByCourse(Long courseID) {
        List<CourseObjective> list = courseObjectiveRepository.findByCourse_CourseIDOrderByOrderIndexAsc(courseID);
        return list.stream()
                .map(this::toResponse)
                .toList();
    }

    // Thêm mục tiêu học tập (courseID từ URL)
    @Transactional
    public CourseObjectiveResponse create(Long courseID, CourseObjectiveRequest request) {
        Course course = courseRepository.findById(courseID)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        CourseObjective objective = CourseObjective.builder()
                .course(course)
                .objectiveText(request.getObjectiveText())
                .orderIndex(request.getOrderIndex())
                .build();

        return toResponse(courseObjectiveRepository.save(objective));
    }

    // Cập nhật mục tiêu học tập
    @Transactional
    public CourseObjectiveResponse update(Long objectiveID, CourseObjectiveRequest request) {
        CourseObjective objective = courseObjectiveRepository.findById(objectiveID)
                .orElseThrow(() -> new AppException(ErrorCode.OBJECTIVE_NOT_FOUND));

        if (request.getObjectiveText() != null)
            objective.setObjectiveText(request.getObjectiveText());
        if (request.getOrderIndex() != null)
            objective.setOrderIndex(request.getOrderIndex());

        return toResponse(courseObjectiveRepository.save(objective));
    }

    // Xóa mục tiêu học tập
    @Transactional
    public void delete(Long objectiveID) {
        if (!courseObjectiveRepository.existsById(objectiveID)) {
            throw new AppException(ErrorCode.OBJECTIVE_NOT_FOUND);
        }
        courseObjectiveRepository.deleteById(objectiveID);
    }

    // Mapper
    private CourseObjectiveResponse toResponse(CourseObjective o) {
        return CourseObjectiveResponse.builder()
                .objectiveID(o.getObjectiveID())
                .courseID(o.getCourse().getCourseID())
                .objectiveText(o.getObjectiveText())
                .orderIndex(o.getOrderIndex())
                .build();
    }
}
