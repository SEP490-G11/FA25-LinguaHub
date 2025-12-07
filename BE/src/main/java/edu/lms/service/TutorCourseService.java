package edu.lms.service;

import edu.lms.dto.request.TutorCourseRequest;
import edu.lms.dto.response.*;
import edu.lms.entity.*;
import edu.lms.enums.CourseDraftStatus;
import edu.lms.enums.CourseStatus;
import edu.lms.enums.LessonType;
import edu.lms.enums.TutorStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.mapper.TutorCourseMapper;
import edu.lms.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Transactional
public class TutorCourseService {

    TutorRepository tutorRepository;
    CourseRepository courseRepository;
    CourseCategoryRepository courseCategoryRepository;
    EnrollmentRepository enrollmentRepository;
    CourseSectionRepository courseSectionRepository;
    LessonRepository lessonRepository;
    LessonResourceRepository lessonResourceRepository;
    TutorCourseMapper tutorCourseMapper;
    CourseObjectiveRepository courseObjectiveRepository;
    CourseObjectiveDraftRepository courseObjectiveDraftRepository;

    CourseDraftRepository courseDraftRepository;
    CourseSectionDraftRepository courseSectionDraftRepository;
    LessonDraftRepository lessonDraftRepository;
    LessonResourceDraftRepository lessonResourceDraftRepository;

    QuizQuestionRepository quizQuestionRepository;
    QuizOptionRepository quizOptionRepository;
    QuizQuestionDraftRepository quizQuestionDraftRepository;
    QuizOptionDraftRepository quizOptionDraftRepository;

    CourseReviewRepository courseReviewRepository;

    // ====================== COMMON HELPERS ======================

    private Tutor resolveTutorByEmail(String email) {
        return tutorRepository.findByUser_Email(email)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));
    }

    private void ensureCourseOwner(Course course, Long tutorId) {
        if (!course.getTutor().getTutorID().equals(tutorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    private void ensureDraftOwner(CourseDraft draft, Long tutorId) {
        if (!draft.getTutor().getTutorID().equals(tutorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    // Cho phép tutor sửa trực tiếp course (khi CHƯA có enrollment)
    public TutorCourseDetailResponse startEditCourseDirect(String email, Long courseID) {
        Tutor tutor = resolveTutorByEmail(email);

        Course course = courseRepository.findById(courseID)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        ensureCourseOwner(course, tutor.getTutorID());

        // Nếu đã có learner enroll → dùng flow Draft (cũ)
        if (enrollmentRepository.existsByCourse(course)) {
            throw new AppException(ErrorCode.COURSE_HAS_ENROLLMENT);
        }

        // Nếu đang Approved → chuyển thành Draft để sửa
        if (course.getStatus() == CourseStatus.Approved) {
            course.setStatus(CourseStatus.Draft);
            course.setUpdatedAt(LocalDateTime.now());
            courseRepository.save(course);
        }

        // Trả về detail của bản live (đang ở trạng thái Draft)
        return toTutorCourseDetailResponse(course);
    }

    // ========================== FLOW COURSE LIVE ============================

    // Create (me)
    public TutorCourseResponse createCourseForCurrentTutor(String email, TutorCourseRequest request) {
        Tutor tutor = resolveTutorByEmail(email);

        if (tutor.getStatus() != TutorStatus.APPROVED)
            throw new AppException(ErrorCode.TUTOR_NOT_APPROVED);

        CourseCategory category = courseCategoryRepository.findById(request.getCategoryID())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_CATEGORY_NOT_FOUND));

        // Tạo entity Course từ mapper
        Course course = tutorCourseMapper.toCourse(request);
        course.setTutor(tutor);
        course.setCategory(category);
        course.setStatus(CourseStatus.Draft);

        // Bổ sung các trường mới (nếu mapper chưa tự map)
        course.setShortDescription(request.getShortDescription());
        course.setRequirement(request.getRequirement());
        course.setLevel(request.getLevel());

        courseRepository.save(course);

        log.info("Tutor [{}] created new course [{}]", tutor.getTutorID(), course.getTitle());
        return tutorCourseMapper.toTutorCourseResponse(course);
    }

    // View (me)
    public List<TutorCourseResponse> getMyCourses(String email) {
        Tutor tutor = resolveTutorByEmail(email);
        return courseRepository.findByTutor(tutor).stream()
                .map(tutorCourseMapper::toTutorCourseResponse).toList();
    }

    public List<TutorCourseResponse> getMyCoursesByStatus(String email, CourseStatus status) {
        Tutor tutor = resolveTutorByEmail(email);
        List<Course> courses = (status == null)
                ? courseRepository.findByTutor(tutor)
                : courseRepository.findByTutorAndStatus(tutor, status);
        return courses.stream().map(tutorCourseMapper::toTutorCourseResponse).toList();
    }

    // Update (me) – CHỈ dùng cho course chưa có enrollment
    public TutorCourseResponse updateCourseForCurrentTutor(String email, Long courseID, TutorCourseRequest request) {
        Tutor tutor = resolveTutorByEmail(email);

        Course course = courseRepository.findById(courseID)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        ensureCourseOwner(course, tutor.getTutorID());

        if (enrollmentRepository.existsByCourse(course)) {
            throw new AppException(ErrorCode.COURSE_HAS_ENROLLMENT); // FE sẽ gọi API draft
        }

        if (course.getStatus() == CourseStatus.Approved) {
            course.setStatus(CourseStatus.Pending);
        }

        CourseCategory category = courseCategoryRepository.findById(request.getCategoryID())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_CATEGORY_NOT_FOUND));

        course.setTitle(request.getTitle());
        course.setShortDescription(request.getShortDescription());
        course.setDescription(request.getDescription());
        course.setRequirement(request.getRequirement());
        course.setLevel(request.getLevel());
        course.setDuration(request.getDuration());
        course.setPrice(request.getPrice());
        course.setLanguage(request.getLanguage());
        course.setThumbnailURL(request.getThumbnailURL());
        course.setCategory(category);
        course.setUpdatedAt(LocalDateTime.now());

        courseRepository.save(course);

        log.info("Tutor [{}] updated course [{}] (status after update: {})",
                tutor.getTutorID(), courseID, course.getStatus());

        return tutorCourseMapper.toTutorCourseResponse(course);
    }

    @Transactional
    public void deleteCourseForCurrentTutor(String email, Long courseID) {
        Tutor tutor = resolveTutorByEmail(email);

        Course course = courseRepository.findById(courseID)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        ensureCourseOwner(course, tutor.getTutorID());

        // CHỈ cho xoá khi status = Draft hoặc Rejected
        if (course.getStatus() != CourseStatus.Draft
                && course.getStatus() != CourseStatus.Rejected) {
            throw new AppException(ErrorCode.COURSE_DELETE_ONLY_DRAFT_OR_REJECTED);
        }

        // Không cho xoá nếu đã có learner enroll
        if (enrollmentRepository.existsByCourse(course)) {
            throw new AppException(ErrorCode.COURSE_HAS_ENROLLMENT);
        }

        // Xoá luôn các bản draft liên quan (nếu có)
        List<CourseDraft> drafts = courseDraftRepository.findByCourse_CourseID(courseID);
        if (!drafts.isEmpty()) {
            courseDraftRepository.deleteAll(drafts);
        }

        courseRepository.delete(course);

        log.warn("Tutor [{}] deleted course [{}] (status: {}) and all related data (drafts & curriculum via cascade)",
                tutor.getTutorID(), courseID, course.getStatus());
    }


    // Disable / Enable course
    public TutorCourseResponse disableCourse(String email, Long courseID) {
        Tutor tutor = resolveTutorByEmail(email);

        if (tutor.getStatus() != TutorStatus.APPROVED) {
            throw new AppException(ErrorCode.TUTOR_NOT_APPROVED);
        }

        Course course = courseRepository.findById(courseID)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        ensureCourseOwner(course, tutor.getTutorID());

        if (course.getStatus() != CourseStatus.Approved) {
            throw new AppException(ErrorCode.INVALID_STATE);
        }

        course.setStatus(CourseStatus.Disabled);
        course.setUpdatedAt(LocalDateTime.now());
        courseRepository.save(course);

        log.info("Tutor [{}] disabled course [{}]", tutor.getTutorID(), courseID);

        return tutorCourseMapper.toTutorCourseResponse(course);
    }

    public TutorCourseResponse enableCourse(String email, Long courseID) {
        Tutor tutor = resolveTutorByEmail(email);

        if (tutor.getStatus() != TutorStatus.APPROVED) {
            throw new AppException(ErrorCode.TUTOR_NOT_APPROVED);
        }

        Course course = courseRepository.findById(courseID)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        ensureCourseOwner(course, tutor.getTutorID());

        if (course.getStatus() != CourseStatus.Disabled) {
            throw new AppException(ErrorCode.INVALID_STATE);
        }

        course.setStatus(CourseStatus.Approved);
        course.setUpdatedAt(LocalDateTime.now());
        courseRepository.save(course);

        log.info("Tutor [{}] enabled course [{}]", tutor.getTutorID(), courseID);

        return tutorCourseMapper.toTutorCourseResponse(course);
    }

    // Lấy students đã enroll khóa học của tutor
    public List<TutorCourseStudentResponse> getStudentsByCourse(Long courseId, Long tutorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        ensureCourseOwner(course, tutor.getTutorID());

        List<Enrollment> enrollments = enrollmentRepository.findAllByCourseId(courseId);

        return enrollments.stream().map(e -> {
            var u = e.getUser();
            return TutorCourseStudentResponse.builder()
                    .userId(u.getUserID())
                    .fullName(u.getFullName())
                    .email(u.getEmail())
                    .phone(u.getPhone())
                    .country(u.getCountry())
                    .enrolledAt(e.getCreatedAt())
                    .build();
        }).toList();
    }

    // detail của tutor (live course)
    public TutorCourseDetailResponse getMyCourseDetail(String email, Long courseID) {
        Tutor tutor = resolveTutorByEmail(email);

        Course course = courseRepository.findById(courseID)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        ensureCourseOwner(course, tutor.getTutorID());
        return toTutorCourseDetailResponse(course);
    }

    // submit course for review
    public TutorCourseResponse submitCourseForReview(String email, Long courseID) {
        Tutor tutor = resolveTutorByEmail(email);

        Course course = courseRepository.findById(courseID)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        ensureCourseOwner(course, tutor.getTutorID());

        CourseStatus status = course.getStatus();

        if (status == CourseStatus.Approved) {
            throw new AppException(ErrorCode.CAN_NOT_CHANGE_STATUS);
        }

        if (status == CourseStatus.Pending) {
            log.info("Tutor [{}] re-submit course [{}] ignored (already Pending)",
                    tutor.getTutorID(), courseID);
            return tutorCourseMapper.toTutorCourseResponse(course);
        }

        if (status == CourseStatus.Draft || status == CourseStatus.Rejected) {
            course.setStatus(CourseStatus.Pending);
            course.setUpdatedAt(LocalDateTime.now());
            courseRepository.save(course);

            log.info("Tutor [{}] submitted course [{}] for review ({} -> Pending)",
                    tutor.getTutorID(), courseID, status);
            return tutorCourseMapper.toTutorCourseResponse(course);
        }

        throw new AppException(ErrorCode.INVALID_STATE);
    }

    // ========================== FLOW COURSE DRAFT ============================

    // 1) Tutor bắt đầu/chỉnh sửa draft update cho 1 course đã Approved
    @Transactional
    public TutorCourseDetailResponse startEditCourseDraft(String email, Long courseID) {
        Tutor tutor = resolveTutorByEmail(email);

        Course course = courseRepository.findById(courseID)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        ensureCourseOwner(course, tutor.getTutorID());

        if (course.getStatus() != CourseStatus.Approved) {
            throw new AppException(ErrorCode.CAN_ONLY_EDIT_DRAFT_FOR_APPROVED_COURSE);
        }

        var existingDraftOpt = courseDraftRepository.findByCourse_CourseIDAndStatusIn(
                courseID,
                List.of(CourseDraftStatus.EDITING, CourseDraftStatus.PENDING_REVIEW)
        );
        if (existingDraftOpt.isPresent()) {
            log.info("Tutor [{}] reuse existing draft [{}] for course [{}]",
                    tutor.getTutorID(), existingDraftOpt.get().getDraftID(), courseID);
            return toTutorCourseDetailResponse(existingDraftOpt.get());
        }

        // 6. Tạo draft mới từ bản live (clone metadata)
        CourseDraft draft = CourseDraft.builder()
                .course(course)
                .tutor(course.getTutor())
                .category(course.getCategory())
                .title(course.getTitle())
                .shortDescription(course.getShortDescription())
                .description(course.getDescription())
                .requirement(course.getRequirement())
                .level(course.getLevel())
                .duration(course.getDuration())
                .price(course.getPrice())
                .language(course.getLanguage())
                .thumbnailURL(course.getThumbnailURL())
                .status(CourseDraftStatus.EDITING)
                .build();

        courseDraftRepository.save(draft);

        // 7. Clone Section/Lesson/Resource + QUIZ sang bản draft
        var sections = course.getSections();
        if (sections != null) {
            for (CourseSection s : sections) {

                CourseSectionDraft sd = CourseSectionDraft.builder()
                        .draft(draft)
                        .originalSectionID(s.getSectionID())
                        .title(s.getTitle())
                        .description(s.getDescription())
                        .orderIndex(s.getOrderIndex())
                        .build();
                courseSectionDraftRepository.save(sd);

                if (s.getLessons() != null) {
                    for (Lesson l : s.getLessons()) {

                        LessonDraft ld = LessonDraft.builder()
                                .sectionDraft(sd)
                                .originalLessonID(l.getLessonID())
                                .title(l.getTitle())
                                .duration(l.getDuration())
                                .lessonType(l.getLessonType())
                                .videoURL(l.getVideoURL())
                                .content(l.getContent())
                                .orderIndex(l.getOrderIndex())
                                .build();
                        lessonDraftRepository.save(ld);

                        // NEW: nếu lesson là Quiz thì clone luôn quiz_question + quiz_option
                        if (l.getLessonType() == LessonType.Quiz) {
                            List<QuizQuestion> questions =
                                    quizQuestionRepository.findByLessonOrderByOrderIndexAsc(l);

                            for (QuizQuestion q : questions) {
                                QuizQuestionDraft qd = QuizQuestionDraft.builder()
                                        .lessonDraft(ld)
                                        .questionText(q.getQuestionText())
                                        .orderIndex(q.getOrderIndex())
                                        .explanation(q.getExplanation())
                                        .score(q.getScore())
                                        .build();
                                quizQuestionDraftRepository.save(qd);

                                if (q.getOptions() != null) {
                                    for (QuizOption o : q.getOptions()) {
                                        QuizOptionDraft od = QuizOptionDraft.builder()
                                                .questionDraft(qd)
                                                .optionText(o.getOptionText())
                                                .isCorrect(o.getIsCorrect())
                                                .orderIndex(o.getOrderIndex())
                                                .build();
                                        quizOptionDraftRepository.save(od);
                                    }
                                }
                            }
                        }

                        if (l.getResources() != null) {
                            for (LessonResource r : l.getResources()) {
                                LessonResourceDraft rd = LessonResourceDraft.builder()
                                        .lessonDraft(ld)
                                        .originalResourceID(r.getResourceID())
                                        .resourceType(r.getResourceType())
                                        .resourceTitle(r.getResourceTitle())
                                        .resourceURL(r.getResourceURL())
                                        .build();

                                lessonResourceDraftRepository.save(rd);
                            }
                        }
                    }
                }
            }
        }

        // 8. Clone Objective sang bản draft
        var objectives = course.getObjectives();
        if (objectives != null) {
            for (CourseObjective o : objectives) {
                CourseObjectiveDraft od = CourseObjectiveDraft.builder()
                        .draft(draft)
                        .originalObjectiveID(o.getObjectiveID())
                        .objectiveText(o.getObjectiveText())
                        .orderIndex(o.getOrderIndex())
                        .build();
                courseObjectiveDraftRepository.save(od);
            }
        }

        log.info("Tutor [{}] started new draft [{}] for course [{}] (clone with quiz)",
                tutor.getTutorID(), draft.getDraftID(), courseID);

        return toTutorCourseDetailResponse(draft);
    }

    // 2) Tutor xem chi tiết bản draft
    public TutorCourseDetailResponse getMyCourseDraftDetail(String email, Long draftID) {
        Tutor tutor = resolveTutorByEmail(email);

        CourseDraft draft = courseDraftRepository.findById(draftID)
                .orElseThrow(() -> new AppException(ErrorCode.DRAFT_NOT_FOUND));

        ensureDraftOwner(draft, tutor.getTutorID());

        return toTutorCourseDetailResponse(draft);
    }

    // 3) Tutor update metadata của draft
    public TutorCourseDetailResponse updateCourseDraftInfo(String email, Long draftID, TutorCourseRequest request) {
        Tutor tutor = resolveTutorByEmail(email);

        CourseDraft draft = courseDraftRepository.findById(draftID)
                .orElseThrow(() -> new AppException(ErrorCode.DRAFT_NOT_FOUND));

        ensureDraftOwner(draft, tutor.getTutorID());

        if (draft.getStatus() != CourseDraftStatus.EDITING) {
            throw new AppException(ErrorCode.INVALID_STATE);
        }

        CourseCategory category = courseCategoryRepository.findById(request.getCategoryID())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_CATEGORY_NOT_FOUND));

        draft.setTitle(request.getTitle());
        draft.setShortDescription(request.getShortDescription());
        draft.setDescription(request.getDescription());
        draft.setRequirement(request.getRequirement());
        draft.setLevel(request.getLevel());
        draft.setDuration(request.getDuration());
        draft.setPrice(request.getPrice());
        draft.setLanguage(request.getLanguage());
        draft.setThumbnailURL(request.getThumbnailURL());
        draft.setCategory(category);
        draft.setUpdatedAt(LocalDateTime.now());

        return toTutorCourseDetailResponse(draft);
    }

    // 4) Tutor submit draft cho admin duyệt
    public TutorCourseDetailResponse submitCourseDraftForReview(String email, Long draftID) {
        Tutor tutor = resolveTutorByEmail(email);

        CourseDraft draft = courseDraftRepository.findById(draftID)
                .orElseThrow(() -> new AppException(ErrorCode.DRAFT_NOT_FOUND));

        ensureDraftOwner(draft, tutor.getTutorID());

        CourseDraftStatus status = draft.getStatus();

        if (status == CourseDraftStatus.PENDING_REVIEW) {
            log.info("Tutor [{}] re-submit draft [{}] ignored (already PENDING_REVIEW)",
                    tutor.getTutorID(), draftID);
            return toTutorCourseDetailResponse(draft);
        }

        if (status == CourseDraftStatus.EDITING || status == CourseDraftStatus.REJECTED) {
            draft.setStatus(CourseDraftStatus.PENDING_REVIEW);
            draft.setUpdatedAt(LocalDateTime.now());
            log.info("Tutor [{}] submitted draft [{}] for review ({} -> PENDING_REVIEW)",
                    tutor.getTutorID(), draftID, status);
            return toTutorCourseDetailResponse(draft);
        }

        throw new AppException(ErrorCode.INVALID_STATE);
    }

    @Transactional
    public void deleteCourseDraftForCurrentTutor(String email, Long draftID) {
        Tutor tutor = resolveTutorByEmail(email);

        CourseDraft draft = courseDraftRepository.findById(draftID)
                .orElseThrow(() -> new AppException(ErrorCode.DRAFT_NOT_FOUND));

        ensureDraftOwner(draft, tutor.getTutorID());

        if (draft.getStatus() != CourseDraftStatus.EDITING) {
            throw new AppException(ErrorCode.INVALID_STATE);
        }

        courseDraftRepository.delete(draft);

        log.info("Tutor [{}] deleted course draft [{}] of course [{}]",
                tutor.getTutorID(), draftID, draft.getCourse().getCourseID());
    }


    // ================== MAPPERS cho LIVE & DRAFT DETAIL =====================

    private LessonResourceResponse toLessonResourceResponse(LessonResource lr) {
        return LessonResourceResponse.builder()
                .resourceID(lr.getResourceID())
                .resourceType(lr.getResourceType())
                .resourceTitle(lr.getResourceTitle())
                .resourceURL(lr.getResourceURL())
                .uploadedAt(lr.getUploadedAt())
                .build();
    }

    private LessonResourceResponse toLessonResourceResponse(LessonResourceDraft lr) {
        return LessonResourceResponse.builder()
                .resourceID(lr.getResourceDraftID())
                .resourceType(lr.getResourceType())
                .resourceTitle(lr.getResourceTitle())
                .resourceURL(lr.getResourceURL())
                .uploadedAt(null)
                .build();
    }

    private LessonResponse toLessonResponse(Lesson l) {
        // DEFAULT: không có quiz
        List<QuizQuestionResponse> quizQuestionResponses = null;

        // Nếu lesson là Quiz -> load danh sách câu hỏi + options
        if (l.getLessonType() == LessonType.Quiz) {
            var questions = quizQuestionRepository.findByLessonOrderByOrderIndexAsc(l);
            quizQuestionResponses = questions.stream()
                    .map(this::toQuizQuestionResponse)
                    .toList();
        }

        return LessonResponse.builder()
                .lessonID(l.getLessonID())
                .title(l.getTitle())
                .duration(l.getDuration())
                .lessonType(l.getLessonType())
                .videoURL(l.getVideoURL())
                .content(l.getContent())
                .orderIndex(l.getOrderIndex())
                .createdAt(l.getCreatedAt())
                .resources(
                        l.getResources() == null
                                ? List.of()
                                : l.getResources().stream()
                                .map(this::toLessonResourceResponse)
                                .toList()
                )
                .quizQuestions(quizQuestionResponses)
                .build();
    }


    private LessonResponse toLessonResponse(LessonDraft l) {
        List<QuizQuestionResponse> quizQuestionResponses = null;

        if (l.getLessonType() == LessonType.Quiz) {
            var questions = quizQuestionDraftRepository.findByLessonDraftOrderByOrderIndexAsc(l);
            quizQuestionResponses = questions.stream()
                    .map(this::toQuizQuestionResponse)
                    .toList();
        }

        return LessonResponse.builder()
                .lessonID(l.getLessonDraftID())
                .title(l.getTitle())
                .duration(l.getDuration())
                .lessonType(l.getLessonType())
                .videoURL(l.getVideoURL())
                .content(l.getContent())
                .orderIndex(l.getOrderIndex())
                .createdAt(null) // draft chưa cần createdAt
                .resources(
                        l.getResources() == null
                                ? List.of()
                                : l.getResources().stream()
                                .map(this::toLessonResourceResponse)
                                .toList()
                )
                .quizQuestions(quizQuestionResponses)
                .build();
    }


    private CourseSectionResponse toCourseSectionResponse(CourseSection s) {
        return CourseSectionResponse.builder()
                .sectionID(s.getSectionID())
                .courseID(s.getCourse().getCourseID())
                .title(s.getTitle())
                .description(s.getDescription())
                .orderIndex(s.getOrderIndex())
                .lessons(
                        s.getLessons() == null ? null :
                                s.getLessons().stream().map(this::toLessonResponse).toList()
                )
                .build();
    }

    private CourseSectionResponse toCourseSectionResponse(CourseSectionDraft s) {
        return CourseSectionResponse.builder()
                .sectionID(s.getSectionDraftID())
                .courseID(s.getDraft().getCourse().getCourseID())
                .title(s.getTitle())
                .description(s.getDescription())
                .orderIndex(s.getOrderIndex())
                .lessons(
                        s.getLessons() == null ? null :
                                s.getLessons().stream().map(this::toLessonResponse).toList()
                )
                .build();
    }

    private TutorCourseDetailResponse toTutorCourseDetailResponse(Course c) {
        long learnerCount = enrollmentRepository.countByCourse_CourseID(c.getCourseID());
        var rating = aggregateRating(c.getCourseID());


        return TutorCourseDetailResponse.builder()
                .id(c.getCourseID())
                .title(c.getTitle())
                .shortDescription(c.getShortDescription())
                .description(c.getDescription())
                .requirement(c.getRequirement())
                .level(c.getLevel())
                .duration(c.getDuration())
                .price(c.getPrice())
                .language(c.getLanguage())
                .thumbnailURL(c.getThumbnailURL())
                .categoryName(c.getCategory() != null ? c.getCategory().getName() : null)
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .adminReviewNote(c.getAdminReviewNote())
                .avgRating(rating.avg)
                .totalRatings(rating.total)
                .learnerCount(learnerCount)
                .section(
                        c.getSections() == null ? List.of() :
                                c.getSections().stream()
                                        .map(this::toCourseSectionResponse)
                                        .toList()
                )
                .objectives(
                        c.getObjectives() == null ? List.of() :
                                c.getObjectives().stream()
                                        .sorted(Comparator.comparing(CourseObjective::getOrderIndex))
                                        .map(o -> CourseObjectiveResponse.builder()
                                                .objectiveID(o.getObjectiveID())
                                                .courseID(c.getCourseID())
                                                .objectiveText(o.getObjectiveText())
                                                .orderIndex(o.getOrderIndex())
                                                .build()
                                        )
                                        .toList()
                )
                .build();
    }

    private TutorCourseDetailResponse toTutorCourseDetailResponse(CourseDraft d) {
        long learnerCount = enrollmentRepository.countByCourse_CourseID(d.getDraftID());
        var rating = aggregateRating(d.getDraftID());

        return TutorCourseDetailResponse.builder()
                .id(d.getDraftID())
                .title(d.getTitle())
                .shortDescription(d.getShortDescription())
                .description(d.getDescription())
                .requirement(d.getRequirement())
                .level(d.getLevel())
                .duration(d.getDuration())
                .price(d.getPrice())
                .language(d.getLanguage())
                .thumbnailURL(d.getThumbnailURL())
                .categoryName(d.getCategory() != null ? d.getCategory().getName() : null)
                .status(d.getStatus() != null ? d.getStatus().name() : null)
                .adminReviewNote(d.getAdminReviewNote())
                .avgRating(rating.avg)
                .totalRatings(rating.total)
                .learnerCount(learnerCount)
                .section(
                        d.getSections() == null ? List.of() :
                                d.getSections().stream()
                                        .map(this::toCourseSectionResponse)
                                        .toList()
                )
                .objectives(
                        d.getObjectives() == null ? List.of() :
                                d.getObjectives().stream()
                                        .sorted(Comparator.comparing(CourseObjectiveDraft::getOrderIndex))
                                        .map(o -> CourseObjectiveResponse.builder()
                                                .objectiveID(o.getObjectiveDraftID()) // 👈 ID của draft objective
                                                .courseID(d.getCourse().getCourseID())
                                                .objectiveText(o.getObjectiveText())
                                                .orderIndex(o.getOrderIndex())
                                                .build()
                                        )
                                        .toList()
                )
                .build();
    }


    // ================== MAPPER QUIZ (LIVE) ==================
    private QuizOptionResponse toQuizOptionResponse(QuizOption o) {
        return QuizOptionResponse.builder()
                .optionID(o.getOptionID())
                .optionText(o.getOptionText())
                .isCorrect(o.getIsCorrect())          // Tutor thấy được đáp án đúng
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
                        q.getOptions() == null
                                ? List.of()
                                : q.getOptions().stream()
                                .sorted(Comparator.comparing(
                                        QuizOption::getOrderIndex,
                                        Comparator.nullsLast(Integer::compareTo)
                                ))
                                .map(this::toQuizOptionResponse)
                                .toList()
                )
                .build();
    }

    // ================== MAPPER QUIZ (DRAFT) ==================
    private QuizOptionResponse toQuizOptionResponse(QuizOptionDraft o) {
        return QuizOptionResponse.builder()
                .optionID(o.getOptionDraftID())
                .optionText(o.getOptionText())
                .isCorrect(o.getIsCorrect())
                .orderIndex(o.getOrderIndex())
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
                        q.getOptions() == null
                                ? List.of()
                                : q.getOptions().stream()
                                .sorted(Comparator.comparing(
                                        QuizOptionDraft::getOrderIndex,
                                        Comparator.nullsLast(Integer::compareTo)
                                ))
                                .map(this::toQuizOptionResponse)
                                .toList()
                )
                .build();
    }

    private record RatingAgg(double avg, int total) {}
    private RatingAgg aggregateRating(Long courseId) {
        var reviews = courseReviewRepository.findByCourse_CourseID(courseId);
        if (reviews == null || reviews.isEmpty()) return new RatingAgg(0.0, 0);

        int total = reviews.size();
        double sum = reviews.stream().mapToDouble(r -> r.getRating() == null ? 0 : r.getRating()).sum();
        double avg = total == 0 ? 0.0 : sum / total;
        avg = Math.round(avg * 10.0) / 10.0; // 1 chữ số
        return new RatingAgg(avg, total);
    }
}
