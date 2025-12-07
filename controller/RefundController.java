package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.RefundInfoRequest;
import edu.lms.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/learner/refund")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @PutMapping("/{refundId}")
    public ApiRespond<Void> submitRefundRequest(
            @PathVariable Long refundId,
            @RequestBody RefundInfoRequest req,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = jwt.getClaim("userId");

        refundService.submitRefundInfo(refundId, req, userId);

        return ApiRespond.<Void>builder()
                .message("Refund info submitted successfully.")
                .build();
    }
}

