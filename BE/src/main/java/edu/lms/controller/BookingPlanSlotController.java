package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.EvidenceRequest;
import edu.lms.dto.request.BookingComplaintRequest;
import edu.lms.dto.response.BookingPlanSlotResponse;
import edu.lms.dto.response.UserResponse;
import edu.lms.service.BookingAttendanceService;
import edu.lms.service.BookingPlanSlotService;
import edu.lms.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/booking-slots")
@RequiredArgsConstructor
@Slf4j
public class BookingPlanSlotController {

    private final BookingPlanSlotService bookingPlanSlotService;
    private final BookingAttendanceService bookingAttendanceService;
    private final UserService userService;

    @GetMapping("/my-slots")
    public ApiRespond<List<BookingPlanSlotResponse>> getMySlots() {
        UserResponse user = userService.getMyInfo();
        Long userId = user.getUserID();
        String role = user.getRole(); // LEARNER / TUTOR

        List<BookingPlanSlotResponse> result = ("LEARNER".equalsIgnoreCase(role))
                ? bookingPlanSlotService.getSlotsForUser(userId)
                : bookingPlanSlotService.getSlotsForTutor(userId);

        return ApiRespond.<List<BookingPlanSlotResponse>>builder()
                .code(1000)
                .message("OK")
                .result(result)
                .build();
    }

    @GetMapping("/public/tutors/{tutorId}/slots/paid")
    public List<BookingPlanSlotResponse> getPaidSlotsByTutor(
            @PathVariable Long tutorId
    ) {
        return bookingPlanSlotService.getPaidSlotsByTutor(tutorId);
    }

    // Learner xác nhận tham gia + evidence
    @PatchMapping("/{slotId}/learner-join")
    public ApiRespond<Void> learnerConfirmJoin(
            @PathVariable Long slotId,
            @RequestBody EvidenceRequest dto
    ) {
        var currentUser = userService.getMyInfo();
        Long userId = currentUser.getUserID();

        bookingAttendanceService.learnerConfirmJoin(userId, slotId, dto);

        return ApiRespond.<Void>builder()
                .code(1000)
                .message("OK")
                .result(null)
                .build();
    }

    // Tutor xác nhận tham gia + evidence
    @PatchMapping("/{slotId}/tutor-join")
    public ApiRespond<Void> tutorConfirmJoin(
            @PathVariable Long slotId,
            @RequestBody EvidenceRequest dto
    ) {
        var currentUser = userService.getMyInfo();
        Long userId = currentUser.getUserID();

        bookingAttendanceService.tutorConfirmJoin(userId, slotId, dto);

        return ApiRespond.<Void>builder()
                .code(1000)
                .message("OK")
                .result(null)
                .build();
    }

    // Learner khiếu nại + evidence
    @PostMapping("/{slotId}/complain")
    public ApiRespond<Void> learnerComplain(
            @PathVariable Long slotId,
            @RequestBody BookingComplaintRequest dto
    ) {
        var currentUser = userService.getMyInfo();
        Long userId = currentUser.getUserID();

        bookingAttendanceService.learnerComplain(userId, slotId, dto);

        return ApiRespond.<Void>builder()
                .code(1000)
                .message("OK")
                .result(null)
                .build();
    }
}
