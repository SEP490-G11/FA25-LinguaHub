package edu.lms.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.lms.dto.request.SlotContentRequest;
import edu.lms.dto.request.TutorPackageRequest;
import edu.lms.dto.response.*;
import edu.lms.entity.BookingPlan;
import edu.lms.entity.Tutor;
import edu.lms.entity.TutorPackage;
import edu.lms.enums.TutorStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.mapper.TutorPackageMapper;
import edu.lms.repository.BookingPlanRepository;
import edu.lms.repository.TutorPackageRepository;
import edu.lms.repository.TutorRepository;
import edu.lms.repository.UserPackageRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.OptionalDouble;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TutorPackageService {

    TutorRepository tutorRepository;
    TutorPackageRepository tutorPackageRepository;
    UserPackageRepository userPackageRepository;
    TutorPackageMapper tutorPackageMapper;
    ObjectMapper objectMapper;
    BookingPlanRepository bookingPlanRepository;

    @Transactional
    public TutorPackageCreateResponse createTutorPackage(Long currentUserId, TutorPackageRequest request) {
        Tutor tutor = getActiveTutorByUserId(currentUserId);

        request.setName(normalizeName(request.getName()));

        validateDuplicateName(tutor.getTutorID(), request.getName(), null);
        
        // Validate slot_content size equals max_slots
        validateSlotContentSize(request.getMaxSlots(), request.getSlotContent());
        
        // Validate slot content slot numbers
        validateSlotContentSlotNumbers(request.getMaxSlots(), request.getSlotContent());

        TutorPackage entity = tutorPackageMapper.toEntity(request);
        entity.setTutor(tutor);
        
        // Convert slot_content list to JSON string
        entity.setSlotContent(convertListToJson(request.getSlotContent()));

        TutorPackage saved = tutorPackageRepository.save(entity);

        return TutorPackageCreateResponse.builder()
                .success(true)
                .packageId(saved.getPackageID())
                .message("Tutor package created successfully")
                .build();
    }

    @Transactional
    public OperationStatusResponse updateTutorPackage(Long currentUserId, Long packageId, TutorPackageRequest request) {
        Tutor tutor = getActiveTutorByUserId(currentUserId);

        TutorPackage tutorPackage = tutorPackageRepository.findById(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PACKAGE_NOT_FOUND));

        ensurePackageOwner(tutor, tutorPackage);
        ensurePackageNotPurchased(packageId);

        request.setName(normalizeName(request.getName()));

        validateDuplicateName(tutor.getTutorID(), request.getName(), packageId);
        
        // Validate slot_content size equals max_slots
        validateSlotContentSize(request.getMaxSlots(), request.getSlotContent());
        
        // Validate slot content slot numbers
        validateSlotContentSlotNumbers(request.getMaxSlots(), request.getSlotContent());

        tutorPackageMapper.updateEntityFromRequest(request, tutorPackage);
        
        // Convert slot_content list to JSON string
        tutorPackage.setSlotContent(convertListToJson(request.getSlotContent()));
        
        tutorPackageRepository.save(tutorPackage);

        return OperationStatusResponse.success("Tutor package updated successfully.");
    }

    @Transactional
    public OperationStatusResponse deleteTutorPackage(Long currentUserId, Long packageId) {
        Tutor tutor = getActiveTutorByUserId(currentUserId);

        TutorPackage tutorPackage = tutorPackageRepository.findById(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PACKAGE_NOT_FOUND));

        ensurePackageOwner(tutor, tutorPackage);
        ensurePackageNotPurchased(packageId);

        tutorPackageRepository.delete(tutorPackage);

        return OperationStatusResponse.success("Tutor package deleted successfully.");
    }

    @Transactional(readOnly = true)
    public TutorPackageListResponse getPackagesByTutor(Long tutorId) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        List<TutorPackageResponse> packages = tutorPackageRepository.findByTutor_TutorID(tutor.getTutorID())
                .stream()
                .map(this::toResponseWithSlotContent)
                .toList();

        return TutorPackageListResponse.builder()
                .packages(packages)
                .build();
    }

    @Transactional(readOnly = true)
    public TutorPackageListResponse getMyPackages(Long currentUserId) {
        Tutor tutor = getActiveTutorByUserId(currentUserId);

        List<TutorPackageResponse> packages = tutorPackageRepository.findByTutor_TutorID(tutor.getTutorID())
                .stream()
                .map(this::toResponseWithSlotContent)
                .toList();

        return TutorPackageListResponse.builder()
                .packages(packages)
                .build();
    }

    @Transactional(readOnly = true)
    public TutorPackageResponse getPackageDetail(Long packageId) {
        TutorPackage tutorPackage = tutorPackageRepository.findById(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PACKAGE_NOT_FOUND));
        return toResponseWithSlotContent(tutorPackage);
    }

    private Tutor getActiveTutorByUserId(Long currentUserId) {
        Tutor tutor = tutorRepository.findByUser_UserID(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        if (tutor.getStatus() != TutorStatus.APPROVED) {
            if (tutor.getStatus() == TutorStatus.SUSPENDED) {
                throw new AppException(ErrorCode.TUTOR_ACCOUNT_LOCKED);
            }
            throw new AppException(ErrorCode.TUTOR_NOT_APPROVED);
        }
        return tutor;
    }

    private void ensurePackageOwner(Tutor tutor, TutorPackage tutorPackage) {
        if (!tutorPackage.getTutor().getTutorID().equals(tutor.getTutorID())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    private void ensurePackageNotPurchased(Long packageId) {
        if (userPackageRepository.existsByTutorPackage_PackageID(packageId)) {
            throw new AppException(ErrorCode.TUTOR_PACKAGE_ALREADY_PURCHASED);
        }
    }

    private void validateDuplicateName(Long tutorId, String name, Long excludePackageId) {
        tutorPackageRepository.findByTutor_TutorIDAndNameIgnoreCase(tutorId, name)
                .ifPresent(existing -> {
                    if (excludePackageId == null || !existing.getPackageID().equals(excludePackageId)) {
                        throw new AppException(ErrorCode.TUTOR_PACKAGE_DUPLICATE_NAME);
                    }
                });
    }

    private String normalizeName(String name) {
        return name == null ? null : name.trim();
    }

    private void validateSlotContentSize(Integer maxSlots, List<SlotContentRequest> slotContent) {
        if (slotContent == null || slotContent.isEmpty()) {
            throw new AppException(ErrorCode.TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH);
        }
        if (maxSlots == null || maxSlots <= 0) {
            throw new AppException(ErrorCode.TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH);
        }
        if (slotContent.size() != maxSlots) {
            throw new AppException(ErrorCode.TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH);
        }
    }

    private void validateSlotContentSlotNumbers(Integer maxSlots, List<SlotContentRequest> slotContent) {
        if (slotContent == null || maxSlots == null) {
            return; // Already validated in validateSlotContentSize
        }
        
        // Check if all slot_numbers are unique and within range [1, maxSlots]
        long uniqueSlotNumbers = slotContent.stream()
                .filter(sc -> sc.getSlotNumber() != null && sc.getSlotNumber() >= 1 && sc.getSlotNumber() <= maxSlots)
                .map(SlotContentRequest::getSlotNumber)
                .distinct()
                .count();
        
        if (uniqueSlotNumbers != maxSlots) {
            throw new AppException(ErrorCode.TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH);
        }
    }

    private String convertListToJson(List<SlotContentRequest> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
    }

    private List<SlotContentResponse> convertJsonToList(String json) {
        if (json == null || json.trim().isEmpty()) {
            return List.of();
        }
        try {
            List<SlotContentRequest> requestList = objectMapper.readValue(json, new TypeReference<List<SlotContentRequest>>() {});
            // Convert Request to Response
            return requestList.stream()
                    .map(req -> SlotContentResponse.builder()
                            .slotNumber(req.getSlotNumber())
                            .content(req.getContent())
                            .build())
                    .toList();
        } catch (Exception e) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
    }

    private TutorPackageResponse toResponseWithSlotContent(TutorPackage tutorPackage) {
        TutorPackageResponse response = tutorPackageMapper.toResponse(tutorPackage);
        // Convert JSON string back to list
        response.setSlotContent(convertJsonToList(tutorPackage.getSlotContent()));
        // Calculate minimum booking price per hour from active booking plans
        Long tutorId = response.getTutorId();
        if (tutorId != null) {
            response.setMinBookingPricePerHour(calculateMinBookingPricePerHour(tutorId));
        }
        return response;
    }

    private Double calculateMinBookingPricePerHour(Long tutorId) {
        List<BookingPlan> activeBookingPlans = bookingPlanRepository
                .findByTutorIDAndIsActiveTrueOrderByTitleAscStartHoursAsc(tutorId);
        
        if (activeBookingPlans == null || activeBookingPlans.isEmpty()) {
            return null; // Không có booking plan active nào
        }
        
        OptionalDouble minPrice = activeBookingPlans.stream()
                .filter(plan -> plan.getPricePerHours() != null && plan.getPricePerHours() > 0)
                .mapToDouble(BookingPlan::getPricePerHours)
                .min();
        
        return minPrice.isPresent() ? minPrice.getAsDouble() : null;
    }
}


