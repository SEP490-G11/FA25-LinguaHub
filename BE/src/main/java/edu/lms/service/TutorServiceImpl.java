package edu.lms.service;

import edu.lms.dto.request.TutorApplyRequest;
import edu.lms.dto.request.TutorCertificateRequest;
import edu.lms.dto.request.TutorUpdateRequest;
import edu.lms.dto.response.*;
import edu.lms.entity.*;
import edu.lms.enums.CourseStatus;
import edu.lms.enums.TutorStatus;
import edu.lms.enums.TutorVerificationStatus;
import edu.lms.exception.TutorApplicationException;
import edu.lms.exception.TutorNotFoundException;
import edu.lms.mapper.TutorCourseMapper;
import edu.lms.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TutorServiceImpl implements TutorService {

    private final TutorRepository tutorRepository;
    private final TutorVerificationRepository tutorVerificationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CourseRepository courseRepository;
    private final BookingPlanRepository bookingPlanRepository;
    private final FeedbackRepository feedbackRepository;
    private final TutorCourseMapper tutorCourseMapper;
    private final TutorBookingPlanService tutorBookingPlanService;

    @Override
    public void applyToBecomeTutor(Long userID, TutorApplyRequest request) {
        log.info("Processing tutor application for user ID: {}", userID);
        
        // 1. Lấy user từ database
        User user = userRepository.findById(userID)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userID));

        // 2. Validate experience < age (nếu có dob)
        if (user.getDob() != null) {
            long age = java.time.temporal.ChronoUnit.YEARS.between(user.getDob(), java.time.LocalDate.now());
            if (request.getExperience() >= age) {
                log.warn("User {} has experience ({}) >= age ({})", userID, request.getExperience(), age);
                throw new TutorApplicationException("Experience must be less than your age. Your age is " + age + " years.");
            }
        } else {
            // Nếu không có dob, vẫn yêu cầu experience hợp lý (tối đa 60 như đã validate trong DTO)
            if (request.getExperience() > 60) {
                log.warn("User {} has invalid experience ({}) without dob", userID, request.getExperience());
                throw new TutorApplicationException("Experience must be reasonable. Please update your date of birth for age validation.");
            }
        }

        // 4. Kiểm tra có Tutor record chưa
        Tutor tutor = tutorRepository.findByUser(user)
                .orElseGet(() -> {
                    log.info("Creating new tutor record for user ID: {}", userID);
                    Tutor newTutor = Tutor.builder()
                            .user(user)
                            .experience((short) 0)
                            .status(TutorStatus.PENDING)
                            .rating(BigDecimal.ZERO)
                            .build();
                    return tutorRepository.save(newTutor);
                });

        // 6. Kiểm tra tutor đã được APPROVED chưa - nếu đã approved thì không cho apply lại
        if (tutor.getStatus() == TutorStatus.APPROVED) {
            log.warn("User {} already has an approved tutor status, cannot apply again", userID);
            throw new TutorApplicationException("You are already an approved tutor. You cannot submit a new application.");
        }

        // 8. Kiểm tra đã có hồ sơ đang pending chưa
        boolean isPending = tutorVerificationRepository.existsByTutorAndStatus(tutor, TutorVerificationStatus.PENDING);
        if (isPending) {
            log.warn("User {} already has a pending tutor application", userID);
            throw new TutorApplicationException("An application is already pending approval");
        }

        // 9. Tạo đơn xác minh mới
        TutorVerification verification = TutorVerification.builder()
                .tutor(tutor)
                .experience(request.getExperience())
                .specialization(request.getSpecialization())
                .teachingLanguage(request.getTeachingLanguage())
                .bio(request.getBio())
                .documentUrl("") // Set giá trị mặc định
                .status(TutorVerificationStatus.PENDING)
                .submittedAt(LocalDateTime.now())
                .build();
        
        // Đảm bảo documentUrl không null sau khi build
        if (verification.getDocumentUrl() == null) {
            verification.setDocumentUrl("");
        }

        List<TutorCertificate> certificates = new ArrayList<>();
        for (TutorCertificateRequest certReq : request.getCertificates()) {
            log.info("Processing certificate: name={}, documentUrl={}", 
                    certReq.getCertificateName(), certReq.getDocumentUrl());
            
            String docURL = certReq.getDocumentUrl();
            
            // Validate: documentURL không được null (đã có @NotBlank validation nhưng double check)
            if (docURL == null) {
                log.error("documentURL is null for certificate: {}", certReq.getCertificateName());
                throw new TutorApplicationException("Document URL is required for certificate: " + certReq.getCertificateName());
            }
            
            // Trim và validate không được empty
            docURL = docURL.trim();
            if (docURL.isEmpty()) {
                log.error("documentURL is empty after trim for certificate: {}", certReq.getCertificateName());
                throw new TutorApplicationException("Document URL cannot be empty for certificate: " + certReq.getCertificateName());
            }
            
            log.info("Validated documentUrl: '{}' for certificate: {}", docURL, certReq.getCertificateName());
            
            // Build entity với documentUrl đã được validate
            TutorCertificate certEntity = TutorCertificate.builder()
                    .tutorVerification(verification)
                    .certificateName(certReq.getCertificateName())
                    .documentUrl(docURL)  // Set giá trị đã validate
                    .build();
            
            // Đảm bảo documentUrl được set đúng sau khi build (phòng trường hợp builder có vấn đề)
            if (certEntity.getDocumentUrl() == null) {
                log.error("documentUrl is null after building, setting it explicitly for certificate: {}", certReq.getCertificateName());
                certEntity.setDocumentUrl(docURL);
            } else if (!certEntity.getDocumentUrl().equals(docURL)) {
                log.warn("documentUrl mismatch after building. Expected: '{}', Got: '{}'. Fixing...", 
                        docURL, certEntity.getDocumentUrl());
                certEntity.setDocumentUrl(docURL);
            }
            
            // Final validation: Đảm bảo giá trị cuối cùng không null và không empty
            String finalDocUrl = certEntity.getDocumentUrl();
            if (finalDocUrl == null || finalDocUrl.trim().isEmpty()) {
                log.error("documentUrl is still null or empty after all checks for certificate: {}", certReq.getCertificateName());
                throw new TutorApplicationException("Failed to set document URL for certificate: " + certReq.getCertificateName());
            }
            
            log.info("Certificate entity created successfully: name={}, documentUrl='{}'", 
                    certEntity.getCertificateName(), certEntity.getDocumentUrl());
            
            // Đảm bảo createdAt được set
            if (certEntity.getCreatedAt() == null) {
                certEntity.setCreatedAt(LocalDateTime.now());
            }
            
            certificates.add(certEntity);
        }
        
        log.info("Total certificates processed: {}", certificates.size());
        
        // Final check: Đảm bảo tất cả certificates đều có documentUrl trước khi save
        for (TutorCertificate cert : certificates) {
            if (cert.getDocumentUrl() == null || cert.getDocumentUrl().trim().isEmpty()) {
                log.error("FINAL CHECK FAILED: Certificate '{}' has null or empty documentUrl before save!", 
                        cert.getCertificateName());
                throw new TutorApplicationException("Invalid certificate data: documentUrl is missing for " + cert.getCertificateName());
            }
            log.debug("Final check passed for certificate: name={}, documentUrl='{}'", 
                    cert.getCertificateName(), cert.getDocumentUrl());
        }
        
        verification.getCertificates().addAll(certificates);
        
        log.info("Saving tutor verification with {} certificates", certificates.size());
        tutorVerificationRepository.save(verification);
        log.info("Tutor application submitted successfully for user ID: {}", userID);
    }

    @Override
    public TutorApplyResponse getApplicationStatus(Long userID) {
        log.info("Getting application status for user ID: {}", userID);
        
        User user = userRepository.findById(userID)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userID));

        // Check if tutor record exists
        Tutor tutor = tutorRepository.findByUser(user).orElse(null);
        
        if (tutor == null) {
            // User hasn't applied yet
            log.info("No tutor record found for user ID: {}, user hasn't applied yet", userID);
            throw new TutorNotFoundException("No application found. Please submit an application first.");
        }

        // Get the latest application
        return tutorVerificationRepository.findTopByTutorOrderBySubmittedAtDesc(tutor)
                .map(v -> {
                    log.info("Found application with status: {} for user ID: {}", v.getStatus(), userID);
                    return TutorApplyResponse.builder()
                        .status(v.getStatus().name())
                        .submittedAt(v.getSubmittedAt())
                        .reasonForReject(v.getReasonForReject())
                            .build();
                })
                .orElseThrow(() -> new TutorNotFoundException("No application found for user ID: " + userID));
    }

    // Admin methods
    @Override
    public List<TutorApplicationListResponse> getPendingApplications() {
        log.info("Getting all pending tutor applications");
        
        List<TutorVerification> pendingVerifications = 
            tutorVerificationRepository.findAllByStatusOrderBySubmittedAtAsc(TutorVerificationStatus.PENDING);
        
        log.info("Found {} pending applications", pendingVerifications.size());
        
        return pendingVerifications.stream()
                .map(this::mapToApplicationListResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TutorApplicationListResponse> getApprovedApplications() {
        log.info("Getting all approved tutor applications");
        
        List<TutorVerification> approvedVerifications = 
            tutorVerificationRepository.findAllByStatusOrderBySubmittedAtDesc(TutorVerificationStatus.APPROVED);
        
        log.info("Found {} approved applications", approvedVerifications.size());
        
        return approvedVerifications.stream()
                .map(this::mapToApplicationListResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TutorApplicationListResponse> getRejectedApplications() {
        log.info("Getting all rejected tutor applications");
        
        List<TutorVerification> rejectedVerifications = 
            tutorVerificationRepository.findAllByStatusOrderBySubmittedAtDesc(TutorVerificationStatus.REJECTED);
        
        log.info("Found {} rejected applications", rejectedVerifications.size());
        
        return rejectedVerifications.stream()
                .map(this::mapToApplicationListResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TutorApplicationDetailResponse getApplicationDetail(Long verificationId) {
        log.info("Getting application detail for verification ID: {}", verificationId);
        
        TutorVerification verification = tutorVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new EntityNotFoundException("Application not found with ID: " + verificationId));
        
        return mapToApplicationDetailResponse(verification);
    }

    @Override
    public void approveTutorApplication(Long verificationId, Long adminId) {
        log.info("Processing tutor application approval for verification ID: {} by admin ID: {}", verificationId, adminId);
        
        TutorVerification verification = tutorVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new EntityNotFoundException("Application not found with ID: " + verificationId));
        
        if (verification.getStatus() != TutorVerificationStatus.PENDING) {
            log.warn("Attempted to approve non-pending application with ID: {}, current status: {}", verificationId, verification.getStatus());
            throw new TutorApplicationException("Application is not in pending status");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin not found with ID: " + adminId));

        // Update verification status
        verification.setStatus(TutorVerificationStatus.APPROVED);
        verification.setReviewedBy(admin);
        verification.setReviewedAt(LocalDateTime.now());
        tutorVerificationRepository.save(verification);

        // Update tutor status and information
        Tutor tutor = verification.getTutor();
        tutor.setStatus(TutorStatus.APPROVED);
        tutor.setExperience(verification.getExperience());
        tutor.setSpecialization(verification.getSpecialization());
        tutor.setTeachingLanguage(verification.getTeachingLanguage());
        tutor.setBio(verification.getBio());
        tutorRepository.save(tutor);
        
        // Change user role from Learner to Tutor
        User user = tutor.getUser();
        Role tutorRole = roleRepository.findById("Tutor")
                .orElseThrow(() -> new EntityNotFoundException("Tutor role not found"));
        user.setRole(tutorRole);
        userRepository.save(user);
        
        log.info("Tutor application approved successfully for verification ID: {}, tutor ID: {}, user role changed to Tutor", verificationId, tutor.getTutorID());
    }

    @Override
    public void rejectTutorApplication(Long verificationId, Long adminId, String reason) {
        log.info("Processing tutor application rejection for verification ID: {} by admin ID: {} with reason: {}", verificationId, adminId, reason);
        
        TutorVerification verification = tutorVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new EntityNotFoundException("Application not found with ID: " + verificationId));
        
        if (verification.getStatus() != TutorVerificationStatus.PENDING) {
            log.warn("Attempted to reject non-pending application with ID: {}, current status: {}", verificationId, verification.getStatus());
            throw new TutorApplicationException("Application is not in pending status");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin not found with ID: " + adminId));

        // Update verification status
        verification.setStatus(TutorVerificationStatus.REJECTED);
        verification.setReviewedBy(admin);
        verification.setReviewedAt(LocalDateTime.now());
        verification.setReasonForReject(reason);
        tutorVerificationRepository.save(verification);
        
        log.info("Tutor application rejected successfully for verification ID: {}, tutor ID: {}", verificationId, verification.getTutor().getTutorID());
    }

    @Override
    public TutorDetailResponse getTutorDetail(Long tutorId) {
        log.info("Getting tutor detail for tutor ID: {}", tutorId);
        
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new TutorNotFoundException("Tutor not found with ID: " + tutorId));
        
        // Only return approved tutors
        if (tutor.getStatus() != TutorStatus.APPROVED) {
            log.warn("Tutor ID: {} is not approved, status: {}", tutorId, tutor.getStatus());
            throw new TutorNotFoundException("Tutor not found or not approved");
        }
        
        User user = tutor.getUser();
        
        // Get approved courses for this tutor
        List<Course> approvedCourses = courseRepository.findByTutorAndStatus(tutor, CourseStatus.Approved);
        List<TutorCourseResponse> courseResponses = approvedCourses.stream()
                .map(tutorCourseMapper::toTutorCourseResponse)
                .collect(Collectors.toList());
        
        // Tính giá booking tối thiểu từ các booking plans active
        Double pricePerHour = calculateMinPricePerHour(tutor.getTutorID());
        
        // Lấy tất cả feedbacks từ booking của tutor với JOIN FETCH để tránh N+1
        List<Feedback> feedbacks = feedbackRepository.findByPayment_TutorIdWithDetails(tutor.getTutorID());
        log.info("Found {} feedbacks for tutor ID: {}", feedbacks.size(), tutor.getTutorID());
        
        List<TutorFeedbackItemResponse> feedbackResponses = feedbacks.stream()
                .map(feedback -> {
                    log.debug("Processing feedback ID: {}, rating: {}, comment: {}", 
                            feedback.getFeedbackID(), feedback.getRating(), feedback.getComment());
                    return TutorFeedbackItemResponse.builder()
                            .feedbackID(feedback.getFeedbackID())
                            .rating(feedback.getRating())
                            .comment(feedback.getComment())
                            .createdAt(feedback.getPayment() != null ? feedback.getPayment().getPaidAt() : null)
                            .learnerName(feedback.getUser() != null ? feedback.getUser().getFullName() : null)
                            .learnerAvatarURL(feedback.getUser() != null ? feedback.getUser().getAvatarURL() : null)
                            .build();
                })
                // Sắp xếp theo thời gian: mới nhất trước (createdAt DESC)
                .sorted(Comparator.comparing(
                        TutorFeedbackItemResponse::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .collect(Collectors.toList());
        
        log.info("Mapped {} feedback responses for tutor ID: {}", feedbackResponses.size(), tutor.getTutorID());
        
        // Lấy tất cả chứng chỉ từ các verification đã được approved (với JOIN FETCH để tránh N+1)
        List<TutorVerification> approvedVerifications = tutorVerificationRepository
                .findAllByTutorWithCertificates(tutor)
                .stream()
                .filter(verification -> verification.getStatus() == TutorVerificationStatus.APPROVED)
                .collect(Collectors.toList());
        
        List<TutorCertificateResponse> certificateResponses = approvedVerifications.stream()
                .flatMap(verification -> {
                    if (verification.getCertificates() != null && !verification.getCertificates().isEmpty()) {
                        return verification.getCertificates().stream();
                    }
                    return java.util.stream.Stream.empty();
                })
                .map(certificate -> TutorCertificateResponse.builder()
                        .certificateId(certificate.getCertificateId())
                        .certificateName(certificate.getCertificateName())
                        .documentUrl(certificate.getDocumentUrl())
                        .build())
                .collect(Collectors.toList());
        
        log.info("Found {} certificates for tutor ID: {}", certificateResponses.size(), tutor.getTutorID());
        
        return TutorDetailResponse.builder()
                .tutorId(tutor.getTutorID())
                .userId(user.getUserID())
                .userName(user.getFullName())
                .userEmail(user.getEmail())
                .avatarURL(user.getAvatarURL())
                .country(user.getCountry())
                .phone(user.getPhone())
                .bio(tutor.getBio())
                .experience(tutor.getExperience())
                .specialization(tutor.getSpecialization())
                .teachingLanguage(tutor.getTeachingLanguage())
                .rating(tutor.getRating())
                .status(tutor.getStatus().name())
                .courses(courseResponses)
                .pricePerHour(pricePerHour)
                .feedbacks(feedbackResponses)
                .certificates(certificateResponses)
                .build();
    }

    @Override
    public List<TutorApplicationListResponse> getAllTutors(String status) {
        log.info("Getting all tutors with status filter: {}", status);
        
        List<Tutor> tutors;
        if (status != null && !status.isEmpty()) {
            try {
                TutorStatus tutorStatus = TutorStatus.valueOf(status.toUpperCase());
                tutors = tutorRepository.findAllByStatus(tutorStatus);
                log.info("Found {} tutors with status: {}", tutors.size(), status);
            } catch (IllegalArgumentException e) {
                log.error("Invalid status provided: {}", status);
                throw new IllegalArgumentException("Invalid status: " + status);
            }
        } else {
            tutors = tutorRepository.findAll();
            log.info("Found {} total tutors", tutors.size());
        }
        
        return tutors.stream()
                .map(tutor -> {
                    TutorVerification latestVerification = 
                        tutorVerificationRepository.findTopByTutorOrderBySubmittedAtDesc(tutor)
                            .orElse(null);
                    
                    // Ưu tiên dùng dữ liệu từ verification nếu có, nếu không thì dùng từ tutor
                    String specialization = latestVerification != null && latestVerification.getSpecialization() != null
                            ? latestVerification.getSpecialization()
                            : tutor.getSpecialization();
                    String teachingLanguage = latestVerification != null && latestVerification.getTeachingLanguage() != null
                            ? latestVerification.getTeachingLanguage()
                            : tutor.getTeachingLanguage();
                    
                    // Tính giá booking tối thiểu từ các booking plans active
                    Double pricePerHour = calculateMinPricePerHour(tutor.getTutorID());
                    
                    // Tính rating trung bình chỉ từ booking feedbacks (không bao gồm course reviews)
                    BigDecimal bookingRating = calculateBookingRating(tutor.getTutorID());
                    
                    return TutorApplicationListResponse.builder()
                            .verificationId(latestVerification != null ? latestVerification.getTutorVerificationID() : null)
                            .tutorId(tutor.getTutorID())
                            .userId(tutor.getUser().getUserID())
                            .userEmail(tutor.getUser().getEmail())
                            .userName(tutor.getUser().getFullName())
                            .avatarURL(tutor.getUser().getAvatarURL())
                            .country(tutor.getUser().getCountry())
                            .specialization(specialization)
                            .teachingLanguage(teachingLanguage)
                            .pricePerHour(pricePerHour)
                            .rating(bookingRating)
                            .status(tutor.getStatus().name())
                            .submittedAt(latestVerification != null ? latestVerification.getSubmittedAt() : null)
                            .reviewedAt(latestVerification != null ? latestVerification.getReviewedAt() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<TutorApplicationListResponse> getAllApplications(String status) {
        List<TutorVerification> allApplications;
        
        if (status != null && !status.trim().isEmpty()) {
            try {
                TutorVerificationStatus verificationStatus = TutorVerificationStatus.valueOf(status.toUpperCase());
                log.info("Getting applications with status: {}", verificationStatus);
                allApplications = tutorVerificationRepository.findAllByStatusOrderBySubmittedAtDesc(verificationStatus);
                log.info("Found {} applications with status: {}", allApplications.size(), verificationStatus);
            } catch (IllegalArgumentException e) {
                log.error("Invalid status provided: {}", status);
                throw new IllegalArgumentException("Invalid status: " + status + ". Valid statuses are: PENDING, REJECTED, APPROVED");
            }
        } else {
            log.info("Getting all applications with status PENDING, REJECTED, and APPROVED");
            List<TutorVerificationStatus> statuses = List.of(
                TutorVerificationStatus.PENDING,
                TutorVerificationStatus.REJECTED,
                TutorVerificationStatus.APPROVED
            );
            allApplications = tutorVerificationRepository.findAllByStatusInOrderBySubmittedAtDesc(statuses);
            log.info("Found {} applications", allApplications.size());
        }
        
        return allApplications.stream()
                .map(this::mapToApplicationListResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void suspendTutor(Long tutorId, Long adminId) {
        log.info("Suspending tutor ID: {} by admin ID: {}", tutorId, adminId);
        
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new TutorNotFoundException("Tutor not found with ID: " + tutorId));
        
        // Xóa tất cả booking plans của tutor và thông báo cho learner
        tutorBookingPlanService.deleteAllBookingPlansForTutor(tutorId);
        
        tutor.setStatus(TutorStatus.SUSPENDED);
        tutorRepository.save(tutor);
        
        log.info("Tutor suspended successfully: {}", tutorId);
    }

    @Override
    public void unsuspendTutor(Long tutorId, Long adminId) {
        log.info("Unsuspending tutor ID: {} by admin ID: {}", tutorId, adminId);
        
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new TutorNotFoundException("Tutor not found with ID: " + tutorId));
        
        tutor.setStatus(TutorStatus.APPROVED);
        tutorRepository.save(tutor);
        
        log.info("Tutor unsuspended successfully: {}", tutorId);
    }

    @Override
    public void updateTutorInfo(Long tutorId, TutorUpdateRequest request) {
        log.info("Updating tutor information for tutor ID: {}", tutorId);
        
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new TutorNotFoundException("Tutor not found with ID: " + tutorId));
        
        // Update fields only if they are provided (not null)
        if (request.getExperience() != null) {
            tutor.setExperience(request.getExperience());
            log.info("Updated experience to: {}", request.getExperience());
        }
        
        if (request.getSpecialization() != null) {
            tutor.setSpecialization(request.getSpecialization());
            log.info("Updated specialization to: {}", request.getSpecialization());
        }
        
        if (request.getTeachingLanguage() != null) {
            tutor.setTeachingLanguage(request.getTeachingLanguage());
            log.info("Updated teaching language to: {}", request.getTeachingLanguage());
        }
        
        if (request.getBio() != null) {
            tutor.setBio(request.getBio());
            log.info("Updated bio");
        }
        
        if (request.getRating() != null) {
            tutor.setRating(request.getRating());
            log.info("Updated rating to: {}", request.getRating());
        }
        
        tutorRepository.save(tutor);
        log.info("Tutor information updated successfully for tutor ID: {}", tutorId);
    }

    // Helper methods
    private TutorApplicationListResponse mapToApplicationListResponse(TutorVerification verification) {
        Tutor tutor = verification.getTutor();
        User user = tutor.getUser();
        
        // Tính giá booking tối thiểu từ các booking plans active
        Double pricePerHour = calculateMinPricePerHour(tutor.getTutorID());
        
        // Tính rating trung bình chỉ từ booking feedbacks (không bao gồm course reviews)
        BigDecimal bookingRating = calculateBookingRating(tutor.getTutorID());
        
        return TutorApplicationListResponse.builder()
                .verificationId(verification.getTutorVerificationID())
                .tutorId(tutor.getTutorID())
                .userId(user.getUserID())
                .userEmail(user.getEmail())
                .userName(user.getFullName())
                .avatarURL(user.getAvatarURL())
                .country(user.getCountry())
                .specialization(verification.getSpecialization())
                .teachingLanguage(verification.getTeachingLanguage())
                .pricePerHour(pricePerHour)
                .rating(bookingRating)
                .status(verification.getStatus().name())
                .submittedAt(verification.getSubmittedAt())
                .reviewedAt(verification.getReviewedAt())
                .build();
    }
    
    /**
     * Tính giá booking tối thiểu từ các booking plans active của tutor
     * @param tutorId ID của tutor
     * @return Giá tối thiểu mỗi giờ, null nếu không có booking plan nào active
     */
    private Double calculateMinPricePerHour(Long tutorId) {
        List<BookingPlan> activeBookingPlans = bookingPlanRepository.findByTutorID(tutorId)
                .stream()
                .filter(plan -> Boolean.TRUE.equals(plan.getIsActive()) && Boolean.TRUE.equals(plan.getIsOpen()))
                .collect(Collectors.toList());
        
        if (activeBookingPlans.isEmpty()) {
            log.debug("No active booking plans found for tutor ID: {}", tutorId);
            return null;
        }
        
        Double minPrice = activeBookingPlans.stream()
                .map(BookingPlan::getPricePerHours)
                .filter(price -> price != null && price > 0)
                .min(Double::compareTo)
                .orElse(null);
        
        log.debug("Calculated min price per hour for tutor ID {}: {}", tutorId, minPrice);
        return minPrice;
    }
    
    /**
     * Tính rating trung bình chỉ từ booking feedbacks của tutor (không bao gồm course reviews)
     * @param tutorId ID của tutor
     * @return Rating trung bình từ booking feedbacks, BigDecimal.ZERO nếu không có feedback nào
     */
    private BigDecimal calculateBookingRating(Long tutorId) {
        List<Feedback> bookingFeedbacks = feedbackRepository.findByPayment_TutorId(tutorId);
        
        if (bookingFeedbacks.isEmpty()) {
            log.debug("No booking feedbacks found for tutor ID: {}", tutorId);
            return BigDecimal.ZERO;
        }
        
        double avgRating = bookingFeedbacks.stream()
                .mapToDouble(f -> f.getRating().doubleValue())
                .average()
                .orElse(0.0);
        
        log.debug("Calculated booking rating for tutor ID {}: {}", tutorId, avgRating);
        return BigDecimal.valueOf(avgRating);
    }

    private TutorApplicationDetailResponse mapToApplicationDetailResponse(TutorVerification verification) {
        Tutor tutor = verification.getTutor();
        User user = tutor.getUser();
        
        return TutorApplicationDetailResponse.builder()
                .verificationId(verification.getTutorVerificationID())
                .tutorId(tutor.getTutorID())
                .userId(user.getUserID())
                .userEmail(user.getEmail())
                .userName(user.getFullName())
                .userPhone(user.getPhone())
                .experience(verification.getExperience())
                .specialization(verification.getSpecialization())
                .teachingLanguage(verification.getTeachingLanguage())
                .bio(verification.getBio())
                .certificates(verification.getCertificates() == null ? List.of() : verification.getCertificates().stream()
                        .map(cert -> TutorCertificateResponse.builder()
                                .certificateId(cert.getCertificateId())
                                .certificateName(cert.getCertificateName())
                                .documentUrl(cert.getDocumentUrl())
                                .build())
                        .toList())
                .status(verification.getStatus().name())
                .submittedAt(verification.getSubmittedAt())
                .reviewedBy(verification.getReviewedBy() != null ? 
                    verification.getReviewedBy().getFullName() : null)
                .reviewedAt(verification.getReviewedAt())
                .reasonForReject(verification.getReasonForReject())
                .build();
    }
}
