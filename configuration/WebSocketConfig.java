package edu.lms.configuration;

import edu.lms.interceptor.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    /**
     * Configure STOMP message broker
     * - /topic: for broadcasting messages to multiple subscribers (pub-sub)
     * - /queue: for point-to-point messaging
     * - /user: for user-specific destinations
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Configure task scheduler for heartbeat
        ThreadPoolTaskScheduler taskScheduler = new ThreadPoolTaskScheduler();
        taskScheduler.setPoolSize(1);
        taskScheduler.setThreadNamePrefix("websocket-heartbeat-");
        taskScheduler.initialize();

        // Enable simple in-memory STOMP message broker
        // Supports destinations prefixed with "/topic" (pub-sub) and "/queue" (point-to-point)
        config.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{10000, 10000}) // Send heartbeat every 10 seconds
                .setTaskScheduler(taskScheduler);

        // Messages from client to server are sent to destinations prefixed with "/app"
        // Example: client sends to "/app/chat.sendMessage" -> handled by @MessageMapping("/chat.sendMessage")
        config.setApplicationDestinationPrefixes("/app");

        // User-specific destinations prefix (for private messages)
        // Example: server sends to "/user/{userId}/queue/errors"
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Register STOMP endpoints
     * Clients connect to these endpoints to establish WebSocket connection
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register STOMP endpoint with SockJS fallback
        // SockJS provides fallback options for browsers that don't support WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow all origins (adjust for production)
                .withSockJS() // Enable SockJS fallback (polling, long-polling, etc.)
                .setHeartbeatTime(25000) // Heartbeat interval for SockJS
                .setDisconnectDelay(5000); // Delay before disconnect

        // Also register native WebSocket endpoint (without SockJS)
        // For clients that support native WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }

    /**
     * Configure client inbound channel (messages from client to server)
     * Register authentication interceptor to validate JWT tokens
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Register authentication interceptor
        // This interceptor validates JWT token on CONNECT frame
        registration.interceptors(webSocketAuthInterceptor);

        // Optional: configure thread pool for inbound messages
        registration.taskExecutor().corePoolSize(4).maxPoolSize(8);
    }

    /**
     * Configure client outbound channel (messages from server to client)
     */
    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        // Optional: configure thread pool for outbound messages
        registration.taskExecutor().corePoolSize(4).maxPoolSize(8);
    }
}

