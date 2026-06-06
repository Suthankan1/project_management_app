package com.planora.backend.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planora.backend.dto.GithubCreateIssueRequestDTO;
import com.planora.backend.dto.GithubIssueDTO;
import com.planora.backend.model.GithubIntegration;
import com.planora.backend.model.Project;
import com.planora.backend.model.User;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.repository.GithubIntegrationRepository;
import com.planora.backend.repository.UserRepository;
import com.planora.backend.service.GithubCommitService;
import com.planora.backend.service.GithubIssueService;
import com.planora.backend.service.GithubNotificationService;
import com.planora.backend.service.GithubPullRequestService;
import com.planora.backend.service.GithubSyncService;
import com.planora.backend.service.JWTService;

@WebMvcTest(GithubDataController.class)
@SuppressWarnings("unused")
class GithubDataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GithubPullRequestService pullRequestService;

    @MockitoBean
    private GithubCommitService commitService;

    @MockitoBean
    private GithubIssueService issueService;

    @MockitoBean
    private GithubSyncService syncService;

    @MockitoBean
    private GithubNotificationService githubNotificationService;

    @MockitoBean
    private com.planora.backend.service.GithubTokenService githubTokenService;

    @MockitoBean
    private GithubIntegrationRepository githubIntegrationRepository;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private JWTService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private User userEntity;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        userEntity = new User();
        userEntity.setUserId(7L);
        userEntity.setUsername("alice");
        userEntity.setEmail("alice@example.com");
        userEntity.setGithubUsername("octocat");
        userEntity.setGithubAccessToken("github-token");
        principal = new UserPrincipal(userEntity);
    }

    @Test
    void createIssue_notifiesGitHubListenersAfterSuccess() throws Exception {
        GithubIntegration integration = new GithubIntegration();
        integration.setId(19L);
        Project project = new Project();
        project.setId(10L);
        integration.setProject(project);
        integration.setRepositoryFullName("planora/app");

        GithubIssueDTO createdIssue = new GithubIssueDTO();
        createdIssue.setNumber(34);
        createdIssue.setTitle("Fix login");
        createdIssue.setBody("Details");

        when(issueService.createIssue(19L, "Fix login", "Details", List.of("bug")))
                .thenReturn(createdIssue);
        when(githubIntegrationRepository.findByIdAndProjectId(19L, 10L)).thenReturn(Optional.of(integration));
        when(userRepository.findById(7L)).thenReturn(Optional.of(userEntity));

        GithubCreateIssueRequestDTO request = new GithubCreateIssueRequestDTO();
        request.setIntegrationId(19L);
        request.setTitle("Fix login");
        request.setBody("Details");
        request.setLabels(List.of("bug"));

        mockMvc.perform(post("/api/github/project/10/issues")
                        .with(user(principal))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.number").value(34));

        verify(githubNotificationService).notifyIssueEvent(
                "planora/app",
                34,
                "Fix login",
                "opened",
                "octocat",
                "Details",
                List.of("bug"));
    }
}