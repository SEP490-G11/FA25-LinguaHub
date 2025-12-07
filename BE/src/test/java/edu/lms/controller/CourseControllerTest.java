package edu.lms.controller;

import edu.lms.dto.response.CourseDetailResponse;
import edu.lms.dto.response.CourseResponse;
import edu.lms.service.CourseService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CourseController.class)
@AutoConfigureMockMvc(addFilters = false)
class CourseControllerTest{

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    CourseService courseService;

    // ================================================================
    // 1. GET /courses/public/approved
    // ================================================================

    @Test
    void getAllApprovedPublic_anonymous() throws Exception {
        // GIVEN
        var c1 = CourseResponse.builder().id(1L).title("Course 1").build();
        var c2 = CourseResponse.builder().id(2L).title("Course 2").build();
        var mockList = List.of(c1, c2);

        // anonymous -> email = null
        when(courseService.getAllApproved(isNull())).thenReturn(mockList);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/courses/public/approved")
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result", hasSize(2)))
                .andExpect(jsonPath("$.result[0].id").value(1))
                .andExpect(jsonPath("$.result[0].title").value("Course 1"))
                .andExpect(jsonPath("$.result[1].id").value(2))
                .andExpect(jsonPath("$.result[1].title").value("Course 2"));

        verify(courseService).getAllApproved(isNull());
    }

    @Test
    void getAllApprovedPublic_withJwtEmail() throws Exception {
        // GIVEN
        String email = "user@example.com";

        var course = CourseResponse.builder().id(1L).title("Course 1").build();
        var mockList = List.of(course);

        // Không ép email tuyệt đối, chỉ cần bất kỳ String nào
        when(courseService.getAllApproved(any())).thenReturn(mockList);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/courses/public/approved")
                        .with(jwt().jwt(jwt -> {
                            jwt.claim("email", email);
                            jwt.subject(email);
                        }))
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result", hasSize(1)))
                .andExpect(jsonPath("$.result[0].id").value(1))
                .andExpect(jsonPath("$.result[0].title").value("Course 1"));

        verify(courseService).getAllApproved(any());
    }

    @Test
    void getAllApprovedPublic_withJwtNoEmail_useSubject() throws Exception {
        // GIVEN
        String subject = "subject@example.com";

        var course = CourseResponse.builder().id(1L).title("Course 1").build();
        var mockList = List.of(course);

        when(courseService.getAllApproved(any())).thenReturn(mockList);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/courses/public/approved")
                        .with(jwt().jwt(jwt -> jwt.subject(subject)))
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result", hasSize(1)))
                .andExpect(jsonPath("$.result[0].id").value(1))
                .andExpect(jsonPath("$.result[0].title").value("Course 1"));

        verify(courseService).getAllApproved(any());
    }

    // ================================================================
    // 2. GET /courses/public/approved/{tutorId}
    // ================================================================

    @Test
    void getApprovedByTutorPublic_anonymous() throws Exception {
        // GIVEN
        Long tutorId = 10L;
        var course = CourseResponse.builder().id(1L).title("Tutor Course").build();
        var mockList = List.of(course);

        when(courseService.getApprovedByTutor(eq(tutorId), isNull()))
                .thenReturn(mockList);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/courses/public/approved/{tutorId}", tutorId)
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result", hasSize(1)))
                .andExpect(jsonPath("$.result[0].id").value(1))
                .andExpect(jsonPath("$.result[0].title").value("Tutor Course"));

        verify(courseService).getApprovedByTutor(eq(tutorId), isNull());
    }

    @Test
    void getApprovedByTutorPublic_withJwtEmail() throws Exception {
        // GIVEN
        Long tutorId = 10L;
        String email = "user@example.com";

        var course = CourseResponse.builder().id(1L).title("Tutor Course").build();
        var mockList = List.of(course);

        when(courseService.getApprovedByTutor(eq(tutorId), any()))
                .thenReturn(mockList);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/courses/public/approved/{tutorId}", tutorId)
                        .with(jwt().jwt(jwt -> {
                            jwt.claim("email", email);
                            jwt.subject(email);
                        }))
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result", hasSize(1)))
                .andExpect(jsonPath("$.result[0].id").value(1))
                .andExpect(jsonPath("$.result[0].title").value("Tutor Course"));

        verify(courseService).getApprovedByTutor(eq(tutorId), any());
    }

    // ================================================================
    // 3. GET /courses/detail/{courseId}
    // ================================================================

    @Test
    void getCourseById_anonymous() throws Exception {
        // GIVEN
        Long courseId = 5L;
        var detail = CourseDetailResponse.builder()
                .id(courseId)
                .title("Detail Course")
                .build();

        when(courseService.getCourseById(eq(courseId), isNull()))
                .thenReturn(detail);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/courses/detail/{courseId}", courseId)
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(courseId))
                .andExpect(jsonPath("$.result.title").value("Detail Course"));

        verify(courseService).getCourseById(eq(courseId), isNull());
    }

    @Test
    void getCourseById_withJwtEmail() throws Exception {
        // GIVEN
        Long courseId = 5L;
        String email = "user@example.com";

        var detail = CourseDetailResponse.builder()
                .id(courseId)
                .title("Detail Course")
                .build();

        when(courseService.getCourseById(eq(courseId), any()))
                .thenReturn(detail);

        // WHEN
        ResultActions result = mockMvc.perform(
                get("/courses/detail/{courseId}", courseId)
                        .with(jwt().jwt(jwt -> {
                            jwt.claim("email", email);
                            jwt.subject(email);
                        }))
                        .accept(MediaType.APPLICATION_JSON)
        );

        // THEN
        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(courseId))
                .andExpect(jsonPath("$.result.title").value("Detail Course"));

        verify(courseService).getCourseById(eq(courseId), any());
    }
}
