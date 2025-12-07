package edu.lms.service;

import edu.lms.dto.request.QuizQuestionRequest;
import edu.lms.dto.response.LessonQuizDetailResponse;
import edu.lms.dto.response.QuizOptionResponse;
import edu.lms.dto.response.QuizQuestionResponse;
import edu.lms.entity.*;
import edu.lms.enums.LessonType;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Transactional
public class TutorQuizService {

    TutorRepository tutorRepository;
    LessonRepository lessonRepository;
    LessonDraftRepository lessonDraftRepository;
    QuizQuestionRepository quizQuestionRepository;
    QuizQuestionDraftRepository quizQuestionDraftRepository;

    // ====================== COMMON HELPERS ======================

    private Tutor resolveTutorByEmail(String email) {
        return tutorRepository.findByUser_Email(email)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));
    }

    // Kiểm tra lesson live có thuộc tutor không + có phải Quiz không
    private Lesson resolveQuizLessonOwnedByTutor(Long lessonID, Long tutorID) {
        Lesson lesson = lessonRepository.findById(lessonID)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        CourseSection section = lesson.getSection();
        if (section == null || section.getCourse() == null || section.getCourse().getTutor() == null) {
            throw new AppException(ErrorCode.INVALID_STATE);
        }

        if (!section.getCourse().getTutor().getTutorID().equals(tutorID)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (lesson.getLessonType() != LessonType.Quiz) {
            throw new AppException(ErrorCode.INVALID_STATE); // lesson không phải quiz
        }

        return lesson;
    }

    // Kiểm tra lesson draft có thuộc tutor không + có phải Quiz không
    private LessonDraft resolveQuizLessonDraftOwnedByTutor(Long lessonDraftID, Long tutorID) {
        LessonDraft lessonDraft = lessonDraftRepository.findById(lessonDraftID)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        CourseSectionDraft sectionDraft = lessonDraft.getSectionDraft();
        if (sectionDraft == null || sectionDraft.getDraft() == null || sectionDraft.getDraft().getTutor() == null) {
            throw new AppException(ErrorCode.INVALID_STATE);
        }

        if (!sectionDraft.getDraft().getTutor().getTutorID().equals(tutorID)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (lessonDraft.getLessonType() != LessonType.Quiz) {
            throw new AppException(ErrorCode.INVALID_STATE);
        }

        return lessonDraft;
    }

    // ====================== MAPPERS ======================

    private QuizOptionResponse toQuizOptionResponse(QuizOption o) {
        return QuizOptionResponse.builder()
                .optionID(o.getOptionID())
                .optionText(o.getOptionText())
                .isCorrect(o.getIsCorrect())
                .orderIndex(o.getOrderIndex())
                .build();
    }

    private QuizOptionResponse toQuizOptionResponse(QuizOptionDraft o) {
        return QuizOptionResponse.builder()
                .optionID(o.getOptionDraftID())
                .optionText(o.getOptionText())
                .isCorrect(o.getIsCorrect())
                .orderIndex(o.getOrderIndex())
                .build();
    }

    private QuizQuestionResponse toQuizQuestionResponse(QuizQuestion q) {
        return QuizQuestionResponse.builder()
                .questionID(q.getQuestionID())
                .questionText(q.getQuestionText())
                .orderIndex(q.getOrderIndex())
                .explanation(q.getExplanation())
                .score(q.getScore())
                .options(
                        q.getOptions() == null ? List.of()
                                : q.getOptions().stream().map(this::toQuizOptionResponse).toList()
                )
                .build();
    }

    private QuizQuestionResponse toQuizQuestionResponse(QuizQuestionDraft q) {
        return QuizQuestionResponse.builder()
                .questionID(q.getQuestionDraftID())
                .questionText(q.getQuestionText())
                .orderIndex(q.getOrderIndex())
                .explanation(q.getExplanation())
                .score(q.getScore())
                .options(
                        q.getOptions() == null ? List.of()
                                : q.getOptions().stream().map(this::toQuizOptionResponse).toList()
                )
                .build();
    }

    // ====================== LIVE QUIZ (Lesson) ======================

    public LessonQuizDetailResponse getLiveLessonQuiz(String email, Long lessonID) {
        Tutor tutor = resolveTutorByEmail(email);
        Lesson lesson = resolveQuizLessonOwnedByTutor(lessonID, tutor.getTutorID());

        List<QuizQuestion> questions = quizQuestionRepository.findByLessonOrderByOrderIndexAsc(lesson);

        return LessonQuizDetailResponse.builder()
                .lessonID(lesson.getLessonID())
                .lessonTitle(lesson.getTitle())
                .lessonType(lesson.getLessonType())
                .isLive(true)
                .questions(
                        questions.stream().map(this::toQuizQuestionResponse).toList()
                )
                .build();
    }

    public QuizQuestionResponse createLiveQuestion(String email, Long lessonID, QuizQuestionRequest request) {
        Tutor tutor = resolveTutorByEmail(email);
        Lesson lesson = resolveQuizLessonOwnedByTutor(lessonID, tutor.getTutorID());

        QuizQuestion q = QuizQuestion.builder()
                .lesson(lesson)
                .questionText(request.getQuestionText())
                .orderIndex(request.getOrderIndex())
                .explanation(request.getExplanation())
                .score(request.getScore() != null ? request.getScore() : BigDecimal.valueOf(1.0))
                .build();

        if (request.getOptions() != null) {
            List<QuizOption> opts = new ArrayList<>();
            request.getOptions().forEach(oReq -> {
                QuizOption option = QuizOption.builder()
                        .question(q)
                        .optionText(oReq.getOptionText())
                        .isCorrect(Boolean.TRUE.equals(oReq.getIsCorrect()))
                        .orderIndex(oReq.getOrderIndex())
                        .build();
                opts.add(option);
            });
            q.setOptions(opts);
        }

        quizQuestionRepository.save(q);

        log.info("Tutor [{}] created quiz question [{}] for lesson [{}]",
                tutor.getTutorID(), q.getQuestionID(), lessonID);

        return toQuizQuestionResponse(q);
    }

    public QuizQuestionResponse updateLiveQuestion(String email, Long questionID, QuizQuestionRequest request) {
        Tutor tutor = resolveTutorByEmail(email);

        QuizQuestion q = quizQuestionRepository.findById(questionID)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_QUESTION_NOT_FOUND));

        Lesson lesson = q.getLesson();
        resolveQuizLessonOwnedByTutor(lesson.getLessonID(), tutor.getTutorID());

        q.setQuestionText(request.getQuestionText());
        q.setOrderIndex(request.getOrderIndex());
        q.setExplanation(request.getExplanation());
        q.setScore(request.getScore() != null ? request.getScore() : BigDecimal.valueOf(1.0));

        // clear all options cũ và tạo lại list mới
        q.getOptions().clear();

        if (request.getOptions() != null) {
            List<QuizOption> newOptions = new ArrayList<>();
            request.getOptions().forEach(oReq -> {
                QuizOption option = QuizOption.builder()
                        .question(q)
                        .optionText(oReq.getOptionText())
                        .isCorrect(Boolean.TRUE.equals(oReq.getIsCorrect()))
                        .orderIndex(oReq.getOrderIndex())
                        .build();
                newOptions.add(option);
            });
            q.getOptions().addAll(newOptions);
        }

        quizQuestionRepository.save(q);

        log.info("Tutor [{}] updated quiz question [{}]", tutor.getTutorID(), questionID);

        return toQuizQuestionResponse(q);
    }

    public void deleteLiveQuestion(String email, Long questionID) {
        Tutor tutor = resolveTutorByEmail(email);

        QuizQuestion q = quizQuestionRepository.findById(questionID)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_QUESTION_NOT_FOUND));

        Lesson lesson = q.getLesson();
        resolveQuizLessonOwnedByTutor(lesson.getLessonID(), tutor.getTutorID());

        quizQuestionRepository.delete(q);

        log.info("Tutor [{}] deleted quiz question [{}]", tutor.getTutorID(), questionID);
    }

    // ====================== DRAFT QUIZ (LessonDraft) ======================

    public LessonQuizDetailResponse getDraftLessonQuiz(String email, Long lessonDraftID) {
        Tutor tutor = resolveTutorByEmail(email);
        LessonDraft lessonDraft = resolveQuizLessonDraftOwnedByTutor(lessonDraftID, tutor.getTutorID());

        List<QuizQuestionDraft> questions =
                quizQuestionDraftRepository.findByLessonDraftOrderByOrderIndexAsc(lessonDraft);

        return LessonQuizDetailResponse.builder()
                .lessonID(lessonDraft.getLessonDraftID())
                .lessonTitle(lessonDraft.getTitle())
                .lessonType(lessonDraft.getLessonType())
                .isLive(false)
                .questions(
                        questions.stream().map(this::toQuizQuestionResponse).toList()
                )
                .build();
    }

    public QuizQuestionResponse createDraftQuestion(String email, Long lessonDraftID, QuizQuestionRequest request) {
        Tutor tutor = resolveTutorByEmail(email);
        LessonDraft lessonDraft = resolveQuizLessonDraftOwnedByTutor(lessonDraftID, tutor.getTutorID());

        QuizQuestionDraft q = QuizQuestionDraft.builder()
                .lessonDraft(lessonDraft)
                .questionText(request.getQuestionText())
                .orderIndex(request.getOrderIndex())
                .explanation(request.getExplanation())
                .score(request.getScore() != null ? request.getScore() : BigDecimal.valueOf(1.0))
                .build();

        if (request.getOptions() != null) {
            List<QuizOptionDraft> opts = new ArrayList<>();
            request.getOptions().forEach(oReq -> {
                QuizOptionDraft option = QuizOptionDraft.builder()
                        .questionDraft(q)
                        .optionText(oReq.getOptionText())
                        .isCorrect(Boolean.TRUE.equals(oReq.getIsCorrect()))
                        .orderIndex(oReq.getOrderIndex())
                        .build();
                opts.add(option);
            });
            q.setOptions(opts);
        }

        quizQuestionDraftRepository.save(q);

        log.info("Tutor [{}] created quiz question draft [{}] for lessonDraft [{}]",
                tutor.getTutorID(), q.getQuestionDraftID(), lessonDraftID);

        return toQuizQuestionResponse(q);
    }

    public QuizQuestionResponse updateDraftQuestion(String email, Long questionDraftID, QuizQuestionRequest request) {
        Tutor tutor = resolveTutorByEmail(email);

        QuizQuestionDraft q = quizQuestionDraftRepository.findById(questionDraftID)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_QUESTION_NOT_FOUND));

        LessonDraft lessonDraft = q.getLessonDraft();
        resolveQuizLessonDraftOwnedByTutor(lessonDraft.getLessonDraftID(), tutor.getTutorID());

        q.setQuestionText(request.getQuestionText());
        q.setOrderIndex(request.getOrderIndex());
        q.setExplanation(request.getExplanation());
        q.setScore(request.getScore() != null ? request.getScore() : BigDecimal.valueOf(1.0));

        q.getOptions().clear();

        if (request.getOptions() != null) {
            List<QuizOptionDraft> newOptions = new ArrayList<>();
            request.getOptions().forEach(oReq -> {
                QuizOptionDraft option = QuizOptionDraft.builder()
                        .questionDraft(q)
                        .optionText(oReq.getOptionText())
                        .isCorrect(Boolean.TRUE.equals(oReq.getIsCorrect()))
                        .orderIndex(oReq.getOrderIndex())
                        .build();
                newOptions.add(option);
            });
            q.getOptions().addAll(newOptions);
        }

        quizQuestionDraftRepository.save(q);

        log.info("Tutor [{}] updated quiz question draft [{}]", tutor.getTutorID(), questionDraftID);

        return toQuizQuestionResponse(q);
    }

    public void deleteDraftQuestion(String email, Long questionDraftID) {
        Tutor tutor = resolveTutorByEmail(email);

        QuizQuestionDraft q = quizQuestionDraftRepository.findById(questionDraftID)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_QUESTION_NOT_FOUND));

        LessonDraft lessonDraft = q.getLessonDraft();
        resolveQuizLessonDraftOwnedByTutor(lessonDraft.getLessonDraftID(), tutor.getTutorID());

        quizQuestionDraftRepository.delete(q);

        log.info("Tutor [{}] deleted quiz question draft [{}]", tutor.getTutorID(), questionDraftID);
    }
}
