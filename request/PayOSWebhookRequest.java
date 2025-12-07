package edu.lms.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true) //bỏ qua field lạ như "success", "currency", ...
public class PayOSWebhookRequest {

    private String code;
    private String desc;
    private Boolean success;
    private PayOSWebhookData data;
    private String signature;

    // fallback khi test tay
    private Long orderCode;
    private String status;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PayOSWebhookData {
        private Long orderCode;
        private String status;
        private java.math.BigDecimal amount;//số thực/tiền (không dùng String)
        private String description;
        private String accountNumber;
        private String accountName;
        private String paymentLinkId;
        private String transactionDateTime;
        private String qrCode;
        private String reference;
        private String currency;
        private String code;
        private String desc;
        private String virtualAccountNumber;
        private String counterAccountBankId;
        private String counterAccountBankName;
        private String counterAccountName;
        private String counterAccountNumber;
        private String virtualAccountName;
    }
}
