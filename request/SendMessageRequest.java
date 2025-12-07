package edu.lms.dto.request;

import edu.lms.enums.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SendMessageRequest {
    @NotNull(message = "ChatRoomID is required")
    Long chatRoomID;

    @NotBlank(message = "Content is required")
    String content;

    @Builder.Default
    MessageType messageType = MessageType.Text;
}


