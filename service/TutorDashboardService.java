package edu.lms.service;

import edu.lms.dto.response.TutorDashboardResponse;

import java.time.LocalDate;

public interface TutorDashboardService {
    TutorDashboardResponse getDashboardForTutor(Long userId,
                                                LocalDate startDate,
                                                LocalDate endDate);
}
