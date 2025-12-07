package edu.lms.service;

import edu.lms.dto.request.TutorApplyRequest;
import edu.lms.dto.request.TutorUpdateRequest;
import edu.lms.dto.response.TutorApplicationDetailResponse;
import edu.lms.dto.response.TutorApplicationListResponse;
import edu.lms.dto.response.TutorApplyResponse;
import edu.lms.dto.response.TutorDetailResponse;

import java.util.List;

public interface TutorService {
    void applyToBecomeTutor(Long userID, TutorApplyRequest request);
    TutorApplyResponse getApplicationStatus(Long userID);
    
    // Public methods
    TutorDetailResponse getTutorDetail(Long tutorId);
    
    // Admin methods
    List<TutorApplicationListResponse> getPendingApplications();
    List<TutorApplicationListResponse> getApprovedApplications();
    List<TutorApplicationListResponse> getRejectedApplications();
    TutorApplicationDetailResponse getApplicationDetail(Long verificationId);
    void approveTutorApplication(Long verificationId, Long adminId);
    void rejectTutorApplication(Long verificationId, Long adminId, String reason);
    List<TutorApplicationListResponse> getAllTutors(String status);
    List<TutorApplicationListResponse> getAllApplications(String status);
    void suspendTutor(Long tutorId, Long adminId);
    void unsuspendTutor(Long tutorId, Long adminId);
    void updateTutorInfo(Long tutorId, TutorUpdateRequest request);
}
