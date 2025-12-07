package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.CourseSectionRequest;
import edu.lms.dto.response.CourseSectionResponse;
import edu.lms.service.CourseSectionService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/tutor/courses/sections")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class CourseSectionController {

    CourseSectionService courseSectionService;

    // CREATE (Tutor owner)
    @PostMapping("/{courseID}")
    public ApiRespond<CourseSectionResponse> createSection(
            @PathVariable Long courseID,
            @RequestBody CourseSectionRequest request,
            @AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<CourseSectionResponse>builder()
                .result(courseSectionService.createSection(courseID, request, email))
                .message("Section created successfully")
                .build();
    }

    // GET ALL BY COURSE (Tutor owner hoặc Learner đã enroll)
    @GetMapping("/{courseID}")
    public ApiRespond<List<CourseSectionResponse>> getSectionsByCourse(
            @PathVariable Long courseID,
            @AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<List<CourseSectionResponse>>builder()
                .result(courseSectionService.getSectionsByCourse(courseID, email))
                .build();
    }

    // GET ONE (Tutor owner hoặc Learner đã enroll)
    @GetMapping("/detail/{sectionID}")
    public ApiRespond<CourseSectionResponse> getSectionById(
            @PathVariable Long sectionID,
            @AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<CourseSectionResponse>builder()
                .result(courseSectionService.getSectionById(sectionID, email))
                .build();
    }

    // UPDATE (Tutor owner)
    @PutMapping("/{sectionID}")
    public ApiRespond<CourseSectionResponse> updateSection(
            @PathVariable Long sectionID,
            @RequestBody CourseSectionRequest request,
            @AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        return ApiRespond.<CourseSectionResponse>builder()
                .result(courseSectionService.updateSection(sectionID, request, email))
                .message("Section updated successfully")
                .build();
    }

    // DELETE (Tutor owner) — xóa Resource → Lesson → Section
    @DeleteMapping("/{sectionID}")
    public ApiRespond<Void> deleteSection(
            @PathVariable Long sectionID,
            @AuthenticationPrincipal(expression = "claims['sub']") String email
    ) {
        courseSectionService.deleteSection(sectionID, email);
        return ApiRespond.<Void>builder()
                .message("Section deleted successfully")
                .build();
    }
}
