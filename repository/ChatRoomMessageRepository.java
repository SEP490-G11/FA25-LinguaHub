package edu.lms.repository;

import edu.lms.entity.ChatRoom;
import edu.lms.entity.ChatRoomMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRoomMessageRepository extends JpaRepository<ChatRoomMessage, Long> {
    List<ChatRoomMessage> findByChatRoomOrderByCreatedAtAsc(ChatRoom chatRoom);

    @Query("SELECT m FROM ChatRoomMessage m WHERE m.chatRoom.chatRoomID = :chatRoomID ORDER BY m.createdAt ASC")
    List<ChatRoomMessage> findByChatRoomIDOrderByCreatedAtAsc(@Param("chatRoomID") Long chatRoomID);
}


