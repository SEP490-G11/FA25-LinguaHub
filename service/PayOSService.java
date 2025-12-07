package edu.lms.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.lms.configuration.PayOSProperties;
import edu.lms.enums.PaymentType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vn.payos.type.CheckoutResponseData;
import vn.payos.type.ItemData;
import vn.payos.type.PaymentData;
import vn.payos.util.SignatureUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayOSService {

    private final PayOSProperties props;
    private final RestTemplate rest = new RestTemplate();

    private static final ObjectMapper mapper =
            new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    // ⭐ TẠO LINK THANH TOÁN — FULL CHUẨN ⭐
    public CheckoutWrapper createPaymentLink(
            Long paymentId,
            Long userId,
            PaymentType type,
            Long targetId,
            BigDecimal amount,
            String description
    ) {
        try {
            long orderCode = System.currentTimeMillis() / 1000;

            String safeDesc = (description != null && description.length() > 25)
                    ? description.substring(0, 25)
                    : description;

            ItemData item = ItemData.builder()
                    .name(safeDesc)
                    .quantity(1)
                    .price(amount.intValue())
                    .build();

            String returnUrl = props.getReturnUrl() + "?paymentId=" + paymentId;
            String cancelUrl = props.getCancelUrl() + "?paymentId=" + paymentId;

            PaymentData paymentData = PaymentData.builder()
                    .orderCode(orderCode)
                    .amount(amount.intValue())
                    .description(safeDesc)
                    .returnUrl(returnUrl)
                    .cancelUrl(cancelUrl)
                    .item(item)
                    .build();

            String signature = SignatureUtils.createSignatureOfPaymentRequest(
                    paymentData,
                    props.getSecretKey()
            );
            paymentData.setSignature(signature);

            Map<String, Object> body = mapper.convertValue(paymentData, Map.class);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-client-id", props.getClientId());
            headers.set("x-api-key", props.getApiKey());

            String url = props.getEndpoint() + "/payment-requests";

            ResponseEntity<String> response =
                    rest.postForEntity(url, new HttpEntity<>(body, headers), String.class);

            if (response.getBody() == null) {
                throw new RuntimeException("Empty response from PayOS");
            }

            JsonNode root = mapper.readTree(response.getBody());
            JsonNode data = root.path("data");

            CheckoutResponseData checkout =
                    mapper.treeToValue(data, CheckoutResponseData.class);

            LocalDateTime expiredAt = LocalDateTime.now().plusMinutes(3);

            log.info(
                    "[PAYOS] Created payment | paymentId={} | orderCode={} | return={} | cancel={}",
                    paymentId, orderCode, returnUrl, cancelUrl
            );

            return new CheckoutWrapper(checkout, expiredAt);

        } catch (Exception e) {
            log.error("[PAYOS ERROR] {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create PayOS link", e);
        }
    }

    // Huỷ payment link bằng API PayOS
    public void cancelPaymentLink(String paymentLinkId) {
        if (paymentLinkId == null || paymentLinkId.isBlank()) {
            log.warn("[PAYOS] Cannot cancel payment: paymentLinkId is null");
            return;
        }

        try {
            String url = "https://api-merchant.payos.vn/v2/payment-requests/" + paymentLinkId + "/cancel";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-client-id", props.getClientId());
            headers.set("x-api-key", props.getApiKey());

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response =
                    rest.exchange(url, HttpMethod.POST, entity, String.class);

            log.info("[PAYOS] Cancel payment link {} -> status {} | body={}",
                    paymentLinkId,
                    response.getStatusCode(),
                    response.getBody());

        } catch (Exception e) {
            log.error("[PAYOS] Failed to cancel payment link {}: {}", paymentLinkId, e.getMessage());
        }
    }

    public record CheckoutWrapper(
            CheckoutResponseData data,
            LocalDateTime expiredAt
    ) {}
}
