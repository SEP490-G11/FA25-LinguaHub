package edu.lms.controller;

import edu.lms.dto.response.WithdrawResponse;
import edu.lms.enums.WithdrawStatus;
import edu.lms.service.AdminWithdrawService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/admin/withdraw")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class AdminWithdrawController {

    AdminWithdrawService adminWithdrawService;

    @PutMapping("/{id}/approve")
    public WithdrawResponse approve(@PathVariable Long id) {
        return adminWithdrawService.approve(id);
    }

    @PutMapping("/{id}/reject")
    public WithdrawResponse reject(@PathVariable Long id) {
        return adminWithdrawService.reject(id);
    }

    @GetMapping("/all")
    public List<WithdrawResponse> getAll() {
        return adminWithdrawService.getAll();
    }

    @GetMapping("/status")
    public List<WithdrawResponse> getByStatus(@RequestParam WithdrawStatus status) {
        return adminWithdrawService.getByStatus(status);
    }
}
