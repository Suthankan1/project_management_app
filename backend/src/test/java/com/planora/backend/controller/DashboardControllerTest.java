package com.planora.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planora.backend.model.User;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.DashboardRecentService;
import com.planora.backend.service.DashboardTableService;
import com.planora.backend.service.JWTService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardRecentService dashboardRecentService;

    @MockBean
    private DashboardTableService dashboardTableService;

    @MockBean
    private JWTService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setUserId(1L);
        user.setUsername("testuser");
        principal = new UserPrincipal(user);
    }

    @Test
    void getRecentProjects_returnsOk() throws Exception {
        when(dashboardRecentService.getRecentProjects(1L, 5)).thenReturn(List.of());

        mockMvc.perform(get("/api/dashboard/recent")
                        .with(SecurityMockMvcRequestPostProcessors.user(principal)))
                .andExpect(status().isOk());
    }

    @Test
    void getWorkedOnTasks_returnsOk() throws Exception {
        when(dashboardTableService.getWorkedOnTasks(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/dashboard/table/worked-on")
                        .with(SecurityMockMvcRequestPostProcessors.user(principal)))
                .andExpect(status().isOk());
    }
}
