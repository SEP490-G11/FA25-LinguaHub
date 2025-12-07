package edu.lms.controller;

import edu.lms.dto.request.WithdrawRequest;
import edu.lms.dto.response.WithdrawResponse;
import edu.lms.service.WithdrawService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/tutor/withdraw")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class TutorWithdrawController {

    WithdrawService withdrawService;

    // Tutor gửi yêu cầu rút tiền
    @PostMapping("/request")
    public WithdrawResponse requestWithdraw(
            @RequestParam Long tutorId,
            @RequestBody WithdrawRequest request
    ) {
        return withdrawService.createWithdraw(tutorId, request);
    }

    // Tutor xem lịch sử rút tiền
    @GetMapping("/history")
    public List<WithdrawResponse> getWithdrawHistory(@RequestParam Long tutorId) {
        return withdrawService.getWithdrawHistory(tutorId);
    }

    // Tutor xem số dư
    @GetMapping("/balance")
    public String getBalance(@RequestParam Long tutorId) {
        return withdrawService.getBalance(tutorId).toPlainString();
    }
}
