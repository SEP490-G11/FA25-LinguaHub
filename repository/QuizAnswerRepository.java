package edu.lms.repository;

import edu.lms.entity.Lesson;
import edu.lms.entity.QuizAnswer;
import edu.lms.entity.QuizQuestion;
import edu.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {

    // Xoá các lần làm cũ cho user + các câu hỏi trong lesson này
    void deleteByUserAndQuestionIn(User user, List<QuizQuestion> questions);

    List<QuizAnswer> findByUserAndQuestionIn(User user, List<QuizQuestion> questions);

    List<QuizAnswer> findByUserAndQuestion_Lesson(User user, Lesson lesson);
}
