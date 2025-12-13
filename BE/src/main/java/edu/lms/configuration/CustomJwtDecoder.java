package edu.lms.configuration;

import java.text.ParseException;
import java.util.Objects;
import javax.crypto.spec.SecretKeySpec;

import edu.lms.dto.request.IntrospectRequest;
import edu.lms.service.AuthenticationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import com.nimbusds.jose.JOSEException;
@Slf4j
@Component
public class CustomJwtDecoder implements JwtDecoder {

    @Value("${jwt.signerKey}")
    private String signerKey;

    @Autowired
    private AuthenticationService authenticationService;

    private NimbusJwtDecoder nimbusJwtDecoder;

    @Override
    public Jwt decode(String token) throws JwtException {
        if (token == null || token.trim().isEmpty()) {
            throw new JwtException("Missing or empty token");
        }


        try {
            var response = authenticationService.introspect(
                    IntrospectRequest.builder().token(token).build());

            if (!response.isValid()) {
                throw new JwtException("Token invalid or expired");
            }
        } catch (JOSEException | ParseException e) {
            throw new JwtException("Token parsing error: " + e.getMessage(), e);
        }

        if (Objects.isNull(nimbusJwtDecoder)) {
            SecretKeySpec keySpec = new SecretKeySpec(signerKey.getBytes(), "HmacSHA512");
            nimbusJwtDecoder = NimbusJwtDecoder
                    .withSecretKey(keySpec)
                    .macAlgorithm(MacAlgorithm.HS512)
                    .build();
        }

        try {
            log.warn("DECODE SIGNER=" + signerKey);

            return nimbusJwtDecoder.decode(token);
        } catch (Exception e) {
            throw new JwtException("Failed to decode JWT: " + e.getMessage(), e);
        }
    }
}
