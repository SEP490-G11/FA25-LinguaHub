package edu.lms.service;

import edu.lms.dto.request.SubmitQuizQuestionAnswer;
import edu.lms.dto.request.SubmitQuizRequest;
import edu.lms.dto.response.QuizOptionResponse;
import edu.lms.dto.response.QuizQuestionResponse;
import edu.lms.dto.response.SubmitQuizQuestionResultResponse;
import edu.lms.dto.response.SubmitQuizResultResponse;
import edu.lms.entity.*;
import edu.lms.enums.EnrollmentStatus;
import edu.lms.enums.LessonType;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class StudentQuizService {

    EnrollmentRepository enrollmentRepository;
    LessonRepository lessonRepository;
    QuizQuestionRepository quizQuestionRepository;
    QuizOptionRepository quizOptionRepository;
    QuizAnswerRepository quizAnswerRepository;
    UserLessonRepository userLessonRepository;
    UserRepository userRepository;
    UserQuizResultRepository userQuizResultRepository;
    UserCourseSectionRepository userCourseSectionRepository;

    // ====================== GET QUIZ QUESTIONS ======================

    @Transactional(readOnly = true)
    public List<QuizQuestionResponse> getQuizForLesson(
            Long userId, Long courseId, Long lessonId
    ) {
        // 1. Check user đã enroll course chưa
        Enrollment enrollment = enrollmentRepository
                .findByUser_UserIDAndCourse_CourseID(userId, courseId)
                .orElseThrow(() -> new AppException(ErrorCode.ENROLLMENT_NOT_FOUND));

        // 2. Check lesson tồn tại & belong to course
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        if (!lesson.getSection().getCourse().getCourseID().equals(courseId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED); // lesson không thuộc course này
        }

        // 3. Check đây có phải lesson Quiz không
        if (lesson.getLessonType() != LessonType.Quiz) {
            throw new AppException(ErrorCode.INVALID_STATE);
        }

        // 4. Lấy tất cả câu hỏi
        List<QuizQuestion> questions =
                quizQuestionRepository.findByLessonOrderByOrderIndexAsc(lesson);

        return questions.stream()
                .map(q -> toQuizQuestionResponse(q, false)) // false = không trả đáp án
                .toList();
    }

    // ====================== SUBMIT QUIZ ======================

    @Transactional
    public SubmitQuizResultResponse submitQuiz(
            Long userId, Long courseId, Long lessonId, SubmitQuizRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        // 1. Check enrollment
        Enrollment enrollment = enrollmentRepository
                .findByUser_UserIDAndCourse_CourseID(userId, courseId)
                .orElseThrow(() -> new AppException(ErrorCode.ENROLLMENT_NOT_FOUND));

        // 2. Check lesson + type + thuộc course
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        if (!lesson.getSection().getCourse().getCourseID().equals(courseId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        if (lesson.getLessonType() != LessonType.Quiz) {
            throw new AppException(ErrorCode.INVALID_STATE);
        }

        // 3. Lấy tất cả câu hỏi của quiz này
        List<QuizQuestion> questions =
                quizQuestionRepository.findByLessonOrderByOrderIndexAsc(lesson);

        if (questions.isEmpty()) {
            throw new AppException(ErrorCode.QUIZ_NO_QUESTION);
        }

        Map<Long, QuizQuestion> questionById = questions.stream()
                .collect(Collectors.toMap(QuizQuestion::getQuestionID, q -> q));

        // 4. Map answer request theo questionId
        Map<Long, SubmitQuizQuestionAnswer> answerByQuestionId =
                Optional.ofNullable(request.getAnswers()).orElse(List.of())
                        .stream()
                        .collect(Collectors.toMap(
                                SubmitQuizQuestionAnswer::getQuestionId,
                                a -> a,
                                (a1, a2) -> a1
                        ));

        // 5. Chấm điểm
        BigDecimal maxScore = BigDecimal.ZERO;
        BigDecimal totalScore = BigDecimal.ZERO;
        int totalQuestions = questions.size();
        int correctQuestions = 0;

        List<SubmitQuizQuestionResultResponse> questionResults = new ArrayList<>();

        for (QuizQuestion q : questions) {
            BigDecimal qMaxScore = (q.getScore() != null) ? q.getScore() : BigDecimal.ONE;
            maxScore = maxScore.add(qMaxScore);

            SubmitQuizQuestionAnswer submitted = answerByQuestionId.get(q.getQuestionID());
            List<Long> selectedOptionIds = (submitted != null && submitted.getSelectedOptionIds() != null)
                    ? submitted.getSelectedOptionIds()
                    : List.of();

            // Tập option đúng
            List<QuizOption> options = q.getOptions();
            Set<Long> correctOptionIds = options.stream()
                    .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                    .map(QuizOption::getOptionID)
                    .collect(Collectors.toSet());

            Set<Long> selectedSet = new HashSet<>(selectedOptionIds);

            boolean isCorrect = !correctOptionIds.isEmpty()
                    && selectedSet.equals(correctOptionIds);

            BigDecimal qScore = isCorrect ? qMaxScore : BigDecimal.ZERO;
            if (isCorrect) correctQuestions++;
            totalScore = totalScore.add(qScore);

            questionResults.add(
                    SubmitQuizQuestionResultResponse.builder()
                            .questionID(q.getQuestionID())
                            .isCorrect(isCorrect)
                            .questionScore(qScore)
                            .maxScore(qMaxScore)
                            .selectedOptionIds(selectedOptionIds)
                            .correctOptionIds(new ArrayList<>(correctOptionIds))
                            .explanation(q.getExplanation())
                            .build()
            );
        }

        BigDecimal percentage = BigDecimal.ZERO;
        if (maxScore.compareTo(BigDecimal.ZERO) > 0) {
            percentage = totalScore
                    .multiply(BigDecimal.valueOf(100))
                    .divide(maxScore, 2, RoundingMode.HALF_UP);
        }

        // 6. Lưu đáp án của user (QuizAnswer): clear cũ -> save mới
        quizAnswerRepository.deleteByUserAndQuestionIn(user, questions);

        if (request.getAnswers() != null) {
            for (SubmitQuizQuestionAnswer a : request.getAnswers()) {
                QuizQuestion q = questionById.get(a.getQuestionId());
                if (q == null || a.getSelectedOptionIds() == null) continue;

                for (Long optId : a.getSelectedOptionIds()) {
                    QuizOption opt = quizOptionRepository.findById(optId).orElse(null);
                    if (opt == null) continue;

                    QuizAnswer answer = QuizAnswer.builder()
                            .question(q)
                            .user(user)
                            .selectedOption(opt)
                            .build();

                    quizAnswerRepository.save(answer);
                }
            }
        }

        // 7. Đánh dấu lesson này là DONE (user đã làm quiz) + lưu đầy đủ info UserLesson
        UserLesson userLesson = userLessonRepository
                .findByUser_UserIDAndLesson_LessonID(userId, lessonId)
                .orElseGet(() -> UserLesson.builder()
                        .user(user)
                        .lesson(lesson)
                        .enrollment(enrollment)
                        .watchedDuration(0)   // quiz không xem video -> 0
                        .isDone(false)
                        .build()
                );

        // nếu record cũ chưa set enrollment thì gán vào
        if (userLesson.getEnrollment() == null) {
            userLesson.setEnrollment(enrollment);
        }
        if (userLesson.getWatchedDuration() == null) {
            userLesson.setWatchedDuration(0);
        }

        userLesson.setIsDone(true);
        userLesson.setCompletedAt(LocalDateTime.now());
        userLessonRepository.save(userLesson);

        // 7.1 Cập nhật tiến độ section
        updateUserCourseSectionProgress(user, lesson.getSection(), enrollment);

        // 7.2 Nếu tất cả section đều 100% -> set Enrollment = Completed
        updateEnrollmentStatusIfCourseCompleted(user, lesson.getSection(), enrollment);

        // 7.5. Lưu tổng kết UserQuizResult (lần làm này)
        boolean passed = percentage.compareTo(BigDecimal.valueOf(60)) >= 0; // rule: >= 60% là pass

        UserQuizResult quizResult = UserQuizResult.builder()
                .user(user)
                .lesson(lesson)
                .totalQuestions(totalQuestions)
                .correctQuestions(correctQuestions)
                .totalScore(totalScore)
                .maxScore(maxScore)
                .percentage(percentage)
                .passed(passed)
                .submittedAt(LocalDateTime.now())
                .build();

        userQuizResultRepository.save(quizResult);

        // 8. Build response trả về cho FE (kèm đáp án + giải thích)
        return SubmitQuizResultResponse.builder()
                .totalQuestions(totalQuestions)
                .correctQuestions(correctQuestions)
                .totalScore(totalScore)
                .maxScore(maxScore)
                .percentage(percentage)
                .questions(questionResults)
                .build();
    }
    // ====================== LẤY KẾT QUẢ QUIZ MỚI NHẤT ======================

    @Transactional(readOnly = true)
    public SubmitQuizResultResponse getLatestQuizResult(
            Long userId, Long courseId, Long lessonId
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        // 1. Check enrollment
        Enrollment enrollment = enrollmentRepository
                .findByUser_UserIDAndCourse_CourseID(userId, courseId)
                .orElseThrow(() -> new AppException(ErrorCode.ENROLLMENT_NOT_FOUND));

        // 2. Check lesson + type + thuộc course
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        if (!lesson.getSection().getCourse().getCourseID().equals(courseId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        if (lesson.getLessonType() != LessonType.Quiz) {
            throw new AppException(ErrorCode.INVALID_STATE);
        }

        // 3. Lấy kết quả mới nhất của user cho lesson này
        UserQuizResult latest = userQuizResultRepository
                .findTopByUser_UserIDAndLesson_LessonIDOrderBySubmittedAtDesc(userId, lessonId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_RESULT_NOT_FOUND));
        // (Nếu chưa có, bạn thêm QUIZ_RESULT_NOT_FOUND vào ErrorCode, hoặc thay bằng lỗi chung bạn đang có)

        // 4. Lấy danh sách câu hỏi của quiz này
        List<QuizQuestion> questions =
                quizQuestionRepository.findByLessonOrderByOrderIndexAsc(lesson);

        if (questions.isEmpty()) {
            throw new AppException(ErrorCode.QUIZ_NO_QUESTION);
        }

        // 5. Lấy đáp án mà user đã chọn (QuizAnswer)
        List<QuizAnswer> answers =
                quizAnswerRepository.findByUserAndQuestion_Lesson(user, lesson);

        Map<Long, List<QuizAnswer>> answersByQuestionId = answers.stream()
                .collect(Collectors.groupingBy(a -> a.getQuestion().getQuestionID()));

        List<SubmitQuizQuestionResultResponse> questionResults = new ArrayList<>();

        for (QuizQuestion q : questions) {
            // Option đúng
            Set<Long> correctOptionIds = q.getOptions() == null ? Set.of()
                    : q.getOptions().stream()
                    .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                    .map(QuizOption::getOptionID)
                    .collect(Collectors.toSet());

            // Option user đã chọn từ QuizAnswer
            List<Long> selectedOptionIds = answersByQuestionId
                    .getOrDefault(q.getQuestionID(), List.of())
                    .stream()
                    .map(a -> a.getSelectedOption().getOptionID())
                    .toList();

            Set<Long> selectedSet = new HashSet<>(selectedOptionIds);

            BigDecimal qMaxScore = (q.getScore() != null) ? q.getScore() : BigDecimal.ONE;
            boolean isCorrect = !correctOptionIds.isEmpty()
                    && selectedSet.equals(correctOptionIds);
            BigDecimal qScore = isCorrect ? qMaxScore : BigDecimal.ZERO;

            questionResults.add(
                    SubmitQuizQuestionResultResponse.builder()
                            .questionID(q.getQuestionID())
                            .isCorrect(isCorrect)
                            .questionScore(qScore)
                            .maxScore(qMaxScore)
                            .selectedOptionIds(selectedOptionIds)
                            .correctOptionIds(new ArrayList<>(correctOptionIds))
                            .explanation(q.getExplanation())
                            .build()
            );
        }

        // 6. Trả về kết quả dựa trên UserQuizResult mới nhất + chi tiết từng câu
        return SubmitQuizResultResponse.builder()
                .totalQuestions(latest.getTotalQuestions())
                .correctQuestions(latest.getCorrectQuestions())
                .totalScore(latest.getTotalScore())
                .maxScore(latest.getMaxScore())
                .percentage(latest.getPercentage())
                .questions(questionResults)
                .build();
    }


    // ====================== HELPERS: PROGRESS & ENROLLMENT ======================

    private void updateUserCourseSectionProgress(User user, CourseSection section, Enrollment enrollment) {
        List<Lesson> lessons = section.getLessons();
        if (lessons == null || lessons.isEmpty()) return;

        long totalLessons = lessons.size();

        long completedLessons = lessons.stream()
                .filter(lesson -> userLessonRepository
                        .findByUser_UserIDAndLesson_LessonID(user.getUserID(), lesson.getLessonID())
                        .map(UserLesson::getIsDone)
                        .orElse(false))
                .count();

        double progressPercent = ((double) completedLessons / totalLessons) * 100;

        UserCourseSection userCourseSection = userCourseSectionRepository
                .findByUser_UserIDAndSection_SectionID(user.getUserID(), section.getSectionID())
                .orElseGet(() -> UserCourseSection.builder()
                        .user(user)
                        .section(section)
                        .enrollment(enrollment)
                        .progress(BigDecimal.ZERO)
                        .build());

        userCourseSection.setProgress(BigDecimal.valueOf(progressPercent));
        userCourseSectionRepository.save(userCourseSection);
    }

    private void updateEnrollmentStatusIfCourseCompleted(
            User user,
            CourseSection currentSection,
            Enrollment enrollment
    ) {
        Course course = currentSection.getCourse();
        List<CourseSection> allSections = course.getSections();
        if (allSections == null || allSections.isEmpty()) {
            return;
        }

        List<UserCourseSection> userSections =
                userCourseSectionRepository.findByUser_UserIDAndEnrollment_EnrollmentID(
                        user.getUserID(),
                        enrollment.getEnrollmentID()
                );

        if (userSections.size() < allSections.size()) {
            return;
        }

        boolean allCompleted = userSections.stream()
                .allMatch(ucs ->
                        ucs.getProgress() != null &&
                                ucs.getProgress().compareTo(BigDecimal.valueOf(100)) >= 0
                );

        if (allCompleted && enrollment.getStatus() != EnrollmentStatus.Completed) {
            enrollment.setStatus(EnrollmentStatus.Completed);
            enrollmentRepository.save(enrollment);
        }
    }

    // ====================== MAPPERS ======================

    private QuizOptionResponse toOptionResponse(QuizOption o, boolean includeCorrect) {
        return QuizOptionResponse.builder()
                .optionID(o.getOptionID())
                .optionText(o.getOptionText())
                .isCorrect(includeCorrect ? o.getIsCorrect() : null)
                .orderIndex(o.getOrderIndex())
                .build();
    }

    private QuizQuestionResponse toQuizQuestionResponse(QuizQuestion q, boolean includeCorrect) {
        List<QuizOptionResponse> optionResponses = q.getOptions() == null
                ? List.of()
                : q.getOptions().stream()
                .sorted(Comparator.comparing(
                        QuizOption::getOrderIndex,
                        Comparator.nullsLast(Integer::compareTo)
                ))
                .map(o -> toOptionResponse(o, includeCorrect))
                .toList();

        return QuizQuestionResponse.builder()
                .questionID(q.getQuestionID())
                .questionText(q.getQuestionText())
                .orderIndex(q.getOrderIndex())
                .explanation(includeCorrect ? q.getExplanation() : null)
                .score(q.getScore())
                .options(optionResponses)
                .build();
    }
}
