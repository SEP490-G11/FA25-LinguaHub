package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.CourseObjectiveRequest;
import edu.lms.dto.response.CourseObjectiveResponse;
import edu.lms.service.CourseObjectiveService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class CourseObjectiveController {

    CourseObjectiveService courseObjectiveService;

    // =============================
    // GET: Lấy danh sách mục tiêu của 1 khóa học
    // =============================
    @Operation(summary = "Get all objectives by course ID")
    @GetMapping("/courses/{courseID}/objectives")
    public ApiRespond<List<CourseObjectiveResponse>> getByCourse(@PathVariable Long courseID) {
        return ApiRespond.<List<CourseObjectiveResponse>>builder()
                .result(courseObjectiveService.getByCourse(courseID))
                .build();
    }

    // =============================
    // POST: Thêm mục tiêu học tập (courseID lấy từ URL)
    // =============================
    @Operation(summary = "Create a new objective for a specific course")
    @PostMapping("/courses/{courseID}/objectives")
    public ApiRespond<CourseObjectiveResponse> create(
            @PathVariable Long courseID,
            @Validated @RequestBody CourseObjectiveRequest request
    ) {
        return ApiRespond.<CourseObjectiveResponse>builder()
                .result(courseObjectiveService.create(courseID, request))
                .build();
    }

    // =============================
    // PUT: Cập nhật mục tiêu học tập
    // =============================
    @Operation(summary = "Update an existing course objective")
    @PutMapping("/course-objectives/{objectiveID}")
    public ApiRespond<CourseObjectiveResponse> update(
            @PathVariable Long objectiveID,
            @Validated @RequestBody CourseObjectiveRequest request
    ) {
        return ApiRespond.<CourseObjectiveResponse>builder()
                .result(courseObjectiveService.update(objectiveID, request))
                .build();
    }

    // =============================
    // DELETE: Xóa mục tiêu học tập
    // =============================
    @Operation(summary = "Delete a course objective by ID")
    @DeleteMapping("/course-objectives/{objectiveID}")
    public ApiRespond<String> delete(@PathVariable Long objectiveID) {
        courseObjectiveService.delete(objectiveID);
        return ApiRespond.<String>builder()
                .result("Deleted objective successfully.")
                .build();
    }
}
