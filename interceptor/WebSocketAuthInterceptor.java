package edu.lms.interceptor;

import edu.lms.configuration.CustomJwtDecoder;
import edu.lms.entity.ChatRoom;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final CustomJwtDecoder jwtDecoder;
    private final ChatRoomRepository chatRoomRepository;

    // Pattern to extract chatRoomID from destination like /topic/chat/123
    private static final Pattern CHAT_ROOM_PATTERN = Pattern.compile("/topic/chat/(\\d+)");

    /**
     * Simple principal class to hold user information for WebSocket authentication
     */
    private static class WebSocketPrincipal {
        private final Long userId;
        private final String email;

        public WebSocketPrincipal(Long userId, String email) {
            this.userId = userId;
            this.email = email;
        }

        public Long getUserId() {
            return userId;
        }

        public String getEmail() {
            return email;
        }
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        // Handle CONNECT command - authenticate user
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Extract token from headers
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            String token = null;

            if (authHeaders != null && !authHeaders.isEmpty()) {
                String authHeader = authHeaders.get(0);
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                }
            }

            // Also check query parameter (for SockJS fallback)
            if (token == null) {
                String query = accessor.getFirstNativeHeader("query");
                if (query != null && query.contains("token=")) {
                    token = query.substring(query.indexOf("token=") + 6);
                    if (token.contains("&")) {
                        token = token.substring(0, token.indexOf("&"));
                    }
                }
            }

            if (token != null && !token.isEmpty()) {
                try {
                    // Decode and validate JWT token
                    Jwt jwt = jwtDecoder.decode(token);

                    // Extract user ID from JWT
                    Object userId = jwt.getClaim("userId");
                    final Long userID;

                    if (userId instanceof Integer) {
                        userID = ((Integer) userId).longValue();
                    } else if (userId instanceof Long) {
                        userID = (Long) userId;
                    } else if (userId instanceof Number) {
                        userID = ((Number) userId).longValue();
                    } else {
                        log.warn("User ID not found in JWT token");
                        throw new AppException(ErrorCode.UNAUTHENTICATED);
                    }

                    // Create authentication object
                    List<org.springframework.security.core.GrantedAuthority> authorities = new ArrayList<>();

                    List<String> permissions = jwt.getClaimAsStringList("permissions");
                    if (permissions != null) {
                        authorities.addAll(permissions.stream()
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList()));
                    }

                    String role = jwt.getClaimAsString("role");
                    if (role != null) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
                    }

                    // Create a simple principal object with user ID
                    WebSocketPrincipal principal = new WebSocketPrincipal(
                            userID,
                            jwt.getClaimAsString("email")
                    );

                    Authentication authentication = new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            authorities
                    );

                    accessor.setUser(authentication);
                    log.info("WebSocket connection authenticated for user: {}", userID);
                } catch (Exception e) {
                    log.error("Error authenticating WebSocket connection", e);
                    throw new AppException(ErrorCode.UNAUTHENTICATED);
                }
            } else {
                log.warn("No authentication token provided for WebSocket connection");
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }
        }

        // Handle SUBSCRIBE command - validate user has access to chat room
        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();

            if (destination != null && destination.startsWith("/topic/chat/")) {
                // Extract chatRoomID from destination
                Matcher matcher = CHAT_ROOM_PATTERN.matcher(destination);
                if (matcher.find()) {
                    try {
                        Long chatRoomID = Long.parseLong(matcher.group(1));
                        Long userID = extractUserIdFromPrincipal(accessor.getUser());

                        if (userID != null) {
                            // Validate user has access to this chat room
                            validateChatRoomAccess(chatRoomID, userID);
                            log.debug("User {} authorized to subscribe to chat room {}", userID, chatRoomID);
                        } else {
                            log.warn("Cannot extract user ID from principal for subscription to {}", destination);
                            throw new AppException(ErrorCode.UNAUTHENTICATED);
                        }
                    } catch (NumberFormatException e) {
                        log.error("Invalid chat room ID in destination: {}", destination, e);
                        throw new AppException(ErrorCode.CHAT_ROOM_NOT_FOUND);
                    }
                }
            }
        }

        return message;
    }

    /**
     * Extract user ID from principal object
     */
    private Long extractUserIdFromPrincipal(java.security.Principal principal) {
        if (principal == null) {
            return null;
        }

        // Handle WebSocketPrincipal (from CONNECT)
        if (principal instanceof WebSocketPrincipal) {
            return ((WebSocketPrincipal) principal).getUserId();
        }

        // Handle Authentication object (if principal is actually an Authentication)
        if (principal instanceof Authentication) {
            Authentication auth = (Authentication) principal;
            Object authPrincipal = auth.getPrincipal();

            if (authPrincipal instanceof WebSocketPrincipal) {
                return ((WebSocketPrincipal) authPrincipal).getUserId();
            }

            // Handle JWT token
            if (authPrincipal instanceof Jwt) {
                Jwt jwt = (Jwt) authPrincipal;
                Object userId = jwt.getClaim("userId");

                if (userId instanceof Integer) {
                    return ((Integer) userId).longValue();
                } else if (userId instanceof Long) {
                    return (Long) userId;
                } else if (userId instanceof Number) {
                    return ((Number) userId).longValue();
                }
            }
        }

        return null;
    }

    /**
     * Validate user has access to chat room
     */
    private void validateChatRoomAccess(Long chatRoomID, Long userID) {
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomID)
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        boolean isLearner = chatRoom.getUser().getUserID().equals(userID);
        boolean isTutor = chatRoom.getTutor().getUser().getUserID().equals(userID);

        if (!isLearner && !isTutor) {
            log.warn("User {} attempted to subscribe to chat room {} without authorization", userID, chatRoomID);
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }
}

