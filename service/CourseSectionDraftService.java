package edu.lms.service;

import edu.lms.dto.request.CourseSectionRequest;
import edu.lms.dto.response.CourseSectionResponse;
import edu.lms.entity.CourseDraft;
import edu.lms.entity.CourseSectionDraft;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.CourseDraftRepository;
import edu.lms.repository.CourseSectionDraftRepository;
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
public class CourseSectionDraftService {

    CourseDraftRepository courseDraftRepository;
    CourseSectionDraftRepository courseSectionDraftRepository;

    private CourseDraft resolveDraftAndCheckOwner(Long draftID, String email) {
        CourseDraft draft = courseDraftRepository.findById(draftID)
                .orElseThrow(() -> new AppException(ErrorCode.DRAFT_NOT_FOUND));

        String tutorEmail = draft.getTutor().getUser().getEmail();
        if (!tutorEmail.equalsIgnoreCase(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return draft;
    }

    private CourseSectionDraft resolveSectionDraftAndCheckOwner(Long sectionDraftID, String email) {
        CourseSectionDraft sd = courseSectionDraftRepository.findById(sectionDraftID)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        String tutorEmail = sd.getDraft().getTutor().getUser().getEmail();
        if (!tutorEmail.equalsIgnoreCase(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return sd;
    }

    private CourseSectionResponse toResponse(CourseSectionDraft s) {
        return CourseSectionResponse.builder()
                .sectionID(s.getSectionDraftID())
                .courseID(s.getDraft().getCourse().getCourseID())
                .title(s.getTitle())
                .description(s.getDescription())
                .orderIndex(s.getOrderIndex())
                .lessons(null)
                .build();
    }

    public List<CourseSectionResponse> getSectionsByDraft(Long draftID, String email) {
        CourseDraft draft = resolveDraftAndCheckOwner(draftID, email);

        return courseSectionDraftRepository
                .findByDraft_DraftIDOrderByOrderIndexAsc(draft.getDraftID())
                .stream().map(this::toResponse).toList();
    }

    public CourseSectionResponse createSection(Long draftID, CourseSectionRequest request, String email) {
        CourseDraft draft = resolveDraftAndCheckOwner(draftID, email);

        CourseSectionDraft sd = CourseSectionDraft.builder()
                .draft(draft)
                .originalSectionID(null)
                .title(request.getTitle())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex())
                .build();

        return toResponse(courseSectionDraftRepository.save(sd));
    }

    public CourseSectionResponse updateSection(Long sectionDraftID, CourseSectionRequest request, String email) {
        CourseSectionDraft sd = resolveSectionDraftAndCheckOwner(sectionDraftID, email);

        sd.setTitle(request.getTitle());
        sd.setDescription(request.getDescription());
        sd.setOrderIndex(request.getOrderIndex());

        return toResponse(courseSectionDraftRepository.save(sd));
    }

    public void deleteSection(Long sectionDraftID, String email) {
        CourseSectionDraft sd = resolveSectionDraftAndCheckOwner(sectionDraftID, email);
        courseSectionDraftRepository.delete(sd);
    }
}
