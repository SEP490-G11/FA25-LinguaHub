package edu.lms.controller;

import edu.lms.dto.request.TutorUpdateRequest;
import edu.lms.dto.response.TutorApplicationDetailResponse;
import edu.lms.dto.response.TutorApplicationListResponse;
import edu.lms.service.TutorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * WebMvcTest cho AdminTutorController.
 * Dùng MockMvc + tự set SecurityContextHolder (JwtAuthenticationToken)
 * để getCurrentUserId() không bị "User not authenticated".
 */
@WebMvcTest(AdminTutorController.class)
@AutoConfigureMockMvc(addFilters = false) // tắt filter, nhưng tự set SecurityContextHolder
class AdminTutorControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    TutorService tutorService;

    /**
     * Tạo Authentication dạng JwtAuthenticationToken với:
     *  - claim "userId" = 99L
     *  - đủ authorities cho tất cả @PreAuthorize
     */
    private Authentication createAdminAuthentication() {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .claim("userId", 99L)
                .subject("admin@linguahub.com")
                .build();

        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("VIEW_TUTOR_APPLICATIONS"),
                new SimpleGrantedAuthority("APPROVE_TUTOR"),
                new SimpleGrantedAuthority("REJECT_TUTOR"),
                new SimpleGrantedAuthority("SUSPEND_TUTOR"),
                new SimpleGrantedAuthority("ACTIVATE_TUTOR"),
                new SimpleGrantedAuthority("UPDATE_TUTOR_INFO")
        );

        return new JwtAuthenticationToken(jwt, authorities);
    }

    /**
     * Trước mỗi test, set admin auth vào SecurityContextHolder
     * để @PreAuthorize + getCurrentUserId() dùng được.
     */
    @BeforeEach
    void setupSecurityContext() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(createAdminAuthentication());
        SecurityContextHolder.setContext(context);
    }

    // ========================================================================
    // 1. GET /admin/tutors/applications/pending
    // ========================================================================

    @Test
    void getPendingApplications() throws Exception {
        var a1 = TutorApplicationListResponse.builder()
                .verificationId(1L)
                .tutorId(10L)
                .userId(100L)
                .userEmail("user1@example.com")
                .userName("User 1")
                .status("PENDING")
                .submittedAt(LocalDateTime.now())
                .build();

        var a2 = TutorApplicationListResponse.builder()
                .verificationId(2L)
                .tutorId(11L)
                .userId(101L)
                .userEmail("user2@example.com")
                .userName("User 2")
                .status("PENDING")
                .submittedAt(LocalDateTime.now())
                .build();

        List<TutorApplicationListResponse> mockList = List.of(a1, a2);

        when(tutorService.getPendingApplications()).thenReturn(mockList);

        ResultActions result = mockMvc.perform(
                get("/admin/tutors/applications/pending")
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].verificationId").value(1))
                .andExpect(jsonPath("$[0].userEmail").value("user1@example.com"))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        verify(tutorService).getPendingApplications();
    }

    // ========================================================================
    // 2. GET /admin/tutors/applications/approved
    // ========================================================================

    @Test
    void getApprovedApplications() throws Exception {
        var a1 = TutorApplicationListResponse.builder()
                .verificationId(3L)
                .tutorId(12L)
                .userId(102L)
                .userEmail("approved1@example.com")
                .userName("Approved 1")
                .status("APPROVED")
                .build();

        List<TutorApplicationListResponse> mockList = List.of(a1);

        when(tutorService.getApprovedApplications()).thenReturn(mockList);

        ResultActions result = mockMvc.perform(
                get("/admin/tutors/applications/approved")
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].verificationId").value(3))
                .andExpect(jsonPath("$[0].status").value("APPROVED"));

        verify(tutorService).getApprovedApplications();
    }

    // ========================================================================
    // 3. GET /admin/tutors/applications/rejected
    // ========================================================================

    @Test
    void getRejectedApplications() throws Exception {
        var a1 = TutorApplicationListResponse.builder()
                .verificationId(4L)
                .tutorId(13L)
                .userId(103L)
                .userEmail("rejected1@example.com")
                .userName("Rejected 1")
                .status("REJECTED")
                .build();

        List<TutorApplicationListResponse> mockList = List.of(a1);

        when(tutorService.getRejectedApplications()).thenReturn(mockList);

        ResultActions result = mockMvc.perform(
                get("/admin/tutors/applications/rejected")
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].verificationId").value(4))
                .andExpect(jsonPath("$[0].status").value("REJECTED"));

        verify(tutorService).getRejectedApplications();
    }

    // ========================================================================
    // 4. GET /admin/tutors/applications?status=...
    // ========================================================================

    @Test
    void getAllApplications() throws Exception {
        String status = "PENDING";

        var a1 = TutorApplicationListResponse.builder()
                .verificationId(5L)
                .tutorId(14L)
                .userId(104L)
                .userEmail("user4@example.com")
                .userName("User 4")
                .status(status)
                .build();

        List<TutorApplicationListResponse> mockList = List.of(a1);

        when(tutorService.getAllApplications(status)).thenReturn(mockList);

        ResultActions result = mockMvc.perform(
                get("/admin/tutors/applications")
                        .param("status", status)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].verificationId").value(5))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        verify(tutorService).getAllApplications(status);
    }

    // ========================================================================
    // 5. GET /admin/tutors/applications/{verificationId}
    // ========================================================================

    @Test
    void getApplicationDetail() throws Exception {
        Long verificationId = 10L;

        var detail = TutorApplicationDetailResponse.builder()
                .verificationId(verificationId)
                .tutorId(20L)
                .userId(200L)
                .userEmail("detail@example.com")
                .userName("Detail User")
                .userPhone("0123456789")
                .experience((short) 5)
                .specialization("IELTS")
                .teachingLanguage("English")
                .bio("Bio here")
                .status("PENDING")
                .submittedAt(LocalDateTime.now())
                .reviewedBy(null)
                .reviewedAt(null)
                .reasonForReject(null)
                .build();

        when(tutorService.getApplicationDetail(verificationId)).thenReturn(detail);

        ResultActions result = mockMvc.perform(
                get("/admin/tutors/applications/{verificationId}", verificationId)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationId").value(verificationId))
                .andExpect(jsonPath("$.userEmail").value("detail@example.com"))
                .andExpect(jsonPath("$.specialization").value("IELTS"));

        verify(tutorService).getApplicationDetail(verificationId);
    }

    // ========================================================================
    // 6. POST /admin/tutors/applications/{verificationId}/approve
    // ========================================================================

    @Test
    void approveApplication() throws Exception {
        Long verificationId = 11L;
        Long adminId = 99L; // từ claim userId

        doNothing().when(tutorService).approveTutorApplication(verificationId, adminId);

        ResultActions result = mockMvc.perform(
                post("/admin/tutors/applications/{verificationId}/approve", verificationId)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(content().string("Application approved successfully"));

        verify(tutorService).approveTutorApplication(verificationId, adminId);
    }

    // ========================================================================
    // 7. POST /admin/tutors/applications/{verificationId}/reject
    // ========================================================================

    @Test
    void rejectApplication() throws Exception {
        Long verificationId = 12L;
        Long adminId = 99L;
        String reason = "Not enough experience";

        doNothing().when(tutorService).rejectTutorApplication(verificationId, adminId, reason);

        String body = """
                {
                  "reason": "Not enough experience"
                }
                """;

        ResultActions result = mockMvc.perform(
                post("/admin/tutors/applications/{verificationId}/reject", verificationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(content().string("Application rejected successfully"));

        verify(tutorService).rejectTutorApplication(verificationId, adminId, reason);
    }

    // ========================================================================
    // 8. GET /admin/tutors/all?status=APPROVED
    // ========================================================================

    @Test
    void getAllTutors() throws Exception {
        String status = "APPROVED";

        var t1 = TutorApplicationListResponse.builder()
                .verificationId(30L)
                .tutorId(300L)
                .userId(3000L)
                .userEmail("tutor1@example.com")
                .userName("Tutor 1")
                .country("Vietnam")
                .specialization("IELTS")
                .teachingLanguage("English")
                .pricePerHour(20.0)
                .rating(BigDecimal.valueOf(4.5))
                .status(status)
                .build();

        List<TutorApplicationListResponse> mockList = List.of(t1);

        when(tutorService.getAllTutors(status)).thenReturn(mockList);

        ResultActions result = mockMvc.perform(
                get("/admin/tutors/all")
                        .param("status", status)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].tutorId").value(300))
                .andExpect(jsonPath("$[0].status").value("APPROVED"));

        verify(tutorService).getAllTutors(status);
    }

    // ========================================================================
    // 9. POST /admin/tutors/{tutorId}/suspend
    // ========================================================================

    @Test
    void suspendTutor() throws Exception {
        Long tutorId = 400L;
        Long adminId = 99L;

        doNothing().when(tutorService).suspendTutor(tutorId, adminId);

        ResultActions result = mockMvc.perform(
                post("/admin/tutors/{tutorId}/suspend", tutorId)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(content().string("Tutor suspended successfully"));

        verify(tutorService).suspendTutor(tutorId, adminId);
    }

    // ========================================================================
    // 10. POST /admin/tutors/{tutorId}/unsuspend
    // ========================================================================

    @Test
    void unsuspendTutor() throws Exception {
        Long tutorId = 401L;
        Long adminId = 99L;

        doNothing().when(tutorService).unsuspendTutor(tutorId, adminId);

        ResultActions result = mockMvc.perform(
                post("/admin/tutors/{tutorId}/unsuspend", tutorId)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(content().string("Tutor unsuspended successfully"));

        verify(tutorService).unsuspendTutor(tutorId, adminId);
    }

    // ========================================================================
    // 11. PATCH /admin/tutors/{tutorId}
    // ========================================================================

    @Test
    void updateTutorInfo() throws Exception {
        Long tutorId = 500L;

        doNothing().when(tutorService).updateTutorInfo(eq(tutorId), any(TutorUpdateRequest.class));

        String body = """
                {
                  "experience": 5,
                  "specialization": "TOEIC",
                  "teachingLanguage": "English",
                  "bio": "Updated bio",
                  "rating": 4.8
                }
                """;

        ResultActions result = mockMvc.perform(
                patch("/admin/tutors/{tutorId}", tutorId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        result.andExpect(status().isOk())
                .andExpect(content().string("Tutor information updated successfully"));

        verify(tutorService).updateTutorInfo(eq(tutorId), any(TutorUpdateRequest.class));
    }
}
