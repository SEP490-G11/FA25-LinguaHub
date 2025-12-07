// src/main/java/edu/lms/service/CourseObjectiveDraftService.java
package edu.lms.service;

import edu.lms.dto.request.CourseObjectiveRequest;
import edu.lms.dto.response.CourseObjectiveResponse;
import edu.lms.entity.CourseDraft;
import edu.lms.entity.CourseObjectiveDraft;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.CourseDraftRepository;
import edu.lms.repository.CourseObjectiveDraftRepository;
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
public class CourseObjectiveDraftService {

    CourseDraftRepository courseDraftRepository;
    CourseObjectiveDraftRepository courseObjectiveDraftRepository;

    private CourseDraft resolveDraftAndCheckOwner(Long draftID, String email) {
        CourseDraft draft = courseDraftRepository.findById(draftID)
                .orElseThrow(() -> new AppException(ErrorCode.DRAFT_NOT_FOUND));

        String tutorEmail = draft.getTutor().getUser().getEmail();
        if (!tutorEmail.equalsIgnoreCase(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return draft;
    }

    private CourseObjectiveDraft resolveObjectiveDraftAndCheckOwner(Long objectiveDraftID, String email) {
        CourseObjectiveDraft od = courseObjectiveDraftRepository.findById(objectiveDraftID)
                .orElseThrow(() -> new AppException(ErrorCode.DRAFT_NOT_FOUND));

        String tutorEmail = od.getDraft().getTutor().getUser().getEmail();
        if (!tutorEmail.equalsIgnoreCase(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return od;
    }

    private CourseObjectiveResponse toResponse(CourseObjectiveDraft od) {
        return CourseObjectiveResponse.builder()
                .objectiveID(od.getObjectiveDraftID())
                .courseID(od.getDraft().getDraftID())
                .objectiveText(od.getObjectiveText())
                .orderIndex(od.getOrderIndex())
                .build();
    }

    public List<CourseObjectiveResponse> getByDraft(Long draftID, String email) {
        CourseDraft draft = resolveDraftAndCheckOwner(draftID, email);

        return courseObjectiveDraftRepository
                .findByDraft_DraftIDOrderByOrderIndexAsc(draft.getDraftID())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CourseObjectiveResponse create(Long draftID, CourseObjectiveRequest request, String email) {
        CourseDraft draft = resolveDraftAndCheckOwner(draftID, email);

        CourseObjectiveDraft od = CourseObjectiveDraft.builder()
                .draft(draft)
                .originalObjectiveID(null)  // mới tạo
                .objectiveText(request.getObjectiveText())
                .orderIndex(request.getOrderIndex())
                .build();

        return toResponse(courseObjectiveDraftRepository.save(od));
    }

    public CourseObjectiveResponse update(Long objectiveDraftID, CourseObjectiveRequest request, String email) {
        CourseObjectiveDraft od = resolveObjectiveDraftAndCheckOwner(objectiveDraftID, email);

        if (request.getObjectiveText() != null)
            od.setObjectiveText(request.getObjectiveText());
        if (request.getOrderIndex() != null)
            od.setOrderIndex(request.getOrderIndex());

        return toResponse(courseObjectiveDraftRepository.save(od));
    }

    public void delete(Long objectiveDraftID, String email) {
        CourseObjectiveDraft od = resolveObjectiveDraftAndCheckOwner(objectiveDraftID, email);
        courseObjectiveDraftRepository.delete(od);
    }
}
