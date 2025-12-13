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
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class ChatServiceTest {

    @Mock ChatRoomRepository chatRoomRepository;
    @Mock ChatRoomMessageRepository chatRoomMessageRepository;
    @Mock UserRepository userRepository;
    @Mock TutorRepository tutorRepository;
    @Mock BookingPlanSlotRepository bookingPlanSlotRepository;
    @Mock WebSocketChatService webSocketChatService;

    @InjectMocks
    ChatService chatService;

    // ========= Helper builders =========

    private User buildUser(Long id, String fullName, String email) {
        User u = new User();
        u.setUserID(id);
        u.setFullName(fullName);
        u.setEmail(email);
        u.setAvatarURL("avatar-" + id);
        return u;
    }

    private Tutor buildTutor(Long tutorId, TutorStatus status, User user) {
        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setStatus(status);
        t.setUser(user);
        return t;
    }

    private ChatRoom buildChatRoom(Long id, User learner, Tutor tutor, ChatRoomType type) {
        ChatRoom room = new ChatRoom();
        room.setChatRoomID(id);
        room.setUser(learner);
        room.setTutor(tutor);
        room.setChatRoomType(type);
        room.setTitle(type + " Room " + id);
        room.setDescription("Desc " + id);
        return room;
    }

    /**
     * 🔧 FIX: BookingPlanSlot entity của bạn chỉ có userID / tutorID
     * nên helper dùng Long thay vì User/Tutor
     */
    private BookingPlanSlot buildSlot(Long id, Long learnerId, Long tutorId,
                                      LocalDateTime start, LocalDateTime end) {
        BookingPlanSlot slot = new BookingPlanSlot();
        slot.setSlotID(id);
        slot.setUserID(learnerId);
        slot.setTutorID(tutorId);
        slot.setStartTime(start);
        slot.setEndTime(end);
        return slot;
    }

    private ChatRoomMessage buildMessage(Long id, ChatRoom room, User sender, String content, MessageType type) {
        ChatRoomMessage msg = new ChatRoomMessage();
        msg.setMessageID(id);
        msg.setChatRoom(room);
        msg.setSender(sender);
        msg.setContent(content);
        msg.setMessageType(type);
        msg.setCreatedAt(LocalDateTime.now().minusMinutes(1));
        return msg;
    }

    @BeforeEach
    void commonMocks() {
        lenient().when(chatRoomMessageRepository.findByChatRoomOrderByCreatedAtAsc(any(ChatRoom.class)))
                .thenReturn(List.of());

        lenient().when(bookingPlanSlotRepository.findPaidSlotsByUserAndTutor(anyLong(), anyLong()))
                .thenReturn(List.of());

        lenient().when(chatRoomRepository.save(any(ChatRoom.class)))
                .then(returnsFirstArg());

        lenient().when(chatRoomMessageRepository.save(any(ChatRoomMessage.class)))
                .then(returnsFirstArg());
    }

    // ========================================================================
    // getOrCreateAdviceRoom
    // ========================================================================
    @Nested
    @DisplayName("getOrCreateAdviceRoom")
    class GetOrCreateAdviceRoomTests {

        /**
         * [NOTE] Learner không tồn tại -> USER_NOT_EXIST
         */
        @Test
        @DisplayName("Learner không tồn tại -> USER_NOT_EXIST")
        void learnerNotFound_shouldThrow() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.getOrCreateAdviceRoom(1L, 2L)
            );
            assertEquals(ErrorCode.USER_NOT_EXIST, ex.getErrorcode());
        }

        /**
         * [NOTE] Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(tutorRepository.findById(2L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.getOrCreateAdviceRoom(1L, 2L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * [NOTE] Learner trùng user của tutor -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Learner trùng với user của tutor -> UNAUTHORIZED")
        void learnerSameAsTutorUser_shouldThrowUnauthorized() {
            User sameUser = buildUser(1L, "Same", "s@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, sameUser);

            when(userRepository.findById(1L)).thenReturn(Optional.of(sameUser));
            when(tutorRepository.findById(2L)).thenReturn(Optional.of(tutor));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.getOrCreateAdviceRoom(1L, 2L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * [NOTE] Advice room đã tồn tại -> reuse, không create
         */
        @Test
        @DisplayName("Advice room đã tồn tại -> reuse, không tạo mới")
        void existingAdviceRoom_shouldBeReused() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom existingRoom = buildChatRoom(100L, learner, tutor, ChatRoomType.Advice);

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(tutorRepository.findById(2L)).thenReturn(Optional.of(tutor));
            when(chatRoomRepository.findByUserAndTutorAndChatRoomType(learner, tutor, ChatRoomType.Advice))
                    .thenReturn(Optional.of(existingRoom));

            ChatRoomResponse res = chatService.getOrCreateAdviceRoom(1L, 2L);

            assertEquals(100L, res.getChatRoomID());
            verify(chatRoomRepository, never()).save(any(ChatRoom.class));
        }

        /**
         * [NOTE] Chưa có Advice room -> tạo mới
         */
        @Test
        @DisplayName("Advice room chưa tồn tại -> tạo mới")
        void noAdviceRoom_shouldCreateNew() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(tutorRepository.findById(2L)).thenReturn(Optional.of(tutor));
            when(chatRoomRepository.findByUserAndTutorAndChatRoomType(learner, tutor, ChatRoomType.Advice))
                    .thenReturn(Optional.empty());

            ChatRoomResponse res = chatService.getOrCreateAdviceRoom(1L, 2L);

            assertEquals(ChatRoomType.Advice, res.getChatRoomType());
            verify(chatRoomRepository).save(any(ChatRoom.class));
        }
    }

    // ========================================================================
    // getOrCreateTrainingRoom
    // ========================================================================
    @Nested
    @DisplayName("getOrCreateTrainingRoom")
    class GetOrCreateTrainingRoomTests {

        /**
         * [NOTE] Learner không tồn tại -> USER_NOT_EXIST
         */
        @Test
        @DisplayName("Learner không tồn tại -> USER_NOT_EXIST")
        void learnerNotFound_shouldThrow() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.getOrCreateTrainingRoom(1L, 2L)
            );
            assertEquals(ErrorCode.USER_NOT_EXIST, ex.getErrorcode());
        }

        /**
         * [NOTE] Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(tutorRepository.findById(2L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.getOrCreateTrainingRoom(1L, 2L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * [NOTE] Learner trùng user của tutor -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Learner trùng user của tutor -> UNAUTHORIZED")
        void learnerSameAsTutorUser_shouldThrowUnauthorized() {
            User sameUser = buildUser(1L, "Same", "s@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, sameUser);

            when(userRepository.findById(1L)).thenReturn(Optional.of(sameUser));
            when(tutorRepository.findById(2L)).thenReturn(Optional.of(tutor));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.getOrCreateTrainingRoom(1L, 2L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * [NOTE] Không có paid slot -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Không có paid slot -> UNAUTHORIZED")
        void noPaidSlot_shouldThrowUnauthorized() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(tutorRepository.findById(2L)).thenReturn(Optional.of(tutor));
            when(bookingPlanSlotRepository.findPaidSlotsByUserAndTutor(1L, 2L))
                    .thenReturn(List.of());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.getOrCreateTrainingRoom(1L, 2L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * [NOTE] Đã có Training room -> reuse
         */
        @Test
        @DisplayName("Training room đã tồn tại -> reuse")
        void existingTrainingRoom_shouldBeReused() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(100L, learner, tutor, ChatRoomType.Training);

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(tutorRepository.findById(2L)).thenReturn(Optional.of(tutor));

            List<BookingPlanSlot> slots = List.of(
                    buildSlot(
                            1L,
                            learner.getUserID(),
                            tutor.getTutorID(),
                            LocalDateTime.now().minusHours(1),
                            LocalDateTime.now().plusHours(1)
                    )
            );
            when(bookingPlanSlotRepository.findPaidSlotsByUserAndTutor(1L, 2L))
                    .thenReturn(slots);

            when(chatRoomRepository.findByUserAndTutorAndChatRoomType(learner, tutor, ChatRoomType.Training))
                    .thenReturn(Optional.of(room));

            ChatRoomResponse res = chatService.getOrCreateTrainingRoom(1L, 2L);

            assertEquals(100L, res.getChatRoomID());
            verify(chatRoomRepository, never()).save(any(ChatRoom.class));
        }

        /**
         * [NOTE] Không có room, có paid slot -> tạo mới
         */
        @Test
        @DisplayName("Không có Training room, có paid slot -> tạo mới")
        void noTrainingRoom_hasPaidSlot_shouldCreate() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(tutorRepository.findById(2L)).thenReturn(Optional.of(tutor));

            List<BookingPlanSlot> slots = List.of(
                    buildSlot(
                            1L,
                            learner.getUserID(),
                            tutor.getTutorID(),
                            LocalDateTime.now().minusHours(1),
                            LocalDateTime.now().plusHours(1)
                    )
            );
            when(bookingPlanSlotRepository.findPaidSlotsByUserAndTutor(1L, 2L))
                    .thenReturn(slots);

            when(chatRoomRepository.findByUserAndTutorAndChatRoomType(learner, tutor, ChatRoomType.Training))
                    .thenReturn(Optional.empty());

            ChatRoomResponse res = chatService.getOrCreateTrainingRoom(1L, 2L);

            assertEquals(ChatRoomType.Training, res.getChatRoomType());
            verify(chatRoomRepository).save(any(ChatRoom.class));
        }
    }

    // ========================================================================
    // sendMessage
    // ========================================================================
    @Nested
    @DisplayName("sendMessage")
    class SendMessageTests {

        /**
         * [NOTE] Sender không tồn tại -> USER_NOT_EXIST
         */
        @Test
        @DisplayName("Sender không tồn tại -> USER_NOT_EXIST")
        void senderNotFound_shouldThrow() {
            SendMessageRequest req = SendMessageRequest.builder()
                    .chatRoomID(10L)
                    .content("Hello")
                    .messageType(MessageType.Text)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.sendMessage(1L, req)
            );
            assertEquals(ErrorCode.USER_NOT_EXIST, ex.getErrorcode());
        }

        /**
         * [NOTE] Room không tồn tại -> CHAT_ROOM_NOT_FOUND
         */
        @Test
        @DisplayName("Room không tồn tại -> CHAT_ROOM_NOT_FOUND")
        void chatRoomNotFound_shouldThrow() {
            SendMessageRequest req = SendMessageRequest.builder()
                    .chatRoomID(10L)
                    .content("Hello")
                    .messageType(MessageType.Text)
                    .build();

            User sender = buildUser(1L, "Sender", "s@x.com");
            when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
            when(chatRoomRepository.findById(10L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.sendMessage(1L, req)
            );
            assertEquals(ErrorCode.CHAT_ROOM_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * [NOTE] Sender không thuộc room -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Sender không thuộc room -> UNAUTHORIZED")
        void senderNotInRoom_shouldThrowUnauthorized() {
            SendMessageRequest req = SendMessageRequest.builder()
                    .chatRoomID(10L)
                    .content("Hello")
                    .messageType(MessageType.Text)
                    .build();

            User sender = buildUser(99L, "Stranger", "st@x.com");
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Advice);

            when(userRepository.findById(99L)).thenReturn(Optional.of(sender));
            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.sendMessage(99L, req)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * [NOTE] Tutor suspended -> room read-only -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Tutor suspended -> read-only -> UNAUTHORIZED")
        void tutorSuspended_shouldMakeRoomReadOnly() {
            SendMessageRequest req = SendMessageRequest.builder()
                    .chatRoomID(10L)
                    .content("Hello")
                    .messageType(MessageType.Text)
                    .build();

            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.SUSPENDED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Advice);

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.sendMessage(1L, req)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * [NOTE] Advice room + MessageType != Text -> INVALID_KEY
         */
        @Test
        @DisplayName("Advice room gửi File -> INVALID_KEY")
        void adviceRoom_invalidMessageType_shouldThrow() {
            SendMessageRequest req = SendMessageRequest.builder()
                    .chatRoomID(10L)
                    .content("file")
                    .messageType(MessageType.File)
                    .build();

            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Advice);

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.sendMessage(1L, req)
            );
            assertEquals(ErrorCode.INVALID_KEY, ex.getErrorcode());
        }

        /**
         * [NOTE] Training room nhưng hết slot active (tất cả endTime < now) -> read-only
         */
        @Test
        @DisplayName("Training room không còn slot active -> UNAUTHORIZED")
        void trainingRoom_noActiveSlots_shouldBeReadOnly() {
            SendMessageRequest req = SendMessageRequest.builder()
                    .chatRoomID(10L)
                    .content("Hello")
                    .messageType(MessageType.Text)
                    .build();

            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Training);

            List<BookingPlanSlot> expiredSlots = List.of(
                    buildSlot(
                            1L,
                            learner.getUserID(),
                            tutor.getTutorID(),
                            LocalDateTime.now().minusHours(2),
                            LocalDateTime.now().minusHours(1)
                    )
            );

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));
            when(bookingPlanSlotRepository.findPaidSlotsByUserAndTutor(1L, 2L))
                    .thenReturn(expiredSlots);

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.sendMessage(1L, req)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * [NOTE] Training room + Image (hoặc File) + còn slot active -> OK
         */
        @Test
        @DisplayName("Training room với Image/File -> gửi OK")
        void trainingRoom_fileOrImage_shouldBeAllowed() {
            SendMessageRequest req = SendMessageRequest.builder()
                    .chatRoomID(10L)
                    .content("image-url")
                    .messageType(MessageType.Image)
                    .build();

            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Training);

            List<BookingPlanSlot> activeSlots = List.of(
                    buildSlot(
                            1L,
                            learner.getUserID(),
                            tutor.getTutorID(),
                            LocalDateTime.now().minusMinutes(30),
                            LocalDateTime.now().plusMinutes(30)
                    )
            );

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));
            when(bookingPlanSlotRepository.findPaidSlotsByUserAndTutor(1L, 2L))
                    .thenReturn(activeSlots);

            ChatMessageResponse res = chatService.sendMessage(1L, req);

            assertEquals("image-url", res.getContent());
            assertEquals(MessageType.Image, res.getMessageType());
            verify(chatRoomMessageRepository).save(any(ChatRoomMessage.class));
            verify(webSocketChatService).broadcastMessage(any(ChatMessageResponse.class));
        }

        /**
         * [NOTE] Happy path – Advice + Text
         */
        @Test
        @DisplayName("Advice room Text -> gửi OK")
        void adviceRoom_text_shouldSendSuccessfully() {
            SendMessageRequest req = SendMessageRequest.builder()
                    .chatRoomID(10L)
                    .content("Hello")
                    .messageType(MessageType.Text)
                    .build();

            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Advice);

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));

            ChatMessageResponse res = chatService.sendMessage(1L, req);

            assertEquals("Hello", res.getContent());
            assertEquals(1L, res.getSenderID());
            verify(chatRoomMessageRepository).save(any(ChatRoomMessage.class));
            verify(webSocketChatService).broadcastMessage(any(ChatMessageResponse.class));
        }
    }

    // ========================================================================
    // getChatRoom
    // ========================================================================
    @Nested
    @DisplayName("getChatRoom")
    class GetChatRoomTests {

        /**
         * [NOTE] Room không tồn tại -> CHAT_ROOM_NOT_FOUND
         */
        @Test
        @DisplayName("Room không tồn tại -> CHAT_ROOM_NOT_FOUND")
        void roomNotFound_shouldThrow() {
            when(chatRoomRepository.findById(10L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.getChatRoom(10L, 1L)
            );
            assertEquals(ErrorCode.CHAT_ROOM_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * [NOTE] User không thuộc room -> UNAUTHORIZED
         */
        @Test
        @DisplayName("User không thuộc room -> UNAUTHORIZED")
        void userNotInRoom_shouldThrowUnauthorized() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Advice);

            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.getChatRoom(10L, 99L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * [NOTE] Happy path – Learner xem room, có messages, có allowedMessageTypes
         */
        @Test
        @DisplayName("Learner truy cập room hợp lệ -> trả về detail")
        void happyPath_shouldReturnRoomDetailForLearner() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Advice);

            ChatRoomMessage msg = buildMessage(1L, room, learner, "Hi", MessageType.Text);
            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));
            when(chatRoomMessageRepository.findByChatRoomOrderByCreatedAtAsc(room))
                    .thenReturn(List.of(msg));

            ChatRoomResponse res = chatService.getChatRoom(10L, 1L);

            assertEquals(10L, res.getChatRoomID());
            assertEquals("Hi", res.getMessages().get(0).getContent());
            assertEquals(List.of(MessageType.Text), res.getAllowedMessageTypes());
        }
    }

    // ========================================================================
    // validateUserAccessToChatRoom
    // ========================================================================
    @Nested
    @DisplayName("validateUserAccessToChatRoom")
    class ValidateUserAccessTests {

        /**
         * [NOTE] Room không tồn tại -> CHAT_ROOM_NOT_FOUND
         */
        @Test
        @DisplayName("Room không tồn tại -> CHAT_ROOM_NOT_FOUND")
        void roomNotFound_shouldThrow() {
            when(chatRoomRepository.findById(10L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.validateUserAccessToChatRoom(10L, 1L)
            );
            assertEquals(ErrorCode.CHAT_ROOM_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * [NOTE] User không phải learner/tutor -> UNAUTHORIZED
         */
        @Test
        @DisplayName("User không thuộc room -> UNAUTHORIZED")
        void stranger_shouldThrowUnauthorized() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Advice);

            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.validateUserAccessToChatRoom(10L, 99L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * [NOTE] User = learner -> OK
         */
        @Test
        @DisplayName("User là learner -> OK")
        void learnerAccess_shouldPass() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Advice);

            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));

            assertDoesNotThrow(
                    () -> chatService.validateUserAccessToChatRoom(10L, 1L)
            );
        }

        /**
         * [NOTE] User = tutorUser -> OK
         */
        @Test
        @DisplayName("User là tutorUser -> OK")
        void tutorUserAccess_shouldPass() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Advice);

            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));

            assertDoesNotThrow(
                    () -> chatService.validateUserAccessToChatRoom(10L, 10L)
            );
        }
    }

    // ========================================================================
    // getUserChatRooms
    // ========================================================================
    @Nested
    @DisplayName("getUserChatRooms")
    class GetUserChatRoomsTests {

        /**
         * [NOTE] User không tồn tại -> USER_NOT_EXIST
         */
        @Test
        @DisplayName("User không tồn tại -> USER_NOT_EXIST")
        void userNotFound_shouldThrow() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.getUserChatRooms(1L)
            );
            assertEquals(ErrorCode.USER_NOT_EXIST, ex.getErrorcode());
        }

        /**
         * [NOTE] User chỉ là learner -> chỉ trả rooms theo user
         */
        @Test
        @DisplayName("Learner không phải tutor -> chỉ rooms theo user")
        void learnerOnly_shouldReturnRoomsAsLearner() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));

            // 🔧 FIX: findByUser(user) trả Optional<Tutor>, test stub Optional.of(...) hoặc Optional.empty()
            when(tutorRepository.findByUser(learner)).thenReturn(Optional.empty());

            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room1 = buildChatRoom(100L, learner, tutor, ChatRoomType.Advice);

            when(chatRoomRepository.findByUser(learner)).thenReturn(new ArrayList<>(List.of(room1)));

            List<ChatRoomResponse> res = chatService.getUserChatRooms(1L);
            assertEquals(1, res.size());
            assertEquals(100L, res.get(0).getChatRoomID());
        }

        /**
         * [NOTE] User vừa là learner vừa là tutor -> combine 2 list
         */
        @Test
        @DisplayName("User là learner + tutor -> combine rooms")
        void learnerAndTutor_shouldReturnBothLists() {
            User user = buildUser(1L, "User", "u@x.com");
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));

            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, user);
            when(tutorRepository.findByUser(user)).thenReturn(Optional.of(tutor));

            User learner2 = buildUser(3L, "Learner2", "l2@x.com");

            ChatRoom asLearner = buildChatRoom(100L, user, tutor, ChatRoomType.Advice);
            ChatRoom asTutor = buildChatRoom(200L, learner2, tutor, ChatRoomType.Training);

            when(chatRoomRepository.findByUser(user)).thenReturn(new ArrayList<>(List.of(asLearner)));
            when(chatRoomRepository.findByTutor(tutor)).thenReturn(List.of(asTutor));

            List<ChatRoomResponse> res = chatService.getUserChatRooms(1L);

            assertEquals(2, res.size());
            assertTrue(res.stream().anyMatch(r -> r.getChatRoomID().equals(100L)));
            assertTrue(res.stream().anyMatch(r -> r.getChatRoomID().equals(200L)));
        }
    }

    // ========================================================================
    // sendMeetingLink
    // ========================================================================
    @Nested
    @DisplayName("sendMeetingLink")
    class SendMeetingLinkTests {

        /**
         * [NOTE] Room không tồn tại -> CHAT_ROOM_NOT_FOUND
         */
        @Test
        @DisplayName("Room không tồn tại -> CHAT_ROOM_NOT_FOUND")
        void roomNotFound_shouldThrow() {
            when(chatRoomRepository.findById(10L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.sendMeetingLink(10L, 10L, "https://meet.google.com/abc")
            );
            assertEquals(ErrorCode.CHAT_ROOM_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * [NOTE] tutorID param != chatRoom.tutor.user.userID -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Tutor không phải owner room -> UNAUTHORIZED")
        void tutorNotOwner_shouldThrowUnauthorized() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Training);

            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.sendMeetingLink(99L, 10L, "https://meet.google.com/abc")
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * [NOTE] meetingLink null/blank -> INVALID_MEETING_LINK
         */
        @Test
        @DisplayName("Meeting link null/blank -> INVALID_MEETING_LINK")
        void blankMeetingLink_shouldThrow() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Training);

            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));

            AppException ex1 = assertThrows(
                    AppException.class,
                    () -> chatService.sendMeetingLink(10L, 10L, null)
            );
            assertEquals(ErrorCode.INVALID_MEETING_LINK, ex1.getErrorcode());

            AppException ex2 = assertThrows(
                    AppException.class,
                    () -> chatService.sendMeetingLink(10L, 10L, "  ")
            );
            assertEquals(ErrorCode.INVALID_MEETING_LINK, ex2.getErrorcode());
        }

        /**
         * [NOTE] meetingLink không phải meet.google -> INVALID_MEETING_LINK
         */
        @Test
        @DisplayName("Meeting link sai format -> INVALID_MEETING_LINK")
        void invalidFormatMeetingLink_shouldThrow() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Training);

            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.sendMeetingLink(10L, 10L, "https://zoom.us/xxx")
            );
            assertEquals(ErrorCode.INVALID_MEETING_LINK, ex.getErrorcode());
        }

        /**
         * [NOTE] Happy path – gửi meet link hợp lệ
         */
        @Test
        @DisplayName("Happy path – gửi meet link thành công")
        void happyPath_shouldSendMeetingLink() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);
            ChatRoom room = buildChatRoom(10L, learner, tutor, ChatRoomType.Training);

            when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(room));

            ChatMessageResponse res =
                    chatService.sendMeetingLink(10L, 10L, "https://meet.google.com/abc");

            assertEquals("https://meet.google.com/abc", res.getContent());
            assertEquals(MessageType.Text, res.getMessageType());
            verify(chatRoomMessageRepository).save(any(ChatRoomMessage.class));
            verify(webSocketChatService).broadcastMessage(any(ChatMessageResponse.class));
        }
    }

    // ========================================================================
    // ensureTrainingRoomExists
    // ========================================================================
    @Nested
    @DisplayName("ensureTrainingRoomExists")
    class EnsureTrainingRoomExistsTests {

        /**
         * [NOTE] Learner không tồn tại -> USER_NOT_EXIST
         */
        @Test
        @DisplayName("Learner không tồn tại -> USER_NOT_EXIST")
        void learnerNotFound_shouldThrow() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.ensureTrainingRoomExists(1L, 2L)
            );
            assertEquals(ErrorCode.USER_NOT_EXIST, ex.getErrorcode());
        }

        /**
         * [NOTE] Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void tutorNotFound_shouldThrow() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(tutorRepository.findById(2L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.ensureTrainingRoomExists(1L, 2L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * [NOTE] Learner trùng user tutor -> UNAUTHORIZED
         */
        @Test
        @DisplayName("Learner trùng user tutor -> UNAUTHORIZED")
        void learnerSameAsTutorUser_shouldThrowUnauthorized() {
            User sameUser = buildUser(1L, "Same", "s@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, sameUser);

            when(userRepository.findById(1L)).thenReturn(Optional.of(sameUser));
            when(tutorRepository.findById(2L)).thenReturn(Optional.of(tutor));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> chatService.ensureTrainingRoomExists(1L, 2L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * [NOTE] Không có paid slot -> không tạo room
         */
        @Test
        @DisplayName("Không có paid slot -> không tạo room")
        void noPaidSlot_shouldDoNothing() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(tutorRepository.findById(2L)).thenReturn(Optional.of(tutor));
            when(bookingPlanSlotRepository.findPaidSlotsByUserAndTutor(1L, 2L))
                    .thenReturn(List.of());

            chatService.ensureTrainingRoomExists(1L, 2L);

            verify(chatRoomRepository, never())
                    .existsByUserAndTutorAndChatRoomType(any(), any(), any());
            verify(chatRoomRepository, never()).save(any(ChatRoom.class));
        }

        /**
         * [NOTE] Có paid slot, room đã tồn tại -> không tạo mới
         */
        @Test
        @DisplayName("Có paid slot, room tồn tại -> không tạo mới")
        void hasPaidSlot_roomAlreadyExists_shouldNotCreate() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(tutorRepository.findById(2L)).thenReturn(Optional.of(tutor));

            List<BookingPlanSlot> slots = List.of(
                    buildSlot(
                            1L,
                            learner.getUserID(),
                            tutor.getTutorID(),
                            LocalDateTime.now().minusMinutes(10),
                            LocalDateTime.now().plusMinutes(10)
                    )
            );
            when(bookingPlanSlotRepository.findPaidSlotsByUserAndTutor(1L, 2L))
                    .thenReturn(slots);

            when(chatRoomRepository.existsByUserAndTutorAndChatRoomType(learner, tutor, ChatRoomType.Training))
                    .thenReturn(true);

            chatService.ensureTrainingRoomExists(1L, 2L);

            verify(chatRoomRepository, never()).save(any(ChatRoom.class));
        }

        /**
         * [NOTE] Có paid slot, chưa có Training room -> auto create
         */
        @Test
        @DisplayName("Có paid slot, chưa có Training room -> tạo mới")
        void hasPaidSlot_roomNotExists_shouldCreate() {
            User learner = buildUser(1L, "Learner", "l@x.com");
            User tutorUser = buildUser(10L, "Tutor", "t@x.com");
            Tutor tutor = buildTutor(2L, TutorStatus.APPROVED, tutorUser);

            when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
            when(tutorRepository.findById(2L)).thenReturn(Optional.of(tutor));

            List<BookingPlanSlot> slots = List.of(
                    buildSlot(
                            1L,
                            learner.getUserID(),
                            tutor.getTutorID(),
                            LocalDateTime.now().minusMinutes(10),
                            LocalDateTime.now().plusMinutes(10)
                    )
            );
            when(bookingPlanSlotRepository.findPaidSlotsByUserAndTutor(1L, 2L))
                    .thenReturn(slots);

            when(chatRoomRepository.existsByUserAndTutorAndChatRoomType(learner, tutor, ChatRoomType.Training))
                    .thenReturn(false);

            chatService.ensureTrainingRoomExists(1L, 2L);

            verify(chatRoomRepository).save(any(ChatRoom.class));
        }
    }
}
