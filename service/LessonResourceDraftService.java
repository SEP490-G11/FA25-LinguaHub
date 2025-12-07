// src/main/java/edu/lms/service/LessonResourceDraftService.java
package edu.lms.service;

import edu.lms.dto.request.LessonResourceRequest;
import edu.lms.dto.response.LessonResourceResponse;
import edu.lms.entity.LessonDraft;
import edu.lms.entity.LessonResourceDraft;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.LessonDraftRepository;
import edu.lms.repository.LessonResourceDraftRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
@Transactional
public class LessonResourceDraftService {

    LessonResourceDraftRepository resourceDraftRepository;
    LessonDraftRepository lessonDraftRepository;
    private static final Pattern URL_PATTERN = Pattern.compile("^(http|https)://.*$", Pattern.CASE_INSENSITIVE);

    private LessonDraft resolveLessonDraftAndCheckOwner(Long lessonDraftID, String email) {
        LessonDraft ld = lessonDraftRepository.findById(lessonDraftID)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));

        String tutorEmail = ld.getSectionDraft().getDraft().getTutor().getUser().getEmail();
        if (!tutorEmail.equalsIgnoreCase(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return ld;
    }

    private LessonResourceDraft resolveResourceDraftAndCheckOwner(Long resourceDraftID, String email) {
        LessonResourceDraft rd = resourceDraftRepository.findById(resourceDraftID)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));

        String tutorEmail = rd.getLessonDraft().getSectionDraft().getDraft()
                .getTutor().getUser().getEmail();
        if (!tutorEmail.equalsIgnoreCase(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return rd;
    }

    private void validateURL(String url) {
        if (url == null || !URL_PATTERN.matcher(url).matches()) {
            throw new ValidationException("Invalid resource URL format");
        }
    }

    private LessonResourceResponse toResponse(LessonResourceDraft r) {
        return LessonResourceResponse.builder()
                .resourceID(r.getResourceDraftID())
                .resourceType(r.getResourceType())
                .resourceTitle(r.getResourceTitle())
                .resourceURL(r.getResourceURL())
                .uploadedAt(null)
                .build();
    }

    public List<LessonResourceResponse> getResourcesByLessonDraft(Long lessonDraftID, String email) {
        LessonDraft ld = resolveLessonDraftAndCheckOwner(lessonDraftID, email);

        return resourceDraftRepository.findByLessonDraft_LessonDraftID(ld.getLessonDraftID())
                .stream().map(this::toResponse).toList();
    }

    public LessonResourceResponse addResource(Long lessonDraftID, LessonResourceRequest request, String email) {
        LessonDraft ld = resolveLessonDraftAndCheckOwner(lessonDraftID, email);
        validateURL(request.getResourceURL());

        LessonResourceDraft rd = LessonResourceDraft.builder()
                .lessonDraft(ld)
                .originalResourceID(null)
                .resourceType(request.getResourceType())
                .resourceTitle(request.getResourceTitle())
                .resourceURL(request.getResourceURL())
                .build();

        return toResponse(resourceDraftRepository.save(rd));
    }

    public LessonResourceResponse updateResource(Long resourceDraftID, LessonResourceRequest request, String email) {
        LessonResourceDraft rd = resolveResourceDraftAndCheckOwner(resourceDraftID, email);

        if (request.getResourceTitle() != null)
            rd.setResourceTitle(request.getResourceTitle());
        if (request.getResourceURL() != null) {
            validateURL(request.getResourceURL());
            rd.setResourceURL(request.getResourceURL());
        }
        if (request.getResourceType() != null)
            rd.setResourceType(request.getResourceType());

        return toResponse(resourceDraftRepository.save(rd));
    }

    public void deleteResource(Long resourceDraftID, String email) {
        LessonResourceDraft rd = resolveResourceDraftAndCheckOwner(resourceDraftID, email);
        resourceDraftRepository.delete(rd);
    }
}
