package edu.lms.controller;

import edu.lms.dto.request.AdminCourseReviewNoteRequest;
import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.response.AdminCourseDraftChangesResponse;
import edu.lms.dto.response.AdminCourseDraftResponse;
import edu.lms.dto.response.AdminCourseResponse;
import edu.lms.dto.response.AdminCourseDetailResponse;
import edu.lms.enums.CourseDraftStatus;
import edu.lms.enums.CourseStatus;
import edu.lms.service.AdminCourseService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/admin/courses")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class AdminCourseController {

    AdminCourseService adminCourseService;

    // ====================== COURSE LIVE LIST ======================

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: Get courses by status (Draft, Pending, Approved, Rejected, Disabled)")
    @GetMapping("/by-status")
    public ApiRespond<List<AdminCourseResponse>> getAllByStatus(
            @RequestParam(required = false) CourseStatus status
    ) {
        return ApiRespond.<List<AdminCourseResponse>>builder()
                .result(adminCourseService.getAllCoursesForAdmin(status))
                .message(status != null
                        ? "Fetched all courses with status " + status
                        : "Fetched all courses (all statuses)")
                .build();
    }

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: Get all courses (full info including level, shortDescription, requirement)")
    @GetMapping
    public ApiRespond<List<AdminCourseResponse>> getAll() {
        return ApiRespond.<List<AdminCourseResponse>>builder()
                .result(adminCourseService.getAllCoursesForAdmin())
                .build();
    }

    // ====================== COURSE LIVE DETAIL & NOTE ======================

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: xem chi tiết 1 course live (kèm Section/Lesson/Resource/Objectives)")
    @GetMapping("/{courseID}/detail")
    public ApiRespond<AdminCourseDetailResponse> getCourseDetail(
            @PathVariable Long courseID
    ) {
        return ApiRespond.<AdminCourseDetailResponse>builder()
                .result(adminCourseService.getCourseDetail(courseID))
                .build();
    }

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: update review note cho course live")
    @PutMapping("/{courseID}/review-note")
    public ApiRespond<AdminCourseDetailResponse> updateCourseReviewNote(
            @PathVariable Long courseID,
            @RequestBody AdminCourseReviewNoteRequest request
    ) {
        return ApiRespond.<AdminCourseDetailResponse>builder()
                .result(adminCourseService.updateCourseReviewNote(courseID, request.getNote()))
                .message("Updated review note for course")
                .build();
    }

    // ====================== APPROVE / REJECT COURSE LIVE ======================

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: approve course live (status → Approved, optional note)")
    @PostMapping("/{courseID}/approve")
    public ApiRespond<AdminCourseResponse> approveLiveCourse(
            @PathVariable Long courseID,
            @RequestBody(required = false) AdminCourseReviewNoteRequest request
    ) {
        String note = request != null ? request.getNote() : null;
        return ApiRespond.<AdminCourseResponse>builder()
                .result(adminCourseService.approveLiveCourse(courseID, note))
                .message("Course live approved")
                .build();
    }

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: reject course live (status → Rejected, bắt buộc note)")
    @PostMapping("/{courseID}/reject")
    public ApiRespond<AdminCourseResponse> rejectLiveCourse(
            @PathVariable Long courseID,
            @RequestBody AdminCourseReviewNoteRequest request
    ) {
        return ApiRespond.<AdminCourseResponse>builder()
                .result(adminCourseService.rejectLiveCourse(courseID, request.getNote()))
                .message("Course live rejected with review note")
                .build();
    }

    // ====================== COURSE DRAFT LIST & DETAIL ======================

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: danh sách course draft theo status (EDITING / PENDING_REVIEW / REJECTED)")
    @GetMapping("/drafts")
    public ApiRespond<List<AdminCourseDraftResponse>> getDraftsByStatus(
            @RequestParam(required = false) CourseDraftStatus status
    ) {
        return ApiRespond.<List<AdminCourseDraftResponse>>builder()
                .result(adminCourseService.getCourseDraftsForAdmin(status))
                .build();
    }

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: xem metadata 1 course draft (không kèm curriculum)")
    @GetMapping("/drafts/{draftID}")
    public ApiRespond<AdminCourseDraftResponse> getDraftDetail(
            @PathVariable Long draftID
    ) {
        return ApiRespond.<AdminCourseDraftResponse>builder()
                .result(adminCourseService.getCourseDraftDetail(draftID))
                .build();
    }

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: xem chi tiết 1 course draft (kèm Section/Lesson/Resource/Objectives)")
    @GetMapping("/drafts/{draftID}/detail")
    public ApiRespond<AdminCourseDetailResponse> getDraftDetailFull(
            @PathVariable Long draftID
    ) {
        return ApiRespond.<AdminCourseDetailResponse>builder()
                .result(adminCourseService.getCourseDraftDetailWithCurriculum(draftID))
                .build();
    }

    // ====================== COURSE DRAFT NOTE & APPROVE / REJECT ======================

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: update review note cho course draft")
    @PutMapping("/drafts/{draftID}/review-note")
    public ApiRespond<AdminCourseDetailResponse> updateCourseDraftReviewNote(
            @PathVariable Long draftID,
            @RequestBody AdminCourseReviewNoteRequest request
    ) {
        return ApiRespond.<AdminCourseDetailResponse>builder()
                .result(adminCourseService.updateCourseDraftReviewNote(draftID, request.getNote()))
                .message("Updated review note for course draft")
                .build();
    }

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: approve draft → merge vào course live, xóa draft")
    @PostMapping("/drafts/{draftID}/approve")
    public ApiRespond<AdminCourseResponse> approveDraft(@PathVariable Long draftID) {
        return ApiRespond.<AdminCourseResponse>builder()
                .result(adminCourseService.approveCourseDraft(draftID))
                .message("Draft approved and merged into live course")
                .build();
    }

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: reject draft (không ảnh hưởng course live) + optional note")
    @PostMapping("/drafts/{draftID}/reject")
    public ApiRespond<Void> rejectDraft(
            @PathVariable Long draftID,
            @RequestBody(required = false) AdminCourseReviewNoteRequest request
    ) {
        String note = request != null ? request.getNote() : null;
        adminCourseService.rejectCourseDraft(draftID, note);
        return ApiRespond.<Void>builder()
                .message("Draft rejected")
                .build();
    }

    @PreAuthorize("principal.claims['role'] == 'Admin'")
    @Operation(summary = "Admin: xem chi tiết các thay đổi giữa course live và draft")
    @GetMapping("/drafts/{draftID}/changes")
    public ApiRespond<AdminCourseDraftChangesResponse> getDraftChanges(
            @PathVariable Long draftID
    ) {
        return ApiRespond.<AdminCourseDraftChangesResponse>builder()
                .result(adminCourseService.getCourseDraftChanges(draftID))
                .message("Fetched diff between live course and draft")
                .build();
    }

}
