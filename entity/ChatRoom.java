package edu.lms.entity;

import edu.lms.enums.ChatRoomType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "ChatRoom")
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long chatRoomID;

    String title;
    
    @Column(columnDefinition = "TEXT")
    String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userID")
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutorID")
    Tutor tutor;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    ChatRoomType chatRoomType = ChatRoomType.Training;

    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    List<ChatRoomMessage> messages;
}
