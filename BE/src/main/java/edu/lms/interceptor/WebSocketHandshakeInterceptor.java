package edu.lms.interceptor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * Interceptor to extract JWT token from query parameter during WebSocket handshake.
 * This is necessary because SockJS doesn't support custom headers during HTTP handshake.
 * The token is stored in session attributes and later retrieved by WebSocketAuthInterceptor.
 */
@Slf4j
@Component
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) throws Exception {
        
        log.info("WebSocket handshake started - URI: {}", request.getURI());
        
        // Extract token from query parameter
        String query = request.getURI().getQuery();
        if (query != null && query.contains("access_token=")) {
            String token = extractTokenFromQuery(query);
            if (token != null && !token.isEmpty()) {
                attributes.put("access_token", token);
                log.info("Token extracted from query parameter and stored in session attributes");
            }
        }
        
        // Also try to get from servlet request parameters (for SockJS)
        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            String token = servletRequest.getServletRequest().getParameter("access_token");
            if (token != null && !token.isEmpty()) {
                attributes.put("access_token", token);
                log.info("Token extracted from servlet request parameter");
            }
        }
        
        // Always allow handshake - authentication will be done in STOMP CONNECT
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        if (exception != null) {
            log.error("WebSocket handshake failed", exception);
        } else {
            log.debug("WebSocket handshake completed successfully");
        }
    }
    
    private String extractTokenFromQuery(String query) {
        String[] params = query.split("&");
        for (String param : params) {
            if (param.startsWith("access_token=")) {
                return param.substring("access_token=".length());
            }
        }
        return null;
    }
}
