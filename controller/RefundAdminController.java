package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.response.RefundRequestResponse;
import edu.lms.enums.RefundStatus;
import edu.lms.service.RefundService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/admin/refund")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class RefundAdminController {

    RefundService refundService;

    @GetMapping("/all")
    public ApiRespond<List<RefundRequestResponse>> getAll() {
        return ApiRespond.<List<RefundRequestResponse>>builder()
                .result(refundService.getAllRefunds())
                .build();
    }

    @GetMapping
    public ApiRespond<List<RefundRequestResponse>> getByStatus(@RequestParam RefundStatus status) {
        return ApiRespond.<List<RefundRequestResponse>>builder()
                .result(refundService.getByStatus(status))
                .build();
    }

    @GetMapping("/{id}")
    public ApiRespond<RefundRequestResponse> getOne(@PathVariable Long id) {
        return ApiRespond.<RefundRequestResponse>builder()
                .result(refundService.getOne(id))
                .build();
    }



    @PutMapping("/{id}/approve")
    public ApiRespond<Void> approve(@PathVariable Long id) {
        refundService.approve(id);
        return ApiRespond.<Void>builder()
                .message("Refund request approved successfully.")
                .build();
    }

    @PutMapping("/{id}/reject")
    public ApiRespond<Void> reject(@PathVariable Long id) {
        refundService.reject(id);
        return ApiRespond.<Void>builder()
                .message("Refund request rejected successfully.")
                .build();
    }
}
