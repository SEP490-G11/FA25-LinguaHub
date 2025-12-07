package edu.lms.controller;

import edu.lms.dto.request.PaymentRequest;
import edu.lms.dto.response.PaymentResponse;
import edu.lms.entity.Payment;
import edu.lms.enums.PaymentType;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.PaymentRepository;
import edu.lms.service.PayOSService;
import edu.lms.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@Slf4j
@Tag(name = "Payment Management", description = "Endpoints for creating and managing payments (Admin / Tutor / Learner)")
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    @Value("${app.frontend-url}")
    private String frontendUrl;

    private final PaymentService paymentService;
    private final PayOSService payOSService;
    private final PaymentRepository paymentRepository;

    @Operation(summary = "Create a payment (PayOS)", description = "Create a pending payment link via PayOS")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Payment link created successfully",
                    content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "400", description = "Invalid payment request", content = @Content)
    })
    @PostMapping("/create")
    public ResponseEntity<?> createPayment(@RequestBody PaymentRequest request) {
        return paymentService.createPayment(request);
    }

    @GetMapping("/me")
    public ResponseEntity<List<PaymentResponse>> getMyPayments(
            @AuthenticationPrincipal(expression = "claims['userId']") Long userId,
            @AuthenticationPrincipal(expression = "claims['role']") String role
    ) {
        List<PaymentResponse> payments = paymentService.getPaymentsForMe(userId, role);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/admin")
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {
        List<PaymentResponse> payments = paymentService.getAllPayments();
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByTutor(@PathVariable Long tutorId) {
        List<PaymentResponse> payments = paymentService.getPaymentsByTutor(tutorId);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByUser(@PathVariable Long userId) {
        List<PaymentResponse> payments = paymentService.getPaymentsByUser(userId);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return new ResponseEntity<>("Payment service is running ✅", HttpStatus.OK);
    }

    // ================== USER CANCEL (PayOS cancelUrl) ==================
    @GetMapping("/cancel")
    public void cancelPayment(
            @RequestParam("paymentId") Long paymentId,
            HttpServletResponse response
    ) throws IOException {

        log.info("[CANCEL CALLBACK] Received cancel for paymentId={}", paymentId);

        // 1. Update trạng thái PAYMENT → CANCELLED + rollback slot nếu Booking
        Payment payment = paymentService.handleUserCancelPayment(paymentId);

        log.info("[CANCEL CALLBACK] After handleUserCancelPayment: id={} | status={} | isPaid={}",
                payment.getPaymentID(), payment.getStatus(), payment.getIsPaid());

        // 2. Tính redirect URL cho FE
        Long tutorid = payment.getTutorId();
        PaymentType type = payment.getPaymentType();

        String redirectUrl;
        if (type == PaymentType.Course) {
            redirectUrl = frontendUrl + "/courses/" + tutorid + "?paid=false";
        } else if (type == PaymentType.Booking) {
            redirectUrl = frontendUrl + "/book-tutor/" + tutorid + "?paid=false";
        } else {
            redirectUrl = frontendUrl + "/payments/result?paid=false";
        }

        response.sendRedirect(redirectUrl);
    }

    @GetMapping("/success")
    public void successPayment(
            @RequestParam("paymentId") Long paymentId,
            HttpServletResponse response
    ) throws IOException {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        Long tutorid = payment.getTutorId();
        PaymentType type = payment.getPaymentType();

        String redirectUrl;

        if (type == PaymentType.Course) {
            redirectUrl = frontendUrl + "/courses/" + tutorid + "?paid=true";
        } else if (type == PaymentType.Booking) {
            redirectUrl = frontendUrl + "/book-tutor/" + tutorid + "?paid=true";
        } else {
            redirectUrl = frontendUrl + "/payments/?paid=true";
        }

        response.sendRedirect(redirectUrl);
    }
}
