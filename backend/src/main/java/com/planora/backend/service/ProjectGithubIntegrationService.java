package com.planora.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import com.planora.backend.dto.GithubLinkRequestDTO;
import com.planora.backend.dto.ProjectGithubRepositoryDTO;
import com.planora.backend.exception.ConflictException;
import com.planora.backend.exception.ResourceNotFoundException;
import com.planora.backend.model.GithubIntegration;
import com.planora.backend.model.Project;
import com.planora.backend.repository.GithubIntegrationRepository;
import com.planora.backend.repository.ProjectRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectGithubIntegrationService {
    private final GithubIntegrationRepository integrationRepository;
    private final GithubApiClient githubApiClient;
    private final ProjectRepository projectRepository;

    @Transactional
    public ProjectGithubRepositoryDTO linkRepository(GithubLinkRequestDTO request) {
        if (integrationRepository.existsByProjectIdAndRepositoryFullName(
                request.getProjectId(), request.getRepositoryFullName())) {
            throw new ConflictException("Repository '" + request.getRepositoryFullName()
                    + "' is already linked to this project");
        }

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + request.getProjectId()));

        try {
            githubApiClient.fetchRepository(request.getRepositoryFullName(), request.getAccessToken());
        } catch (GithubApiClient.GithubApiException e) {
            throw new RuntimeException("Cannot access GitHub repository: " + e.getMessage());
        }

        GithubIntegration integration = new GithubIntegration();
        integration.setProject(project);
        integration.setRepositoryFullName(request.getRepositoryFullName());
        integration.setRepositoryUrl("https://github.com/" + request.getRepositoryFullName());
        integration.setEncryptedAccessToken(request.getAccessToken());
        integration.setTokenType(resolveTokenType(request.getTokenType()));
        integration.setActive(true);

        GithubIntegration saved = integrationRepository.save(integration);
        log.info("Linked GitHub repo '{}' to project {}", request.getRepositoryFullName(), request.getProjectId());
        return toDTO(saved);
    }

    @Transactional
    public void unlinkRepository(Long integrationId, Long projectId) {
        GithubIntegration integration = integrationRepository
                .findByIdAndProjectId(integrationId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found: " + integrationId));
        integrationRepository.delete(integration);
        log.info("Unlinked GitHub integration {} from project {}", integrationId, projectId);
    }

    @Transactional(readOnly = true)
    public List<ProjectGithubRepositoryDTO> getLinkedRepositories(Long projectId) {
        return integrationRepository.findByProjectIdAndActiveTrue(projectId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private GithubIntegration.TokenType resolveTokenType(String raw) {
        if (raw == null) return GithubIntegration.TokenType.PERSONAL_ACCESS_TOKEN;
        try {
            return GithubIntegration.TokenType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            return GithubIntegration.TokenType.PERSONAL_ACCESS_TOKEN;
        }
    }

    private ProjectGithubRepositoryDTO toDTO(GithubIntegration integration) {
        return ProjectGithubRepositoryDTO.builder()
                .integrationId(integration.getId())
                .projectId(integration.getProject().getId())
                .repositoryFullName(integration.getRepositoryFullName())
                .repositoryUrl(integration.getRepositoryUrl())
                .tokenType(integration.getTokenType().name())
                .active(integration.isActive())
                .build();
    }
}
