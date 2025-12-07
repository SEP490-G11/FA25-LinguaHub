package edu.lms.service;

import edu.lms.dto.request.SendMessageRequest;
import edu.lms.dto.response.ChatMessageResponse;
import edu.lms.dto.response.ChatRoomResponse;
import edu.lms.entity.*;
import edu.lms.enums.ChatRoomType;
import edu.lms.enums.MessageType;
import edu.lms.enums.TutorStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Transactional
public class ChatService {

    ChatRoomRepository chatRoomRepository;
    ChatRoomMessageRepository chatRoomMessageRepository;
    UserRepository userRepository;
    TutorRepository tutorRepository;
    BookingPlanSlotRepository bookingPlanSlotRepository;
    WebSocketChatService webSocketChatService;

    /**
     * Get or create Advice chat room between Learner and Tutor
     * Business Rule: Each Learner-Tutor pair has only 1 Advice room
     */

    public ChatRoomResponse getOrCreateAdviceRoom(Long learnerID, Long tutorID) {
        log.info("Getting or creating Advice room for Learner {} and Tutor {}", learnerID, tutorID);

        User learner = userRepository.findById(learnerID)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        Tutor tutor = tutorRepository.findById(tutorID)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        // Prevent creating a chat room where learner is the same user as the tutor's
        // account
        if (tutor.getUser() != null && tutor.getUser().getUserID().equals(learnerID)) {
            log.warn("Prevent creating advice room: learnerID {} is same as tutor's userID {}", learnerID,
                    tutor.getUser().getUserID());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Check if Advice room already exists
        ChatRoom adviceRoom = chatRoomRepository
                .findByUserAndTutorAndChatRoomType(learner, tutor, ChatRoomType.Advice)
                .orElseGet(() -> {
                    log.info("Creating new Advice room for Learner {} and Tutor {}", learnerID, tutorID);
                    return createAdviceRoom(learner, tutor);
                });

        return mapToChatRoomResponse(adviceRoom);
    }

    // ...existing code...
    public ChatRoomResponse getOrCreateTrainingRoom(Long learnerID, Long tutorID) {
        log.info("Getting or creating Training room for Learner {} and Tutor {}", learnerID, tutorID);

        User learner = userRepository.findById(learnerID)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        Tutor tutor = tutorRepository.findById(tutorID)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        // Prevent creating a chat room where learner is the same user as the tutor's
        // account
        if (tutor.getUser() != null && tutor.getUser().getUserID().equals(learnerID)) {
            log.warn("Prevent creating training room: learnerID {} is same as tutor's userID {}", learnerID,
                    tutor.getUser().getUserID());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Kiểm tra xem learner đã có slot đã thanh toán (Paid) với tutor này chưa
        List<BookingPlanSlot> paidSlots = bookingPlanSlotRepository
                .findPaidSlotsByUserAndTutor(learnerID, tutorID);

        if (paidSlots.isEmpty()) {
            throw new AppException(ErrorCode.UNAUTHORIZED); // Chưa book và thanh toán slot nào
        }

        // Check if Training room already exists
        ChatRoom trainingRoom = chatRoomRepository
                .findByUserAndTutorAndChatRoomType(learner, tutor, ChatRoomType.Training)
                .orElseGet(() -> {
                    log.info("Creating new Training room for Learner {} and Tutor {}", learnerID, tutorID);
                    return createTrainingRoom(learner, tutor);
                });

        return mapToChatRoomResponse(trainingRoom);
    }

    /**
     * Create Advice room
     */
    private ChatRoom createAdviceRoom(User learner, Tutor tutor) {
        String title = String.format("Advice Chat - %s & %s",
                learner.getFullName() != null ? learner.getFullName() : learner.getEmail(),
                tutor.getUser().getFullName() != null ? tutor.getUser().getFullName() : tutor.getUser().getEmail());

        ChatRoom room = ChatRoom.builder()
                .user(learner)
                .tutor(tutor)
                .chatRoomType(ChatRoomType.Advice)
                .title(title)
                .description("Advice chat room for pre-booking consultation")
                .build();

        return chatRoomRepository.save(room);
    }

    /**
     * Create Training room
     */
    private ChatRoom createTrainingRoom(User learner, Tutor tutor) {
        String title = String.format("Training Chat - %s & %s",
                learner.getFullName() != null ? learner.getFullName() : learner.getEmail(),
                tutor.getUser().getFullName() != null ? tutor.getUser().getFullName() : tutor.getUser().getEmail());

        ChatRoom room = ChatRoom.builder()
                .user(learner)
                .tutor(tutor)
                .chatRoomType(ChatRoomType.Training)
                .title(title)
                .description("Training chat room for learning sessions")
                .build();

        return chatRoomRepository.save(room);
    }

    /**
     * Send message to chat room
     * Enforces business rules:
     * - Advice room: only Text messages allowed
     * - Training room: Text, Image, File allowed
     * - Tutor suspended: read-only
     * - Booking cancelled: read-only
     */
    public ChatMessageResponse sendMessage(Long senderID, SendMessageRequest request) {
        log.info("User {} sending message to ChatRoom {}", senderID, request.getChatRoomID());

        User sender = userRepository.findById(senderID)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        ChatRoom chatRoom = chatRoomRepository.findById(request.getChatRoomID())
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        // Verify sender is either the learner or tutor in this room
        if (!chatRoom.getUser().getUserID().equals(senderID) &&
                !chatRoom.getTutor().getUser().getUserID().equals(senderID)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Check if room is read-only (Tutor suspended or Booking cancelled)
        if (isRoomReadOnly(chatRoom)) {
            throw new AppException(ErrorCode.UNAUTHORIZED); // Or create specific error code
        }

        // Validate message type based on room type
        validateMessageType(chatRoom.getChatRoomType(), request.getMessageType());

        // Create and save message
        ChatRoomMessage message = ChatRoomMessage.builder()
                .chatRoom(chatRoom)
                .sender(sender)
                .content(request.getContent())
                .messageType(request.getMessageType())
                .createdAt(LocalDateTime.now())
                .build();

        message = chatRoomMessageRepository.save(message);
        log.info("Message saved successfully with ID {}", message.getMessageID());

        ChatMessageResponse messageResponse = mapToChatMessageResponse(message);
        
        // Broadcast message via WebSocket for real-time updates
        try {
            webSocketChatService.broadcastMessage(messageResponse);
        } catch (Exception e) {
            log.error("Error broadcasting message via WebSocket, but message was saved", e);
            // Don't throw exception - message is already saved
        }

        return messageResponse;
    }

    /**
     * Check if room is read-only based on business rules
     */
    private boolean isRoomReadOnly(ChatRoom chatRoom) {
        Tutor tutor = chatRoom.getTutor();
        User learner = chatRoom.getUser();

        // Rule: When Tutor is suspended → both Advice and Training are read-only
        if (tutor.getStatus() == TutorStatus.SUSPENDED) {
            log.info("Room {} is read-only because Tutor {} is suspended",
                    chatRoom.getChatRoomID(), tutor.getTutorID());
            return true;
        }

        // Rule: For Training room - check if learner còn slot đã thanh toán (Paid) với
        // tutor này
        if (chatRoom.getChatRoomType() == ChatRoomType.Training) {
            // Kiểm tra xem còn slot nào đã thanh toán (Paid) và chưa hết hạn không
            List<BookingPlanSlot> paidSlots = bookingPlanSlotRepository
                    .findPaidSlotsByUserAndTutor(learner.getUserID(), tutor.getTutorID())
                    .stream()
                    .filter(slot -> slot.getEndTime().isAfter(LocalDateTime.now()))
                    .toList();

            // Nếu không còn slot nào đã thanh toán và chưa hết hạn, room là read-only
            if (paidSlots.isEmpty()) {
                log.info("Room {} is read-only because learner has no active paid slots with tutor {}",
                        chatRoom.getChatRoomID(), tutor.getTutorID());
                return true;
            }
        }

        return false;
    }

    /**
     * Validate message type based on room type
     */
    private void validateMessageType(ChatRoomType roomType, MessageType messageType) {
        if (roomType == ChatRoomType.Advice) {
            // Advice can only send text, not files
            if (messageType != MessageType.Text) {
                throw new AppException(ErrorCode.INVALID_KEY); // Or create specific error code
            }
        }
        // Training allows Text, Image, File - no validation needed
    }

    /**
     * Get allowed message types based on room type
     * Advice room: chỉ Text
     * Training room: Text, Image, File
     * Link được gửi như Text (không có enum Link riêng)
     */
    private List<MessageType> getAllowedMessageTypes(ChatRoomType roomType) {
        if (roomType == ChatRoomType.Advice) {
            // Advice room: chỉ cho phép Text
            return List.of(MessageType.Text);
        } else {
            // Training room: cho phép Text, Image, File
            return List.of(MessageType.Text, MessageType.Image, MessageType.File);
        }
    }

    /**
     * Get chat room with messages
     */
    public ChatRoomResponse getChatRoom(Long chatRoomId, Long userID) {
        log.info("Getting ChatRoom {} for User {}", chatRoomId, userID);

        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        // Verify user has access to this room
        validateUserAccessToChatRoom(chatRoomId, userID);

        return mapToChatRoomResponse(chatRoom);
    }

    /**
     * Validate that user has access to a chat room
     * User must be either the learner or tutor in the room
     */
    public void validateUserAccessToChatRoom(Long chatRoomId, Long userID) {
        log.debug("Validating access for user {} to chat room {}", userID, chatRoomId);

        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        // Verify user is either the learner or tutor in this room
        boolean isLearner = chatRoom.getUser().getUserID().equals(userID);
        boolean isTutor = chatRoom.getTutor().getUser().getUserID().equals(userID);

        if (!isLearner && !isTutor) {
            log.warn("User {} attempted to access chat room {} without authorization", userID, chatRoomId);
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        log.debug("User {} has valid access to chat room {}", userID, chatRoomId);
    }

    /**
     * Get all chat rooms for a user (both as learner and tutor)
     */
    public List<ChatRoomResponse> getUserChatRooms(Long userID) {
        log.info("Getting all chat rooms for User {}", userID);

        User user = userRepository.findById(userID)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        List<ChatRoom> rooms = chatRoomRepository.findByUser(user);

        // Also get rooms where user is the tutor
        Tutor tutor = tutorRepository.findByUser(user).orElse(null);
        if (tutor != null) {
            rooms.addAll(chatRoomRepository.findByTutor(tutor));
        }

        return rooms.stream()
                .map(this::mapToChatRoomResponse)
                .collect(Collectors.toList());
    }

    /**
     * Send Google Meet link automatically (from Booking.MeetingLink)
     * This is called when tutor wants to share meeting link
     */
    public ChatMessageResponse sendMeetingLink(Long tutorID, Long chatRoomId, String meetingLink) {
        log.info("Tutor {} sending meeting link to ChatRoom {}", tutorID, chatRoomId);

        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        // Verify tutor owns this room
        if (!chatRoom.getTutor().getUser().getUserID().equals(tutorID)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Validate that the meeting link is a Google Meet link
        if (meetingLink == null || meetingLink.trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_MEETING_LINK);
        }
        
        String trimmedLink = meetingLink.trim();
        if (!trimmedLink.startsWith("https://meet.google.com/")) {
            log.warn("Tutor {} attempted to send invalid meeting link: {}", tutorID, trimmedLink);
            throw new AppException(ErrorCode.INVALID_MEETING_LINK);
        }

        Tutor tutor = chatRoom.getTutor();
        User tutorUser = tutor.getUser();

        // Create message with meeting link
        ChatRoomMessage message = ChatRoomMessage.builder()
                .chatRoom(chatRoom)
                .sender(tutorUser)
                .content(trimmedLink)
                .messageType(MessageType.Text) // Links are sent as Text type
                .createdAt(LocalDateTime.now())
                .build();

        message = chatRoomMessageRepository.save(message);
        log.info("Meeting link sent successfully");

        ChatMessageResponse messageResponse = mapToChatMessageResponse(message);
        
        // Broadcast message via WebSocket for real-time updates
        try {
            webSocketChatService.broadcastMessage(messageResponse);
        } catch (Exception e) {
            log.error("Error broadcasting meeting link via WebSocket, but message was saved", e);
            // Don't throw exception - message is already saved
        }

        return messageResponse;
    }

    /**
     * Map ChatRoom entity to ChatRoomResponse DTO
     */
    private ChatRoomResponse mapToChatRoomResponse(ChatRoom chatRoom) {
        List<ChatRoomMessage> messages = chatRoomMessageRepository
                .findByChatRoomOrderByCreatedAtAsc(chatRoom);

        List<ChatMessageResponse> messageResponses = messages.stream()
                .map(this::mapToChatMessageResponse)
                .collect(Collectors.toList());

        boolean canSendMessage = !isRoomReadOnly(chatRoom);

        User learner = chatRoom.getUser();
        Tutor tutor = chatRoom.getTutor();
        User tutorUser = tutor.getUser();

        // Lấy danh sách các loại message được phép gửi dựa trên room type
        List<MessageType> allowedMessageTypes = getAllowedMessageTypes(chatRoom.getChatRoomType());

        return ChatRoomResponse.builder()
                .chatRoomID(chatRoom.getChatRoomID())
                .title(chatRoom.getTitle())
                .description(chatRoom.getDescription())
                .userID(learner.getUserID())
                .userName(learner.getFullName() != null ? learner.getFullName() : learner.getEmail())
                .userAvatarURL(learner.getAvatarURL())
                .tutorID(tutor.getTutorID())
                .tutorName(tutorUser.getFullName() != null ? tutorUser.getFullName() : tutorUser.getEmail())
                .tutorAvatarURL(tutorUser.getAvatarURL())
                .chatRoomType(chatRoom.getChatRoomType())
                .messages(messageResponses)
                .canSendMessage(canSendMessage)
                .allowedMessageTypes(allowedMessageTypes)
                .build();
    }

    /**
     * Map ChatRoomMessage entity to ChatMessageResponse DTO
     */
    private ChatMessageResponse mapToChatMessageResponse(ChatRoomMessage message) {
        User sender = message.getSender();
        return ChatMessageResponse.builder()
                .messageID(message.getMessageID())
                .chatRoomID(message.getChatRoom().getChatRoomID())
                .senderID(sender.getUserID())
                .senderName(sender.getFullName() != null ? sender.getFullName() : sender.getEmail())
                .senderAvatarURL(sender.getAvatarURL())
                .content(message.getContent())
                .messageType(message.getMessageType())
                .createdAt(message.getCreatedAt())
                .build();
    }

    /**
     * Auto-create Training room when slot is paid
     * This should be called from Payment service after payment is successful
     * Chỉ tạo Training room khi learner đã thanh toán ít nhất 1 slot với tutor
     */
    public void ensureTrainingRoomExists(Long learnerID, Long tutorID) {
        log.info("Ensuring Training room exists for Learner {} and Tutor {}", learnerID, tutorID);

        User learner = userRepository.findById(learnerID)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        Tutor tutor = tutorRepository.findById(tutorID)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        // Prevent creating a chat room where learner is the same user as the tutor's
        // account
        if (tutor.getUser() != null && tutor.getUser().getUserID().equals(learnerID)) {
            log.warn("Prevent creating training room: learnerID {} is same as tutor's userID {}", learnerID,
                    tutor.getUser().getUserID());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Kiểm tra xem learner đã có slot đã thanh toán (Paid) với tutor này chưa
        List<BookingPlanSlot> paidSlots = bookingPlanSlotRepository
                .findPaidSlotsByUserAndTutor(learnerID, tutorID);

        if (paidSlots.isEmpty()) {
            log.info("No paid slots found, skipping Training room creation for Learner {} and Tutor {}",
                    learnerID, tutorID);
            return;
        }

        // Check if Training room already exists, if not create it
        if (!chatRoomRepository.existsByUserAndTutorAndChatRoomType(
                learner, tutor, ChatRoomType.Training)) {
            log.info("Auto-creating Training room for Learner {} and Tutor {}", learnerID, tutorID);
            createTrainingRoom(learner, tutor);
        }
    }
}
