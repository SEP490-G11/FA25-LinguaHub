package edu.lms.configuration;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
public class PayOSProperties {

    @Value("${payos.client-id}")
    private String clientId;

    @Value("${payos.api-key}")
    private String apiKey;

    @Value("${payos.secret-key}")
    private String secretKey;

    @Value("${payos.endpoint}")
    private String endpoint;

    @Value("${payos.return-url}")
    private String returnUrl;

    @Value("${payos.cancel-url}")
    private String cancelUrl;

    @Value("${payos.verify-signature}")
    private boolean verifySignature;
}
