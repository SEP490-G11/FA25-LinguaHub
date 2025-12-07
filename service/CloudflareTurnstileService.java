package edu.lms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class CloudflareTurnstileService {

    @Value("${cloudflare.turnstile.secret-key}")
    private String secretKey;

    // Nếu muốn có flag bật/tắt:
    @Value("${cloudflare.turnstile.enabled:true}")
    private boolean enabled;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final ObjectMapper mapper = new ObjectMapper();

    public boolean verify(String token) {
        if (!enabled) {
            // Dev mode: bỏ qua check
            log.info("[TURNSTILE] Verification disabled by config");
            return true;
        }

        if (token == null || token.isBlank()) {
            log.warn("[TURNSTILE] Empty token");
            return false;
        }

        try {
            String url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("secret", secretKey);
            body.add("response", token);
            // Có thể thêm remoteip nếu muốn: body.add("remoteip", clientIp);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> entity =
                    new HttpEntity<>(body, headers);

            ResponseEntity<String> response =
                    restTemplate.postForEntity(url, entity, String.class);

            JsonNode root = mapper.readTree(response.getBody());
            boolean success = root.path("success").asBoolean(false);

            if (!success) {
                log.warn("[TURNSTILE] verify FAIL, response={}", response.getBody());
            } else {
                log.info("[TURNSTILE] verify OK");
            }

            return success;
        } catch (Exception e) {
            log.error("[TURNSTILE] verify error: {}", e.getMessage(), e);
            return false;
        }
    }
}
