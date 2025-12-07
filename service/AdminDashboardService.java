// src/main/java/edu/lms/service/AdminDashboardService.java
package edu.lms.service;

import edu.lms.dto.response.AdminDashboardResponse;

import java.time.LocalDate;

public interface AdminDashboardService {

    AdminDashboardResponse getDashboard(LocalDate startDate, LocalDate endDate);

}
