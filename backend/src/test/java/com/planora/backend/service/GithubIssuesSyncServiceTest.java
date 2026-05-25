package com.planora.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.planora.backend.dto.GithubIssueDTO;
import com.planora.backend.exception.GithubAuthenticationException;
import com.planora.backend.exception.GithubRateLimitException;
import com.planora.backend.exception.GithubRepositoryNotFoundException;

class GithubIssuesSyncServiceTest {

    private MockRestServiceServer server;
    private GithubIssuesSyncService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        service = new GithubIssuesSyncService(builder);
    }

    @Test
    void syncIssues_fetchesAndMapsGithubIssues() {
        String response = """
                [{
                  "id": 12,
                  "number": 34,
                  "title": "Fix login",
                  "body": "Session expires early",
                  "state": "open",
                  "labels": [{"name": "bug", "color": "d73a4a"}],
                  "assignees": [{"login": "octocat"}, {"login": "hubot"}],
                  "created_at": "2026-05-01T10:15:30Z",
                  "updated_at": "2026-05-02T12:00:00Z",
                  "html_url": "https://github.com/planora/app/issues/34",
                  "comments": 2
                }]
                """;

        server.expect(requestTo("https://api.github.com/repos/planora/app/issues?state=all&per_page=100"))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer github-token"))
                .andRespond(withSuccess(response, MediaType.APPLICATION_JSON));

        List<GithubIssueDTO> result = service.syncIssues("planora/app", "github-token");

        assertEquals(1, result.size());
        GithubIssueDTO issue = result.get(0);
        assertEquals(12L, issue.getId());
        assertEquals(34, issue.getNumber());
        assertEquals("Fix login", issue.getTitle());
        assertEquals("open", issue.getState());
        assertEquals("bug", issue.getLabels().get(0).getName());
        assertEquals(List.of("octocat", "hubot"), issue.getAssignees());
        assertEquals(OffsetDateTime.parse("2026-05-01T10:15:30Z"), issue.getCreatedAt());
        assertEquals("https://github.com/planora/app/issues/34", issue.getHtmlUrl());
        assertEquals(2, issue.getComments());
        server.verify();
    }

    @Test
    void syncIssues_throwsAuthenticationExceptionForUnauthorizedToken() {
        server.expect(requestTo("https://api.github.com/repos/planora/app/issues?state=all&per_page=100"))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        assertThrows(GithubAuthenticationException.class,
                () -> service.syncIssues("planora/app", "expired-token"));
        server.verify();
    }

    @Test
    void syncIssues_throwsRateLimitExceptionForForbiddenResponse() {
        server.expect(requestTo("https://api.github.com/repos/planora/app/issues?state=all&per_page=100"))
                .andRespond(withStatus(HttpStatus.FORBIDDEN));

        assertThrows(GithubRateLimitException.class,
                () -> service.syncIssues("planora/app", "github-token"));
        server.verify();
    }

    @Test
    void syncIssues_throwsNotFoundExceptionForMissingRepository() {
        server.expect(requestTo("https://api.github.com/repos/planora/missing/issues?state=all&per_page=100"))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThrows(GithubRepositoryNotFoundException.class,
                () -> service.syncIssues("planora/missing", "github-token"));
        server.verify();
    }
}
