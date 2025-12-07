package edu.lms.dto.response;

import edu.lms.enums.MessageType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessageResponse {
    Long messageID;
    Long chatRoomID;
    Long senderID;
    String senderName;
    String senderAvatarURL;
    String content;
    MessageType messageType;
    LocalDateTime createdAt;
}


