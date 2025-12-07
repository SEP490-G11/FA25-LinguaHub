package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.SendMessageRequest;
import edu.lms.dto.response.ChatMessageResponse;
import edu.lms.dto.response.ChatRoomResponse;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.security.UserPrincipal;
import edu.lms.service.ChatService;
import edu.lms.service.WebSocketChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Chat", description = "API quản lý chatroom và tin nhắn giữa Learner và Tutor")
public class ChatController {

    ChatService chatService;
    WebSocketChatService webSocketChatService;

    /**
     * Get or create Advice chat room
     * Flow A: Learner views Tutor profile → click "Chat to Ask"
     * Advice room: Trước khi book slot (pre-booking consultation)
     */
    @Operation(summary = "Learner tạo/lấy Advice chat room với Tutor (lấy learnerID từ authentication)")
    @PostMapping("/advice/{tutorID}")
    public ResponseEntity<ApiRespond<ChatRoomResponse>> getOrCreateAdviceRoom(
            @PathVariable Long tutorID
    ) {
        Long learnerID = getCurrentUserId();
        ChatRoomResponse room = chatService.getOrCreateAdviceRoom(learnerID, tutorID);
        return ResponseEntity.ok(ApiRespond.<ChatRoomResponse>builder()
                .result(room)
                .message("Advice chat room retrieved successfully")
                .build());
    }

    /**
     * Get or create Training chat room
     * Flow B: Learner đã book và thanh toán slot → có thể chat trong Training room
     * Training room: Sau khi book slot (learning sessions)
     */
    @Operation(summary = "Learner tạo/lấy Training chat room với Tutor (lấy learnerID từ authentication) - Yêu cầu: Learner phải đã book và thanh toán ít nhất 1 slot")
    @PostMapping("/training/{tutorID}")
    public ResponseEntity<ApiRespond<ChatRoomResponse>> getOrCreateTrainingRoom(
            @PathVariable Long tutorID
    ) {
        Long learnerID = getCurrentUserId();
        ChatRoomResponse room = chatService.getOrCreateTrainingRoom(learnerID, tutorID);
        return ResponseEntity.ok(ApiRespond.<ChatRoomResponse>builder()
                .result(room)
                .message("Training chat room retrieved successfully")
                .build());
    }

    /**
     * Send message to chat room
     * Supports both Advice and Training chat
     */
    @Operation(summary = "Learner/Tutor gửi tin nhắn trong chat room (lấy senderID từ authentication) - Advice room: chỉ Text, Training room: Text/Image/File")
    @PostMapping("/message")
    public ResponseEntity<ApiRespond<ChatMessageResponse>> sendMessage(
            @RequestBody @Valid SendMessageRequest request
    ) {
        Long senderID = getCurrentUserId();
        ChatMessageResponse message = chatService.sendMessage(senderID, request);
        return ResponseEntity.ok(ApiRespond.<ChatMessageResponse>builder()
                .result(message)
                .message("Message sent successfully")
                .build());
    }

    /**
     * Get chat room with messages
     */
    @Operation(summary = "Learner/Tutor xem lịch sử chat room với tất cả tin nhắn (lấy userID từ authentication)")
    @GetMapping("/room/{chatRoomId}")
    public ResponseEntity<ApiRespond<ChatRoomResponse>> getChatRoom(
            @PathVariable Long chatRoomId
    ) {
        Long userID = getCurrentUserId();
        ChatRoomResponse room = chatService.getChatRoom(chatRoomId, userID);
        return ResponseEntity.ok(ApiRespond.<ChatRoomResponse>builder()
                .result(room)
                .message("Chat room retrieved successfully")
                .build());
    }

    /**
     * Get all chat rooms for current user
     */
    @Operation(summary = "Learner/Tutor xem danh sách tất cả chat rooms của chính mình (lấy userID từ authentication) - Bao gồm cả rooms ở vai trò learner và tutor")
    @GetMapping("/rooms")
    public ResponseEntity<ApiRespond<List<ChatRoomResponse>>> getUserChatRooms() {
        Long userID = getCurrentUserId();
        List<ChatRoomResponse> rooms = chatService.getUserChatRooms(userID);
        return ResponseEntity.ok(ApiRespond.<List<ChatRoomResponse>>builder()
                .result(rooms)
                .message("Chat rooms retrieved successfully")
                .build());
    }

    /**
     * Send Google Meet link to chat room (Tutor only)
     * This allows tutor to share meeting link from Booking.MeetingLink
     */
    @Operation(summary = "Tutor gửi Google Meet link vào chat room (lấy tutorID từ authentication) - Chỉ Tutor mới có thể gửi meeting link")
    @PostMapping("/room/{chatRoomId}/meeting-link")
    public ResponseEntity<ApiRespond<ChatMessageResponse>> sendMeetingLink(
            @PathVariable Long chatRoomId,
            @RequestBody String meetingLink
    ) {
        Long tutorID = getCurrentUserId();
        ChatMessageResponse message = chatService.sendMeetingLink(tutorID, chatRoomId, meetingLink);
        return ResponseEntity.ok(ApiRespond.<ChatMessageResponse>builder()
                .result(message)
                .message("Meeting link sent successfully")
                .build());
    }

    /**
     * Send typing indicator to chat room
     * This broadcasts typing status via WebSocket to other participants
     */
    @Operation(summary = "Gửi typing indicator vào chat room (lấy senderID từ authentication) - Broadcast qua WebSocket")
    @PostMapping("/room/{chatRoomId}/typing")
    public ResponseEntity<ApiRespond<String>> sendTypingIndicator(
            @PathVariable Long chatRoomId
    ) {
        Long senderID = getCurrentUserId();
        
        // Validate user has access to this chat room before broadcasting typing
        chatService.validateUserAccessToChatRoom(chatRoomId, senderID);
        
        webSocketChatService.broadcastTyping(chatRoomId, senderID);
        return ResponseEntity.ok(ApiRespond.<String>builder()
                .result("Typing indicator sent")
                .message("Typing indicator broadcasted successfully")
                .build());
    }

    /**
     * Helper method to get current user ID from JWT token or UserPrincipal
     * Hỗ trợ cả 2 cách authentication: JWT token và UserPrincipal
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // Kiểm tra authentication null trước
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        
        // Trường hợp 1: JWT token (OAuth2)
        if (authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            Object userId = jwt.getClaim("userId");
            
            if (userId instanceof Integer) {
                return ((Integer) userId).longValue();
            } else if (userId instanceof Long) {
                return (Long) userId;
            } else if (userId instanceof Number) {
                return ((Number) userId).longValue();
            }
            
            // Nếu không tìm thấy userId trong JWT claim, throw exception
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        
        // Trường hợp 2: UserPrincipal (Form-based authentication)
        if (authentication.getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) authentication.getPrincipal()).getUserId();
        }
        
        // Không phải JWT cũng không phải UserPrincipal
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
}


