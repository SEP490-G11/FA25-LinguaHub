package edu.lms.controller;

import edu.lms.dto.request.AdminCourseReviewNoteRequest;
import edu.lms.dto.response.AdminCourseDetailResponse;
import edu.lms.dto.response.AdminCourseDraftChangesResponse;
import edu.lms.dto.response.AdminCourseDraftResponse;
import edu.lms.dto.response.AdminCourseResponse;
import edu.lms.enums.CourseDraftStatus;
import edu.lms.enums.CourseStatus;
import edu.lms.service.AdminCourseService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
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
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminCourseController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminCourseControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    AdminCourseService adminCourseService;

    // helper: JWT với role = Admin
    private static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor adminJwt() {
        return jwt().jwt(jwt -> jwt.claim("role", "Admin"));
    }

    // ====================== COURSE LIVE LIST ======================

    @Test
    void getAllByStatus() throws Exception {
        // GIVEN
        CourseStatus status = CourseStatus.Approved;

        var c1 = AdminCourseResponse.builder()
                .id(1L)
                .title("Course 1")
                .status(status.name())
                .build();
        var c2 = AdminCourseResponse.builder()
                .id(2L)
                .title("Course 2")
                .status(status.name())
                .build();
        var mockList = List.of(c1, c2);

        when(adminCourseService.getAllCoursesForAdmin(status)).thenReturn(mockList);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/admin/courses/by-status")
                        .with(adminJwt())
                        .param("status", status.name())
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result", hasSize(2)))
                .andExpect(jsonPath("$.result[0].id").value(1))
                .andExpect(jsonPath("$.result[0].title").value("Course 1"))
                .andExpect(jsonPath("$.result[0].status").value(status.name()))
                .andExpect(jsonPath("$.result[1].id").value(2))
                .andExpect(jsonPath("$.result[1].title").value("Course 2"));

        verify(adminCourseService).getAllCoursesForAdmin(status);
    }

    @Test
    void getAll() throws Exception {
        // GIVEN
        var c1 = AdminCourseResponse.builder()
                .id(1L)
                .title("Course 1")
                .build();
        var c2 = AdminCourseResponse.builder()
                .id(2L)
                .title("Course 2")
                .build();
        var mockList = List.of(c1, c2);

        when(adminCourseService.getAllCoursesForAdmin()).thenReturn(mockList);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/admin/courses")
                        .with(adminJwt())
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result", hasSize(2)))
                .andExpect(jsonPath("$.result[0].id").value(1))
                .andExpect(jsonPath("$.result[0].title").value("Course 1"))
                .andExpect(jsonPath("$.result[1].id").value(2))
                .andExpect(jsonPath("$.result[1].title").value("Course 2"));

        verify(adminCourseService).getAllCoursesForAdmin();
    }

    // ====================== COURSE LIVE DETAIL & NOTE ======================

    @Test
    void getCourseDetail() throws Exception {
        // GIVEN
        Long courseId = 10L;

        var detail = AdminCourseDetailResponse.builder()
                .id(courseId)
                .courseID(courseId)
                .draft(false)
                .title("Admin Detail Course")
                .language("English")
                .price(BigDecimal.valueOf(100_000))
                .createdAt(LocalDateTime.now())
                .build();

        when(adminCourseService.getCourseDetail(courseId)).thenReturn(detail);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/admin/courses/{courseID}/detail", courseId)
                        .with(adminJwt())
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(courseId))
                .andExpect(jsonPath("$.result.courseID").value(courseId))
                .andExpect(jsonPath("$.result.draft").value(false))
                .andExpect(jsonPath("$.result.title").value("Admin Detail Course"));

        verify(adminCourseService).getCourseDetail(courseId);
    }

    @Test
    void updateCourseReviewNote() throws Exception {
        // GIVEN
        Long courseId = 10L;
        String note = "Looks good, minor issues only.";

        var detail = AdminCourseDetailResponse.builder()
                .id(courseId)
                .courseID(courseId)
                .adminReviewNote(note)
                .build();

        when(adminCourseService.updateCourseReviewNote(courseId, note)).thenReturn(detail);

        String body = """
                {
                  "note": "Looks good, minor issues only."
                }
                """;

        // WHEN
        ResultActions result = mockMvc.perform(
                put("/admin/courses/{courseID}/review-note", courseId)
                        .with(adminJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(courseId))
                .andExpect(jsonPath("$.result.adminReviewNote").value(note))
                .andExpect(jsonPath("$.message").value("Updated review note for course"));

        verify(adminCourseService).updateCourseReviewNote(courseId, note);
    }

    // ====================== APPROVE / REJECT COURSE LIVE ======================

    @Test
    void approveLiveCourse() throws Exception {
        // GIVEN
        Long courseId = 20L;
        String note = "Approved after review";

        var resp = AdminCourseResponse.builder()
                .id(courseId)
                .title("Live Course")
                .status(CourseStatus.Approved.name())
                .adminReviewNote(note)
                .build();

        when(adminCourseService.approveLiveCourse(courseId, note)).thenReturn(resp);

        String body = """
                {
                  "note": "Approved after review"
                }
                """;

        // WHEN
        ResultActions result = mockMvc.perform(
                post("/admin/courses/{courseID}/approve", courseId)
                        .with(adminJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(courseId))
                .andExpect(jsonPath("$.result.status").value("Approved"))
                .andExpect(jsonPath("$.result.adminReviewNote").value(note))
                .andExpect(jsonPath("$.message").value("Course live approved"));

        verify(adminCourseService).approveLiveCourse(courseId, note);
    }

    @Test
    void rejectLiveCourse() throws Exception {
        // GIVEN
        Long courseId = 21L;
        String note = "Content quality not sufficient";

        var resp = AdminCourseResponse.builder()
                .id(courseId)
                .title("Live Course 2")
                .status(CourseStatus.Rejected.name())
                .adminReviewNote(note)
                .build();

        when(adminCourseService.rejectLiveCourse(courseId, note)).thenReturn(resp);

        String body = """
                {
                  "note": "Content quality not sufficient"
                }
                """;

        // WHEN
        ResultActions result = mockMvc.perform(
                post("/admin/courses/{courseID}/reject", courseId)
                        .with(adminJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(courseId))
                .andExpect(jsonPath("$.result.status").value("Rejected"))
                .andExpect(jsonPath("$.result.adminReviewNote").value(note))
                .andExpect(jsonPath("$.message").value("Course live rejected with review note"));

        verify(adminCourseService).rejectLiveCourse(courseId, note);
    }

    // ====================== COURSE DRAFT LIST & DETAIL ======================

    @Test
    void getDraftsByStatus() throws Exception {
        // GIVEN
        CourseDraftStatus status = CourseDraftStatus.PENDING_REVIEW;

        var d1 = AdminCourseDraftResponse.builder()
                .draftID(100L)
                .courseID(10L)
                .title("Draft 1")
                .status(status.name())
                .build();
        var d2 = AdminCourseDraftResponse.builder()
                .draftID(101L)
                .courseID(11L)
                .title("Draft 2")
                .status(status.name())
                .build();

        var mockList = List.of(d1, d2);

        when(adminCourseService.getCourseDraftsForAdmin(status)).thenReturn(mockList);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/admin/courses/drafts")
                        .with(adminJwt())
                        .param("status", status.name())
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result", hasSize(2)))
                .andExpect(jsonPath("$.result[0].draftID").value(100))
                .andExpect(jsonPath("$.result[0].title").value("Draft 1"))
                .andExpect(jsonPath("$.result[1].draftID").value(101))
                .andExpect(jsonPath("$.result[1].title").value("Draft 2"));

        verify(adminCourseService).getCourseDraftsForAdmin(status);
    }

    @Test
    void getDraftDetail() throws Exception {
        // GIVEN
        Long draftId = 200L;

        var draft = AdminCourseDraftResponse.builder()
                .draftID(draftId)
                .courseID(10L)
                .title("Draft Meta")
                .status(CourseDraftStatus.EDITING.name())
                .build();

        when(adminCourseService.getCourseDraftDetail(draftId)).thenReturn(draft);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/admin/courses/drafts/{draftID}", draftId)
                        .with(adminJwt())
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.draftID").value(draftId))
                .andExpect(jsonPath("$.result.title").value("Draft Meta"));

        verify(adminCourseService).getCourseDraftDetail(draftId);
    }

    @Test
    void getDraftDetailFull() throws Exception {
        // GIVEN
        Long draftId = 201L;

        var detail = AdminCourseDetailResponse.builder()
                .id(draftId)
                .courseID(10L)
                .draft(true)
                .title("Draft Full Detail")
                .build();

        when(adminCourseService.getCourseDraftDetailWithCurriculum(draftId)).thenReturn(detail);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/admin/courses/drafts/{draftID}/detail", draftId)
                        .with(adminJwt())
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(draftId))
                .andExpect(jsonPath("$.result.draft").value(true))
                .andExpect(jsonPath("$.result.title").value("Draft Full Detail"));

        verify(adminCourseService).getCourseDraftDetailWithCurriculum(draftId);
    }

    // ====================== COURSE DRAFT NOTE & APPROVE / REJECT ======================

    @Test
    void updateCourseDraftReviewNote() throws Exception {
        // GIVEN
        Long draftId = 300L;
        String note = "Please improve quiz explanations.";

        var detail = AdminCourseDetailResponse.builder()
                .id(draftId)
                .courseID(10L)
                .draft(true)
                .adminReviewNote(note)
                .build();

        when(adminCourseService.updateCourseDraftReviewNote(draftId, note)).thenReturn(detail);

        String body = """
                {
                  "note": "Please improve quiz explanations."
                }
                """;

        // WHEN
        ResultActions result = mockMvc.perform(
                put("/admin/courses/drafts/{draftID}/review-note", draftId)
                        .with(adminJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(draftId))
                .andExpect(jsonPath("$.result.adminReviewNote").value(note))
                .andExpect(jsonPath("$.message").value("Updated review note for course draft"));

        verify(adminCourseService).updateCourseDraftReviewNote(draftId, note);
    }

    @Test
    void approveDraft() throws Exception {
        // GIVEN
        Long draftId = 400L;

        var resp = AdminCourseResponse.builder()
                .id(10L)
                .title("Approved from Draft")
                .status(CourseStatus.Approved.name())
                .build();

        when(adminCourseService.approveCourseDraft(draftId)).thenReturn(resp);

        // WHEN
        ResultActions result = mockMvc.perform(
                post("/admin/courses/drafts/{draftID}/approve", draftId)
                        .with(adminJwt())
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(10))
                .andExpect(jsonPath("$.result.status").value("Approved"))
                .andExpect(jsonPath("$.message").value("Draft approved and merged into live course"));

        verify(adminCourseService).approveCourseDraft(draftId);
    }

    @Test
    void rejectDraft() throws Exception {
        // GIVEN
        Long draftId = 401L;
        String note = "Draft content not aligned with course objectives";

        // void method → có thể dùng doNothing()
        doNothing().when(adminCourseService).rejectCourseDraft(draftId, note);

        String body = """
                {
                  "note": "Draft content not aligned with course objectives"
                }
                """;

        // WHEN
        ResultActions result = mockMvc.perform(
                post("/admin/courses/drafts/{draftID}/reject", draftId)
                        .with(adminJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Draft rejected"));

        verify(adminCourseService).rejectCourseDraft(draftId, note);
    }

    @Test
    void getDraftChanges() throws Exception {
        // GIVEN
        Long draftId = 500L;

        var changes = AdminCourseDraftChangesResponse.builder()
                .courseId(10L)
                .draftId(draftId)
                .build();

        when(adminCourseService.getCourseDraftChanges(draftId)).thenReturn(changes);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/admin/courses/drafts/{draftID}/changes", draftId)
                        .with(adminJwt())
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.courseId").value(10))
                .andExpect(jsonPath("$.result.draftId").value(draftId))
                .andExpect(jsonPath("$.message").value("Fetched diff between live course and draft"));

        verify(adminCourseService).getCourseDraftChanges(draftId);
    }
}
