package com.planora.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planora.backend.dto.ProjectInviteRequest;
import com.planora.backend.model.TeamRole;
import com.planora.backend.model.User;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.JWTService;
import com.planora.backend.service.ProjectInvitationService;

@WebMvcTest(ProjectInvitationController.class)
class ProjectInvitationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProjectInvitationService projectInvitationService;

    @MockitoBean
    private JWTService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setUserId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        principal = new UserPrincipal(user);
    }

    @Test
    void inviteToProject_returnsOk() throws Exception {
        ProjectInviteRequest request = new ProjectInviteRequest();
        request.setEmail("new@example.com");
        request.setRole(TeamRole.MEMBER);

        mockMvc.perform(post("/api/projects/10/invitations")
                        .with(SecurityMockMvcRequestPostProcessors.user(principal))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(projectInvitationService).inviteToProject(eq(10L), any(ProjectInviteRequest.class), eq(1L));
    }

    @Test
    void acceptInvitation_returnsOk() throws Exception {
        Map<String, String> request = Map.of("token", "secret-token");

        mockMvc.perform(post("/api/projects/invitations/accept")
                        .with(SecurityMockMvcRequestPostProcessors.user(principal))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(projectInvitationService).acceptInvitation(eq("secret-token"), eq(1L));
    }
}
