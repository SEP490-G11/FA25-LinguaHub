package edu.lms.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.lms.service.PaymentWebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments/webhook")
@RequiredArgsConstructor
@Tag(name = "PayOS Webhook", description = "Receive PayOS payment status notifications")
public class PaymentWebhookController {

    private final PaymentWebhookService paymentWebhookService;
    private final ObjectMapper mapper;

    @PostMapping
    @Operation(summary = "Receive PayOS webhook", description = "Callback from PayOS after payment result")
    public ResponseEntity<Map<String, Object>> handleWebhook(@RequestBody String rawBody) {
        try {
            // 1) Log RAW BODY để xem PayOS gửi gì trong mọi trường hợp (SUCCESS / CANCEL / FAILED)
            log.info("[PAYOS WEBHOOK][RAW] {}", rawBody);

            JsonNode root = mapper.readTree(rawBody);

            // 2) Lấy code/desc ở ngoài
            String rootCode = root.path("code").asText();      // "00" / "xx"
            String rootDesc = root.path("desc").asText();      // "success" / "something"

            // 3) Lấy data bên trong
            JsonNode dataNode = root.path("data");
            long orderCode = dataNode.path("orderCode").asLong();  // 123
            String dataCode = dataNode.path("code").asText();      // "00" / "xx"
            String dataDesc = dataNode.path("desc").asText();      // "Thành công" / "..."

            // 4) Log chi tiết để debug CANCEL vs SUCCESS
            log.info("[PAYOS WEBHOOK][PARSED] orderCode={} | rootCode={} | rootDesc={} | dataCode={} | dataDesc={}",
                    orderCode, rootCode, rootDesc, dataCode, dataDesc);

            // 5) Chọn code & desc dùng nội bộ (ưu tiên trong data nếu có)
            String finalCode = (dataCode != null && !dataCode.isBlank()) ? dataCode : rootCode;
            String finalDesc = (dataDesc != null && !dataDesc.isBlank()) ? dataDesc : rootDesc;

            // 6) Forward sang service xử lý DB
            paymentWebhookService.handleWebhook(
                    String.valueOf(orderCode),
                    finalCode,
                    Map.of(
                            "rootCode", rootCode,
                            "rootDesc", rootDesc,
                            "dataCode", dataCode,
                            "dataDesc", dataDesc
                    )
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Webhook processed successfully",
                    "orderCode", orderCode,
                    "status", finalCode
            ));

        } catch (Exception e) {
            log.error("[PAYOS WEBHOOK][ERROR] {}", e.getMessage(), e);

            return ResponseEntity.ok(Map.of(
                    "message", "Webhook received but parse/handle failed",
                    "error", e.getMessage()
            ));
        }
    }
}
