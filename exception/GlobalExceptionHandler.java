package edu.lms.exception;

import edu.lms.dto.request.ApiRespond;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.Objects;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String MIN_ATTRIBUTE = "min";

    // ==================== CUSTOM APP EXCEPTION ====================
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiRespond> handleAppException(AppException ex) {
        ErrorCode errorCode = ex.getErrorcode();
        ApiRespond response = ApiRespond.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
        return ResponseEntity.status(errorCode.getStatusCode()).body(response);
    }

    // ==================== BAD CREDENTIALS (LOGIN WRONG PASSWORD) ====================
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiRespond> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Invalid login attempt: {}", ex.getMessage());
        ErrorCode errorCode = ErrorCode.PASSWORD_ENABLED;
        ApiRespond response = ApiRespond.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    // ==================== VALIDATION ERRORS (@NotBlank, @Size, ...) ====================
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiRespond> handleValidation(MethodArgumentNotValidException ex) {
        String enumKey = ex.getFieldError().getDefaultMessage();
        ErrorCode errorCode = ErrorCode.INVALID_KEY;
        Map<String, Object> attributes = null;

        try {
            errorCode = ErrorCode.valueOf(enumKey);
            var constraintViolation = ex.getBindingResult()
                    .getFieldErrors()
                    .getFirst()
                    .unwrap(ConstraintViolation.class);
            attributes = constraintViolation.getConstraintDescriptor().getAttributes();
            log.debug("Validation attributes: {}", attributes);
        } catch (IllegalArgumentException ignored) {
        }

        ApiRespond response = ApiRespond.builder()
                .code(errorCode.getCode())
                .message(Objects.nonNull(attributes)
                        ? mapAttributes(errorCode.getMessage(), attributes)
                        : errorCode.getMessage())
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    // ==================== INVALID JSON FORMAT ====================
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiRespond> handleJsonParse(HttpMessageNotReadableException ex) {
        log.error("JSON parse error: {}", ex.getMessage());
        ApiRespond response = ApiRespond.builder()
                .code(ErrorCode.INVALID_KEY.getCode())
                .message("Invalid JSON format")
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // ==================== AUTHORIZATION DENIED ====================
    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<ApiRespond> handleAuthorizationDenied(AuthorizationDeniedException ex) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
        ApiRespond response = ApiRespond.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
        return ResponseEntity.status(errorCode.getStatusCode()).body(response);
    }

    // ==================== ENTITY NOT FOUND ====================
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiRespond> handleEntityNotFound(EntityNotFoundException ex) {
        ApiRespond response = ApiRespond.builder()
                .code(404)
                .message(ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // ==================== TUTOR EXCEPTIONS ====================
    @ExceptionHandler(TutorApplicationException.class)
    public ResponseEntity<ApiRespond> handleTutorApplication(TutorApplicationException ex) {
        ApiRespond response = ApiRespond.builder()
                .code(400)
                .message(ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(TutorNotFoundException.class)
    public ResponseEntity<ApiRespond> handleTutorNotFound(TutorNotFoundException ex) {
        ApiRespond response = ApiRespond.builder()
                .code(404)
                .message(ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // ==================== RUNTIME FALLBACK ====================
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiRespond> handleRuntimeException(RuntimeException ex) {
        log.error("Unhandled exception: ", ex);
        ApiRespond response = ApiRespond.builder()
                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                .message(ex.getMessage() != null
                        ? ex.getMessage()
                        : ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    // ==================== HELPER ====================
    private String mapAttributes(String message, Map<String, Object> attributes) {
        String minValue = String.valueOf(attributes.get(MIN_ATTRIBUTE));
        return message.replace("{" + MIN_ATTRIBUTE + "}", minValue);
    }
}
