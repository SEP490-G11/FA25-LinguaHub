package edu.lms.repository;

import edu.lms.entity.ChatRoom;
import edu.lms.entity.Tutor;
import edu.lms.entity.User;
import edu.lms.enums.ChatRoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByUserAndTutorAndChatRoomType(User user, Tutor tutor, ChatRoomType chatRoomType);
    List<ChatRoom> findByUser(User user);
    List<ChatRoom> findByTutor(Tutor tutor);
    List<ChatRoom> findByUserAndTutor(User user, Tutor tutor);
    boolean existsByUserAndTutorAndChatRoomType(User user, Tutor tutor, ChatRoomType chatRoomType);
    
    /**
     * Check if user has access to chat room (either as learner or tutor)
     */
    @org.springframework.data.jpa.repository.Query(
        "SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM ChatRoom c " +
        "WHERE c.chatRoomID = :chatRoomId AND (c.user.userID = :userId OR c.tutor.user.userID = :userId)"
    )
    boolean existsByIdAndUserAccess(@org.springframework.data.repository.query.Param("chatRoomId") Long chatRoomId, 
                                    @org.springframework.data.repository.query.Param("userId") Long userId);
}


