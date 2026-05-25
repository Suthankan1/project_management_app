package com.planora.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planora.backend.dto.GithubIssueDTO;
import com.planora.backend.dto.GithubIssueImportResponseDTO;
import com.planora.backend.exception.GithubRateLimitException;
import com.planora.backend.exception.GithubRepositoryNotFoundException;
import com.planora.backend.model.User;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.repository.UserRepository;
import com.planora.backend.service.GithubIssueImportService;
import com.planora.backend.service.GithubIssuesSyncService;
import com.planora.backend.service.JWTService;

@WebMvcTest(GithubIssuesController.class)
class GithubIssuesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GithubIssuesSyncService githubIssuesSyncService;

    @MockitoBean
    private GithubIssueImportService githubIssueImportService;

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
        userEntity.setGithubAccessToken("github-token");
        principal = new UserPrincipal(userEntity);
    }

    @Test
    void getIssues_filtersByStateAndLabelUsingStoredToken() throws Exception {
        GithubIssueDTO matching = issue(1L, "open", "Bug");
        GithubIssueDTO wrongState = issue(2L, "closed", "bug");
        GithubIssueDTO wrongLabel = issue(3L, "open", "feature");

        when(userRepository.findById(7L)).thenReturn(Optional.of(userEntity));
        when(githubIssuesSyncService.syncIssues("planora/app", "github-token"))
                .thenReturn(List.of(matching, wrongState, wrongLabel));

        mockMvc.perform(get("/api/github/issues")
                        .with(user(principal))
                        .param("repoFullName", "planora/app")
                        .param("state", "open")
                        .param("label", "bug"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1));

        verify(githubIssuesSyncService).syncIssues("planora/app", "github-token");
    }

    @Test
    void getIssues_defaultsStateToAll() throws Exception {
        when(userRepository.findById(7L)).thenReturn(Optional.of(userEntity));
        when(githubIssuesSyncService.syncIssues("planora/app", "github-token"))
                .thenReturn(List.of(issue(1L, "open", "bug"), issue(2L, "closed", "feature")));

        mockMvc.perform(get("/api/github/issues")
                        .with(user(principal))
                        .param("repoFullName", "planora/app"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getIssues_returnsUnauthorizedWhenGithubTokenIsMissing() throws Exception {
        userEntity.setGithubAccessToken(" ");
        when(userRepository.findById(7L)).thenReturn(Optional.of(userEntity));

        mockMvc.perform(get("/api/github/issues")
                        .with(user(principal))
                        .param("repoFullName", "planora/app"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("GitHub account is not connected"));

        verify(githubIssuesSyncService, never()).syncIssues("planora/app", "github-token");
    }

    @Test
    void getIssues_returnsNotFoundWhenGithubRepositoryDoesNotExist() throws Exception {
        when(userRepository.findById(7L)).thenReturn(Optional.of(userEntity));
        when(githubIssuesSyncService.syncIssues("planora/missing", "github-token"))
                .thenThrow(new GithubRepositoryNotFoundException("GitHub repository not found"));

        mockMvc.perform(get("/api/github/issues")
                        .with(user(principal))
                        .param("repoFullName", "planora/missing"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getIssues_returnsTooManyRequestsWhenGithubIsRateLimited() throws Exception {
        when(userRepository.findById(7L)).thenReturn(Optional.of(userEntity));
        when(githubIssuesSyncService.syncIssues("planora/app", "github-token"))
                .thenThrow(new GithubRateLimitException("GitHub API rate limit exceeded"));

        mockMvc.perform(get("/api/github/issues")
                        .with(user(principal))
                        .param("repoFullName", "planora/app"))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void getIssues_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/github/issues").param("repoFullName", "planora/app"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void importIssues_returnsImportedAndSkippedTaskResults() throws Exception {
        when(userRepository.findById(7L)).thenReturn(Optional.of(userEntity));
        when(githubIssueImportService.importIssues(any(), org.mockito.ArgumentMatchers.eq(userEntity)))
                .thenReturn(new GithubIssueImportResponseDTO(List.of(101L, 102L), List.of(3)));

        mockMvc.perform(post("/api/github/issues/import")
                        .with(user(principal))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "projectId", 10L,
                                "repoFullName", "planora/app",
                                "issueNumbers", List.of(1, 2, 3)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported[0]").value(101))
                .andExpect(jsonPath("$.skipped[0]").value(3));
    }

    @Test
    void importIssues_requiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/github/issues/import")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":10,\"repoFullName\":\"planora/app\",\"issueNumbers\":[1]}"))
                .andExpect(status().isUnauthorized());
    }

    private GithubIssueDTO issue(Long id, String state, String label) {
        GithubIssueDTO issue = new GithubIssueDTO();
        issue.setId(id);
        issue.setState(state);
        issue.setLabels(List.of(new GithubIssueDTO.LabelDTO(label, "ffffff")));
        return issue;
    }
}
