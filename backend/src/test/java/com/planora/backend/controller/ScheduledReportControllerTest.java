package com.planora.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planora.backend.annotation.WithMockUserPrincipal;
import com.planora.backend.dto.ScheduledReportRequestDTO;
import com.planora.backend.dto.ScheduledReportResponseDTO;
import com.planora.backend.model.User;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.JWTService;
import com.planora.backend.service.ReportScheduledService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReportScheduledController.class)
class ScheduledReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportScheduledService service;

    @MockBean
    private JWTService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setUserId(1L);
        user.setUsername("testuser");
        principal = new UserPrincipal(user);
    }

    @Test
    @WithMockUserPrincipal
    void createScheduledReport_success() throws Exception {
        ScheduledReportRequestDTO req = new ScheduledReportRequestDTO();
        req.setProjectId(10L);
        req.setFormat("PDF");
        req.setScheduleType("ONE_TIME");
        req.setSendTime("09:00");
        req.setRecipientsTo(List.of("test@example.com"));

        ScheduledReportResponseDTO resp = new ScheduledReportResponseDTO();
        resp.setId(1L);
        resp.setProjectId(10L);

        when(service.create(any(), anyLong())).thenReturn(resp);

        mockMvc.perform(post("/api/scheduled-reports")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @WithMockUserPrincipal
    void createScheduledReport_invalidPayload_returns400() throws Exception {
        ScheduledReportRequestDTO req = new ScheduledReportRequestDTO();
        req.setProjectId(-5L); // Negative ID
        req.setFormat("INVALID"); // Invalid enum format
        req.setScheduleType("INVALID_SCHEDULE"); // Invalid schedule type
        req.setSendTime("invalid-time"); // Invalid time format
        req.setRecipientsTo(List.of("not-an-email")); // Invalid email

        mockMvc.perform(post("/api/scheduled-reports")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }
}
