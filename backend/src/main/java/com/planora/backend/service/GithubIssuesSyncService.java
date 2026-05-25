package com.planora.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.planora.backend.dto.GithubIssueDTO;
import com.planora.backend.exception.GithubAuthenticationException;
import com.planora.backend.exception.GithubRateLimitException;
import com.planora.backend.exception.GithubRepositoryNotFoundException;

@Service
public class GithubIssuesSyncService {

    private final RestClient githubClient;

    @Autowired
    public GithubIssuesSyncService(RestClient.Builder restClientBuilder) {
        githubClient = restClientBuilder
                .baseUrl("https://api.github.com")
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
                .build();
    }

    /**
     * Fetches issues and pull-request issue entries exposed by GitHub's issues endpoint.
     */
    @Cacheable(cacheNames = "github-issues", key = "#repoFullName.toLowerCase()", sync = true)
    public List<GithubIssueDTO> syncIssues(String repoFullName, String accessToken) {
        String[] repositoryParts = repoFullName.split("/", 2);
        if (repositoryParts.length != 2
                || repositoryParts[0].isBlank()
                || repositoryParts[1].isBlank()) {
            throw new GithubRepositoryNotFoundException("GitHub repository not found");
        }

        return githubClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/repos/{owner}/{repo}/issues")
                        .queryParam("state", "all")
                        .queryParam("per_page", 100)
                        .build(repositoryParts[0], repositoryParts[1]))
                .headers(headers -> headers.setBearerAuth(accessToken))
                .retrieve()
                .onStatus(status -> status.value() == 401, (request, response) -> {
                    throw new GithubAuthenticationException("Invalid GitHub access token");
                })
                .onStatus(status -> status.value() == 403, (request, response) -> {
                    throw new GithubRateLimitException("GitHub API rate limit exceeded");
                })
                .onStatus(status -> status.value() == 404, (request, response) -> {
                    throw new GithubRepositoryNotFoundException("GitHub repository not found");
                })
                .body(new ParameterizedTypeReference<List<GithubIssueDTO>>() {
                });
    }
}
