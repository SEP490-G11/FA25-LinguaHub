package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.BookingFeedbackRequest;
import edu.lms.dto.response.BookingFeedbackResponse;
import edu.lms.service.BookingFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/booking-feedback")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
@Tag(name = "Booking Feedback", description = "Learner feedback cho buổi booking 1-1")
public class BookingFeedbackController {

    BookingFeedbackService bookingFeedbackService;

    @Operation(summary = "Learner viết feedback cho booking plan khi đã từng booking (thanh toán thành công)")
    @PostMapping("/{bookingPlanId}")
    public ApiRespond<BookingFeedbackResponse> createFeedback(
            @PathVariable Long bookingPlanId,
            @RequestBody BookingFeedbackRequest request
    ) {
        return ApiRespond.<BookingFeedbackResponse>builder()
                .result(bookingFeedbackService.createFeedback(bookingPlanId, request))
                .message("Feedback created successfully")
                .build();
    }

    @Operation(summary = "Learner chỉnh sửa feedback booking của chính mình")
    @PutMapping("/{feedbackId}")
    public ApiRespond<BookingFeedbackResponse> updateFeedback(
            @PathVariable Long feedbackId,
            @RequestBody BookingFeedbackRequest request
    ) {
        return ApiRespond.<BookingFeedbackResponse>builder()
                .result(bookingFeedbackService.updateFeedback(feedbackId, request))
                .message("Feedback updated successfully")
                .build();
    }

    @Operation(summary = "Learner xoá feedback booking của chính mình")
    @DeleteMapping("/{feedbackId}")
    public ApiRespond<Void> deleteFeedback(@PathVariable Long feedbackId) {
        bookingFeedbackService.deleteFeedback(feedbackId);
        return ApiRespond.<Void>builder()
                .message("Feedback deleted successfully")
                .build();
    }
}
