package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.CourseReviewRequest;
import edu.lms.dto.response.CourseReviewResponse;
import edu.lms.service.CourseReviewService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/review")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class CourseReviewController {

    CourseReviewService courseReviewService;

    @Operation(summary = "leaner viết review về khóa học khi đã dăng ký và đã hoàn thành khóa học hơn 50%")
    @PostMapping("/{courseId}")
    public ApiRespond<CourseReviewResponse> createReview(
            @PathVariable Long courseId,
            @Valid @RequestBody CourseReviewRequest request
    ) {
        return ApiRespond.<CourseReviewResponse>builder()
                .result(courseReviewService.createReview(courseId, request))
                .message("Review created successfully")
                .build();
    }

    @Operation(summary = "learner chỉnh sửa review của chính mình")
    @PutMapping("/{reviewId}")
    public ApiRespond<CourseReviewResponse> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody CourseReviewRequest request
    ) {
        return ApiRespond.<CourseReviewResponse>builder()
                .result(courseReviewService.updateReview(reviewId, request))
                .message("Review updated successfully")
                .build();
    }

    @Operation(summary = "xoá review")
    @DeleteMapping("/{reviewId}")
    public ApiRespond<Void> deleteReview(@PathVariable Long reviewId) {
        courseReviewService.deleteReview(reviewId);
        return ApiRespond.<Void>builder()
                .message("Review deleted successfully")
                .build();
    }
}
