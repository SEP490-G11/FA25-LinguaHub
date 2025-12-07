package edu.lms.service;

import edu.lms.dto.response.ChatMessageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketChatService {

    private final SimpMessagingTemplate messagingTemplate;

    // Note: Authorization is validated in ChatService before calling this service
    // This service only handles broadcasting, not authorization

    /**
     * Broadcast a new message to all subscribers of a chat room
     * This is called after a message is saved via REST API
     */
    public void broadcastMessage(ChatMessageResponse messageResponse) {
        try {
            // Use ChatMessageResponse directly - frontend will know it's a MESSAGE
            String destination = "/topic/chat/" + messageResponse.getChatRoomID();
            messagingTemplate.convertAndSend(destination, messageResponse);
            log.info("Message broadcasted via WebSocket to: {}", destination);
        } catch (Exception e) {
            log.error("Error broadcasting message via WebSocket", e);
        }
    }

    /**
     * Send typing indicator to chat room
     */
    public void broadcastTyping(Long chatRoomID, Long senderID) {
        try {
            // Use Map for typing indicator (simple structure)
            Map<String, Object> typingResponse = new HashMap<>();
            typingResponse.put("type", "TYPING");
            typingResponse.put("chatRoomID", chatRoomID);
            typingResponse.put("senderID", senderID);

            String destination = "/topic/chat/" + chatRoomID + "/typing";
            messagingTemplate.convertAndSend(destination, typingResponse);
            log.debug("Typing indicator broadcasted to: {}", destination);
        } catch (Exception e) {
            log.error("Error broadcasting typing indicator", e);
        }
    }

    /**
     * Send error message to specific user
     */
    public void sendErrorToUser(Long userID, String errorMessage) {
        try {
            // Use Map for error message (simple structure)
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("type", "ERROR");
            errorResponse.put("error", errorMessage);

            messagingTemplate.convertAndSendToUser(
                    userID.toString(),
                    "/queue/errors",
                    errorResponse
            );
            log.info("Error message sent to user: {}", userID);
        } catch (Exception e) {
            log.error("Error sending error message to user {}", userID, e);
        }
    }
}

