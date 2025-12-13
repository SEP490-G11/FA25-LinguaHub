package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.EvidenceRequest;
import edu.lms.dto.response.RefundRequestResponse;
import edu.lms.service.RefundService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/tutor/refunds")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class TutorRefundController {

    RefundService refundService;

    @GetMapping("/{id}")
    public ApiRespond<RefundRequestResponse> getOneForTutor(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long tutorUserId = jwt.getClaim("userId");
        RefundRequestResponse dto = refundService.getOneForTutor(id, tutorUserId);
        return ApiRespond.success(dto);
    }

    // Tutor xác nhận "CÓ THAM GIA" + upload evidence
    @PatchMapping("/{id}/attend")
    public ApiRespond<Void> tutorConfirmAttend(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody EvidenceRequest evidence
    ) {
        Long tutorUserId = jwt.getClaim("userId");
        refundService.tutorConfirmAttend(id, tutorUserId, evidence);
        return ApiRespond.success(null);
    }

    // Tutor đồng ý refund (xác nhận KHÔNG tham gia / chấp nhận trả lại tiền)
    @PatchMapping("/{id}/agree-refund")
    public ApiRespond<Void> tutorAgreeRefund(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long tutorUserId = jwt.getClaim("userId");
        refundService.tutorAgreeRefund(id, tutorUserId);
        return ApiRespond.success(null);
    }
}
