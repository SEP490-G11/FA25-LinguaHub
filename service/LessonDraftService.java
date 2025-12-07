// src/main/java/edu/lms/service/LessonDraftService.java
package edu.lms.service;

import edu.lms.dto.request.LessonRequest;
import edu.lms.dto.response.LessonResourceResponse;
import edu.lms.dto.response.LessonResponse;
import edu.lms.entity.*;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.CourseSectionDraftRepository;
import edu.lms.repository.LessonDraftRepository;
import edu.lms.repository.LessonResourceDraftRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
@Transactional
public class LessonDraftService {

    LessonDraftRepository lessonDraftRepository;
    CourseSectionDraftRepository courseSectionDraftRepository;
    LessonResourceDraftRepository lessonResourceDraftRepository;

    private CourseSectionDraft resolveSectionDraftAndCheckOwner(Long sectionDraftID, String email) {
        CourseSectionDraft sd = courseSectionDraftRepository.findById(sectionDraftID)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        String tutorEmail = sd.getDraft().getTutor().getUser().getEmail();
        if (!tutorEmail.equalsIgnoreCase(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return sd;
    }

    private LessonDraft resolveLessonDraftAndCheckOwner(Long lessonDraftID, String email) {
        LessonDraft ld = lessonDraftRepository.findById(lessonDraftID)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));

        String tutorEmail = ld.getSectionDraft().getDraft().getTutor().getUser().getEmail();
        if (!tutorEmail.equalsIgnoreCase(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return ld;
    }

    private LessonResourceResponse mapRes(LessonResourceDraft r) {
        return LessonResourceResponse.builder()
                .resourceID(r.getResourceDraftID())
                .resourceType(r.getResourceType())
                .resourceTitle(r.getResourceTitle())
                .resourceURL(r.getResourceURL())
                .uploadedAt(null)
                .build();
    }

    private LessonResponse toResponse(LessonDraft l) {
        return LessonResponse.builder()
                .lessonID(l.getLessonDraftID())
                .title(l.getTitle())
                .duration(l.getDuration())
                .lessonType(l.getLessonType())
                .videoURL(l.getVideoURL())
                .content(l.getContent())
                .orderIndex(l.getOrderIndex())
                .createdAt(null)
                .resources(l.getResources() == null
                        ? List.of()
                        : l.getResources().stream().map(this::mapRes).toList())
                .build();
    }

    public List<LessonResponse> getLessonsBySectionDraft(Long sectionDraftID, String email) {
        CourseSectionDraft sd = resolveSectionDraftAndCheckOwner(sectionDraftID, email);

        return lessonDraftRepository
                .findBySectionDraft_SectionDraftIDOrderByOrderIndexAsc(sd.getSectionDraftID())
                .stream().map(this::toResponse).toList();
    }

    public LessonResponse createLesson(Long sectionDraftID, LessonRequest request, String email) {
        CourseSectionDraft sd = resolveSectionDraftAndCheckOwner(sectionDraftID, email);

        LessonDraft ld = LessonDraft.builder()
                .sectionDraft(sd)
                .originalLessonID(null)
                .title(request.getTitle())
                .content(request.getContent())
                .orderIndex(request.getOrderIndex())
                .duration(request.getDuration())
                .lessonType(request.getLessonType())
                .videoURL(request.getVideoURL())
                .build();

        return toResponse(lessonDraftRepository.save(ld));
    }

    public LessonResponse updateLesson(Long lessonDraftID, LessonRequest request, String email) {
        LessonDraft ld = resolveLessonDraftAndCheckOwner(lessonDraftID, email);

        ld.setTitle(request.getTitle());
        ld.setContent(request.getContent());
        ld.setOrderIndex(request.getOrderIndex());
        ld.setDuration(request.getDuration());
        ld.setLessonType(request.getLessonType());
        ld.setVideoURL(request.getVideoURL());

        return toResponse(lessonDraftRepository.save(ld));
    }

    public LessonResponse getLessonDetail(Long lessonDraftID, String email) {
        LessonDraft ld = resolveLessonDraftAndCheckOwner(lessonDraftID, email);
        return toResponse(ld);
    }

    public void deleteLesson(Long lessonDraftID, String email) {
        LessonDraft ld = resolveLessonDraftAndCheckOwner(lessonDraftID, email);

        // Cascade + orphanRemoval sẽ tự xoá LessonResourceDraft
        lessonDraftRepository.delete(ld);
    }



}
