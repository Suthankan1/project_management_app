package com.planora.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planora.backend.dto.ProjectInviteRequest;
import com.planora.backend.exception.InvitationExpiredException;
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

    @MockBean
    private ProjectInvitationService projectInvitationService;

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

    @Test
    void acceptInvitation_whenExpired_returnsGone() throws Exception {
        Map<String, String> request = Map.of("token", "expired-token");
        doThrow(new InvitationExpiredException("Invitation has expired"))
                .when(projectInvitationService).acceptInvitation("expired-token", 1L);

        mockMvc.perform(post("/api/projects/invitations/accept")
                        .with(SecurityMockMvcRequestPostProcessors.user(principal))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.errorCode").value("INVITATION_EXPIRED"))
                .andExpect(jsonPath("$.message").value("Invitation has expired"));
    }
}
