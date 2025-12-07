package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.response.AdminDashboardResponse;
import edu.lms.service.AdminDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
@Tag(name = "Admin Dashboard", description = "API tổng quan cho Admin")
public class AdminDashboardController {

    AdminDashboardService adminDashboardService;

    @GetMapping
    @Operation(summary = "Lấy dữ liệu dashboard admin trong khoảng ngày")
    public ApiRespond<AdminDashboardResponse> getAdminDashboard(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        LocalDate now = LocalDate.now();
        if (startDate == null) startDate = now.withDayOfMonth(1);
        if (endDate == null) endDate = now;

        AdminDashboardResponse data =
                adminDashboardService.getDashboard(startDate, endDate);

        return ApiRespond.<AdminDashboardResponse>builder()
                .result(data)
                .build();
    }
}
